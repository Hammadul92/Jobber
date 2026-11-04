"""PDF copy of an invoice, attached to invoice and payment confirmation emails."""

from decimal import Decimal
from io import BytesIO
from xml.sax.saxutils import escape
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.platypus import KeepTogether, LongTable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from core.pricing import invoice_line_items
from operations.pdf import (
    LINE, MUTED, PAPER, _address, _billing_address, _paragraph, _section, _styles, _text,
)

SETTLED_PAYOUT_STATUSES = ("PAID", "PARTIALLY_REFUNDED", "REFUNDED")
ACCENT = colors.HexColor("#FF7A00")
PAID_BACKGROUND = colors.HexColor("#ECFDF5")
PAID_LINE = colors.HexColor("#A7F3D0")


def _money(amount, currency):
    return f"${Decimal(str(amount or 0)):,.2f} {currency}"


def _local(value, business):
    """Show a stored timestamp in the business's own timezone."""
    if value is None:
        return None
    try:
        zone = ZoneInfo(business.timezone)
    except (ZoneInfoNotFoundError, ValueError, TypeError):
        zone = ZoneInfo("UTC")  # same fallback as core.payment_terms.business_local_date
    return timezone.localtime(value, zone) if timezone.is_aware(value) else value


def paid_by_card(invoice):
    return invoice.payouts.filter(status__in=SETTLED_PAYOUT_STATUSES).exists()


def payment_method_label(invoice):
    """How a paid invoice was settled, in words a client recognises."""
    if paid_by_card(invoice):
        return "Credit card (paid online)"
    if invoice.payment_option == "ETRANSFER":
        return "Interac e-Transfer"
    return "Payment received by business"


def refunded_total(invoice):
    return sum(
        (payout.refunded_amount or Decimal("0")
         for payout in invoice.payouts.filter(status__in=SETTLED_PAYOUT_STATUSES)),
        Decimal("0"),
    )


def invoice_pdf_filename(invoice):
    suffix = "-paid" if invoice.status == "PAID" else ""
    return f"{invoice.invoice_number}{suffix}.pdf"


def _boxed(content, width, background=PAPER, border=LINE):
    table = Table([[content]], colWidths=[width])
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), background),
        ("BOX", (0, 0), (-1, -1), 0.6, border),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return table


def _key_values(rows, styles, width):
    """Two-column label/value list used inside the payment panel."""
    table = Table(
        [[_paragraph(label, styles["label"]), _paragraph(value, styles["body"])] for label, value in rows],
        colWidths=[width * 0.32, width * 0.68],
    )
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return table


