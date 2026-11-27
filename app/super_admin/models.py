from django.conf import settings
from django.db import models


class PlatformEvent(models.Model):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )
    entity = models.CharField(max_length=80, db_index=True)
    entity_id = models.PositiveBigIntegerField(db_index=True)
    operation = models.CharField(max_length=20)
    summary = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at", "-id"]


class DeletionBatch(models.Model):
    resource = models.CharField(max_length=80)
    record_id = models.PositiveBigIntegerField()
    records = models.JSONField(default=list)
    created_at = models.DateTimeField()


class NotificationState(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    read_through = models.PositiveBigIntegerField(default=0)


class NotificationRead(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    event = models.ForeignKey(PlatformEvent, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("user", "event")
