"""Auto-generated invoices.

A one-time service gets a single invoice once its quote is signed and the
service is active. A subscription gets one invoice per billing period
(monthly, or yearly when the billing cycle says so), anchored on the
service's start date and stopping after its end date. Each subscription
invoice records the period it bills in ``billing_period_start``; a database
constraint keeps that to one invoice per service per period, so the hourly
job, quote signing and service activation can all call this safely.
"""
import calendar
import logging
from datetime import date, timedelta

import pytz
from django.db import IntegrityError, transaction
from django.utils import timezone

from core.models import Invoice, Service
from core.pricing import line_items_total, quote_line_items, tax_amount_for

logger = logging.getLogger(__name__)


def is_subscription(service):
    return service.service_type == "SUBSCRIPTION"


def _months_per_period(service):
    return 12 if service.billing_cycle == "YEARLY" else 1


def _add_months(anchor, months):
    """Same day-of-month ``months`` later, clamped to the month's last day."""
    month_index = anchor.month - 1 + months
    year = anchor.year + month_index // 12
    month = month_index % 12 + 1
    return date(year, month, min(anchor.day, calendar.monthrange(year, month)[1]))


def _period_start(service, index):
    return _add_months(service.start_date, _months_per_period(service) * index)


def billing_period_for(service, day):
    """(start, end) of the billing period containing ``day``.

    Before the service starts this is the first period; after the end date
    there is none.
    """
    start_date = service.start_date
    index = 0
    if day > start_date:
        months = (day.year - start_date.year) * 12 + day.month - start_date.month
        index = months // _months_per_period(service)
        if _period_start(service, index) > day:
            index -= 1

    start = _period_start(service, index)
    if service.end_date and start > service.end_date:
        return None
    end = _period_start(service, index + 1) - timedelta(days=1)
    if service.end_date:
        end = min(end, service.end_date)
    return start, end


def business_today(business):
    """Today's date where the business operates."""
    try:
        tz = pytz.timezone(business.timezone)
    except (pytz.UnknownTimeZoneError, AttributeError):
        tz = pytz.utc
    return timezone.now().astimezone(tz).date()


def _format_day(day):
    return f"{day:%b} {day.day}, {day.year}"


def _signed_quote(service):
    quote = (
        service.service_quotes.filter(is_active=True)
        .exclude(status="DECLINED")
        .first()
    )
    return quote if quote and quote.status == "SIGNED" else None


def _create_invoice(service, quote, period=None):
    items = quote_line_items(quote)
    subtotal = line_items_total(items)
    tax_rate = quote.tax_rate if quote.tax_rate is not None else service.business.tax_rate
    tax_amount = tax_amount_for(subtotal, tax_rate)
    notes = "Auto-generated invoice."
    if period:
        notes = (
            f"Auto-generated invoice for {_format_day(period[0])} – "
            f"{_format_day(period[1])}."
        )
    return Invoice.objects.create(
        business=service.business,
        client=service.client,
        service=service,
        billing_period_start=period[0] if period else None,
        due_date=None if quote.payment_terms else business_today(service.business) + timedelta(days=2),
        payment_terms=quote.payment_terms,
        currency=quote.currency or service.currency,
        subtotal=subtotal,
        tax_rate=tax_rate,
        tax_amount=tax_amount,
        total_amount=subtotal + tax_amount,
        line_items=items,
        notes=notes,
    )


def create_auto_invoice_for_service(service, today=None):
    """Create the invoice the service is due, if any; returns it or None."""
    if service.status != "ACTIVE" or not service.auto_generate_invoices:
        return None
    quote = _signed_quote(service)
    if not quote:
        return None

    if not is_subscription(service):
        if service.invoices.filter(is_active=True).exists():
            return None
        return _create_invoice(service, quote)

    period = billing_period_for(service, today or business_today(service.business))
    if period is None:
        return None
    # Trashed invoices count: deleting a period's invoice must not recreate it.
    if Invoice.all_objects.filter(service=service, billing_period_start=period[0]).exists():
        return None
    try:
        with transaction.atomic():
            return _create_invoice(service, quote, period)
    except IntegrityError:
        # Another process created this period's invoice first.
        return None


def generate_due_subscription_invoices(today=None):
    """Create this period's draft invoice for every eligible subscription."""
    services = Service.objects.filter(
        status="ACTIVE",
        service_type="SUBSCRIPTION",
        auto_generate_invoices=True,
    ).select_related("business", "client")

    created = []
    for service in services:
        try:
            invoice = create_auto_invoice_for_service(service, today)
        except Exception:  # keep one bad service from blocking the rest
            logger.exception("Recurring invoice failed for service %s", service.pk)
            continue
        if invoice:
            created.append(invoice)
    return created
