import stripe

from django.conf import settings
from django.core.exceptions import ValidationError

from rest_framework import status, viewsets
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import BankingInformation, Business, Client, Invoice
from finance import serializers

stripe.api_key = settings.STRIPE_SECRET_KEY


class BankingInformationViewSet(viewsets.ModelViewSet):
    """View for manage banking information APIs."""
    serializer_class = serializers.BankingInformationSerializer
    queryset = BankingInformation.objects.all()
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
            client=client if client else None
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
        Supports US and CA.
        """
        user = request.user
        data = request.data

        business = Business.objects.filter(owner=user).first()
        if not business:
            return Response(
                {"detail": "Only business owners can add a payout bank account."},
                status=status.HTTP_403_FORBIDDEN,
            )

        required_fields = ["account_holder_name", "country", "currency", "account_number"]
        for field in required_fields:
            if not data.get(field):
                return Response(
                    {"detail": f"Missing required field: {field}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        country = data.get("country")
        currency = data.get("currency")
        account_holder_name = data.get("account_holder_name")
        account_holder_type = data.get("account_holder_type", "individual")
        routing_number = data.get("routing_number")
        transit_number = data.get("transit_number")
        bank_name = data.get("bank_name")

        banking_info = BankingInformation.objects.filter(
            business=business,
            payment_method_type="BANK_ACCOUNT",
        ).first()

        if not banking_info or not banking_info.stripe_customer_id:
            try:
                connected_account = stripe.Account.create(
                    type="custom",
                    country=country,
                    email=business.email,
                    business_type="company" if account_holder_type == "company" else "individual",
                    capabilities={
                        "transfers": {"requested": True},
                    },
                    metadata={"business_id": str(business.id)},
                )
            except stripe.StripeError as e:
                return Response(
                    {"detail": f"Stripe error: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not banking_info:
                banking_info = BankingInformation.objects.create(
                    business=business,
                    stripe_customer_id=connected_account.id,
                    payment_method_type="BANK_ACCOUNT",
                )
            else:
                banking_info.stripe_customer_id = connected_account.id
                banking_info.save(update_fields=["stripe_customer_id"])

        try:
            if country == "US":
                external_account = stripe.Account.create_external_account(
                    banking_info.stripe_customer_id,
                    external_account={
                        "object": "bank_account",
                        "country": country,
                        "currency": currency,
                        "account_holder_name": account_holder_name,
                        "account_holder_type": account_holder_type,
                        "routing_number": routing_number,
                        "account_number": data.get("account_number"),
                    },
                )
            elif country == "CA":
                combined_routing = f"{transit_number}{routing_number}"
                external_account = stripe.Account.create_external_account(
                    banking_info.stripe_customer_id,
                    external_account={
                        "object": "bank_account",
                        "country": country,
                        "currency": currency,
                        "account_holder_name": account_holder_name,
                        "account_holder_type": account_holder_type,
                        "routing_number": combined_routing,
                        "account_number": data.get("account_number"),
                    },
                )
            else:
                return Response(
                    {"detail": "Unsupported country. Only US and CA are supported."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except stripe.StripeError as e:
            return Response(
                {"detail": f"Stripe error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        banking_info.bank_name = bank_name or external_account.get("bank_name")
        banking_info.account_holder_name = account_holder_name
        banking_info.account_number_last4 = external_account.get("last4")
        banking_info.routing_number = routing_number
        banking_info.transit_number = transit_number
        banking_info.save(
            update_fields=[
                "bank_name",
                "account_holder_name",
                "account_number_last4",
                "routing_number",
                "transit_number",
            ]
        )

        return Response(
            {
                "detail": "Bank account added successfully.",
            },
            status=status.HTTP_201_CREATED,
        )


class InvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing invoices."""
    serializer_class = serializers.InvoiceSerializer
    queryset = Invoice.objects.all()
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return invoices linked to the logged-in user."""
        user = self.request.user

        business = Business.objects.filter(owner=user).first()
        if business:
            return self.queryset.filter(business=business, is_active=True).order_by("-id")

        client = Client.objects.filter(user=user).first()
        if client:
            return self.queryset.filter(client=client, is_active=True).order_by("-id")

        return self.queryset.none()

    def perform_create(self, serializer):
        """Attach business/client/service/quote properly before saving."""
        user = self.request.user
        business = Business.objects.filter(owner=user).first()
        if not business:
            raise ValidationError("Only business owners can create invoices.")

        validated_data = serializer.validated_data

        client = validated_data.get("client")
        service = validated_data.get("service")

        if client.business != business:
            raise ValidationError("Client does not belong to your business.")

        if service:
            if service.business != business or service.client != client:
                raise ValidationError("Service must belong to the same business and client.")

        serializer.save(
            business=business,
            client=client,
            service=service,
        )

    def perform_destroy(self, instance):
        """Soft delete the invoice instead of hard deleting."""
        instance.soft_delete(user=self.request.user)

    @action(detail=True, methods=["post"], url_path="create-stripe-invoice")
    def create_stripe_invoice(self, request, pk=None):
        """
        Create a Stripe invoice for this invoice record.
        Only allowed for Businesses.
        """
        user = request.user
        business = Business.objects.filter(owner=user).first()
        if not business:
            return Response(
                {"detail": "Only business owners can create Stripe invoices."},
                status=status.HTTP_403_FORBIDDEN,
            )

        invoice = self.get_object()
        if not invoice.client or not invoice.client.user.email:
            return Response(
                {"detail": "Invoice must be linked to a client with an email."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            customer = stripe.Customer.create(
                name=invoice.client.user.name,
                email=invoice.client.user.email,
            )

            stripe_invoice_item = stripe.InvoiceItem.create(
                customer=customer.id,
                amount=int(invoice.total_amount * 100),
                currency=invoice.currency.lower(),
                description=f"Invoice {invoice.invoice_number}",
            )

            stripe_invoice = stripe.Invoice.create(
                customer=customer.id,
                auto_advance=True,
            )

            invoice.stripe_invoice_id = stripe_invoice.id
            invoice.save(update_fields=["stripe_invoice_id"])

            return Response(
                {"detail": "Stripe invoice created successfully.", "stripe_invoice_id": stripe_invoice.id},
                status=status.HTTP_201_CREATED,
            )

        except stripe.StripeError as e:
            return Response(
                {"detail": f"Stripe error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["post"], url_path="mark-as-paid")
    def mark_as_paid(self, request, pk=None):
        """Mark invoice as paid manually (if offline payment)."""
        invoice = self.get_object()

        if invoice.status == "PAID":
            return Response(
                {"detail": "Invoice already marked as paid."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invoice.status = "PAID"
        invoice.paid_at = timezone.now()
        invoice.save(update_fields=["status", "paid_at"])

        return Response(
            {"detail": "Invoice marked as paid successfully."},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get"], url_path="stripe-status")
    def stripe_status(self, request, pk=None):
        """Fetch the current Stripe invoice status."""
        invoice = self.get_object()

        if not invoice.stripe_invoice_id:
            return Response(
                {"detail": "No Stripe invoice linked."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            stripe_invoice = stripe.Invoice.retrieve(invoice.stripe_invoice_id)
            return Response(
                {"stripe_status": stripe_invoice.get("status")},
                status=status.HTTP_200_OK,
            )
        except stripe.StripeError as e:
            return Response(
                {"detail": f"Stripe error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
