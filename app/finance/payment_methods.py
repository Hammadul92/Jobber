"""Resolve usable saved cards consistently for invoice display and payment."""

from core.models import BankingInformation
from django.db.models import Q


def get_client_payment_method(client):
    """Prefer this client's card, then another card saved by the same user."""
    cards = BankingInformation.objects.filter(
        client__user_id=client.user_id,
        client__is_active=True,
        client__is_deleted=False,
        is_active=True,
        payment_method_type="CARD",
    ).filter(
        Q(business__isnull=True) | Q(business__owner_id=client.user_id),
    ).exclude(
        stripe_customer_id__isnull=True,
    ).exclude(
        stripe_customer_id="",
    ).exclude(
        stripe_payment_method_id__isnull=True,
    ).exclude(
        stripe_payment_method_id="",
    ).order_by("-id")
    return cards.filter(client=client).first() or cards.first()
