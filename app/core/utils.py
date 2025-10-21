import pytz
from django.utils import timezone
from rest_framework import serializers


class BusinessTimezoneMixin:
    """
    Converts datetime fields from UTC → business timezone
    when serializing output.
    """

    def _get_business_timezone(self, instance):
        if hasattr(instance, "business") and getattr(instance.business, "timezone", None):
            return instance.business.timezone

        if hasattr(instance, "service") and getattr(instance.service.business, "timezone", None):
            return instance.service.business.timezone

        if hasattr(instance, "client") and getattr(instance.client.business, "timezone", None):
            return instance.client.business.timezone

        return None

    def to_representation(self, instance):
        """Convert UTC datetimes → business timezone when returning response"""
        data = super().to_representation(instance)
        tz_name = self._get_business_timezone(instance)
        if not tz_name:
            return data

        tz = pytz.timezone(tz_name)

        for field_name, field in self.fields.items():
            if isinstance(field, serializers.DateTimeField):
                raw_value = getattr(instance, field_name, None)
                if raw_value:
                    if timezone.is_naive(raw_value):
                        raw_value = timezone.make_aware(raw_value, timezone.utc)

                    localized = raw_value.astimezone(tz)

                    data[field_name] = localized.strftime("%Y-%m-%d %H:%M:%S")

        return data
