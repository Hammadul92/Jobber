"""Superuser-only monitoring API. Deliberately read-only for business data."""

import csv
import io
from datetime import date, timedelta
from django.contrib.auth import authenticate, login, logout
from django.contrib.admin.models import LogEntry
from django.core.exceptions import ValidationError
from django.db.models import Q, Sum, Count, ImageField
from django.db.models.functions import TruncDate
from django.http import HttpResponse
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from rest_framework import permissions
from rest_framework.authentication import SessionAuthentication
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle
from core import models
from .models import PlatformEvent
from .telemetry import system_event
from .presentation import (
    eager,
    record_name,
    primary_field,
    resource_for,
    related_search,
    LABEL_PATHS,
)

RESOURCES = {
    "activity": PlatformEvent,
    "users": models.User,
    "admins": models.User,
    "businesses": models.Business,
    "clients": models.Client,
    "team": models.TeamMember,
    "services": models.Service,
    "questionnaires": models.ServiceQuestionnaire,
    "terms-templates": models.ServiceTermsTemplate,
    "jobs": models.Job,
    "assignments": models.JobAssignment,
    "photos": models.JobPhoto,
    "quotes": models.Quote,
    "invoices": models.Invoice,
    "payments": models.Payout,
    "refunds": models.PayoutRefund,
    "payment-methods": models.BankingInformation,
    "catalog": models.ServiceOption,
    "faqs": models.FAQ,
    "audit": LogEntry,
}
HIDDEN = {"password"}


def numeric_search(text):
    if text.isascii() and text.isdigit() and len(text) <= 19:
        number = int(text)
        if number <= 9223372036854775807:
            return Q(pk=number)
    return Q(pk__in=[])


class SuperuserOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_active and request.user.is_superuser)


