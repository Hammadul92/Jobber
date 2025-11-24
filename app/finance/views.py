import stripe
import time

from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import BankingInformation, Business, Client, Invoice, Payout
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
        Create or connect a Stripe Express account for payouts.
        Stripe handles onboarding, bank account, and identity verification.
        """
        user = request.user
        business = Business.objects.filter(owner=user).first()

        if not business:
            return Response(
                {"detail": "Only business owners can add a bank account."},
                status=status.HTTP_403_FORBIDDEN,
            )

        banking_info = BankingInformation.objects.filter(
            business=business,
            payment_method_type="BANK_ACCOUNT",
        ).first()

        try:
            if not banking_info or not banking_info.stripe_connected_account_id:
                connected_account = stripe.Account.create(
                    type="express",
                    country=business.country.upper(),
                    email=business.email,
                    capabilities={"transfers": {"requested": True}},
                    business_profile={
                        "name": business.name,
                        "mcc": "7349",
                        "url": business.website or f"https://contractorz.com/businesses/{business.slug}",
                        "product_description": f"Payouts for {business.name}",
                    },
                    metadata={"business_id": str(business.id)},
                )

                if not banking_info:
                    banking_info = BankingInformation.objects.create(
                        business=business,
                        stripe_connected_account_id=connected_account.id,
                        payment_method_type="BANK_ACCOUNT",
                    )
                else:
                    banking_info.stripe_connected_account_id = connected_account.id
                    banking_info.save(update_fields=["stripe_connected_account_id"])

            else:
                connected_account = stripe.Account.retrieve(banking_info.stripe_connected_account_id)

            account_link = stripe.AccountLink.create(
                account=connected_account.id,
                refresh_url=f"{settings.FRONTEND_URL}/reauth",
                return_url=f"{settings.FRONTEND_URL}/user-account/banking",
                type="account_onboarding",
            )

            return Response(
                {
                    "detail": "Stripe onboarding link created.",
                    "onboarding_url": account_link.url,
                },
                status=status.HTTP_200_OK,
            )

        except stripe.StripeError as e:
            return Response({"detail": f"Stripe error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["post"], url_path="check-bank-account")
    def check_bank_account(self, request):
        """
        Retrieve and update bank account info from Stripe for the connected Express account.
        """
        user = request.user
        business = Business.objects.filter(owner=user).first()

        if not business:
            return Response(
                {"detail": "Only business owners can check bank account."},
                status=status.HTTP_403_FORBIDDEN,
            )

        banking_info = BankingInformation.objects.filter(
            business=business,
            payment_method_type="BANK_ACCOUNT",
        ).first()

        if not banking_info or not banking_info.stripe_connected_account_id:
            return Response(
                {"detail": "No connected Stripe account found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            connected_account = stripe.Account.retrieve(
                banking_info.stripe_connected_account_id,
                expand=["external_accounts"],
            )

            external_accounts = connected_account.external_accounts.data
            if not external_accounts:
                return Response(
                    {"detail": "No bank account found for this Stripe account."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            bank_account = external_accounts[0]
            banking_info.bank_name = bank_account.bank_name
            banking_info.account_number_last4 = bank_account.last4
            banking_info.currency = bank_account.currency
            banking_info.country = bank_account.country
            banking_info.account_holder_name = bank_account.account_holder_name or business.name
            banking_info.account_holder_type = bank_account.account_holder_type
            banking_info.save()

            return Response(
                {
                    "detail": "Banking information checked successfully.",
                },
                status=status.HTTP_200_OK,
            )

        except stripe.StripeError as e:
            return Response({"detail": f"Stripe error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


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
                .exclude(status="DRAFT") \
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

        if invoice.status == "PAID":
            return Response({"detail": "Invoice already paid."}, status=status.HTTP_400_BAD_REQUEST)

        client_bank_info = client.banking_information.filter(is_active=True).first()
        if not client_bank_info or not client_bank_info.stripe_payment_method_id:
            return Response(
                {"error": "Client does not have an active payment method."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        business_bank_info = business.banking_information.filter(
            is_active=True, payment_method_type="BANK_ACCOUNT"
        ).first()

        if not business_bank_info or not business_bank_info.stripe_connected_account_id:
            return Response(
                {"error": "Business does not have a connected Stripe account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        amount_cents = int(invoice.total_amount * 100)

        try:
            payment_intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=invoice.currency.lower(),
                customer=client_bank_info.stripe_customer_id,
                payment_method=client_bank_info.stripe_payment_method_id,
                off_session=True,
                confirm=True,
                transfer_data={"destination": business_bank_info.stripe_connected_account_id},
                description=f"Payment for Invoice #{invoice.invoice_number}",
                metadata={"invoice_id": str(invoice.id)},
            )

            invoice.status = "PAID"
            invoice.paid_at = timezone.now()
            invoice.save(update_fields=["status", "paid_at"])

            Payout.objects.create(
                business=business,
                invoice=invoice,
                amount=invoice.total_amount,
                currency=invoice.currency,
                stripe_payment_intent_id=payment_intent.id,
                status="PAID",
                processed_at=timezone.now(),
            )

            return Response({"detail": "Payment successful and payout recorded."}, status=200)

        except stripe.StripeError as e:
            return Response({"error": f"Stripe error: {str(e)}"}, status=400)

        except Exception as e:
            return Response({"error": str(e)}, status=500)


class PayoutViewSet(viewsets.ModelViewSet):
    """ViewSet for managing payouts."""

    serializer_class = serializers.PayoutSerializer
    queryset = Payout.objects.all()
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    pagination_class = paginations.PayoutPagination

    def get_queryset(self):
        """Restrict payouts to the user's business."""

        user = self.request.user
        business = Business.objects.filter(owner=user).first()

        if business:
            return self.queryset.filter(business=business, is_active=True).order_by("-id")
        return self.queryset.none()

    def perform_destroy(self, instance):
        """Soft delete the payout."""

        instance.soft_delete(user=self.request.user)

    @action(detail=True, methods=["post"], url_path="refund")
    def refund_payout(self, request, pk=None):
        """
        Refund a payout through Stripe.
        Supports partial or full refunds.
        """
        payout = self.get_object()
        amount = request.data.get("amount")
        reason = request.data.get("reason", "Customer requested refund")

        if not payout.stripe_payment_intent_id:
            return Response(
                {"error": "No Stripe payment intent found for this payout."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if payout.is_refunded:
            return Response(
                {"error": "This payout has already been refunded."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            refund_params = {"payment_intent": payout.stripe_payment_intent_id}
            if amount:
                refund_params["amount"] = int(float(amount) * 100)

            refund = stripe.Refund.create(**refund_params)

            payout.is_refunded = True
            payout.refunded_amount = amount or payout.amount
            payout.refund_reason = reason
            payout.stripe_refund_id = refund.id
            payout.refunded_at = timezone.now()
            payout.status = "REFUNDED"
            payout.save(
                update_fields=[
                    "is_refunded",
                    "refunded_amount",
                    "refund_reason",
                    "stripe_refund_id",
                    "refunded_at",
                    "status",
                ]
            )

            return Response(
                {"detail": "Refund successful.", "refund_id": refund.id},
                status=status.HTTP_200_OK,
            )

        except stripe.StripeError as e:
            payout.failure_reason = str(e)
            payout.save(update_fields=["failure_reason"])
            return Response(
                {"error": f"Stripe error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as e:
            payout.failure_reason = str(e)
            payout.save(update_fields=["failure_reason"])
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
