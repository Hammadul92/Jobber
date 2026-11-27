"""Validated, confirmed record changes for active Django superusers."""

import hashlib
import json
from django import forms
from django.contrib.admin.models import LogEntry, CHANGE
from django.contrib.auth.password_validation import validate_password
from django.core import signing
from django.core import serializers
from django.core.exceptions import ValidationError
from django.db import transaction, models as db, IntegrityError
from django.db.models.deletion import Collector
from django.forms import modelform_factory
from django.utils import timezone
from rest_framework.response import Response
from core import models
from .models import DeletionBatch
from .presentation import eager, record_name, resource_for, related_search
from .views import Base, RESOURCES, queryset

READONLY = {"activity", "audit"}
EXCLUDED = {
    "is_deleted",
    "deleted_at",
    "deleted_by",
    "is_active",
    "is_superuser",
    "is_staff",
    "last_login",
    "groups",
    "user_permissions",
    "password",
    "assigned_to",
    "assignees",
}


def capabilities(resource, obj=None):
    if resource in READONLY:
        return []
    if obj is None:
        return ["create"]
    if getattr(obj, "is_deleted", False):
        return ["restore"]
    result = ["edit", "delete"]
    if hasattr(obj, "is_active"):
        result.append("deactivate" if obj.is_active else "activate")
    return result


def form_for(resource, obj=None, data=None, files=None):
    model = RESOURCES[resource]
    names = [
        f.name
        for f in model._meta.get_fields()
        if getattr(f, "editable", False) and not f.auto_created and f.name not in EXCLUDED
    ]
    form = modelform_factory(model, fields=names)(data=data, files=files, instance=obj)
    for field in form.fields.values():
        if isinstance(field, forms.ModelChoiceField):
            if hasattr(field.queryset.model, "is_deleted"):
                field.queryset = field.queryset.filter(is_deleted=False)
            field.label_from_instance = record_name
    if model == models.User:
        form.fields["new_password"] = forms.CharField(
            label="Password" if obj is None else "New password",
            required=obj is None,
            widget=forms.PasswordInput,
            help_text="Leave blank to keep the current password." if obj else "",
        )
    return form


def validate_record(obj):
    """Keep related records in the same business and reject invalid amounts."""
    for field in obj._meta.fields:
        if field.is_relation and getattr(obj, field.attname):
            parent = field.related_model._base_manager.select_for_update().get(
                pk=getattr(obj, field.attname)
            )
            if getattr(parent, "is_deleted", False):
                raise ValidationError(
                    "Restore %s before linking this record." % record_name(parent)
                )
    business_id = getattr(obj, "business_id", None)
    client = getattr(obj, "client", None)
    service = getattr(obj, "service", None)
    if business_id and client and client.business_id != business_id:
        raise ValidationError("The client must belong to the selected business.")
    if business_id and service and service.business_id != business_id:
        raise ValidationError("The service must belong to the selected business.")
    if isinstance(obj, models.Invoice) and service and client and service.client_id != client.pk:
        raise ValidationError("The invoice client must match the service client.")
    if isinstance(obj, models.Payout) and obj.invoice.business_id != obj.business_id:
        raise ValidationError("The payment and invoice must belong to the same business.")
    if (
        isinstance(obj, models.JobAssignment)
        and obj.team_member.business_id != obj.job.service.business_id
    ):
        raise ValidationError("The assigned member must belong to the job's business.")
    for name in ("amount", "price", "subtotal", "tax_amount", "total_amount", "hours_worked"):
        value = getattr(obj, name, None)
        if value is not None and value < 0:
            raise ValidationError("%s cannot be negative." % name.replace("_", " ").capitalize())
    if isinstance(obj, models.JobPhoto):
        if (
            models.JobPhoto.objects.filter(job=obj.job, photo_type=obj.photo_type)
            .exclude(pk=obj.pk)
            .exists()
        ):
            raise ValidationError("This job already has a %s photo." % obj.photo_type.lower())
    if isinstance(obj, models.Service):
        if obj.end_date and obj.end_date < obj.start_date:
            raise ValidationError("The service end date must follow its start date.")
        if not obj.business.services_offered.filter(name=obj.service_name).exists():
            raise ValidationError("This service is not offered by the selected business.")
    if isinstance(obj, (models.Service, models.Invoice, models.Quote)):
        from operations.serializers import ServiceSerializer
        from rest_framework.exceptions import ValidationError as APIValidationError
        from core.pricing import line_items_total, tax_amount_for

        items = (
            getattr(obj, "items", None)
            if isinstance(obj, models.Service)
            else getattr(obj, "line_items", None)
        )
        if items:
            try:
                items = ServiceSerializer().validate_items(items)
            except APIValidationError as exc:
                raise ValidationError(str(exc.detail))
            if isinstance(obj, models.Service):
                obj.items, obj.price = items, line_items_total(items)
            elif isinstance(obj, models.Invoice):
                obj.line_items = items
                obj.subtotal = line_items_total(items)
                obj.tax_amount = tax_amount_for(obj.subtotal, obj.tax_rate)
                obj.total_amount = obj.subtotal + obj.tax_amount


