"""
Serializers for business APIs
"""

from rest_framework import serializers

from core.models import Business


class BusinessSerializer(serializers.ModelSerializer):
    """ Serializer for businesses."""
    services_offered = serializers.SerializerMethodField()

    class Meta:
        model = Business
        fields = ['id', 'owner', 'name', 'phone', 'email', 'logo',
                  'website', 'business_description', 'street_address',
                  'suite_unit', 'city', 'country', 'province_state',
                  'postal_code', 'business_number', 'tax_rate',
                  'services_offered', 'timezone']

        read_only_fields = ['id']

    def get_services_offered(self, obj):
        """Return a list of tag names for services_offered."""
        return list(obj.services_offered.names()) \
            if obj.services_offered else []

    def create(self, validated_data):
        tags = validated_data.pop('services_offered', [])
        business = super().create(validated_data)
        business.services_offered.set(tags)
        return business

    def update(self, instance, validated_data):
        tags = validated_data.pop('services_offered', None)
        business = super().update(instance, validated_data)
        if tags is not None:
            business.services_offered.set(tags)
        return business
