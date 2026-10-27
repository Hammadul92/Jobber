from decimal import Decimal

from rest_framework import serializers

from core.utils import BusinessTimezoneMixin
from core.models import BankingInformation, Invoice, Payout
from core.pricing import invoice_line_items, line_items_total, quote_line_items, service_line_items, tax_amount_for
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
        ]


class InvoiceSerializer(BusinessTimezoneMixin, serializers.ModelSerializer):
    line_items = serializers.SerializerMethodField()
    line_items_locked = serializers.SerializerMethodField()
    business_name = serializers.CharField(
        source="business.name",
        read_only=True,
    )
    client_name = serializers.CharField(
        source="client.user.name",
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

    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_number",
            "status",
            "due_date",
            "business_name",
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
        read_only_fields = ["invoice_number", "created_at", "updated_at"]

    def get_invoice_total(self, obj):
        return f"{obj.total_amount} {obj.currency}"

    def get_line_items(self, obj):
        return invoice_line_items(obj)

    def get_line_items_locked(self, obj):
        return obj.line_items is not None

    def validate(self, attrs):
        """Keep invoice amounts aligned with the saved item breakdown."""
        service = attrs.get("service") or getattr(self.instance, "service", None)
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
        source="invoice.client.user.name", read_only=True
    )
    service_name = serializers.CharField(
        source="invoice.service.service_name", read_only=True
    )
    invoice_number = serializers.CharField(
        source="invoice.invoice_number", read_only=True
    )
    payout_total = serializers.SerializerMethodField()

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
