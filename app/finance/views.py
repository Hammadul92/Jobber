import stripe
import logging
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from rest_framework import status, viewsets, mixins
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from core.models import BankingInformation, Business, Client, Invoice, Payout
from finance import serializers, paginations, emails
from finance.stripe_connect import create_merchant_account, create_onboarding_link
from finance.payment_methods import get_client_payment_method

stripe.api_key = settings.STRIPE_SECRET_KEY
logger = logging.getLogger(__name__)


def record_payment_result(invoice, payment_intent, account_id, payout=None):
    """Keep unsettled charges visible and prevent a second charge on retry."""
    if payout is None:
        payout = Payout.objects.get(invoice=invoice, stripe_payment_intent_id=payment_intent.id)
    payout.stripe_payment_intent_id = payment_intent.id
    payout.save(update_fields=["stripe_payment_intent_id"])
    if payout.amount != invoice.total_amount or payout.currency != invoice.currency:
        return Response({"error": "The invoice changed during payment. Please contact support."}, status=409)
    if payment_intent.status != "succeeded":
        if payment_intent.status in ("requires_payment_method", "canceled"):
            payout.status = "FAILED"
            payout.save(update_fields=["status"])
        return Response(
            {"error": "Payment has not completed. Retry to check its status before making another payment."},
            status=status.HTTP_409_CONFLICT,
        )
    invoice.status = "PAID"
    invoice.paid_at = timezone.now()
    invoice.save(update_fields=["status", "paid_at"])
    payout.status = "PAID"
    payout.processed_at = timezone.now()
    payout.save(update_fields=["status", "processed_at"])
    emails.send_invoice_paid_email(invoice)
    return Response({"detail": "Payment successful and payout recorded."}, status=200)


