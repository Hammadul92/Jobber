"""Shared service, quote, and invoice line-item pricing helpers."""

from decimal import Decimal


def business_tax_label(business):
    """Use an explicit label or a safe jurisdiction-aware default."""
    explicit_label = (getattr(business, "tax_label", "") or "").strip()
    if explicit_label:
        return explicit_label
    if business.tax_rate == 0:
        return "Tax"
    if business.country == "CA":
        if business.province_state in {"AB", "NT", "NU", "YT"}:
            return "GST"
        if business.province_state in {"NB", "NL", "NS", "ON", "PE"}:
            return "HST"
    return "Tax"


def tax_amount_for(subtotal, rate):
    return (subtotal * rate / Decimal("100")).quantize(Decimal("0.01"))


def quote_effective_tax_rate(quote):
    rate = getattr(quote, "tax_rate", None)
    if rate is None and getattr(quote, "status", None) == "DRAFT":
        return quote.service.business.tax_rate
    return rate


def quote_tax_details(quote):
    """Return displayed tax terms; historic sent/signed quotes stay unchanged."""
    subtotal = line_items_total(quote_line_items(quote))
    rate = quote_effective_tax_rate(quote)
    if rate is None:
        return subtotal, None, None, subtotal
    amount = tax_amount_for(subtotal, rate)
    label = getattr(quote, "tax_label", "") or business_tax_label(quote.service.business)
    return subtotal, label, amount, subtotal + amount


def service_line_items(service):
    """Return explicit items or one legacy line for a service without items."""
    if getattr(service, "items", None):
        return [dict(item) for item in service.items]
    return [{
        "title": service.service_name,
        "description": service.description or "",
        "price": str(service.price),
    }]


def quote_line_items(quote):
    """Use the saved quote terms, falling back for quotes made before snapshots."""
    if getattr(quote, "line_items", None) is not None:
        return [dict(item) for item in quote.line_items]
    return service_line_items(quote.service)


def invoice_line_items(invoice):
    """Use issued invoice terms, falling back for older invoice records."""
    if getattr(invoice, "line_items", None) is not None:
        return [dict(item) for item in invoice.line_items]
    if invoice.service:
        return [{
            "title": invoice.service.service_name,
            "description": invoice.service.description or "",
            "price": str(invoice.subtotal),
        }]
    return [{"title": "Service", "description": "", "price": str(invoice.subtotal)}]


def line_items_total(items):
    return sum((Decimal(str(item["price"])) for item in items), Decimal("0.00"))