def field_schema(form, resource):
    from taggit.forms import TagField

    result = []
    for name, field in form.fields.items():
        initial = form[name].value()
        if isinstance(field, TagField):
            initial = field.widget.format_value(initial)
        elif isinstance(initial, (list, tuple)):
            initial = ", ".join(str(v) for v in initial)
        kind, choices = "text", []
        if isinstance(field, forms.ModelChoiceField):
            kind = "relation"
            if initial:
                current = field.queryset.filter(pk=initial).first()
                if current:
                    choices = [{"value": str(current.pk), "label": record_name(current)}]
        elif isinstance(field, forms.BooleanField):
            kind = "boolean"
        elif isinstance(field, forms.ChoiceField):
            kind = "select"
            choices = [{"value": str(v), "label": str(l)} for v, l in field.choices]
        elif isinstance(field, forms.FileField):
            kind, initial = "file", ""
        elif isinstance(field, forms.JSONField):
            kind = "textarea"
            if not isinstance(initial, str):
                initial = json.dumps(initial) if initial is not None else ""
        elif isinstance(field.widget, forms.Textarea):
            kind = "textarea"
        elif isinstance(field, forms.DateTimeField):
            kind = "datetime-local"
        elif isinstance(field, forms.DateField):
            kind = "date"
        elif isinstance(field, (forms.DecimalField, forms.IntegerField, forms.FloatField)):
            kind = "number"
        elif name == "new_password":
            kind = "password"
        elif isinstance(field, forms.EmailField):
            kind = "email"
        result.append(
            {
                "name": name,
                "label": str(field.label),
                "type": kind,
                "required": field.required,
                "value": initial if initial is not None else "",
                "choices": choices,
                "help": str(field.help_text),
            }
        )
    return result


def descendants(root, restore=False, lock=False):
    """Walk owning reverse FKs only; never follow an FK to its parent."""
    found = {}

    def walk(obj):
        key = (obj._meta.label_lower, obj.pk)
        if key in found:
            return
        found[key] = obj
        if lock:
            obj.__class__._base_manager.select_for_update().get(pk=obj.pk)
        for relation in obj._meta.related_objects:
            field = relation.field
            if relation.many_to_many or relation.related_model not in RESOURCES.values():
                continue
            if relation.related_model in (RESOURCES["audit"], RESOURCES["activity"]):
                continue
            # A service owns its invoice history even though legacy FK uses SET_NULL.
            if field.remote_field.on_delete is not db.CASCADE and not (
                isinstance(obj, models.Service)
                and relation.related_model == models.Invoice
                and field.name == "service"
            ):
                continue
            manager = getattr(
                relation.related_model, "all_objects", relation.related_model._default_manager
            )
            qs = manager.filter(**{field.name: obj})
            for child in eager(qs):
                walk(child)

    walk(root)
    return list(found.values())