class Base(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [SuperuserOnly]

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "no-store"
        return response


class LoginThrottle(AnonRateThrottle):
    rate = "10/min"


@method_decorator(csrf_protect, name="dispatch")
class Auth(Base):
    throttle_classes = [LoginThrottle]
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(
            {
                "csrf": get_token(request),
                "authenticated": bool(
                    request.user.is_authenticated
                    and request.user.is_active
                    and request.user.is_superuser
                ),
                "name": request.user.get_username() if request.user.is_authenticated else "",
                "display_name": request.user.name if request.user.is_authenticated else "",
                "email": request.user.email if request.user.is_authenticated else "",
                "id": request.user.pk if request.user.is_authenticated else None,
                "photo_url": (
                    "/api/super-admin/media/admins/%s/photo/" % request.user.pk
                    if request.user.is_authenticated and request.user.photo
                    else None
                ),
            }
        )

    def post(self, request):
        user = authenticate(
            request, username=request.data.get("email"), password=request.data.get("password")
        )
        if not user or not user.is_active or not user.is_superuser:
            system_event("dashboard_access", "denied", {"reason": "Sign-in rejected"})
            return Response({"detail": "Unable to sign in with these credentials."}, status=403)
        login(request, user)
        request.session.set_expiry(1800)
        LogEntry.objects.log_action(user.id, None, user.id, user.email, 2, "Super-admin sign-in")
        return Response(
            {
                "authenticated": True,
                "csrf": get_token(request),
                "name": user.email,
                "display_name": user.name,
                "email": user.email,
                "id": user.pk,
                "photo_url": (
                    "/api/super-admin/media/admins/%s/photo/" % user.pk if user.photo else None
                ),
            }
        )

    def delete(self, request):
        logout(request)
        return Response({"authenticated": False})


def queryset(key):
    model = RESOURCES[key]
    qs = getattr(model, "all_objects", model._default_manager).all()
    if key == "admins":
        qs = qs.filter(is_superuser=True)
    elif key == "users":
        qs = qs.filter(is_superuser=False)
    return qs


def describe(model):
    primary = primary_field(model)
    fields = []
    for f in model._meta.fields:
        if (
            f.name in HIDDEN
            or f.name == "id"
            or f.name.endswith("_id")
            or (model == models.TeamMember and f.name == "employee")
        ):
            continue
        field = {
            "name": f.name,
            "label": str(f.verbose_name).title(),
            "choices": list(f.choices or []),
            "type": "ImageField" if isinstance(f, ImageField) else f.get_internal_type(),
            "primary": f.name == primary,
            "sort_key": f.name,
        }
        if model == models.User and f.name == "role":
            field["choices"] = [("Super Admin", "Super Admin")] + list(f.choices)
        if f.is_relation:
            field["resource"] = resource_for(f.related_model, RESOURCES)
            paths = LABEL_PATHS.get(f.related_model, ())
            field["sort_key"] = f.name + "__" + paths[0] if paths else f.name
        if f.name == "is_active" and issubclass(model, models.SoftDeletableModel):
            field["label"] = "Active Membership" if model == models.TeamMember else "Active"
        fields.append(field)
    if primary == "display_name":
        paths = LABEL_PATHS.get(model, ())
        fields.insert(
            0,
            {
                "name": primary,
                "label": "Name",
                "choices": [],
                "type": "Display",
                "primary": True,
                "synthetic": True,
                "sort_key": paths[0] if paths else None,
            },
        )
    if model == PlatformEvent:
        fields.append(
            {
                "name": "record",
                "label": "Record",
                "choices": [],
                "type": "Relation",
                "synthetic": True,
            }
        )
    if model in (models.JobAssignment, models.ServiceOption):
        fields.extend(
            [
                {
                    "name": "is_deleted",
                    "label": "Is Deleted",
                    "choices": [],
                    "type": "BooleanField",
                    "synthetic": True,
                },
                {
                    "name": "deleted_at",
                    "label": "Deleted At",
                    "choices": [],
                    "type": "Display",
                    "synthetic": True,
                },
            ]
        )
    return sorted(fields, key=lambda f: not f.get("primary", False))


def row(obj):
    from .actions import capabilities

    result = {"id": obj.pk, "_label": record_name(obj), "_relations": {}}
    result["_actions"] = capabilities(resource_for(type(obj), RESOURCES, obj), obj)
    for field in obj._meta.fields:
        if field.name in HIDDEN:
            continue
        value = getattr(obj, field.attname)
        if field.is_relation and value is not None:
            related = getattr(obj, field.name)
            result["_relations"][field.name] = {
                "id": value,
                "label": record_name(related),
                "resource": resource_for(field.related_model, RESOURCES, related),
            }
        if field.get_internal_type() in ("ImageField", "FileField"):
            value = bool(value)
        result[field.name] = value
    if isinstance(obj, PlatformEvent):
        result["record"] = None
    result[primary_field(type(obj))] = result["_label"]
    if hasattr(obj, "is_active") and getattr(obj, "is_deleted", False):
        result["is_active"] = False
    if isinstance(obj, models.User) and obj.is_superuser:
        result["role"] = "Super Admin"
    if isinstance(obj, (models.JobAssignment, models.ServiceOption)):
        result["is_deleted"] = getattr(obj, "is_deleted", False)
        result["deleted_at"] = getattr(obj, "deleted_at", None)
    return result


def presented_rows(objects):
    rows = [row(obj) for obj in objects]
    # Activity references are generic, so resolve them in batches, not per row.
    for resource, model in RESOURCES.items():
        if resource == "admins":
            continue
        relevant = [
            r for r in rows if r.get("entity") == model._meta.model_name and r.get("entity_id")
        ]
        if relevant:
            found = eager(
                getattr(model, "all_objects", model._default_manager).filter(
                    pk__in=[r["entity_id"] for r in relevant]
                )
            ).in_bulk()
            for item in relevant:
                target = found.get(item["entity_id"])
                item["record"] = item["entity_id"]
                item["_relations"]["record"] = {
                    "id": item["entity_id"],
                    "resource": resource_for(model, RESOURCES, target) if target else None,
                    "label": (
                        record_name(target) if target else "Removed " + model._meta.verbose_name
                    ),
                }
    return rows


class Records(Base):
    def get(self, request, resource, pk=None):
        if resource not in RESOURCES:
            return Response({"detail": "Not found."}, status=404)
        model = RESOURCES[resource]
        fields = describe(model)
        try:
            for field in fields:
                value = request.query_params.get(field["name"], "")
                if field["type"] == "BooleanField" and value not in ("", "true", "false"):
                    raise ValueError()
                if field["type"] in ("ForeignKey", "OneToOneField") and value:
                    if (
                        not value.isascii()
                        or not value.isdigit()
                        or len(value) > 19
                        or int(value) > 9223372036854775807
                    ):
                        raise ValueError()
            for name in ("from", "to"):
                if request.query_params.get(name):
                    date.fromisoformat(request.query_params[name])
            if request.query_params.get("from") and request.query_params.get("to"):
                if request.query_params["from"] > request.query_params["to"]:
                    raise ValueError()
            if int(request.query_params.get("page", 1)) < 1:
                raise ValueError()
            if int(request.query_params.get("page_size", 25)) not in (10, 25, 50, 100):
                raise ValueError()
        except ValueError:
            return Response({"detail": "Invalid filter."}, status=400)
        if (
            resource in ("assignments", "catalog")
            and request.query_params.get("is_deleted") == "true"
            and not pk
        ):
            from .actions import archived_listing

            return archived_listing(request, resource, fields)
        if resource in ("users", "admins"):
            for field in fields:
                if field["name"] == "role":
                    field["choices"] = (
                        [("Super Admin", "Super Admin")]
                        if resource == "admins"
                        else list(models.User._meta.get_field("role").choices)
                    )
        qs = eager(queryset(resource))
        if pk:
            obj = qs.filter(pk=pk).first()
            if obj is None and resource in ("assignments", "catalog"):
                from .actions import archived_object

                obj = archived_object(resource, pk)
            if not obj:
                return Response({"detail": "Not found."}, status=404)
            links = []
            for f in model._meta.fields:
                if f.is_relation and getattr(obj, f.attname):
                    target = resource_for(f.related_model, RESOURCES, getattr(obj, f.name))
                    if target:
                        links.append(
                            {
                                "label": "%s: %s"
                                % (f.verbose_name, record_name(getattr(obj, f.name))),
                                "resource": target,
                                "id": getattr(obj, f.attname),
                            }
                        )
            documents = []
            if resource == "invoices" or (resource == "quotes" and obj.signed_at):
                documents.append(
                    {
                        "label": "Download PDF",
                        "url": "/api/super-admin/documents/%s/%s/" % (resource, pk),
                    }
                )
            for target, related_model in RESOURCES.items():
                if target == "admins":
                    continue
                for relation in related_model._meta.fields:
                    if relation.is_relation and relation.related_model == model:
                        count = queryset(target).filter(**{relation.name: pk}).count()
                        if count:
                            links.append(
                                {
                                    "label": "%s (%s): %s" % (target, relation.verbose_name, count),
                                    "resource": target,
                                    "query": "%s=%s" % (relation.name, pk),
                                }
                            )
            return Response(
                {
                    "record": presented_rows([obj])[0],
                    "fields": fields,
                    "links": links,
                    "documents": documents,
                }
            )
        search = request.query_params.get("search", "").strip()
        if search:
            query = numeric_search(search)
            for f in model._meta.fields:
                if (
                    f.get_internal_type() in ("CharField", "EmailField", "TextField")
                    and f.name not in HIDDEN
                ):
                    query |= Q(**{f.name + "__icontains": search})
            for path in LABEL_PATHS.get(model, ()):
                if "__" in path:
                    query |= Q(**{path + "__icontains": search})
            for field in model._meta.fields:
                if field.is_relation:
                    query |= related_search(field.related_model, field.name, search)
            qs = qs.filter(query)
        try:
            for field in fields:
                value = request.query_params.get(field["name"])
                if value and (
                    field["choices"]
                    or field["type"] == "BooleanField"
                    or field["type"] in ("ForeignKey", "OneToOneField")
                ):
                    if field.get("synthetic"):
                        continue
                    if field["type"] == "BooleanField":
                        value = value == "true"
                    if model == models.User and field["name"] == "role":
                        qs = (
                            qs.filter(is_superuser=True)
                            if value == "Super Admin"
                            else qs.filter(role=value, is_superuser=False)
                        )
                    elif field["name"] == "is_active" and issubclass(
                        model, models.SoftDeletableModel
                    ):
                        active = Q(is_active=True, is_deleted=False)
                        qs = qs.filter(active if value else ~active)
                    else:
                        qs = qs.filter(**{field["name"]: value})
            for field in model._meta.fields:
                text = request.query_params.get(field.name + "_search", "").strip()
                if field.is_relation and text:
                    qs = qs.filter(related_search(field.related_model, field.name, text))
            date_field = next(
                (
                    f["name"]
                    for f in fields
                    if f["name"]
                    in ("created_at", "date_created", "joined_at", "action_time", "uploaded_at")
                ),
                None,
            )
            requested_date = request.query_params.get("date_field")
            date_fields = {
                f["name"]: f["type"] for f in fields if f["type"] in ("DateField", "DateTimeField")
            }
            if date_field is None:
                date_field = next(iter(date_fields), None)
            if requested_date in date_fields:
                date_field = requested_date
            if date_field:
                for param, lookup in [("from", "date__gte"), ("to", "date__lte")]:
                    if request.query_params.get(param):
                        qs = qs.filter(
                            **{
                                date_field
                                + "__"
                                + (
                                    lookup
                                    if date_fields[date_field] == "DateTimeField"
                                    else lookup.replace("date__", "")
                                ): date.fromisoformat(request.query_params[param])
                            }
                        )
            order = request.query_params.get("ordering", "-id")
            allowed_ordering = {"id"} | {f.get("sort_key") for f in fields if f.get("sort_key")}
            if order.lstrip("-") not in allowed_ordering:
                order = "-id"
            qs = qs.order_by(order)
            if (
                resource in ("assignments", "catalog")
                and request.query_params.get("is_deleted") != "false"
            ):
                from .actions import archived_listing

                return archived_listing(request, resource, fields, live_objects=qs)
            count = qs.count()
            if request.query_params.get("export") == "csv":
                if count > 10000:
                    return Response(
                        {"detail": "Narrow filters to at most 10,000 records."}, status=400
                    )
                output = io.StringIO()
                writer = csv.writer(output)
                names = [f["name"] for f in fields]
                writer.writerow([f["label"] for f in fields])
                for values in presented_rows(qs.iterator()):
                    for key, relation in values["_relations"].items():
                        values[key] = relation["label"]
                    writer.writerow(
                        [
                            (
                                ("'" + str(values[n]))
                                if str(values[n]).startswith(("=", "+", "-", "@"))
                                else values[n]
                            )
                            for n in names
                        ]
                    )
                LogEntry.objects.log_action(
                    request.user.id, None, "", resource, 2, "CSV export: %s rows" % count
                )
                response = HttpResponse(output.getvalue(), content_type="text/csv")
                response["Content-Disposition"] = 'attachment; filename="%s.csv"' % resource
                return response
            page = max(1, int(request.query_params.get("page", 1)))
            size = int(request.query_params.get("page_size", 25))
            if size not in (10, 25, 50, 100):
                return Response({"detail": "Invalid page size."}, status=400)
            return Response(
                {
                    "fields": fields,
                    "date_field": date_field,
                    "count": count,
                    "page": page,
                    "page_size": size,
                    "pages": max(1, (count + size - 1) // size),
                    "results": presented_rows(qs[(page - 1) * size:page * size]),
                    "filter_labels": {
                        f.name: record_name(
                            eager(
                                f.related_model._base_manager.filter(
                                    pk=request.query_params[f.name]
                                )
                            ).first()
                        )
                        for f in model._meta.fields
                        if f.is_relation and request.query_params.get(f.name)
                    },
                }
            )
        except (ValueError, ValidationError):
            return Response({"detail": "Invalid filter."}, status=400)


class Overview(Base):
    def get(self, request):
        from .actions import archived_objects

        counts = {key: queryset(key).count() for key in RESOURCES}
        for key in ("catalog", "assignments"):
            counts[key] += sum(1 for _ in archived_objects(key))
        totals = list(
            models.Invoice.objects.values("currency", "status").annotate(total=Sum("total_amount"))
        )
        return Response(
            {
                "counts": counts,
                "invoice_totals": totals,
                "business_trend": list(
                    models.Business.objects.filter(
                        created_at__date__gte=date.today() - timedelta(days=90)
                    )
                    .annotate(day=TruncDate("created_at"))
                    .values("day")
                    .annotate(count=Count("id"))
                    .order_by("day")
                ),
                "coverage": (
                    "Counts include deleted records; invoice totals exclude deleted invoices. "
                    "CAD and USD are reported separately."
                ),
                "statuses": {
                    key: list(RESOURCES[key].objects.values("status").annotate(count=Count("id")))
                    for key in ("services", "jobs", "quotes", "invoices", "payments", "refunds")
                },
                "overdue_invoices": models.Invoice.objects.filter(
                    status="SENT", due_date__lt=date.today()
                ).count(),
            }
        )


class Search(Base):
    def get(self, request):
        text = request.query_params.get("q", "").strip()
        if len(text) < 2:
            return Response({"results": []})
        results = []
        for key, model in RESOURCES.items():
            if key in ("audit", "activity"):
                continue
            query = numeric_search(text)
            for field in model._meta.fields:
                if (
                    field.get_internal_type() in ("CharField", "EmailField", "TextField")
                    and field.name not in HIDDEN
                ):
                    query |= Q(**{field.name + "__icontains": text})
                if field.is_relation:
                    query |= related_search(field.related_model, field.name, text)
            for obj in eager(queryset(key).filter(query).order_by("-pk"))[:5]:
                label = record_name(obj)
                results.append({"resource": key, "id": obj.pk, "label": label})
            if key in ("catalog", "assignments"):
                from .actions import archived_objects

                for obj in archived_objects(key):
                    label = record_name(obj)
                    if text.casefold() in label.casefold() or str(obj.pk) == text:
                        results.append({"resource": key, "id": obj.pk, "label": label})
        return Response({"results": results})


def integration_summary(event):
    return {"status": event.operation, "recorded_at": event.created_at, "details": event.summary}


class System(Base):
    def get(self, request):
        from django.db import connection
        from django.conf import settings

        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            healthy = cursor.fetchone()[0] == 1
        return Response(
            {
                "database": "Connected" if healthy else "Unavailable",
                "email_backend": settings.EMAIL_BACKEND.rsplit(".", 1)[-1],
                "payments_configured": bool(settings.STRIPE_SECRET_KEY),
                "recurring_invoice_heartbeat": (
                    integration_summary(
                        PlatformEvent.objects.filter(entity="recurring_invoices").first()
                    )
                    if PlatformEvent.objects.filter(entity="recurring_invoices").exists()
                    else "No runs recorded yet"
                ),
                "email_delivery_tracking": "Backend acceptance only; provider delivery receipts are not available",
                "latest_email_event": (
                    integration_summary(PlatformEvent.objects.filter(entity="email").first())
                    if PlatformEvent.objects.filter(entity="email").exists()
                    else "No email attempts recorded yet"
                ),
                "stripe_reconciliation": "On-demand comparisons are available on payment and refund details",
            }
        )


class Document(Base):
    def get(self, request, resource, pk):
        from django.http import FileResponse

        if resource not in ("quotes", "invoices"):
            return Response({"detail": "Not found."}, status=404)
        obj = queryset(resource).filter(pk=pk).first()
        if not obj:
            return Response({"detail": "Not found."}, status=404)
        if resource == "quotes":
            if not obj.signed_at:
                return Response(
                    {"detail": "The quotation PDF is available after the quote has been signed."},
                    status=400,
                )
            from operations.pdf import build_signed_quote_pdf

            output = build_signed_quote_pdf(obj)
        else:
            from finance.pdf import build_invoice_pdf

            output = build_invoice_pdf(obj)
        return FileResponse(
            output,
            as_attachment=True,
            filename="%s-%s.pdf" % (resource, pk),
            content_type="application/pdf",
        )


class Media(Base):
    def get(self, request, resource, pk, field):
        from django.http import FileResponse

        if resource not in RESOURCES:
            return Response({"detail": "Not found."}, status=404)
        allowed = [f.name for f in RESOURCES[resource]._meta.fields if isinstance(f, ImageField)]
        if field not in allowed:
            return Response({"detail": "Not found."}, status=404)
        obj = queryset(resource).filter(pk=pk).first()
        image = getattr(obj, field, None) if obj else None
        if not image:
            return Response({"detail": "Not found."}, status=404)
        try:
            return FileResponse(image.open("rb"))
        except (OSError, ValueError):
            return Response({"detail": "File unavailable."}, status=404)


class Reconcile(Base):
    def post(self, request, resource, pk):
        from django.conf import settings
        from django.utils import timezone
        import stripe

        if resource not in ("payments", "refunds"):
            return Response({"detail": "Not found."}, status=404)
        obj = queryset(resource).filter(pk=pk).first()
        if not obj:
            return Response({"detail": "Not found."}, status=404)
        if not settings.STRIPE_SECRET_KEY:
            return Response({"detail": "Stripe is not configured in this environment."}, status=503)
        payment = obj if resource == "payments" else obj.payout
        reference = (
            payment.stripe_payment_intent_id if resource == "payments" else obj.stripe_refund_id
        )
        if not reference:
            return Response({"detail": "This record has no Stripe reference."}, status=400)
        options = {"api_key": settings.STRIPE_SECRET_KEY}
        if payment.stripe_account_id:
            options["stripe_account"] = payment.stripe_account_id
        try:
            remote = (stripe.PaymentIntent if resource == "payments" else stripe.Refund).retrieve(
                reference, **options
            )
        except stripe.StripeError:
            return Response(
                {
                    "detail": "Stripe could not return this record. Check the account and environment."
                },
                status=502,
            )
        result = {
            "local_status": obj.status,
            "provider_status": remote.status,
            "local_amount": str(obj.amount),
            "provider_amount_minor_units": remote.amount,
            "provider_currency": remote.currency.upper(),
            "checked_at": timezone.now(),
        }
        system_event("stripe_comparison", "completed", {"resource": resource, "id": pk})
        return Response(result)
