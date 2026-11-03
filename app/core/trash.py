"""Trash: list a resource's soft-deleted records and restore them.

A viewset opts in by mixing in TrashMixin ahead of its other bases and
describing each row for the trash table:

    class ClientViewSet(TrashMixin, ListingMixin, viewsets.ModelViewSet):
        trash_select_related = ("user",)

        def trash_label(self, obj): return obj.name
        def trash_detail(self, obj): return obj.company_name

That adds:

    GET  <resource>/trash/?page=1&search=text  -> deleted rows, newest first
    POST <resource>/<pk>/restore/              -> restore the row and the
                                                  records deleted with it
    POST <resource>/restore/ {"ids": [...]}    -> restore many rows

There is deliberately no way to purge records from the trash: deleted
records are kept as proof of past work and payments.
"""

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import filters, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from core.listing import MAX_BULK_IDS, OptionalPagePagination, _message

OWNER_ROLES = ("MANAGER", "ADMIN")


class TrashPagination(OptionalPagePagination):
    """Same page shape as the live tables, but the trash is always paged."""

    def paginate_queryset(self, queryset, request, view=None):
        return PageNumberPagination.paginate_queryset(self, queryset, request, view)


class TrashMixin:
    trash_select_related = ()
    _in_trash = False

    def trash_label(self, obj):
        return str(obj)

    def trash_detail(self, obj):
        return ""

    def get_queryset(self):
        # The viewset's own get_queryset calls super() and then applies its
        # ownership filters, so trash rows are scoped exactly like live rows.
        if self._in_trash:
            model = super().get_queryset().model
            return model.all_objects.filter(is_deleted=True).select_related(
                "deleted_by", *self.trash_select_related
            )
        return super().get_queryset()

    def _enter_trash(self, request):
        if getattr(request.user, "role", None) not in OWNER_ROLES:
            raise PermissionDenied("Only business owners can view or restore deleted records.")
        self._in_trash = True

    def _trash_row(self, obj):
        owner = obj.deleted_owner()
        deleted_by = obj.deleted_by
        return {
            "id": obj.pk,
            "label": self.trash_label(obj),
            "detail": self.trash_detail(obj),
            "deleted_at": obj.deleted_at,
            "deleted_by": (deleted_by.name or deleted_by.email) if deleted_by else "",
            "blocked_reason": _blocked_reason(owner),
        }

    @action(detail=False, methods=["get"], url_path="trash")
    def trash(self, request):
        self._enter_trash(request)
        queryset = self.get_queryset().order_by("-deleted_at", "-id")
        queryset = filters.SearchFilter().filter_queryset(request, queryset, self)

        paginator = TrashPagination()
        page = paginator.paginate_queryset(queryset, request, self)
        return paginator.get_paginated_response([self._trash_row(obj) for obj in page])

    @action(detail=True, methods=["post"], url_path="restore")
    def restore(self, request, pk=None):
        self._enter_trash(request)
        obj = self.get_object()
        _restore(obj)
        return Response(
            {"detail": f"{_kind(obj)} “{self.trash_label(obj)}” was restored."},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path="restore", url_name="bulk-restore")
    def bulk_restore(self, request):
        """Restore many rows: {"ids": [1, 2]} -> {succeeded, failed, results}.

        Each row is restored on its own, so one that cannot come back (its
        owner is still in the trash, or it would break a rule) does not stop
        the rest. Results keep the order of the ids sent.
        """
        self._enter_trash(request)
        ids = request.data.get("ids")
        if not isinstance(ids, list) or not ids or len(ids) > MAX_BULK_IDS:
            raise ValidationError({"ids": f"Select between 1 and {MAX_BULK_IDS} rows."})

        trash = self.get_queryset()
        rows = []
        for pk in dict.fromkeys(str(pk) for pk in ids):
            obj = trash.filter(pk=pk).first()
            if obj is None:
                rows.append({"id": pk, "ok": False, "detail": "Not found."})
                continue
            try:
                _restore(obj)
                rows.append({"id": pk, "ok": True, "detail": ""})
            except ValidationError as exc:
                rows.append({"id": pk, "ok": False, "detail": _message(exc.detail)})

        succeeded = sum(row["ok"] for row in rows)
        return Response(
            {"succeeded": succeeded, "failed": len(rows) - succeeded, "results": rows},
            status=status.HTTP_200_OK,
        )


def _restore(obj):
    """Restore one trashed record, or raise ValidationError saying why not."""
    reason = _blocked_reason(obj.deleted_owner())
    if reason:
        raise ValidationError({"detail": reason})

    # Restoring must not break the rules a new record has to follow,
    # e.g. two open quotes for the same service.
    try:
        obj.clean()
    except DjangoValidationError as exc:
        raise ValidationError({"detail": " ".join(exc.messages)})

    with transaction.atomic():
        obj.restore(cascade=True)


def _kind(obj):
    return obj._meta.verbose_name.capitalize()


def _blocked_reason(owner):
    if owner is None:
        return ""
    return f"Restore {owner._meta.verbose_name} “{owner}” first. This record belongs to it."
