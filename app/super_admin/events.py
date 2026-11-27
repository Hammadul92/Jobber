"""Record future model saves without retaining sensitive customer content."""

from django.db.models.signals import post_save
from django.dispatch import receiver
from .context import actor
from .models import PlatformEvent


@receiver(post_save, dispatch_uid="super_admin_platform_event")
def record_event(sender, instance, created, raw=False, **kwargs):
    if raw or sender.__module__ != "core.models":
        return
    # Authentication updates this on every session login. The dashboard login
    # has its own audit entry; do not turn the timestamp write into an alert.
    if kwargs.get("update_fields") == frozenset({"last_login"}):
        return
    request = actor.get()
    user = getattr(request, "user", None)
    user_id = user.pk if user and user.is_authenticated else None
    summary = {
        field: getattr(instance, field)
        for field in ("status", "is_active", "is_deleted")
        if hasattr(instance, field)
    }
    PlatformEvent.objects.create(
        actor_id=user_id,
        entity=sender._meta.model_name,
        entity_id=instance.pk,
        operation="created" if created else "updated",
        summary=summary,
    )