def restore_records(resource, root):
    batch = DeletionBatch.objects.filter(
        resource=resource, record_id=root.pk, created_at=root.deleted_at
    ).first()
    if not batch:
        # Legacy deletes use their shared timestamp to identify descendants.
        return [
            obj
            for obj in descendants(root)
            if getattr(obj, "is_deleted", False) and obj.deleted_at == root.deleted_at
        ]
    result = []
    for item in batch.records:
        if item.get("snapshot"):
            restored = next(serializers.deserialize("json", item["snapshot"])).object
            if not restored.__class__._base_manager.filter(pk=item["id"]).exists():
                restored._restore_snapshot = True
                result.append(restored)
            continue
        obj = (
            RESOURCES[item["resource"]]
            .all_objects.filter(pk=item["id"], is_deleted=True, deleted_at=root.deleted_at)
            .first()
        )
        if obj:
            result.append(obj)
    return result


def archived_object(resource, pk):
    if resource not in ("assignments", "catalog"):
        return None
    batch = (
        DeletionBatch.objects.filter(records__contains=[{"resource": resource, "id": pk}])
        .order_by("-created_at")
        .first()
    )
    record = (
        next(
            (
                item
                for item in batch.records
                if item.get("resource") == resource and item["id"] == pk
            ),
            None,
        )
        if batch
        else None
    )
    if record and record.get("snapshot"):
        obj = next(serializers.deserialize("json", record["snapshot"])).object
        obj.is_deleted, obj.deleted_at = True, batch.created_at
        obj._restore_snapshot = True
        return obj
    return None


def archived_objects(resource):
    """Return the latest missing snapshot of each archived record, including children."""
    snapshots = {}
    for batch in DeletionBatch.objects.filter(records__contains=[{"resource": resource}]).order_by(
        "-created_at", "-pk"
    ):
        for item in batch.records:
            if item.get("resource") == resource and item.get("snapshot"):
                snapshots.setdefault(item["id"], (item["snapshot"], batch.created_at))
    existing = set(
        RESOURCES[resource]._base_manager.filter(pk__in=snapshots).values_list("pk", flat=True)
    )
    for pk, (snapshot, deleted_at) in snapshots.items():
        if pk not in existing:
            obj = next(serializers.deserialize("json", snapshot)).object
            obj.is_deleted, obj.deleted_at, obj._restore_snapshot = True, deleted_at, True
            yield obj


