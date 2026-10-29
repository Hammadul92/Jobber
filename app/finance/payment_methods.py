"""Resolve usable saved cards consistently for invoice display and payment."""

from core.models import BankingInformation
from django.db.models import Q


def usable_cards_for_user(user_id):
    """Saved cards a client account can pay with, across its business links."""
    return BankingInformation.objects.filter(
        client__user_id=user_id,
        client__is_active=True,
        client__is_deleted=False,
        is_active=True,
        payment_method_type="CARD",
    ).filter(
        Q(business__isnull=True) | Q(business__owner_id=user_id),
    ).exclude(
        stripe_customer_id__isnull=True,
    ).exclude(
        stripe_customer_id="",
    ).exclude(
        stripe_payment_method_id__isnull=True,
    ).exclude(
        stripe_payment_method_id="",
    )


def get_client_payment_method(client):
    """Prefer this client's card, then another card saved by the same user."""
    cards = usable_cards_for_user(client.user_id).order_by("-id")
    return cards.filter(client=client).first() or cards.first()
