"""Human-readable labels for the monitoring API; identifiers stay internal."""

from core import models
from .models import PlatformEvent
from django.contrib.admin.models import LogEntry
from django.contrib.contenttypes.models import ContentType

LABEL_PATHS = {
    ContentType: ("model", "app_label"),
    models.User: ("name", "email"),
    models.Business: ("name", "email"),
    models.Client: ("name", "user__name", "user__email"),
    models.TeamMember: ("employee__name", "employee__email"),
    models.Service: ("service_name",),
    models.ServiceQuestionnaire: ("service_name",),
    models.ServiceTermsTemplate: ("service_name",),
    models.Job: ("title",),
    models.JobAssignment: ("job__title", "team_member__employee__name"),
    models.JobPhoto: ("job__title",),
    models.Quote: ("quote_number",),
    models.Invoice: ("invoice_number",),
    models.Payout: ("invoice__invoice_number",),
    models.PayoutRefund: ("payout__invoice__invoice_number",),
    models.BankingInformation: (
        "account_holder_name",
        "business__name",
        "client__name",
        "client__user__name",
    ),
    models.FAQ: ("question",),
    models.ServiceOption: ("name",),
    PlatformEvent: ("entity", "operation"),
    LogEntry: ("object_repr", "change_message"),
}


def resource_for(model, registry, obj=None):
    if model == models.User and obj is not None:
        return "admins" if obj.is_superuser else "users"
    return next((key for key, candidate in registry.items() if candidate == model), None)


def eager(qs):
    paths = set()
    model = qs.model
    for path in LABEL_PATHS.get(model, ()):
        if "__" in path:
            paths.add(path.rsplit("__", 1)[0])
    for field in model._meta.fields:
        if field.is_relation:
            paths.add(field.name)
            for path in LABEL_PATHS.get(field.related_model, ()):
                if "__" in path:
                    paths.add(field.name + "__" + path.rsplit("__", 1)[0])
    return qs.select_related(*sorted(paths))


def record_name(obj):
    if obj is None:
        return "Unavailable record"
    if obj._meta.label_lower == "taggit.taggeditem":
        return "Catalog link: %s" % record_name(obj.content_object)
    if isinstance(obj, models.Client):
        return obj.name or record_name(obj.user)
    if isinstance(obj, models.TeamMember):
        return record_name(obj.employee)
    if isinstance(obj, models.JobAssignment):
        return "%s: %s" % (record_name(obj.job), record_name(obj.team_member))
    if isinstance(obj, models.JobPhoto):
        return "%s photo: %s" % (obj.get_photo_type_display(), record_name(obj.job))
    if isinstance(obj, models.Payout):
        return "Payment: %s" % record_name(obj.invoice)
    if isinstance(obj, models.PayoutRefund):
        return "Refund: %s" % record_name(obj.payout.invoice)
    if isinstance(obj, models.BankingInformation):
        method = obj.card_brand or obj.bank_name or obj.get_payment_method_type_display()
        last4 = obj.card_last4 or obj.account_number_last4
        return "%s%s: %s" % (
            method,
            " ••••" + last4 if last4 else "",
            record_name(obj.business or obj.client),
        )
    if isinstance(obj, PlatformEvent):
        return "%s %s" % (obj.operation.capitalize(), obj.entity.replace("_", " "))
    if isinstance(obj, LogEntry):
        return "%s: %s" % (
            obj.get_action_flag_display(),
            obj.object_repr or "Administrative activity",
        )
    for attr in (
        "name",
        "title",
        "service_name",
        "quote_number",
        "invoice_number",
        "question",
        "email",
    ):
        value = getattr(obj, attr, None)
        if value and str(value).strip():
            return str(value)
    return "Unnamed %s" % obj._meta.verbose_name


def primary_field(model):
    names = {f.name for f in model._meta.fields}
    return next(
        (
            name
            for name in (
                "name",
                "title",
                "service_name",
                "quote_number",
                "invoice_number",
                "question",
            )
            if name in names
        ),
        "display_name",
    )


def related_search(model, prefix, text):
    from django.db.models import Q

    result = Q(pk__in=[])
    for path in LABEL_PATHS.get(model, ()):
        result |= Q(**{(prefix + "__" if prefix else "") + path + "__icontains": text})
    return result