def build_invoice_pdf(invoice):
    """Return the invoice as a PDF; a paid invoice includes its payment receipt."""
    output = BytesIO()
    document = SimpleDocTemplate(
        output, pagesize=LETTER, rightMargin=42, leftMargin=42,
        topMargin=34, bottomMargin=40,
        title=f"Invoice {invoice.invoice_number}", author=invoice.business.name,
    )
    styles = _styles()
    business = invoice.business
    client = invoice.client
    service = invoice.service
    currency = invoice.currency
    is_paid = invoice.status == "PAID"
    content_left = document.leftMargin + 6
    content_right = LETTER[0] - document.rightMargin - 6
    width = content_right - content_left

    issued = _local(invoice.sent_at or invoice.created_at, business)
    paid_at = _local(invoice.paid_at, business)

    def draw_page(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.5)
        canvas.line(content_left, 38, content_right, 38)
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(MUTED)
        canvas.drawString(content_left, 25, f"{business.name} | {'Paid invoice' if is_paid else 'Invoice'}")
        canvas.drawRightString(content_right, 25, f"{invoice.invoice_number}  |  Page {doc.page}")
        if doc.page > 1:
            canvas.drawString(content_left, LETTER[1] - 25, "INVOICE - CONTINUED")
            canvas.drawRightString(content_right, LETTER[1] - 25, invoice.invoice_number)
        canvas.restoreState()

    status_badge = (
        '<font color="#047857"><b>PAID</b></font>' if is_paid
        else '<font color="#B45309"><b>PAYMENT DUE</b></font>'
    )
    metadata = [
        _paragraph("INVOICE", styles["meta"]),
        _paragraph(invoice.invoice_number, styles["reference"]),
        Paragraph(status_badge, styles["meta"]),
        _paragraph(f"Issued: {issued:%d %b %Y}", styles["meta"]),
    ]
    if invoice.due_date:
        metadata.append(_paragraph(f"Due: {invoice.due_date:%d %b %Y}", styles["meta"]))
    if invoice.payment_terms:
        metadata.append(_paragraph(f"Payment terms: {invoice.get_payment_terms_display()}", styles["meta"]))
    if is_paid and paid_at:
        metadata.append(_paragraph(f"Paid: {paid_at:%d %b %Y}", styles["meta"]))
    header = Table([[_paragraph(business.name, styles["title"]), metadata]], colWidths=[width * 0.64, width * 0.36])
    header.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 13),
        ("LINEBELOW", (0, 0), (-1, -1), 2, ACCENT),
    ]))

    business_details = [
        _paragraph("FROM", styles["label"]),
        _paragraph(business.name, styles["name"]),
        _paragraph(_text(_address(business)), styles["body"]),
        _paragraph(f"Phone: {_text(business.phone)}", styles["body"]),
        _paragraph(f"Email: {_text(business.email)}", styles["body"]),
    ]
    if business.business_number:
        business_details.append(_paragraph(f"Business no.: {business.business_number}", styles["body"]))
    client_details = [
        _paragraph("BILL TO", styles["label"]),
        _paragraph(client.company_name or client.name, styles["name"]),
        *([_paragraph(client.name, styles["body"])] if client.company_name else []),
        _paragraph(client.user.email, styles["body"]),
        *([_paragraph(client.phone, styles["body"])] if client.phone else []),
        _paragraph(_text(_billing_address(client), "Billing address not provided"), styles["body"]),
    ]
    contacts = Table([[business_details, client_details]], colWidths=[width / 2] * 2)
    contacts.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 20),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    story = [header, Spacer(1, 15), contacts, Spacer(1, 15)]
    if service:
        story += [
            _boxed([
                _paragraph(service.service_name, styles["name"]),
                _paragraph(f"Service address: {_text(_address(service))}", styles["body"]),
            ], width),
            Spacer(1, 12),
        ]

    rows = [[_paragraph("DESCRIPTION", styles["label"]), _paragraph("AMOUNT", styles["label_right"])]]
    for item in invoice_line_items(invoice):
        detail = [_paragraph(item.get("title") or "Service", styles["name"])]
        if item.get("description"):
            detail.append(_paragraph(item["description"], styles["body"]))
        rows.append([detail, _paragraph(_money(item.get("price"), currency), styles["label_right"])])
    rows.append([_paragraph("SUBTOTAL", styles["label"]), _paragraph(_money(invoice.subtotal, currency), styles["label_right"])])
    if invoice.tax_amount:
        tax_label = (business.tax_label or "Tax").upper()
        rows.append([
            _paragraph(f"{tax_label} ({invoice.tax_rate}%)", styles["label"]),
            _paragraph(_money(invoice.tax_amount, currency), styles["label_right"]),
        ])
    rows.append([_paragraph("TOTAL", styles["label"]), _paragraph(_money(invoice.total_amount, currency), styles["label_right"])])
    refunded = refunded_total(invoice) if is_paid else Decimal("0")
    if is_paid:
        rows.append([_paragraph("AMOUNT PAID", styles["label"]), _paragraph(_money(invoice.total_amount, currency), styles["label_right"])])
        if refunded:
            rows.append([_paragraph("REFUNDED", styles["label"]), _paragraph(_money(refunded, currency), styles["label_right"])])
    balance = Decimal("0") if is_paid else invoice.total_amount
    rows.append([_paragraph("BALANCE DUE", styles["label"]), _paragraph(_money(balance, currency), styles["amount"])])
    pricing = LongTable(rows, colWidths=[width * 0.72, width * 0.28], repeatRows=1)
    pricing.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, 0), PAPER),
        ("BACKGROUND", (0, -1), (-1, -1), PAPER),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, LINE),
        ("LINEABOVE", (0, -1), (-1, -1), 0.8, LINE),
        ("LINEBELOW", (0, 1), (-1, -2), 0.3, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story += [pricing, Spacer(1, 14)]

    inner = width - 24
    if is_paid:
        payment_rows = [
            ("Amount paid", _money(invoice.total_amount, currency)),
            ("Date paid", f"{paid_at:%B %d, %Y}" if paid_at else "-"),
            ("Payment method", payment_method_label(invoice)),
            ("Reference", invoice.invoice_number),
        ]
        if refunded:
            payment_rows.append(("Refunded", _money(refunded, currency)))
        panel = _boxed([
            Paragraph("PAYMENT RECEIVED - THANK YOU", styles["signed"]),
            Spacer(1, 5),
            _key_values(payment_rows, styles, inner),
        ], width, background=PAID_BACKGROUND, border=PAID_LINE)
    elif invoice.payment_option == "ETRANSFER" and business.etransfer_email:
        panel = _boxed([
            _paragraph("HOW TO PAY - INTERAC E-TRANSFER", styles["label"]),
            _key_values([
                ("Send to", business.etransfer_email),
                ("Amount", _money(invoice.total_amount, currency)),
                ("Message", f"Invoice {invoice.invoice_number}"),
            ], styles, inner),
            Spacer(1, 3),
            _paragraph(
                "Include the invoice number in the e-Transfer message so your payment can be matched.",
                styles["small"],
            ),
        ], width)
    elif invoice.payment_option == "ETRANSFER":
        panel = _boxed([
            _paragraph("HOW TO PAY - INTERAC E-TRANSFER", styles["label"]),
            _paragraph(
                f"Contact {business.name} at {_text(business.email)} for e-Transfer details, "
                f"and include invoice number {invoice.invoice_number} in the e-Transfer message.",
                styles["body"],
            ),
        ], width)
    else:
        panel = _boxed([
            _paragraph("HOW TO PAY", styles["label"]),
            _paragraph(
                "Pay securely online using the payment link in the invoice email, "
                "or sign in to your client portal to view and pay this invoice.",
                styles["body"],
            ),
        ], width)
    story.append(KeepTogether([panel]))

    if invoice.notes:
        # _section escapes plain text itself (and keeps rich-text markup).
        story += [Spacer(1, 6), *_section("Notes", invoice.notes, styles)]

    story += [
        Spacer(1, 10),
        Paragraph(
            f"Questions about this invoice? Contact {escape(business.name)} at {escape(_text(business.email))}.",
            styles["small"],
        ),
    ]

    document.build(story, onFirstPage=draw_page, onLaterPages=draw_page)
    output.seek(0)
    return output
