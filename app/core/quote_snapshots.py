"""Immutable related-record snapshots for finalized quotes."""


def _date(value):
    return value.isoformat() if value else None


def build_signed_quote_snapshot(quote):
    """Capture mutable client, service and business data at signing time."""
    service = quote.service
    client = service.client
    business = service.business
    return {
        "version": 1,
        "client": {
            "id": client.id,
            "user": client.user_id,
            "business": client.business_id,
            "name": client.name,
            "client_name": client.name,
            "email": client.user.email,
            "client_email": client.user.email,
            "phone": client.phone,
            "client_phone": client.phone,
            "company_name": client.company_name,
            "billing_street_address": client.billing_street_address,
            "billing_city": client.billing_city,
            "billing_province_state": client.billing_province_state,
            "billing_country": client.billing_country,
            "billing_postal_code": client.billing_postal_code,
        },
        "service": {
            "id": service.id,
            "client": service.client_id,
            "client_name": client.name,
            "business": service.business_id,
            "service_name": service.service_name,
            "description": service.description or "",
            "items": [dict(item) for item in (service.items or [])],
            "start_date": _date(service.start_date),
            "end_date": _date(service.end_date),
            "service_type": service.service_type,
            "price": str(service.price),
            "currency": service.currency,
            "billing_cycle": service.billing_cycle,
            "street_address": service.street_address,
            "city": service.city,
            "country": service.country,
            "province_state": service.province_state,
            "postal_code": service.postal_code,
        },
        "business": {
            "id": business.id,
            "name": business.name,
            "phone": business.phone,
            "email": business.email,
            "street_address": business.street_address,
            "city": business.city,
            "country": business.country,
            "province_state": business.province_state,
            "postal_code": business.postal_code,
        },
    }


def signed_snapshot_section(quote, section):
    """Return a signed snapshot section, or None for unsigned/legacy quotes."""
    if getattr(quote, "status", None) != "SIGNED":
        return None
    snapshot = getattr(quote, "signed_snapshot", None) or {}
    value = snapshot.get(section)
    return value if isinstance(value, dict) else None
