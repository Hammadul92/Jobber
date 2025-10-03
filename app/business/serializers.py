"""
Serializers for business APIs
"""

import json
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from core.models import Business, Client, TeamMember


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

    class Meta:
        model = Client
        fields = ['id', 'business', 'name', 'email', 'phone',
                  'street_address', 'city', 'country', 'province_state',
                  'postal_code', 'created_at', 'updated_at']

        read_only_fields = ['id', 'business', 'created_at', 'updated_at']


class TeamMemberSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(
        source="employee.name",
        read_only=True
    )
    employee_email = serializers.CharField(
        source="employee.email",
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
            "job_duties", "expertise", "phone",
            "is_active", "joined_at",
        ]

        read_only_fields = ["id", "joined_at"]
