from decimal import Decimal

from rest_framework import serializers

from core.ownership import OwnedRelationsMixin
from core.utils import BusinessTimezoneMixin
from core.models import BankingInformation, Invoice, Payout
from core.pricing import invoice_line_items, line_items_total, quote_line_items, service_line_items, tax_amount_for
from core.payment_terms import business_local_date
from finance.payment_methods import get_client_payment_method


class BankingInformationSerializer(serializers.ModelSerializer):
    stripe_connection_status = serializers.SerializerMethodField()

    def get_stripe_connection_status(self, obj):
        if not obj.stripe_connected_account_id:
            return "not_connected"
        if not obj.stripe_connect_v2:
            return "reconnect_required"
        if obj.stripe_charges_enabled and obj.stripe_payouts_enabled:
            return "connected"
        return "onboarding"

    class Meta:
        model = BankingInformation
        fields = [
            "id",
            "business",
            "client",
            "payment_method_type",
            "bank_name",
            "account_holder_name",
            "account_holder_type",
            "account_number_last4",
            "country",
            "currency",
            "auto_payments",
            "card_brand",
            "card_last4",
            "card_exp_month",
            "card_exp_year",
            "is_active",
            "stripe_charges_enabled",
            "stripe_payouts_enabled",
            "stripe_connection_status",
        ]

        read_only_fields = [
            "created_at", "updated_at", "stripe_charges_enabled", "stripe_payouts_enabled",
            "business", "client", "is_active",
        ]


class InvoiceSerializer(OwnedRelationsMixin, BusinessTimezoneMixin, serializers.ModelSerializer):
    owned_relations = ("business", "client", "service")
    line_items = serializers.SerializerMethodField()
    line_items_locked = serializers.SerializerMethodField()
    business_name = serializers.CharField(
        source="business.name",
        read_only=True,
    )
    business_timezone = serializers.CharField(source="business.timezone", read_only=True)
    client_name = serializers.CharField(
        source="client.name",
        read_only=True,
    )
    client_company_name = serializers.CharField(source="client.company_name", read_only=True)
    billing_street_address = serializers.CharField(source="client.billing_street_address", read_only=True)
    billing_city = serializers.CharField(source="client.billing_city", read_only=True)
    billing_province_state = serializers.CharField(source="client.billing_province_state", read_only=True)
    billing_country = serializers.CharField(source="client.billing_country", read_only=True)
    billing_postal_code = serializers.CharField(source="client.billing_postal_code", read_only=True)
    service_street_address = serializers.CharField(source="service.street_address", read_only=True)
    service_city = serializers.CharField(source="service.city", read_only=True)
    service_province_state = serializers.CharField(source="service.province_state", read_only=True)
    service_country = serializers.CharField(source="service.country", read_only=True)
    service_postal_code = serializers.CharField(source="service.postal_code", read_only=True)
    service_name = serializers.CharField(
        source="service.service_name",
        read_only=True,
    )
    invoice_total = serializers.SerializerMethodField()
    has_payment_method = serializers.SerializerMethodField()
    can_manage = serializers.SerializerMethodField()
    has_paid_payout = serializers.SerializerMethodField()
    payout_id = serializers.SerializerMethodField()

    refunded_amount = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_number",
            "status",
            "due_date",
            "payment_terms",
            "sent_at",
            "business_name",
            "business_timezone",
            "subtotal",
            "tax_rate",
            "tax_amount",
            "total_amount",
            "line_items",
            "line_items_locked",
            "notes",
            "paid_at",
            "has_payment_method",
            "can_manage",
            "has_paid_payout",
            "payout_id",
            "refunded_amount",
            "client_name",
            "client_company_name",
            "billing_street_address", "billing_city", "billing_province_state",
            "billing_country", "billing_postal_code",
            "service_street_address", "service_city", "service_province_state",
            "service_country", "service_postal_code",
            "service_name",
            "currency",
            "invoice_total",
            "business",
            "client",
            "service",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["invoice_number", "sent_at", "created_at", "updated_at"]

    def get_invoice_total(self, obj):
        return f"{obj.total_amount} {obj.currency}"

    def get_line_items(self, obj):
        return invoice_line_items(obj)

    def get_line_items_locked(self, obj):
        return obj.line_items is not None

    def get_refunded_amount(self, obj):
        """Refunds leave the invoice paid; this shows how much was returned."""
        total = sum((payout.refunded_amount or 0) for payout in obj.payouts.all())
        return f"{total:.2f}"

    def validate(self, attrs):
        """Keep invoice amounts aligned with the saved item breakdown."""
        service = attrs.get("service") or getattr(self.instance, "service", None)
        business = attrs.get("business") or getattr(self.instance, "business", None)
        client = attrs.get("client") or getattr(self.instance, "client", None)
        if business and client and client.business_id != business.pk:
            raise serializers.ValidationError({"client": "This client does not belong to the invoice's business."})
        if business and service and service.business_id != business.pk:
            raise serializers.ValidationError({"service": "This service does not belong to the invoice's business."})
        if self.instance is None:
            if attrs.get("status", "DRAFT") != "DRAFT":
                raise serializers.ValidationError({"status": "Create a draft before sending an invoice."})
            quote = (service.service_quotes.filter(status="SIGNED", is_active=True).first()
                     if service else None)
            agreed_terms = quote.payment_terms if quote else None
            chosen_terms = attrs.get("payment_terms")
            if agreed_terms and chosen_terms and chosen_terms != agreed_terms:
                raise serializers.ValidationError({"payment_terms": "Must match the signed quote."})
            attrs["payment_terms"] = agreed_terms or chosen_terms
            if not attrs["payment_terms"]:
                raise serializers.ValidationError({"payment_terms": "Choose payment terms."})
            attrs.setdefault("due_date", None)
        elif "payment_terms" in attrs and attrs["payment_terms"] != self.instance.payment_terms:
            raise serializers.ValidationError({"payment_terms": "Payment terms cannot be changed after creation."})
        if self.instance and self.instance.payment_terms and "due_date" in attrs:
            if self.instance.status != "DRAFT" or self.instance.sent_at is not None:
                if attrs["due_date"] != self.instance.due_date:
                    raise serializers.ValidationError({"due_date": "A sent invoice's due date cannot be changed."})
        if business and (self.instance is None or self.instance.payment_terms) and (
            attrs.get("due_date") is not None and attrs["due_date"] < business_local_date(business)
        ):
            raise serializers.ValidationError({"due_date": "The due date cannot be in the past."})
        if self.instance and attrs.get("status") == "SENT" and self.instance.payment_terms:
            due_date = attrs.get("due_date", self.instance.due_date)
            if due_date is not None and due_date < business_local_date(business):
                raise serializers.ValidationError({"due_date": "Update the past due date before sending."})
        if self.instance and (self.instance.status in ("PAID", "CANCELLED") or
                              self.instance.payouts.filter(status="PAID").exists()):
            if any(key in attrs for key in ("payment_terms", "due_date")):
                raise serializers.ValidationError("Payment terms and due date are locked for this invoice.")
        if self.instance and self.instance.line_items is not None:
            items = self.instance.line_items
        elif service and not self.instance:
            quote = service.service_quotes.filter(status="SIGNED", is_active=True).first()
            items = quote_line_items(quote) if quote else service_line_items(service)
            attrs["line_items"] = items
            attrs["currency"] = (quote.currency if quote else None) or service.currency
            if quote and quote.tax_rate is not None:
                attrs["tax_rate"] = quote.tax_rate
        else:
            return attrs

        subtotal = line_items_total(items)
        rate = attrs.get("tax_rate", getattr(self.instance, "tax_rate", Decimal("0")))
        tax = tax_amount_for(subtotal, rate)
        attrs["subtotal"] = subtotal
        attrs["tax_amount"] = tax
        attrs["total_amount"] = subtotal + tax
        return attrs

    def get_has_payment_method(self, obj):
        return get_client_payment_method(obj.client) is not None

    def get_can_manage(self, obj):
        request = self.context.get("request")
        return bool(request and obj.business.owner_id == request.user.pk)

    def get_has_paid_payout(self, obj):
        """
        Returns True only if there is a payout with status PAID
        for this invoice.
        """
        return obj.payouts.filter(status="PAID").exists()

    def get_payout_id(self, obj):
        payout = obj.payouts.filter(status="PAID").first()
        return payout.id if payout else None


