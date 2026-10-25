"""Managed Risk onboarding through the stable Accounts v2 API."""

import stripe
from django.conf import settings


def connect_client():
    return stripe.StripeClient(
        settings.STRIPE_SECRET_KEY,
        stripe_version="2026-09-30.endive",
        http_client=stripe.RequestsClient(timeout=10),
        max_network_retries=0,
    )


def create_merchant_account(business, banking_info):
    return connect_client().v2.core.accounts.create(
        {
            "contact_email": business.email,
            "display_name": business.name,
            "dashboard": "full",
            "identity": {"country": business.country.upper()},
            "configuration": {
                "merchant": {"capabilities": {"card_payments": {"requested": True}}},
            },
            "defaults": {
                "responsibilities": {
                    "fees_collector": "stripe",
                    "losses_collector": "stripe",
                },
            },
            "metadata": {"business_id": str(business.id)},
        },
        options={"idempotency_key": f"merchant-bank-{banking_info.pk}"},
    )


def create_onboarding_link(account_id):
    return connect_client().v2.core.account_links.create(
        {
            "account": account_id,
            "use_case": {
                "type": "account_onboarding",
                "account_onboarding": {
                    "refresh_url": f"{settings.FRONTEND_URL}/reauth",
                    "return_url": f"{settings.FRONTEND_URL}/user/banking",
                },
            },
        },
    )
