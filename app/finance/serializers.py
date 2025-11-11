from rest_framework import serializers

from core.utils import BusinessTimezoneMixin
from core.models import BankingInformation, Invoice


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
            'transit_number',
            'account_number_last4',
            'routing_number',
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

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'status', 'due_date', 'business_name',
            'subtotal', 'tax_rate', 'tax_amount', 'total_amount',
            'notes', 'paid_at', 'has_payment_method',
            'client_name', 'service_name', 'currency', 'invoice_total',
            'business', 'client', 'service', 'created_at', 'updated_at'
        ]
        read_only_fields = ['invoice_number', 'created_at', 'updated_at']

    def get_invoice_total(self, obj):
        return f"{obj.total_amount} {obj.currency}"

    def get_has_payment_method(self, obj):
        return bool(obj.client.banking_information.filter(is_active=True).first())