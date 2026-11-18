import calendar
from datetime import date

import pytz
from django.db import migrations, models


def _add_months(anchor, months):
    month_index = anchor.month - 1 + months
    year = anchor.year + month_index // 12
    month = month_index % 12 + 1
    return date(year, month, min(anchor.day, calendar.monthrange(year, month)[1]))


def _period_start_containing(service, day):
    step = 12 if service.billing_cycle == "YEARLY" else 1
    if day <= service.start_date:
        return service.start_date
    months = (day.year - service.start_date.year) * 12 + day.month - service.start_date.month
    index = months // step
    start = _add_months(service.start_date, step * index)
    if start > day:
        start = _add_months(service.start_date, step * (index - 1))
    return start


def tag_existing_subscription_invoices(apps, schema_editor):
    """Mark subscription invoices already auto-generated with the period they
    bill, so the recurring job does not bill that period a second time."""
    Invoice = apps.get_model("core", "Invoice")
    invoices = (
        Invoice.objects.filter(
            service__service_type="SUBSCRIPTION",
            notes="Auto-generated invoice.",
            billing_period_start__isnull=True,
        )
        .select_related("service", "business")
        .order_by("created_at")
    )
    taken = set()
    for invoice in invoices:
        try:
            tz = pytz.timezone(invoice.business.timezone)
        except pytz.UnknownTimeZoneError:
            tz = pytz.utc
        start = _period_start_containing(invoice.service, invoice.created_at.astimezone(tz).date())
        if (invoice.service_id, start) in taken:
            continue
        taken.add((invoice.service_id, start))
        invoice.billing_period_start = start
        invoice.save(update_fields=["billing_period_start"])


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0038_invoice_payment_options'),
    ]

    operations = [
        migrations.AddField(
            model_name='invoice',
            name='billing_period_start',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddConstraint(
            model_name='invoice',
            constraint=models.UniqueConstraint(condition=models.Q(billing_period_start__isnull=False), fields=('service', 'billing_period_start'), name='unique_invoice_per_service_billing_period'),
        ),
        migrations.RunPython(tag_existing_subscription_invoices, migrations.RunPython.noop),
    ]