class BankingInformationViewSet(viewsets.ModelViewSet):
    """View for manage banking information APIs."""

    serializer_class = serializers.BankingInformationSerializer
    queryset = BankingInformation.objects.filter(is_active=True)
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"], url_path="stripe-config")
    def stripe_config(self, request):
        """Expose only the publishable key selected by server configuration."""
        key = settings.STRIPE_PUBLIC_KEY
        if not key or not key.startswith(("pk_test_", "pk_live_")):
            return Response(
                {"detail": "Card payments are not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        response = Response({"publishable_key": key})
        response["Cache-Control"] = "no-store"
        return response

    def get_queryset(self):
        """Return banking information linked to the logged-in user."""
        user = self.request.user
        return self.queryset.filter(
            Q(business__owner=user) | Q(client__user=user, client__is_active=True)
        ).order_by("-id")

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
            raise ValidationError("User must be linked to a Business or Client.")

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
            payment_method_type="CARD",
        )

        if not banking_info.stripe_customer_id:
            customer = stripe.Customer.create(
                name=owner_name,
                email=owner_email,
            )
            banking_info.stripe_customer_id = customer.id
            banking_info.save(update_fields=["stripe_customer_id"])

        intent = stripe.SetupIntent.create(customer=banking_info.stripe_customer_id)

        return Response(
            {"client_secret": intent.client_secret},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path="save-payment-method")
    def save_payment_method(self, request):
        """
        Save the Stripe payment method to the user's banking information,
        along with card metadata (brand, last4, exp_month,
        exp_year).
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
            payment_method_type="CARD",
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
        card = payment_method.to_dict().get("card", {})

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
    @transaction.atomic
    def add_bank_account(self, request):
        """
        Create a Managed Risk merchant account for direct payments.
        Stripe handles onboarding, bank account, and identity verification.
        """
        user = request.user
        business = Business.objects.select_for_update().filter(owner=user).first()

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
            if banking_info and banking_info.stripe_connected_account_id:
                if not banking_info.stripe_connect_v2:
                    return Response(
                        {"detail": (
                            "Disconnect your previous Stripe connection and "
                            "connect again for live direct payments."
                        )},
                        status=status.HTTP_409_CONFLICT,
                    )
            else:
                if not banking_info:
                    banking_info = BankingInformation.objects.create(
                        business=business,
                        payment_method_type="BANK_ACCOUNT",
                    )
                connected_account = create_merchant_account(business, banking_info)
                banking_info.stripe_connected_account_id = connected_account.id
                banking_info.stripe_connect_v2 = True
                banking_info.save(update_fields=["stripe_connected_account_id", "stripe_connect_v2"])

            account_link = create_onboarding_link(banking_info.stripe_connected_account_id)

            return Response(
                {
                    "detail": "Stripe onboarding link created.",
                    "onboarding_url": account_link.url,
                },
                status=status.HTTP_200_OK,
            )

        except stripe.APIConnectionError:
            logger.warning("Stripe onboarding connection failed for business %s", business.pk)
            return Response(
                {"detail": "Stripe did not respond in time. Please try connecting again."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except stripe.StripeError as e:
            logger.warning(
                "Stripe onboarding rejected for business %s: status=%s code=%s request_id=%s",
                business.pk, getattr(e, "http_status", None),
                getattr(e, "code", None), getattr(e, "request_id", None),
            )
            return Response(
                {"detail": f"Stripe error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=False, methods=["post"], url_path="check-bank-account")
    def check_bank_account(self, request):
        """
        Retrieve and update bank account info from Stripe for the connected
        merchant account.
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

            banking_info.stripe_charges_enabled = connected_account.charges_enabled
            banking_info.stripe_payouts_enabled = connected_account.payouts_enabled
            external_accounts = connected_account.to_dict().get("external_accounts", {}).get("data", [])
            bank_account = next(
                (account for account in external_accounts if account.get("object") == "bank_account"),
                None,
            )
            if bank_account:
                banking_info.bank_name = bank_account.get("bank_name")
                banking_info.account_number_last4 = bank_account.get("last4")
                banking_info.currency = bank_account.get("currency")
                banking_info.country = bank_account.get("country")
                banking_info.account_holder_name = (
                    bank_account.get("account_holder_name") or business.name
                )
                banking_info.account_holder_type = bank_account.get("account_holder_type")
            banking_info.save()

            return Response(
                {
                    "detail": "Banking information checked successfully.",
                    "charges_enabled": banking_info.stripe_charges_enabled,
                    "payouts_enabled": banking_info.stripe_payouts_enabled,
                },
                status=status.HTTP_200_OK,
            )

        except stripe.StripeError as e:
            return Response(
                {"detail": f"Stripe error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
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
        invoices = self.queryset.filter(is_active=True)
        if self.action == "list" and Business.objects.filter(owner=user).exists():
            return invoices.filter(business__owner=user).order_by("-id")
        return invoices.filter(
            Q(business__owner=user)
            | (Q(client__user=user, client__is_active=True, client__is_deleted=False) & ~Q(status="DRAFT"))
        ).order_by("-id")

    def perform_create(self, serializer):
        """Attach business/client/service properly before saving."""

        validated_data = serializer.validated_data
        business = validated_data.get("business")
        client = validated_data.get("client")
        service = validated_data.get("service")

        if business.owner_id != self.request.user.pk:
            raise PermissionDenied("Only the business owner can create invoices.")

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
        if instance.business.owner_id != self.request.user.pk:
            raise PermissionDenied("Only the business owner can update invoices.")
        previous_status = instance.status
        updated_instance = serializer.save()

        if previous_status != "SENT" and updated_instance.status == "SENT":
            emails.send_invoice_email(updated_instance)

        if previous_status != "PAID" and updated_instance.status == "PAID":
            updated_instance.paid_at = timezone.now()
            updated_instance.save(update_fields=["paid_at"])

    def perform_destroy(self, instance):
        """Soft delete the record."""

        if instance.business.owner_id != self.request.user.pk:
            raise PermissionDenied("Only the business owner can delete invoices.")
        instance.soft_delete(user=self.request.user)

    @action(detail=True, methods=["post"], url_path="send-invoice")
    def send_invoice(self, request, pk=None):
        """Send or resend a payable invoice with a fresh client login link."""
        invoice = self.get_object()
        if invoice.business.owner_id != request.user.pk:
            raise PermissionDenied("Only the business owner can send invoices.")
        if invoice.status not in ("DRAFT", "SENT") or Payout.all_objects.filter(
            invoice=invoice, status="PAID",
        ).exists():
            return Response(
                {"detail": "Only draft or sent unpaid invoices can be emailed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            emails.send_invoice_email(invoice)
        except Exception:
            logger.exception("Unable to email invoice %s", invoice.pk)
            return Response(
                {"detail": "Invoice email could not be sent. Please try again."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if invoice.status == "DRAFT":
            invoice.status = "SENT"
            invoice.save(update_fields=["status"])
        return Response({"detail": "Invoice email sent successfully."})

    @action(detail=True, methods=["post"], url_path="make-payment")
    @transaction.atomic
    def make_payment(self, request, pk=None):
        """Charge the client directly on the business account."""

        invoice = Invoice.objects.select_for_update().get(pk=self.get_object().pk)
        client = invoice.client
        business = invoice.business

        if client.user_id != request.user.pk:
            raise PermissionDenied("Only the invoiced customer can make this payment.")

        if invoice.status == "PAID" or Payout.all_objects.filter(invoice=invoice, status="PAID").exists():
            return Response(
                {"detail": "Invoice already paid."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if invoice.status != "SENT":
            return Response(
                {"detail": "Only sent invoices can be paid."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pending = Payout.all_objects.filter(invoice=invoice, status="PENDING").first()
        if pending:
            if not pending.stripe_payment_intent_id:
                return Response({"error": "A payment is pending review. Please contact support."}, status=409)
            try:
                options = {"stripe_account": pending.stripe_account_id} if pending.stripe_account_id else {}
                intent = stripe.PaymentIntent.retrieve(pending.stripe_payment_intent_id, **options)
                return record_payment_result(invoice, intent, pending.stripe_account_id, pending)
            except stripe.StripeError as exc:
                return Response({"error": f"Unable to check pending payment: {exc}"}, status=400)

        client_bank_info = get_client_payment_method(client)
        if not client_bank_info:
            return Response(
                {"error": "Client does not have an active payment method."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        business_bank_info = business.banking_information.filter(
            is_active=True,
            payment_method_type="BANK_ACCOUNT",
        ).first()

        if not business_bank_info or not business_bank_info.stripe_connected_account_id:
            return Response(
                {"error": "Business does not have a connected Stripe account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        amount_cents = int(invoice.total_amount * 100)
        if amount_cents <= 0:
            return Response(
                {"detail": "Invoice amount must be greater than zero."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        attempt = None
        try:
            account_id = business_bank_info.stripe_connected_account_id
            connected_account = stripe.Account.retrieve(account_id)
            if (
                not connected_account.charges_enabled
                or not connected_account.payouts_enabled
                or connected_account.to_dict().get("controller", {}).get("losses", {}).get("payments") != "stripe"
            ):
                return Response(
                    {"error": "Complete Stripe onboarding for managed-risk payments before collecting payment."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            attempt = Payout.objects.create(
                business=business, invoice=invoice, amount=invoice.total_amount,
                currency=invoice.currency, stripe_account_id=account_id, status="PENDING",
            )
            cloned_method = stripe.PaymentMethod.create(
                customer=client_bank_info.stripe_customer_id,
                payment_method=client_bank_info.stripe_payment_method_id,
                stripe_account=account_id,
                idempotency_key=f"payout-{attempt.pk}-card",
            )
            payment_intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=invoice.currency.lower(),
                payment_method=cloned_method.id,
                payment_method_types=["card"],
                off_session=True,
                confirm=True,
                stripe_account=account_id,
                idempotency_key=f"payout-{attempt.pk}-direct",
                description=(f"Payment for Invoice #{invoice.invoice_number}"),
                metadata={"invoice_id": str(invoice.id)},
            )
            return record_payment_result(invoice, payment_intent, account_id, attempt)

        except stripe.StripeError as e:
            if attempt and isinstance(e, (
                stripe.CardError, stripe.InvalidRequestError,
                stripe.AuthenticationError, stripe.PermissionError,
            )):
                attempt.status = "FAILED"
                attempt.save(update_fields=["status"])
            return Response({"error": f"Stripe error: {str(e)}"}, status=400)

        except Exception as e:
            return Response({"error": str(e)}, status=500)


class PayoutViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin, viewsets.GenericViewSet,
):
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
            return self.queryset.filter(
                business=business,
                is_active=True,
            ).order_by("-id")
        return self.queryset.none()

    def perform_destroy(self, instance):
        """Soft delete the payout."""

        instance.soft_delete(user=self.request.user)

    @action(detail=True, methods=["post"], url_path="refund")
    @transaction.atomic
    def refund_payout(self, request, pk=None):
        """
        Refund a payout through Stripe.
        Supports partial or full refunds.
        """
        payout = Payout.objects.select_for_update().get(pk=self.get_object().pk)
        amount = request.data.get("amount")
        reason = request.data.get(
            "reason",
            "Customer requested refund",
        )

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

        if payout.status != "PAID":
            return Response({"error": "Only completed payments can be refunded."}, status=400)

        try:
            refund_params = {
                "payment_intent": payout.stripe_payment_intent_id,
                "idempotency_key": f"payout-{payout.pk}-refund",
            }
            if payout.stripe_account_id:
                refund_params["stripe_account"] = payout.stripe_account_id
            if amount not in (None, ""):
                try:
                    requested = Decimal(str(amount))
                    if (
                        not requested.is_finite() or requested <= 0 or requested > payout.amount
                        or requested != requested.quantize(Decimal("0.01"))
                    ):
                        raise ValueError
                except (InvalidOperation, ValueError):
                    return Response({"error": "Enter a valid refund amount up to the payment total."}, status=400)
                refund_params["amount"] = int(requested * 100)

            if payout.stripe_refund_id:
                scope = {"stripe_account": payout.stripe_account_id} if payout.stripe_account_id else {}
                refund = stripe.Refund.retrieve(payout.stripe_refund_id, **scope)
            else:
                refund = stripe.Refund.create(**refund_params)
                payout.stripe_refund_id = refund.id
                payout.save(update_fields=["stripe_refund_id"])
            if refund.status != "succeeded":
                return Response(
                    {"detail": "Refund is not completed. Retry to check its status."},
                    status=status.HTTP_202_ACCEPTED,
                )

            payout.is_refunded = True
            payout.refunded_amount = Decimal(refund.amount) / 100
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