class PayoutSerializer(BusinessTimezoneMixin, serializers.ModelSerializer):
    """Serializer for Payout model."""

    business_name = serializers.CharField(
        source="business.name",
        read_only=True,
    )
    client_name = serializers.CharField(
        source="invoice.client.name", read_only=True
    )
    service_name = serializers.CharField(
        source="invoice.service.service_name", read_only=True
    )
    invoice_number = serializers.CharField(
        source="invoice.invoice_number", read_only=True
    )
    payout_total = serializers.SerializerMethodField()
    refundable_amount = serializers.SerializerMethodField()
    refunds = serializers.SerializerMethodField()

    class Meta:
        model = Payout
        fields = [
            "id",
            "business",
            "business_name",
            "client_name",
            "service_name",
            "invoice",
            "invoice_number",
            "amount",
            "payout_total",
            "currency",
            "status",
            "is_refunded",
            "refunded_amount",
            "refundable_amount",
            "refunds",
            "refund_reason",
            "processed_at",
            "refunded_at",
            "failure_reason",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "processed_at",
            "refunded_at",
            "is_active",
            "created_at",
            "updated_at",
            "failure_reason",
        ]

    def get_payout_total(self, obj):
        return f"{obj.amount:.2f} {obj.currency} (before Stripe fees)"

    def get_refundable_amount(self, obj):
        if obj.status not in ("PAID", "PARTIALLY_REFUNDED"):
            return "0.00"
        return f"{obj.amount - (obj.refunded_amount or 0):.2f}"

    def get_refunds(self, obj):
        return [
            {
                "id": refund.id, "amount": f"{refund.amount:.2f}", "reason": refund.reason,
                "status": refund.status, "created_at": refund.created_at,
            }
            for refund in obj.refunds.all()
        ]
