"""Calendar-day invoice dates based on the business's local first-send date."""

from datetime import timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.utils import timezone


PAYMENT_TERM_DAYS = {"UPFRONT": 0, "NET_15": 15, "NET_30": 30}


def business_local_date(business, at=None):
    try:
        business_zone = ZoneInfo(business.timezone)
    except (ZoneInfoNotFoundError, TypeError, ValueError):
        business_zone = ZoneInfo("UTC")
    return timezone.localdate(at or timezone.now(), business_zone)


def due_date_for_terms(terms, business, at=None):
    return business_local_date(business, at) + timedelta(days=PAYMENT_TERM_DAYS[terms])


def prepare_first_send(invoice, at=None):
    """Set first-send time and calculate a date only when none was chosen."""
    if invoice.sent_at is not None:
        return False
    if not invoice.payment_terms:
        return False
    invoice.sent_at = at or timezone.now()
    if invoice.due_date is None:
        invoice.due_date = due_date_for_terms(invoice.payment_terms, invoice.business, invoice.sent_at)
    return True
