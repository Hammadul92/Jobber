from io import BytesIO
from decimal import Decimal
from xml.sax.saxutils import escape

from PIL import Image as PillowImage, ImageChops, ImageOps
from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    CondPageBreak, Image, KeepTogether, LongTable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
)

from core.pricing import quote_line_items, quote_tax_details
from operations.pdf_content import parse_pdf_content


NAVY = colors.HexColor("#09355D")
INK = colors.HexColor("#253446")
MUTED = colors.HexColor("#64748B")
LINE = colors.HexColor("#DDE3EA")
PAPER = colors.HexColor("#F5F7F9")
GREEN = colors.HexColor("#047857")


def _text(value, fallback="-"):
    if value in (None, ""):
        return fallback
    return str(value)


def _address(record):
    return ", ".join(filter(None, [
        record.street_address, record.city, record.province_state,
        record.country, record.postal_code,
    ]))


def _billing_address(client):
    return ", ".join(filter(None, [
        client.billing_street_address, client.billing_city,
        client.billing_province_state, client.billing_country,
        client.billing_postal_code,
    ]))


def _styles():
    body = ParagraphStyle(
        "quote_body", fontName="Helvetica", fontSize=9, leading=13,
        textColor=INK, spaceAfter=5,
    )
    name = ParagraphStyle(
        "quote_name", parent=body, fontName="Helvetica-Bold",
        fontSize=11, leading=15, textColor=NAVY,
    )
    label = ParagraphStyle(
        "quote_label", parent=body, fontName="Helvetica-Bold",
        fontSize=7.5, leading=11, textColor=MUTED, spaceAfter=6,
    )
    return {
        "body": body, "name": name, "label": label,
        "title": ParagraphStyle(
            "quote_title", parent=name, fontSize=21, leading=25, spaceAfter=0,
        ),
        "reference": ParagraphStyle(
            "quote_reference", parent=name, alignment=TA_RIGHT,
        ),
        "label_right": ParagraphStyle(
            "quote_label_right", parent=label, alignment=TA_RIGHT,
        ),
        "meta": ParagraphStyle(
            "quote_meta", parent=body, alignment=TA_RIGHT,
            fontSize=8.5, leading=12, spaceAfter=2,
        ),
        "signed": ParagraphStyle(
            "quote_signed", parent=body, fontName="Helvetica-Bold",
            fontSize=8.5, leading=12, textColor=GREEN,
        ),
        "section": ParagraphStyle(
            "quote_section", parent=body, fontName="Helvetica-Bold",
            fontSize=10, leading=14, textColor=NAVY,
            spaceBefore=6, spaceAfter=4, keepWithNext=True,
        ),
        "rich_heading": ParagraphStyle(
            "quote_rich_heading", parent=body, fontName="Helvetica-Bold",
            spaceBefore=4, spaceAfter=4, keepWithNext=True,
        ),
        "blockquote": ParagraphStyle(
            "quote_blockquote", parent=body, leftIndent=12, textColor=MUTED,
        ),
        "amount": ParagraphStyle(
            "quote_amount", parent=body, fontName="Helvetica-Bold",
            fontSize=15, leading=20, alignment=TA_RIGHT, textColor=NAVY,
        ),
        "small": ParagraphStyle(
            "quote_small", parent=body, fontSize=7.5, leading=11,
            textColor=MUTED, spaceAfter=0,
        ),
    }


def _paragraph(value, style):
    return Paragraph(escape(_text(value)), style)


def _section(title, content, styles):
    flowables = [Paragraph(title, styles["section"])]
    for block in parse_pdf_content(_text(content)):
        style = styles[block["kind"]]
        if block["bullet"]:
            style = ParagraphStyle(
                "quote_list_item", parent=style,
                leftIndent=12 * (block["indent"] + 1),
                bulletIndent=12 * block["indent"], spaceAfter=3,
            )
        flowables.append(Paragraph(block["html"], style, bulletText=block["bullet"]))
    return flowables


def _signature_image(quote):
    """Frame the stored signature without the drawing canvas's blank margins."""
    quote.signature.open("rb")
    try:
        original = quote.signature.read()
    finally:
        quote.signature.close()
    with PillowImage.open(BytesIO(original)) as stored:
        rgba = ImageOps.exif_transpose(stored).convert("RGBA")
        image = PillowImage.new("RGB", rgba.size, "white")
        image.paste(rgba, mask=rgba.getchannel("A"))
    bounds = ImageChops.difference(
        image, PillowImage.new("RGB", image.size, "white"),
    ).getbbox()
    if bounds:
        image = image.crop(bounds)
    image = ImageOps.expand(image, border=6, fill="white")
    data = BytesIO()
    image.save(data, format="PNG")
    data.seek(0)
    scale = min(170 / image.width, 56 / image.height)
    signature = Image(data, width=image.width * scale, height=image.height * scale)
    signature.hAlign = "LEFT"
    return signature


