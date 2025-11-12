import stripe

from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import BankingInformation, Business, Client, Invoice
from finance import serializers, paginations, emails

stripe.api_key = settings.STRIPE_SECRET_KEY


class BankingInformationViewSet(viewsets.ModelViewSet):
    """View for manage banking information APIs."""
    serializer_class = serializers.BankingInformationSerializer
    queryset = BankingInformation.objects.filter(is_active=True)
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return banking information linked to the logged-in user."""
        user = self.request.user

        business = Business.objects.filter(owner=user).first()
        if business:
            return self.queryset.filter(business=business).order_by("-id")

        client = Client.objects.filter(user=user).first()
        if client:
            return self.queryset.filter(client=client).order_by("-id")

        return self.queryset.none()

    def perform_create(self, serializer):
        """Attach the correct business or client before saving."""
        user = self.request.user

        business = Business.objects.filter(owner=user).first()
        client = Client.objects.filter(user=user).first()

        if business:
            serializer.save(business=business)
        elif client:
            serializer.save(client=client)
        else:
            raise ValidationError(
                "User must be linked to a Business or Client."
            )

    def perform_destroy(self, instance):
        """Soft delete the record."""

        instance.soft_delete(user=self.request.user)

    @action(detail=False, methods=["post"], url_path="create-setup-intent")
    def create_setup_intent(self, request):
        """
        Create or reuse a Stripe customer,
        and return a SetupIntent client secret.
        """
        user = request.user
        business = Business.objects.filter(owner=user).first()
        client = Client.objects.filter(user=user).first()

        if not business and not client:
            return Response(
                {"detail": "User must be linked to a Business or Client."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        owner_name = business.name if business else client.user.name
        owner_email = business.email if business else client.user.email

        banking_info, _ = BankingInformation.objects.get_or_create(
            business=business if business else None,
            client=client if client else None,
            payment_method_type="CARD"
        )

        if not banking_info.stripe_customer_id:
            customer = stripe.Customer.create(
                name=owner_name,
                email=owner_email,
            )
            banking_info.stripe_customer_id = customer.id
            banking_info.save(update_fields=["stripe_customer_id"])

        intent = stripe.SetupIntent.create(
            customer=banking_info.stripe_customer_id
        )

        return Response(
            {"client_secret": intent.client_secret},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path="save-payment-method")
    def save_payment_method(self, request):
        """
        Save the Stripe payment method to the user's banking information,
        along with card metadata (brand, last4, exp_month, exp_year).
        """
        user = request.user
        payment_method_id = request.data.get("payment_method_id")

        if not payment_method_id:
            return Response(
                {"detail": "Missing payment_method_id"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        business = Business.objects.filter(owner=user).first()
        client = Client.objects.filter(user=user).first()

        if not business and not client:
            return Response(
                {"detail": "User must be linked to a Business or Client."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        banking_info = BankingInformation.objects.filter(
            business=business if business else None,
            client=client if client else None,
            payment_method_type="CARD"
        ).first()

        if not banking_info:
            return Response(
                {"detail": "Banking information not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        stripe.PaymentMethod.attach(
            payment_method_id,
            customer=banking_info.stripe_customer_id,
        )

        stripe.Customer.modify(
            banking_info.stripe_customer_id,
            invoice_settings={"default_payment_method": payment_method_id},
        )

        payment_method = stripe.PaymentMethod.retrieve(payment_method_id)
        card = payment_method.get("card", {})

        banking_info.stripe_payment_method_id = payment_method_id
        banking_info.card_brand = card.get("brand")
        banking_info.card_last4 = card.get("last4")
        banking_info.card_exp_month = card.get("exp_month")
        banking_info.card_exp_year = card.get("exp_year")
        banking_info.save(
            update_fields=[
                "stripe_payment_method_id",
                "card_brand",
                "card_last4",
                "card_exp_month",
                "card_exp_year",
            ]
        )

        return Response(
            {
                "detail": "Payment method saved successfully.",
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path="add-bank-account")
    def add_bank_account(self, request):
        """
        Add or update a bank account for payouts (Business-only).
        Supports US and CA. Uses Stripe Custom Connected Accounts.
        """
        user = request.user
        data = request.data

        business = Business.objects.filter(owner=user).first()
        if not business:
            return Response(
                {"detail": "Only business owners can add a bank account."},
                status=status.HTTP_403_FORBIDDEN,
            )

        required_fields = ["account_holder_name", "country", "currency", "account_number"]
        for field in required_fields:
            if not data.get(field):
                return Response(
                    {"detail": f"Missing required field: {field}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        country = data.get("country").upper()
        currency = data.get("currency").lower()
        account_holder_name = data.get("account_holder_name")
        account_holder_type = data.get("account_holder_type", "individual")
        routing_number = data.get("routing_number")
        transit_number = data.get("transit_number")

        banking_info = BankingInformation.objects.filter(
            business=business,
            payment_method_type="BANK_ACCOUNT",
        ).first()

        business_url = business.website if business.website else f"https://contractorz.com/businesses/{business.slug}"

        if not banking_info or not banking_info.stripe_connected_account_id:
            try:
                connected_account = stripe.Account.create(
                    type="custom",
                    country=country,
                    email=business.email,
                    business_type="company" if account_holder_type == "company" else "individual",
                    business_profile={
                        "name": business.name,
                        "product_description": f"Payout account for {business.name}",
                        "mcc": "7349",
                        "url": business_url,
                        "support_phone": business.support_phone,
                    },
                    company={
                        "name": business.name,
                        "phone": business.phone,
                        "registration_number": business.business_number,
                        "directors_provided": True,
                        "owners_provided": True,
                        "representatives_provided": True,
                        "address": {
                            "line1": business.street_address,
                            "line2": "",
                            "city": business.city,
                            "state": business.province_state,
                            "postal_code": business.postal_code,
                            "country": business.country.upper(),
                        },
                    } if account_holder_type == "company" else None,
                    individual={
                        "first_name": first_name,
                        "last_name": last_name,
                        "email": user.email,
                        "address": {
                            "line1": business.street_address,
                            "line2": "",
                            "city": business.city,
                            "state": business.province_state,
                            "postal_code": business.postal_code,
                            "country": business.country.upper(),
                        },
                    } if account_holder_type == "individual" else None,
                    capabilities={"transfers": {"requested": True}},
                    tos_acceptance={
                        "date": int(time.time()),
                        "ip": request.META.get("REMOTE_ADDR"),
                    },
                    metadata={"business_id": str(business.id)},
                )
            except stripe.StripeError as e:
                return Response({"detail": f"Stripe error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

            if not banking_info:
                banking_info = BankingInformation.objects.create(
                    business=business,
                    stripe_connected_account_id=connected_account.id,
                    payment_method_type="BANK_ACCOUNT",
                )
            else:
                banking_info.stripe_connected_account_id = connected_account.id
                banking_info.save(update_fields=["stripe_connected_account_id"])

            try:
                stripe.Account.create_person(
                    connected_account.id,
                    person={
                        "first_name": business.owner_first_name,
                        "last_name": business.owner_last_name,
                        "email": business.owner_email,
                        "dob": {"day": 1, "month": 1, "year": 1980},
                        "address": {
                            "line1": business.street_address,
                            "line2": "",
                            "city": business.city,
                            "state": business.province_state,
                            "postal_code": business.postal_code,
                            "country": business.country.upper(),
                        },
                        "relationship": {
                            "owner": True,
                            "representative": True,
                            "percent_ownership": business.owner_percent_ownership,
                        },
                    },
                )
            except stripe.StripeError as e:
                return Response({"detail": f"Stripe error (representative): {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if country == "US":
                routing = routing_number
            elif country == "CA":
                if not transit_number or not routing_number:
                    return Response({"detail": "Transit number and routing number are required for CA."},
                                    status=status.HTTP_400_BAD_REQUEST)
                routing = f"{transit_number}{routing_number}"
            else:
                return Response({"detail": "Unsupported country."}, status=status.HTTP_400_BAD_REQUEST)

            external_account = stripe.Account.create_external_account(
                banking_info.stripe_connected_account_id,
                external_account={
                    "object": "bank_account",
                    "country": country,
                    "currency": currency,
                    "account_holder_name": account_holder_name,
                    "account_holder_type": account_holder_type,
                    "routing_number": routing,
                    "account_number": data.get("account_number"),
                },
            )
        except stripe.StripeError as e:
            return Response({"detail": f"Stripe error (bank account): {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        banking_info.account_holder_name = account_holder_name
        banking_info.account_holder_type = account_holder_type
        banking_info.country = country
        banking_info.currency = currency
        banking_info.account_number_last4 = external_account.get("last4")
        banking_info.routing_number = routing_number
        banking_info.transit_number = transit_number
        banking_info.save(
            update_fields=[
                "account_holder_name",
                "account_holder_type",
                "country",
                "currency",
                "account_number_last4",
                "routing_number",
                "transit_number",
            ]
        )

        return Response(
            {"detail": "Bank account added successfully."},
            status=status.HTTP_201_CREATED
        )


class InvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing invoices."""
    serializer_class = serializers.InvoiceSerializer
    queryset = Invoice.objects.all()
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    pagination_class = paginations.InvoicePagination

    def get_queryset(self):
        """Return invoices linked to the logged-in user."""
        user = self.request.user

        business = Business.objects.filter(owner=user).first()
        if business:
            return self.queryset \
                .filter(business=business, is_active=True).order_by("-id")

        client = Client.objects.filter(user=user).first()
        if client:
            return self.queryset.filter(client=client, is_active=True) \
                .order_by("-id")

        return self.queryset.none()

    def perform_create(self, serializer):
        """Attach business/client/service properly before saving."""

        validated_data = serializer.validated_data
        business = validated_data.get("business")
        client = validated_data.get("client")
        service = validated_data.get("service")

        if client.business != business:
            raise ValidationError("Client does not belong to your business.")

        if service:
            if service.business != business or service.client != client:
                raise ValidationError(
                    "Service must belong to the same business and client."
                )

        serializer.save(
            business=business,
            client=client,
            service=service,
        )

    def perform_update(self, serializer):
        """Trigger email when invoice is sent."""

        instance = serializer.instance
        previous_status = instance.status
        updated_instance = serializer.save()

        if previous_status != "SENT" and updated_instance.status == "SENT":
            emails.send_invoice_email(updated_instance)

        if previous_status != "PAID" and updated_instance.status == "PAID":
            updated_instance.paid_at = timezone.now()
            updated_instance.save(update_fields=["paid_at"])

    def perform_destroy(self, instance):
        """Soft delete the record."""

        instance.soft_delete(user=self.request.user)

    @action(detail=True, methods=["post"], url_path="make-payment")
    def make_payment(self, request, pk=None):
        """Charge client and transfer funds to business."""

        invoice = self.get_object()
        client = invoice.client
        business = invoice.business

        if not client:
            return Response({"error": "Client not found."}, status=status.HTTP_400_BAD_REQUEST)
        if not business:
            return Response({"error": "Business not found."}, status=status.HTTP_400_BAD_REQUEST)
        if invoice.status == "PAID":
            return Response({"detail": "Invoice already paid."}, status=status.HTTP_400_BAD_REQUEST)

        client_bank_info = client.banking_information.filter(is_active=True).first()
        if not client_bank_info or not client_bank_info.stripe_payment_method_id:
            return Response(
                {"error": "Client does not have an active payment method."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        print(business)
        business_bank_info = business.banking_information.filter(is_active=True).first()
        if not business_bank_info or not business_bank_info.stripe_connected_account_id:
            return Response(
                {"error": "Business does not have a connected Stripe account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        amount_cents = int(invoice.total_amount * 100)

        payment_intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency=invoice.currency.lower(),
            customer=client_bank_info.stripe_customer_id,
            payment_method=client_bank_info.stripe_payment_method_id,
            off_session=True,
            confirm=True,
            transfer_data={
                "destination": business_bank_info.stripe_connected_account_id
            },
            description=f"Payment for Invoice #{invoice.id}",
            metadata={"invoice_id": invoice.id},
        )

        invoice.status = "PAID"
        invoice.paid_at = timezone.now()
        invoice.stripe_payment_intent_id = payment_intent.id
        invoice.save(update_fields=["status", "paid_at", "stripe_payment_intent_id"])

        transfer_id = None
        if hasattr(payment_intent, "transfer_data"):
            transfer_id = payment_intent.transfer_data.get("destination")

        Payout.objects.create(
            business=business,
            client=client,
            invoice=invoice,
            amount=invoice.total_amount,
            currency=invoice.currency,
            stripe_transfer_id=transfer_id,
            status="PAID",
            paid_at=timezone.now(),
        )

        return Response(
            {
                "detail": "Payment successful and payout recorded.",
                "invoice_id": invoice.id,
                "payment_intent_id": payment_intent.id,
            },
            status=status.HTTP_200_OK,
        )
