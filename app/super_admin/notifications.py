"""Per-superuser unread state for the recorded platform activity feed."""

from django.db import transaction
from rest_framework.response import Response
from .models import PlatformEvent, NotificationRead, NotificationState
from .views import Base, presented_rows, RESOURCES


def feed(user):
    latest = PlatformEvent.objects.order_by("-pk").values_list("pk", flat=True).first() or 0
    state = NotificationState.objects.filter(user=user).first()
    unread = PlatformEvent.objects.filter(
        pk__gt=state.read_through if state else 0, pk__lte=latest
    ).exclude(pk__in=NotificationRead.objects.filter(user=user).values("event_id"))
    events = list(unread.select_related("actor").order_by("-pk")[:50])
    rows = presented_rows(events)
    results = []
    for event, row in zip(events, rows):
        related = row["_relations"].get("record")
        verb = "Deleted" if event.summary.get("is_deleted") else event.operation.capitalize()
        entity = next(
            (
                str(model._meta.verbose_name)
                for model in RESOURCES.values()
                if model._meta.model_name == event.entity
            ),
            event.entity.replace("_", " "),
        )
        description = related["label"] if related else "Platform activity was recorded."
        status = event.summary.get("status")
        if status:
            description += " · " + str(status).replace("_", " ").title()
        results.append(
            {
                "id": event.pk,
                "title": "%s %s" % (verb, entity),
                "description": description,
                "created_at": event.created_at,
                "is_read": False,
                "to": (
                    "/super-admin/%s/%s" % (related["resource"], related["id"])
                    if related and related["resource"]
                    else "/super-admin/activity/%s" % event.pk
                ),
            }
        )
    return {"results": results, "unread_count": unread.count(), "through": latest}


class Notifications(Base):
    def get(self, request):
        return Response(feed(request.user))

    def post(self, request):
        operation = request.data.get("operation")
        if operation not in ("read", "read_all"):
            return Response({"detail": "Unknown notification action."}, status=400)
        try:
            value = int(request.data.get("id" if operation == "read" else "through"))
            if value < 0:
                raise ValueError()
        except (TypeError, ValueError):
            return Response({"detail": "Invalid notification reference."}, status=400)
        with transaction.atomic():
            if operation == "read":
                event = PlatformEvent.objects.filter(pk=value).first()
                if event is None:
                    return Response({"detail": "Notification not found."}, status=404)
                NotificationRead.objects.get_or_create(user=request.user, event=event)
            else:
                latest = (
                    PlatformEvent.objects.order_by("-pk").values_list("pk", flat=True).first() or 0
                )
                if value > latest:
                    return Response(
                        {"detail": "Refresh notifications before marking them read."}, status=400
                    )
                NotificationState.objects.get_or_create(user=request.user)
                state = NotificationState.objects.select_for_update().get(user=request.user)
                state.read_through = max(state.read_through, value)
                state.save(update_fields=["read_through"])
                NotificationRead.objects.filter(
                    user=request.user, event_id__lte=state.read_through
                ).delete()
        return Response(feed(request.user))
