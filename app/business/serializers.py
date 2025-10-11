"""
Serializers for business APIs
"""

import json
from django.utils import timezone

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from core.models import (
    Business,
    Client,
    TeamMember,
    Service,
    Quote,
)


class BusinessSerializer(serializers.ModelSerializer):
    """ Serializer for businesses."""
    services_offered = serializers.SerializerMethodField()

    class Meta:
        model = Business
        fields = ['id', 'owner', 'name', 'phone', 'email',
                  'business_description', 'street_address',
                  'city', 'country', 'province_state',
                  'postal_code', 'business_number', 'tax_rate',
                  'services_offered', 'timezone', 'created_at',
                  'updated_at']

        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    @extend_schema_field(serializers.ListField(child=serializers.CharField()))
    def get_services_offered(self, obj):
        """Return a list of tag names for services_offered."""
        return list(obj.services_offered.names()) \
            if obj.services_offered else []

    def create(self, validated_data):
        tags = self.initial_data.get('services_offered')
        if isinstance(tags, str):
            try:
                tags = json.loads(tags)
            except json.JSONDecodeError:
                tags = []
        validated_data.pop('services_offered', None)
        business = super().create(validated_data)
        business.services_offered.set(tags)
        return business

    def update(self, instance, validated_data):
        tags = self.initial_data.get('services_offered')
        if isinstance(tags, str):
            try:
                tags = json.loads(tags)
            except json.JSONDecodeError:
                tags = []
        validated_data.pop('services_offered', None)
        business = super().update(instance, validated_data)
        if tags is not None:
            business.services_offered.set(tags)
        return business


class ClientSerializer(serializers.ModelSerializer):
    """ Serializer for clients."""
    client_name = serializers.CharField(
        source="user.name",
        read_only=True
    )
    client_email = serializers.CharField(
        source="user.email",
        read_only=True
    )
    client_phone = serializers.CharField(
        source="user.phone",
        read_only=True
    )
    is_active = serializers.CharField(
        source="user.is_active",
        read_only=True
    )

    class Meta:
        model = Client
        fields = ['id', 'user', 'business', 'client_name',
                  'client_email', 'client_phone', 'is_active',
                  'street_address', 'city', 'country', 'province_state',
                  'postal_code', 'created_at', 'updated_at']

        read_only_fields = [
            'id', 'user', 'business', 'created_at', 'updated_at'
        ]


class TeamMemberSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(
        source="employee.name",
        read_only=True
    )
    employee_email = serializers.CharField(
        source="employee.email",
        read_only=True
    )
    employee_phone = serializers.CharField(
        source="employee.phone",
        read_only=True
    )
    is_active = serializers.CharField(
        source="employee.is_active",
        read_only=True
    )
    role = serializers.CharField(source="employee.role", read_only=True)
    business_name = serializers.CharField(
        source="business.name",
        read_only=True
    )

    class Meta:
        model = TeamMember
        fields = [
            "id", "business", "business_name", "employee",
            "employee_name", "employee_email", "is_active", "role",
            "job_duties", "expertise", "employee_phone",
            "is_active", "joined_at",
        ]

        read_only_fields = ["id", "joined_at"]


class ServiceSerializer(serializers.ModelSerializer):
    """ Serializer for services."""
    quotations = serializers.SerializerMethodField()
    client_name = serializers.CharField(
        source="client.user.name",
        read_only=True
    )

    class Meta:
        model = Service
        fields = [
            "id", "client", "client_name", "business", "quotations",
            "service_name", "description", "start_date", "end_date",
            "service_type", "price", "currency", "billing_cycle", "status",
            "street_address", "city", "country", "province_state",
            "postal_code", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "client", "business", "created_at", "updated_at"
        ]

    def get_quotations(self, obj):
        """Return related quotes."""
        quotes = obj.service_quotes.filter(is_active=True).values(
            "id", "quote_number", "status", "valid_until", "created_at"
        )
        return list(quotes)

    def validate(self, data):
        """
        Custom validation:
        - Ensure service_name is valid for the selected business.
        - Ensure client belongs to the same business.
        """
        business = (
            data.get("business")
            or getattr(self.instance, "business", None)
        )
        client = data.get("client") or getattr(self.instance, "client", None)

        # Validate service_name
        if business and data.get("service_name"):
            allowed = {
                service.name
                for service in business.services_offered.all()
            }
            if data["service_name"] not in allowed:
                raise serializers.ValidationError({
                    "service_name": (
                        "This service is not offered by the "
                        "selected business."
                    )
                })

        # Validate client belongs to business
        if business and client and client.business != business:
            raise serializers.ValidationError({
                "client": (
                    "This client does not belong to the selected "
                    "business."
                )
            })

        return data


class QuoteSerializer(serializers.ModelSerializer):
    """ Serializer for quotes."""

    service_data = ServiceSerializer(source="service", read_only=True)
    client = ClientSerializer(source="service.client", read_only=True)
    service_name = serializers.CharField(
        source="service.service_name",
        read_only=True
    )
    client_name = serializers.CharField(
        source="service.client.user.name",
        read_only=True
    )
    business_name = serializers.CharField(
        source="service.business.name",
        read_only=True
    )

    class Meta:
        model = Quote
        fields = [
            "id", "quote_number", "service", "service_data", "client",
            "service_name", "client_name", "business_name", "valid_until",
            "status", "signed_at", "signature", "terms_conditions",
            "notes", "is_active", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "quote_number", "status", "created_at", "updated_at",
        ]

    def validate_valid_until(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError(
                "The 'valid_until' date must be in the future."
            )
        return value
