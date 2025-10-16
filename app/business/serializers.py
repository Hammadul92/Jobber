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
    Job,
    JobPhoto,
    Quote,
    ServiceQuestionnaire,
    Service,
    TeamMember,
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

    def validate(self, attrs):
        employee = attrs.get("employee")
        business = attrs.get("business")

        # Prevent adding any business owner as a team member
        if employee and hasattr(employee, "owned_businesses"):
            if employee.owned_businesses.exists():
                raise serializers.ValidationError(
                    f"User '{employee.name}' is already a business owner and cannot be added as a team member."
                )

        return attrs


class ServiceSerializer(serializers.ModelSerializer):
    """Serializer for services with optimized validation."""
    quotations = serializers.SerializerMethodField()
    service_questionnaires = serializers.SerializerMethodField()
    client_name = serializers.CharField(source="client.user.name", read_only=True)

    class Meta:
        model = Service
        fields = [
            "id", "client", "client_name", "business", "quotations",
            "service_name", "service_questionnaires", "filled_questionnaire",
            "description", "start_date", "end_date", "service_type",
            "price", "currency", "billing_cycle", "status",
            "street_address", "city", "country", "province_state",
            "postal_code", "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_quotations(self, obj):
        """Return related active quotes."""
        return list(obj.service_quotes.filter(is_active=True).values(
            "id", "quote_number", "status", "valid_until", "created_at"
        ))

    def get_service_questionnaires(self, obj):
        """Return the active questionnaire for this service if exists."""
        questionnaire = obj.business.service_questionnaires.filter(
            service_name=obj.service_name,
            is_active=True
        ).first()
        if questionnaire:
            return {
                "id": questionnaire.id,
                "questionnaire": questionnaire.additional_questions_form,
            }
        return {}


    def validate(self, data):
        """
        Validates:
        - client belongs to business
        - service_name is offered by business
        - (questionnaire existence only checked on creation)
        """
        business = data.get("business") or getattr(self.instance, "business", None)
        client = data.get("client") or getattr(self.instance, "client", None)
        service_name = data.get("service_name") or getattr(self.instance, "service_name", None)

        errors = {}

        # Validate service_name is offered by the business
        if business and service_name:
            allowed_services = {s.name for s in business.services_offered.all()}
            if service_name not in allowed_services:
                errors["service_name"] = "This service is not offered by the selected business."

        # Validate client belongs to business
        if business and client and client.business != business:
            errors["client"] = "This client does not belong to the selected business."

        # Only check for questionnaire existence when creating
        if not self.instance:  # creation only
            has_questionnaire = business.service_questionnaires.filter(
                service_name=service_name,
                is_active=True
            ).exists()
            if not has_questionnaire:
                errors["service_name"] = (
                    "Cannot create this service because there is no active "
                    "questionnaire for the selected service name."
                )

        if errors:
            raise serializers.ValidationError(errors)

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


class ServiceQuestionnaireSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.name', read_only=True)
    no_of_questions = serializers.SerializerMethodField()

    class Meta:
        model = ServiceQuestionnaire
        fields = [
            'id',
            'business',
            'business_name',
            'service_name',
            'additional_questions_form',
            'no_of_questions',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'business_name',
            'no_of_questions',
            'created_at',
            'updated_at',
        ]

    def get_no_of_questions(self, obj):
        """Return the count of questions in the questionnaire."""
        if obj.additional_questions_form and isinstance(obj.additional_questions_form, list):
            return len(obj.additional_questions_form)
        return 0


class JobSerializer(serializers.ModelSerializer):
    """Serializer for Job model."""

    service_name = serializers.CharField(source="service.service_name", read_only=True)
    assigned_to_name = serializers.CharField(
        source="assigned_to.employee.name", read_only=True
    )
    business_name = serializers.CharField(
        source="service.business.name", read_only=True
    )

    class Meta:
        model = Job
        fields = [
            "id",
            "service",
            "service_name",
            "assigned_to",
            "assigned_to_name",
            "business_name",
            "title",
            "description",
            "scheduled_date",
            "completed_at",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate(self, data):
        """Ensure job assignment is within the same business as service."""
        service = data.get("service") or getattr(self.instance, "service", None)
        assigned_to = data.get("assigned_to") or getattr(self.instance, "assigned_to", None)

        errors = {}

        if assigned_to and service:
            # Validate that assigned team member belongs to same business
            if assigned_to.business != service.business:
                errors["assigned_to"] = (
                    "Assigned team member must belong to the same business as the service."
                )

        if errors:
            raise serializers.ValidationError(errors)

        return data


class JobPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobPhoto
        fields = [
            "id",
            "job",
            "photo",
            "photo_type",
            "uploaded_at",
        ]
        read_only_fields = ["uploaded_at"]