def build_signed_quote_pdf(quote):
    """Return a consistently laid-out copy of the quote and recorded signature."""
    output = BytesIO()
    document = SimpleDocTemplate(
        output, pagesize=LETTER, rightMargin=42, leftMargin=42,
        topMargin=34, bottomMargin=40,
        title=f"Signed quotation {quote.quote_number}", author="GetContractorz",
    )
    styles = _styles()
    service = quote.service
    quoted_currency = getattr(quote, "currency", None) or service.currency
    business = service.business
    client = service.client.user
    # SimpleDocTemplate's content frame has 6pt inner padding on each side.
    content_left = document.leftMargin + 6
    content_right = LETTER[0] - document.rightMargin - 6
    width = content_right - content_left
    signed_at = quote.signed_at.strftime("%B %d, %Y at %I:%M %p %Z")
    valid_until = getattr(quote, "valid_until", None)

    def draw_page(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.5)
        canvas.line(content_left, 38, content_right, 38)
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(MUTED)
        canvas.drawString(content_left, 25, "GetContractorz | Signed quotation")
        canvas.drawRightString(
            content_right, 25,
            f"{quote.quote_number}  |  Page {doc.page}",
        )
        if doc.page > 1:
            canvas.drawString(content_left, LETTER[1] - 25, "QUOTATION - CONTINUED")
            canvas.drawRightString(
                content_right, LETTER[1] - 25, quote.quote_number,
            )
        canvas.restoreState()

    metadata = [
        _paragraph("QUOTATION", styles["meta"]),
        _paragraph(quote.quote_number, styles["reference"]),
        Paragraph('<font color="#047857"><b>SIGNED</b></font>', styles["meta"]),
    ]
    if valid_until:
        metadata.append(_paragraph(f"Valid until: {valid_until:%d %b %Y}", styles["meta"]))
    header = Table(
        [[_paragraph(business.name, styles["title"]), metadata]],
        colWidths=[width * 0.64, width * 0.36],
    )
    header.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 13),
        ("LINEBELOW", (0, 0), (-1, -1), 2, colors.HexColor("#FF7A00")),
    ]))

    business_details = [
        _paragraph("BUSINESS DETAILS", styles["label"]),
        _paragraph(f"Address: {_text(_address(business))}", styles["body"]),
        _paragraph(f"Phone: {_text(business.phone)}", styles["body"]),
        _paragraph(f"Email: {_text(business.email)}", styles["body"]),
    ]
    client_details = [
        _paragraph("PREPARED FOR", styles["label"]),
        _paragraph(client.name, styles["name"]),
        *([_paragraph(service.client.company_name, styles["body"])] if service.client.company_name else []),
        _paragraph(client.email, styles["body"]),
        _paragraph(client.phone, styles["body"]),
        _paragraph(f"Billing address: {_text(_billing_address(service.client))}", styles["body"]),
    ]
    contacts = Table([[business_details, client_details]], colWidths=[width / 2] * 2)
    contacts.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 20),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    service_details = [
        _paragraph(service.service_name, styles["name"]),
        _paragraph(f"Service address: {_text(_address(service))}", styles["body"]),
    ]
    service_type = getattr(service, "service_type", None)
    if service_type:
        service_details.append(_paragraph(
            service_type.replace("_", " ").title(), styles["small"],
        ))
    summary = Table([[service_details]], colWidths=[width])
    summary.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), PAPER),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))

    items = quote_line_items(quote)
    rows = [[
        _paragraph("SERVICE ITEMS", styles["label"]),
        _paragraph("PRICE", styles["label_right"]),
    ]]
    for item in items:
        detail = [_paragraph(item["title"], styles["name"])]
        if item.get("description"):
            detail.append(_paragraph(item["description"], styles["body"]))
        rows.append([
            detail,
            _paragraph(f"${Decimal(str(item['price'])):,.2f} {quoted_currency}", styles["label_right"]),
        ])
    subtotal, tax_label, tax_amount, total = quote_tax_details(quote)
    if tax_amount is not None:
        rows.append([
            _paragraph("SUBTOTAL", styles["label"]),
            _paragraph(f"${subtotal:,.2f} {quoted_currency}", styles["label_right"]),
        ])
        rows.append([
            _paragraph(f"{tax_label.upper()} ({quote.tax_rate}%)", styles["label"]),
            _paragraph(f"${tax_amount:,.2f} {quoted_currency}", styles["label_right"]),
        ])
    billing_cycle = getattr(service, "billing_cycle", "")
    period = " / month" if billing_cycle == "MONTHLY" else ""
    rows.append([
        _paragraph("QUOTED TOTAL" + period.upper(), styles["label"]),
        _paragraph(f"${total:,.2f} {quoted_currency}", styles["amount"]),
    ])
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

    story = [header, Spacer(1, 15), contacts, Spacer(1, 15), summary, Spacer(1, 12), pricing, Spacer(1, 4)]
    if len(items) > 1:
        story.append(CondPageBreak(260))
    if service.description and getattr(service, "items", None):
        story.extend(_section("Service Description", service.description, styles))
    story.extend(_section(
        "General terms and conditions",
        quote.general_terms_conditions or "No general terms provided.", styles,
    ))
    story.extend(_section(
        "Additional terms and conditions",
        quote.terms_conditions or "No additional terms provided.", styles,
    ))
    if quote.notes:
        story.extend(_section("Notes", quote.notes, styles))

    acceptance_details = [
        Paragraph("SIGNED AND ACCEPTED", styles["signed"]), Spacer(1, 5),
        _paragraph(client.name, styles["name"]),
        _paragraph(f"Signed by {_text(client.name)} on {signed_at}", styles["body"]),
    ]
    signature_details = [_paragraph("CLIENT SIGNATURE", styles["label"])]
    if quote.signature:
        signature_details.append(_signature_image(quote))
    acceptance = Table(
        [[acceptance_details, signature_details]],
        colWidths=[width * 0.62, width * 0.38],
    )
    acceptance.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), PAPER),
        ("LINEABOVE", (0, 0), (-1, 0), 1, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    story.append(KeepTogether([
        Spacer(1, 7), acceptance, Spacer(1, 5),
        Paragraph(
            "This document is a finalized copy of the electronically signed "
            "quotation stored by Contractorz.", styles["small"],
        ),
    ]))

    document.build(story, onFirstPage=draw_page, onLaterPages=draw_page)
    output.seek(0)
    return output
