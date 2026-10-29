"""Server-side paging, filtering, sorting and bulk actions for list endpoints.

A viewset opts in by mixing in ListingMixin and declaring:

    search_fields = [...]                # ?search=text
    ordering_fields = [...]              # ?ordering=field or -field
    filter_fields = {"status": "status"} # ?status=value -> .filter(status=value)
    bulk_actions = {"send": "send_quote", "delete": "destroy"}

Lists stay plain arrays unless the request asks for a page (?page=N), so
dropdowns that need every record keep working.
"""

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.http import Http404
from rest_framework import filters, status
from rest_framework.decorators import action
from rest_framework.exceptions import APIException, PermissionDenied, ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

MAX_BULK_IDS = 100


class OptionalPagePagination(PageNumberPagination):
    """Page only when the client asks for ?page=; otherwise return every row."""

    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100

    def paginate_queryset(self, queryset, request, view=None):
        if self.page_query_param not in request.query_params:
            return None
        return super().paginate_queryset(queryset, request, view)

    def get_paginated_response(self, data):
        return Response({
            "count": self.page.paginator.count,
            "total_pages": self.page.paginator.num_pages,
            "current_page": self.page.number,
            "page_size": self.get_page_size(self.request),
            "results": data,
        })


class FieldFilterBackend(filters.BaseFilterBackend):
    """Apply the whitelisted ?param=value filters a view lists in filter_fields."""

    def filter_queryset(self, request, queryset, view):
        lookups = {}
        for param, lookup in getattr(view, "filter_fields", {}).items():
            value = request.query_params.get(param)
            if value not in (None, ""):
                if value.lower() in ("true", "false"):
                    value = value.lower() == "true"
                lookups[lookup] = value
        if not lookups:
            return queryset
        try:
            return queryset.filter(**lookups)
        except (ValueError, DjangoValidationError) as exc:
            raise ValidationError({"detail": f"Invalid filter value: {exc}"})


class ListingMixin:
    filter_backends = [FieldFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    pagination_class = OptionalPagePagination
    search_fields = []
    ordering_fields = []
    filter_fields = {}
    bulk_actions = {}

    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk(self, request):
        """Run one action on many rows: {"action": "...", "ids": [1, 2]}.

        Each row reuses the single-row handler, so the same queryset scoping
        and business rules apply. Rows are processed independently.
        """
        if getattr(request.user, "role", None) not in ("MANAGER", "ADMIN"):
            raise PermissionDenied("Only business owners can run bulk actions.")
        name = request.data.get("action")
        ids = request.data.get("ids")
        if name not in self.bulk_actions:
            raise ValidationError({"action": f"Choose one of: {', '.join(sorted(self.bulk_actions))}."})
        if not isinstance(ids, list) or not ids or len(ids) > MAX_BULK_IDS:
            raise ValidationError({"ids": f"Select between 1 and {MAX_BULK_IDS} rows."})

        handler = getattr(self, self.bulk_actions[name])
        lookup = self.lookup_url_kwarg or self.lookup_field
        results = []
        for pk in dict.fromkeys(str(pk) for pk in ids):
            self.kwargs[lookup] = pk
            try:
                with transaction.atomic():
                    response = handler(request, pk=pk)
                ok = response.status_code < 400
                detail = _message(response.data) if response.data else ""
            except Http404:
                ok, detail = False, "Not found."
            except APIException as exc:
                ok, detail = False, _message(exc.detail)
            except DjangoValidationError as exc:
                ok, detail = False, "; ".join(exc.messages)
            results.append({"id": pk, "ok": ok, "detail": detail})

        succeeded = sum(result["ok"] for result in results)
        return Response(
            {"succeeded": succeeded, "failed": len(results) - succeeded, "results": results},
            status=status.HTTP_200_OK,
        )


def _message(data):
    """Flatten DRF error data into one readable line."""
    if isinstance(data, dict):
        if "detail" in data:
            return _message(data["detail"])
        if "error" in data:
            return _message(data["error"])
        return "; ".join(f"{key}: {_message(value)}" for key, value in data.items())
    if isinstance(data, (list, tuple)):
        return "; ".join(_message(item) for item in data)
    return str(data)
