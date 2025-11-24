from rest_framework import serializers

from core.utils import BusinessTimezoneMixin
from core.models import BankingInformation, Invoice, Payout


class BankingInformationSerializer(serializers.ModelSerializer):

    class Meta:
        model = BankingInformation
        fields = [
            'id',
            'business',
            'client',
            'payment_method_type',
            'bank_name',
            'account_holder_name',
            'account_number_last4',
            'auto_payments',
            'card_brand',
            'card_last4',
            'card_exp_month',
            'card_exp_year',
            'is_active',
        ]

        read_only_fields = ['created_at', 'updated_at']


class InvoiceSerializer(BusinessTimezoneMixin, serializers.ModelSerializer):
    business_name = serializers.CharField(
        source="business.name",
        read_only=True
    )
    client_name = serializers.CharField(
        source="client.user.name",
        read_only=True
    )
    service_name = serializers.CharField(
        source="service.service_name",
        read_only=True
    )
    invoice_total = serializers.SerializerMethodField()
    has_payment_method = serializers.SerializerMethodField()
    has_paid_payout = serializers.SerializerMethodField()
    payout_id = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'status', 'due_date', 'business_name',
            'subtotal', 'tax_rate', 'tax_amount', 'total_amount',
            'notes', 'paid_at', 'has_payment_method', 'has_paid_payout',
            'payout_id', 'client_name', 'service_name', 'currency',
            'invoice_total', 'business', 'client', 'service', 'created_at',
            'updated_at'
        ]
        read_only_fields = ['invoice_number', 'created_at', 'updated_at']

    def get_invoice_total(self, obj):
        return f"{obj.total_amount} {obj.currency}"

    def get_has_payment_method(self, obj):
        return bool(obj.client.banking_information.filter(is_active=True).first())

    def get_has_paid_payout(self, obj):
        """
        Returns True only if there is a payout with status PAID for this invoice.
        """
        return obj.payouts.filter(status="PAID").exists()

    def get_payout_id(self, obj):
        payout = obj.payouts.filter(status="PAID").first()
        return payout.id if payout else None


class PayoutSerializer(BusinessTimezoneMixin, serializers.ModelSerializer):
    """Serializer for Payout model."""

    business_name = serializers.CharField(source="business.name", read_only=True)
    client_name = serializers.CharField(source="invoice.client.user.name", read_only=True)
    service_name = serializers.CharField(source="invoice.service.service_name", read_only=True)
    invoice_number = serializers.CharField(source="invoice.invoice_number", read_only=True)
    payout_total = serializers.SerializerMethodField()

    class Meta:
        model = Payout
        fields = [
            "id", "business", "business_name", "client_name",
            "service_name", "invoice", "invoice_number", "amount",
            "payout_total", "currency", "status", "is_refunded",
            "refunded_amount", "refund_reason", "processed_at",
            "refunded_at", "failure_reason", "is_active",
            "created_at", "updated_at",
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
        amt = float(obj.amount)
        fee = round(amt * 0.029 + 0.30, 2)
        net = round(amt - fee, 2)
        return f"{net:.2f} {obj.currency} (after {fee:.2f} stripe fee)"
