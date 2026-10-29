"""Keep writable relations inside the requesting user's own business."""

from rest_framework import serializers

from core.models import Business


def owning_business(obj):
    """Return the business a record belongs to."""
    if isinstance(obj, Business):
        return obj
    if hasattr(obj, "business"):
        return obj.business
    if hasattr(obj, "service"):
        return obj.service.business
    if hasattr(obj, "job"):
        return obj.job.service.business
    raise TypeError(f"Cannot resolve the business of {obj!r}")


class OwnedRelationsMixin:
    """Reject writes that point a relation at another business's record.

    Unchanged relations are accepted so full-object updates keep working.
    """

    owned_relations = ()

    def can_link(self, field, target, user):
        return owning_business(target).owner_id == user.pk

    def run_validation(self, data=serializers.empty):
        attrs = super().run_validation(data)
        user = getattr(self.context.get("request"), "user", None)
        if user is None or getattr(user, "role", None) == "ADMIN":
            return attrs

        errors = {}
        for field in self.owned_relations:
            target = attrs.get(field)
            if target is None:
                continue
            if self.instance is not None and getattr(self.instance, f"{field}_id", None) == target.pk:
                continue
            if not self.can_link(field, target, user):
                errors[field] = "Select a record from your own business."
        if errors:
            raise serializers.ValidationError(errors)
        return attrs