def archived_listing(request, resource, fields, live_objects=()):
    from .views import row
    from django.http import HttpResponse
    import csv
    import io

    fields = [
        dict(field, type="DateTimeField") if field["name"] == "deleted_at" else field
        for field in fields
    ]
    date_fields = {f["name"] for f in fields if f["type"] in ("DateField", "DateTimeField")}
    date_field = "created_at" if "created_at" in date_fields else "deleted_at"
    if request.query_params.get("date_field") in date_fields:
        date_field = request.query_params["date_field"]

    rows = [row(obj) for obj in live_objects]
    if date_field == "deleted_at" and (
        request.query_params.get("from") or request.query_params.get("to")
    ):
        rows = []
    for obj in archived_objects(resource):
        if obj:
            item = row(obj)
            text = request.query_params.get("search", "").lower()
            if text and text not in json.dumps(item, default=str).lower():
                continue
            if any(
                str(item.get(field["name"])) != value
                for field in fields
                for value in [request.query_params.get(field["name"])]
                if value and field["type"] in ("ForeignKey", "OneToOneField")
            ):
                continue
            if any(
                text.lower()
                not in item.get("_relations", {}).get(field["name"], {}).get("label", "").lower()
                for field in fields
                for text in [request.query_params.get(field["name"] + "_search", "").strip()]
                if text and field["type"] in ("ForeignKey", "OneToOneField")
            ):
                continue
            from datetime import date

            try:
                start, end = request.query_params.get("from"), request.query_params.get("to")
                value = getattr(obj, date_field)
                value = value.date() if hasattr(value, "date") else value
                if start and value < date.fromisoformat(start):
                    continue
                if end and value > date.fromisoformat(end):
                    continue
            except ValueError:
                return Response({"detail": "Invalid date."}, status=400)
            rows.append(item)
    order = request.query_params.get("ordering", "-id")
    if order.lstrip("-") not in {"id"} | {f.get("sort_key") for f in fields if f.get("sort_key")}:
        order = "-id"
    key = next((f["name"] for f in fields if f.get("sort_key") == order.lstrip("-")), "id")
    numeric = key == "id" or any(
        f["name"] == key and f["type"] in ("DecimalField", "IntegerField", "FloatField")
        for f in fields
    )
    rows.sort(
        key=lambda r: (
            (r.get(key) is None, r.get(key))
            if numeric
            else str(r.get("_relations", {}).get(key, {}).get("label", r.get(key)) or "")
        ),
        reverse=order.startswith("-"),
    )
    if request.query_params.get("export") == "csv":
        if len(rows) > 10000:
            return Response({"detail": "Narrow filters to at most 10,000 records."}, status=400)
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([f["label"] for f in fields])
        for item in rows:
            values = [
                str(
                    item.get("_relations", {})
                    .get(f["name"], {})
                    .get("label", item.get(f["name"], ""))
                )
                for f in fields
            ]
            writer.writerow(["'" + v if v.startswith(("=", "+", "-", "@")) else v for v in values])
        response = HttpResponse(output.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="%s.csv"' % resource
        LogEntry.objects.log_action(
            request.user.pk, None, "", resource, CHANGE, "CSV export: %s rows" % len(rows)
        )
        return response
    try:
        page, size = int(request.query_params.get("page", 1)), int(
            request.query_params.get("page_size", 25)
        )
        if page < 1 or size not in (10, 25, 50, 100):
            raise ValueError()
    except ValueError:
        return Response({"detail": "Invalid page or page size."}, status=400)
    return Response(
        {
            "fields": fields,
            "results": rows[(page - 1) * size:page * size],
            "count": len(rows),
            "page": page,
            "page_size": size,
            "pages": max(1, (len(rows) + size - 1) // size),
            "date_field": date_field,
            "filter_labels": {
                f.name: record_name(
                    f.related_model._base_manager.filter(pk=request.query_params[f.name]).first()
                )
                for f in RESOURCES[resource]._meta.fields
                if f.is_relation and request.query_params.get(f.name)
            },
        }
    )


def impact(resource, obj, operation, actor, lock=False):
    if operation not in capabilities(resource, obj):
        raise ValidationError("This action is unavailable for this record.")
    if (
        isinstance(obj, models.User)
        and obj.pk == actor.pk
        and operation in ("delete", "deactivate")
    ):
        raise ValidationError("You cannot delete or deactivate your own signed-in account.")
    if operation == "restore":
        owner = obj.deleted_owner() if hasattr(obj, "deleted_owner") else None
        if isinstance(obj, models.Invoice) and obj.service_id and obj.service.is_deleted:
            owner = obj.service
        if owner:
            raise ValidationError("Restore %s first." % record_name(owner))
        objects = restore_records(resource, obj)
        restoring = {(item._meta.concrete_model, item.pk) for item in objects}
        for item in objects:
            for field in item._meta.fields:
                if (
                    field.is_relation
                    and field.remote_field.on_delete is db.CASCADE
                    and getattr(item, field.attname)
                ):
                    if (
                        field.related_model._meta.concrete_model,
                        getattr(item, field.attname),
                    ) in restoring:
                        continue
                    parent = getattr(item, field.name)
                    if (
                        getattr(parent, "is_deleted", False)
                        and (parent._meta.concrete_model, parent.pk) not in restoring
                    ):
                        raise ValidationError("Restore %s first." % record_name(parent))
    elif operation == "delete" and isinstance(obj, models.SoftDeletableModel):
        objects = [
            item for item in descendants(obj, lock=lock) if not getattr(item, "is_deleted", False)
        ]
    else:
        objects = [obj]
    if operation == "delete" and any(
        isinstance(item, models.User) and item.pk == actor.pk for item in objects
    ):
        raise ValidationError("This cascade would delete your signed-in account.")
    rows = [
        {
            "resource": resource_for(type(item), RESOURCES, item),
            "id": item.pk,
            "name": record_name(item),
            "entity": str(item._meta.verbose_name).title(),
            "effect": operation.capitalize(),
        }
        for item in objects
    ]
    if resource == "catalog" and operation == "delete":
        collector = Collector(using="default")
        collector.collect([obj])
        for qs in collector.fast_deletes:
            for item in qs:
                parent = getattr(item, "content_object", None)
                rows.append(
                    {
                        "resource": None,
                        "id": item.pk,
                        "name": record_name(parent) if parent else str(item._meta.verbose_name),
                        "entity": "Catalog link",
                        "effect": "Unlink",
                    }
                )
    state = [
        {
            "model": item._meta.label_lower,
            "id": item.pk,
            "fields": {
                f.attname: str(getattr(item, f.attname)) for f in item._meta.concrete_fields
            },
        }
        for item in objects
    ]
    fingerprint = hashlib.sha256(
        json.dumps([rows, state], sort_keys=True, default=str).encode()
    ).hexdigest()
    return objects, rows, fingerprint


class Actions(Base):
    def get(self, request, resource, pk=None):
        if resource not in RESOURCES or resource in READONLY:
            return Response({"detail": "Activity and audit history are read-only."}, status=400)
        obj = queryset(resource).filter(pk=pk).first() if pk else None
        if pk and obj is None:
            obj = archived_object(resource, pk)
        if pk and obj is None:
            return Response({"detail": "Not found."}, status=404)
        operation = request.query_params.get("operation")
        if operation:
            try:
                _, records, digest = impact(resource, obj, operation, request.user)
            except ValidationError as exc:
                return Response({"detail": " ".join(exc.messages)}, status=400)
            token = signing.dumps(
                {
                    "resource": resource,
                    "id": pk,
                    "operation": operation,
                    "actor": request.user.pk,
                    "digest": digest,
                },
                salt="super-admin-action",
            )
            return Response(
                {
                    "records": records,
                    "token": token,
                    "operation": operation,
                    "name": record_name(obj),
                    "permanent": False,
                }
            )
        form = form_for(resource, obj)
        field_name = request.query_params.get("field")
        if field_name:
            field = form.fields.get(field_name)
            if not isinstance(field, forms.ModelChoiceField):
                return Response({"detail": "Unknown relation."}, status=400)
            qs = field.queryset
            text = request.query_params.get("search", "").strip()
            if text:
                qs = qs.filter(related_search(qs.model, "", text))
            return Response(
                {
                    "options": [
                        {"value": str(o.pk), "label": record_name(o)}
                        for o in eager(qs).order_by("pk")[:50]
                    ]
                }
            )
        return Response(
            {
                "fields": field_schema(form, resource),
                "name": record_name(obj) if obj else "",
                "actions": capabilities(resource, obj),
            }
        )

    def post(self, request, resource, pk=None):
        if resource not in RESOURCES or resource in READONLY:
            return Response({"detail": "Activity and audit history are read-only."}, status=400)
        operation = request.data.get("operation", "edit" if pk else "create")
        try:
            with transaction.atomic():
                obj = queryset(resource).select_for_update().filter(pk=pk).first() if pk else None
                if pk and obj is None:
                    obj = archived_object(resource, pk)
                if pk and obj is None:
                    return Response({"detail": "Not found."}, status=404)
                if operation in ("create", "edit"):
                    if operation not in capabilities(resource, obj):
                        raise ValidationError("This record cannot be edited.")
                    form = form_for(resource, obj, request.data, request.FILES)
                    if not form.is_valid():
                        return Response(
                            {
                                "detail": "Please correct the highlighted fields.",
                                "errors": form.errors,
                            },
                            status=400,
                        )
                    instance = form.save(commit=False)
                    validate_record(instance)
                    if isinstance(instance, models.User):
                        password = form.cleaned_data.get("new_password")
                        if password:
                            validate_password(password, instance)
                            instance.set_password(password)
                        instance.is_superuser = resource == "admins"
                    instance.save()
                    form.save_m2m()
                    obj = instance
                else:
                    confirmed = signing.loads(
                        request.data.get("token", ""), salt="super-admin-action", max_age=600
                    )
                    objects, records, digest = impact(
                        resource, obj, operation, request.user, lock=True
                    )
                    if confirmed != {
                        "resource": resource,
                        "id": pk,
                        "operation": operation,
                        "actor": request.user.pk,
                        "digest": digest,
                    }:
                        return Response(
                            {"detail": "Affected records changed. Review a new confirmation."},
                            status=409,
                        )
                    stamp = timezone.now()
                    if operation == "delete":
                        if not isinstance(obj, models.SoftDeletableModel):
                            archived = [
                                {
                                    "resource": resource,
                                    "id": obj.pk,
                                    "snapshot": serializers.serialize("json", [obj]),
                                }
                            ]
                            if resource == "catalog":
                                collector = Collector(using="default")
                                collector.collect([obj])
                                for qs in collector.fast_deletes:
                                    for item in qs:
                                        archived.append(
                                            {
                                                "resource": None,
                                                "id": item.pk,
                                                "snapshot": serializers.serialize("json", [item]),
                                            }
                                        )
                            DeletionBatch.objects.create(
                                resource=resource, record_id=pk, records=archived, created_at=stamp
                            )
                            obj.delete()
                        else:
                            archived = [
                                {
                                    "resource": r["resource"],
                                    "id": r["id"],
                                    "snapshot": (
                                        serializers.serialize("json", [item])
                                        if not isinstance(item, models.SoftDeletableModel)
                                        else None
                                    ),
                                }
                                for item, r in zip(objects, records)
                            ]
                            for item in objects:
                                if not isinstance(item, models.SoftDeletableModel):
                                    item.delete()
                                    continue
                                if isinstance(item, models.User):
                                    item.is_active = False
                                    item.save(update_fields=["is_active"])
                                models.SoftDeletableModel.soft_delete(
                                    item, user=request.user, cascade=False, deleted_at=stamp
                                )
                            DeletionBatch.objects.create(
                                resource=resource,
                                record_id=pk,
                                created_at=stamp,
                                records=archived,
                            )
                    elif operation == "restore":
                        for item in objects:
                            if getattr(item, "_restore_snapshot", False):
                                item.save_base(raw=True, force_insert=True)
                                continue
                            item.is_deleted, item.deleted_by, item.deleted_at = False, None, None
                            item.clean()
                            item.save()
                    elif operation in ("activate", "deactivate"):
                        obj.is_active = operation == "activate"
                        obj.save(update_fields=["is_active"])
                    else:
                        raise ValidationError("Unknown action.")
                LogEntry.objects.log_action(
                    request.user.pk,
                    None,
                    pk or obj.pk,
                    record_name(obj),
                    CHANGE,
                    "Super-admin %s: %s" % (operation, resource),
                )
                return Response(
                    {
                        "detail": "Record %s completed." % operation,
                        "id": obj.pk,
                        "resource": resource,
                    }
                )
        except (signing.BadSignature, signing.SignatureExpired):
            return Response(
                {"detail": "Confirmation expired. Review the affected records again."}, status=409
            )
        except ValidationError as exc:
            return Response({"detail": " ".join(exc.messages)}, status=400)
        except IntegrityError:
            return Response(
                {
                    "detail": "This change conflicts with an existing record. Review related records and try again."
                },
                status=400,
            )
