from io import BytesIO

from django.utils.html import strip_tags
from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def _text(value, fallback="-"):
    if value in (None, ""):
        return fallback
    return str(value)


def _address(service):
    return ", ".join(
        filter(
            None,
            [
                service.street_address,
                service.city,
                service.province_state,
                service.country,
                service.postal_code,
            ],
        )
    )


def _section(title, content, styles):
    return KeepTogether(
        [
            Paragraph(title, styles["section_heading"]),
            Spacer(1, 5),
            Paragraph(_text(content), styles["body"]),
            Spacer(1, 14),
        ]
    )


def build_signed_quote_pdf(quote):
    """Return a PDF containing the finalized quote and stored signature."""
    output = BytesIO()
    document = SimpleDocTemplate(
        output,
        pagesize=LETTER,
        rightMargin=0.65 * inch,
        leftMargin=0.65 * inch,
        topMargin=0.55 * inch,
        bottomMargin=0.55 * inch,
        title=f"Signed quotation {quote.quote_number}",
        author="Contractorz",
    )

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="quote_title",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#09355D"),
            spaceAfter=3,
        )
    )
    styles.add(
        ParagraphStyle(
            name="meta_right",
            parent=styles["BodyText"],
            alignment=TA_RIGHT,
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#475569"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="section_heading",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#09355D"),
            spaceBefore=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="body",
            parent=styles["BodyText"],
            fontSize=9.5,
            leading=14,
            textColor=colors.HexColor("#334155"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="signed_label",
            parent=styles["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=15,
            textColor=colors.HexColor("#047857"),
        )
    )

    service = quote.service
    business = service.business
    client = service.client.user
    signed_at = quote.signed_at.strftime("%B %d, %Y at %I:%M %p %Z")
    price = f"${service.price:,.2f} {service.currency}"

    story = []
    header = Table(
        [
            [
                Paragraph(_text(business.name), styles["quote_title"]),
                Paragraph(
                    f"<b>QUOTATION</b><br/>{quote.quote_number}<br/>"
                    f"Status: SIGNED",
                    styles["meta_right"],
                ),
            ]
        ],
        colWidths=[4.8 * inch, 2.0 * inch],
    )
    header.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LINEBELOW", (0, 0), (-1, -1), 2, colors.HexColor("#FF7A00")),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
            ]
        )
    )
    story.extend([header, Spacer(1, 18)])

    details = [
        ["CLIENT", "SERVICE"],
        [
            Paragraph(
                f"<b>{_text(client.name)}</b><br/>"
                f"{_text(client.email)}<br/>{_text(client.phone)}",
                styles["body"],
            ),
            Paragraph(
                f"<b>{_text(service.service_name)}</b><br/>"
                f"{_text(_address(service))}<br/>{price}",
                styles["body"],
            ),
        ],
    ]
    detail_table = Table(details, colWidths=[3.4 * inch, 3.4 * inch])
    detail_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#64748B")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 8),
                ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#CBD5E1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E2E8F0")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ]
        )
    )
    story.extend([detail_table, Spacer(1, 18)])

    if service.description:
        story.append(_section("Service description", service.description, styles))
    story.append(
        _section(
            "General terms and conditions",
            strip_tags(quote.general_terms_conditions or "No general terms provided."),
            styles,
        )
    )
    story.append(
        _section(
            "Additional terms and conditions",
            quote.terms_conditions or "No additional terms provided.",
            styles,
        )
    )
    if quote.notes:
        story.append(_section("Notes", quote.notes, styles))

    story.extend(
        [
            Spacer(1, 4),
            Paragraph("SIGNED AND ACCEPTED", styles["signed_label"]),
            Paragraph(
                f"Signed by {_text(client.name)} on {signed_at}", styles["body"]
            ),
            Spacer(1, 8),
        ]
    )

    if quote.signature:
        quote.signature.open("rb")
        signature_data = BytesIO(quote.signature.read())
        quote.signature.close()
        signature = Image(signature_data)
        signature._restrictSize(3.2 * inch, 1.25 * inch)
        signature.hAlign = "LEFT"
        story.extend([signature, Spacer(1, 4)])

    story.append(
        Paragraph(
            "This document is a finalized copy of the electronically signed "
            "quotation stored by Contractorz.",
            styles["body"],
        )
    )

    document.build(story)
    output.seek(0)
    return output
