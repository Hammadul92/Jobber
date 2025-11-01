from rest_framework import serializers

# from core.utils import BusinessTimezoneMixin
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
            'created_at',
            'updated_at',
        ]

        read_only_fields = ['created_at', 'updated_at']


class InvoiceSerializer(serializers.ModelSerializer):

    class Meta:
        model = Invoice
        fields = "__all__"
        read_only_fields = ["invoice_number", "created_at", "updated_at"]