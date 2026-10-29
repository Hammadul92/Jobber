"""Regression tests for signed quotation PDF business details."""

from decimal import Decimal
from io import BytesIO
from types import SimpleNamespace
from unittest.mock import patch

from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, override_settings
from django.utils import timezone
from PIL import Image, ImageDraw
from reportlab.platypus import Paragraph

from operations.emails import send_signed_quote_copy_email
from operations.pdf import build_signed_quote_pdf, _signature_image
from operations.pdf_content import parse_pdf_content


class SignedQuotePdfTests(SimpleTestCase):
    def setUp(self):
        image = BytesIO()
        Image.new("RGB", (100, 30), "black").save(image, format="PNG")
        self.business = SimpleNamespace(
            name="Northstar Services Inc.", logo=None,
            street_address="700 Business Avenue, Suite 12", city="Edmonton",
            province_state="AB", country="CA", postal_code="T5J 1N3",
            phone="+1 780-555-0123", email="office@example.test",
        )
        self.service = SimpleNamespace(
            business=self.business,
            client=SimpleNamespace(
                name="Example Client", phone="+1 403-555-0145",
                company_name="Example Construction Ltd.",
                billing_street_address="45 Billing Road", billing_city="Calgary",
                billing_province_state="AB", billing_country="CA",
                billing_postal_code="T2P 9Z9",
                user=SimpleNamespace(
                    name="Example Client", email="client@example.test",
                    phone="+1 403-555-0145",
                ),
            ),
            service_name="Flooring", price=Decimal("2300.00"), currency="CAD",
            street_address="123 Client Street", city="Calgary",
            province_state="AB", country="CA", postal_code="T2P 1J9",
            description="Install agreed flooring materials.",
        )
        self.quote = SimpleNamespace(
            id=42, quote_number="Q-TEST-042", service=self.service,
            signed_at=timezone.now(),
            signature=SimpleUploadedFile(
                "signature.png", image.getvalue(), content_type="image/png",
            ),
            general_terms_conditions="Original agreed general terms.",
            terms_conditions="Additional agreed terms.", notes="Agreed notes.",
        )

    def render(self, action=None):
        rendered = []

        def capture_paragraph(text, style, **kwargs):
            paragraph = Paragraph(text, style, **kwargs)
            rendered.append(paragraph.getPlainText())
            return paragraph

        with patch("operations.pdf.Paragraph", side_effect=capture_paragraph):
            pdf = (action or (lambda: build_signed_quote_pdf(self.quote)))()
        return pdf, "\n".join(rendered)

    def test_pdf_includes_registered_business_contact_details(self):
        pdf, text = self.render()

        self.assertTrue(pdf.getvalue().startswith(b"%PDF"))
        self.assertIn(self.business.name, text)
        self.assertIn(
            "Address: 700 Business Avenue, Suite 12, Edmonton, AB, CA, T5J 1N3",
            text,
        )
        self.assertIn("Phone: +1 780-555-0123", text)
        self.assertIn("Email: office@example.test", text)
        self.assertIn("123 Client Street, Calgary, AB, CA, T2P 1J9", text)
        self.assertIn("Example Construction Ltd.", text)
        self.assertIn("Billing address: 45 Billing Road, Calgary, AB, CA, T2P 9Z9", text)
        self.assertIn("client@example.test", text)
        self.assertIn("Original agreed general terms.", text)
        self.assertIn("SIGNED AND ACCEPTED", text)
        self.assertIn(b"/Subtype /Image", pdf.getvalue())

    def test_pdf_shows_agreed_payment_terms(self):
        self.quote.payment_terms = "NET_30"
        self.quote.get_payment_terms_display = lambda: "Net 30 days"
        _, text = self.render()
        self.assertIn("Payment terms: Net 30 days", text)

    def test_no_items_uses_service_as_single_priced_line(self):
        self.service.items = []
        self.quote.line_items = None
        _, text = self.render()
        self.assertIn("Flooring", text)
        self.assertIn("Install agreed flooring materials.", text)
        self.assertIn("$2,300.00 CAD", text)
        self.assertIn("QUOTED TOTAL", text)

    def test_signed_pdf_displays_saved_tax_and_total(self):
        self.quote.tax_rate = Decimal("5.00")
        self.quote.tax_label = "GST"
        self.service.billing_cycle = "MONTHLY"
        _, text = self.render()
        self.assertIn("SUBTOTAL", text)
        self.assertIn("GST (5.00%)", text)
        self.assertIn("$115.00 CAD", text)
        self.assertIn("$2,415.00 CAD", text)
        self.assertIn("QUOTED TOTAL / MONTH", text)

    def test_one_explicit_item_uses_item_description_and_price(self):
        self.service.items = [{"title": "Snow plowing", "description": "Parking lot", "price": "125.00"}]
        self.quote.line_items = list(self.service.items)
        _, text = self.render()
        self.assertIn("Snow plowing", text)
        self.assertIn("Parking lot", text)
        self.assertIn("$125.00 CAD", text)
        self.assertNotIn("$2,300.00 CAD", text)

    def test_multiple_items_keep_separate_prices_and_total(self):
        self.quote.line_items = [
            {"title": "Snow plowing", "description": "Parking lot", "price": "125.00"},
            {"title": "Walkways", "description": "Sidewalk clearing", "price": "45.00"},
            {"title": "Snow hauling", "description": "Remove piles", "price": "80.00"},
        ]
        _, text = self.render()
        for title, amount in (("Snow plowing", "125.00"), ("Walkways", "45.00"), ("Snow hauling", "80.00")):
            self.assertIn(title, text)
            self.assertIn(f"${amount} CAD", text)
        self.assertIn("$250.00 CAD", text)

    def test_missing_business_details_have_readable_fallbacks(self):
        for field in (
            "street_address", "city", "province_state", "country",
            "postal_code", "phone", "email",
        ):
            setattr(self.business, field, None)

        pdf, text = self.render()

        self.assertTrue(pdf.getvalue().startswith(b"%PDF"))
        self.assertIn("Address: -", text)
        self.assertIn("Phone: -", text)
        self.assertIn("Email: -", text)
        self.assertNotIn("None", text)

    def test_legacy_client_without_billing_address_has_readable_fallback(self):
        client = self.service.client
        client.company_name = ""
        for field in (
            "billing_street_address", "billing_city", "billing_province_state",
            "billing_country", "billing_postal_code",
        ):
            setattr(client, field, "")

        pdf, text = self.render()

        self.assertTrue(pdf.getvalue().startswith(b"%PDF"))
        self.assertIn("Billing address: -", text)
        self.assertIn("Service address: 123 Client Street", text)
        self.assertNotIn("Example Construction Ltd.", text)

    def test_long_business_details_and_markup_characters_render(self):
        self.business.name = "Northstar & Sons <Services>"
        self.business.street_address = "Suite <West> & Yard, " + "Business Avenue " * 12
        self.business.city = "Long City Name " * 6

        pdf, text = self.render()

        self.assertTrue(pdf.getvalue().startswith(b"%PDF"))
        self.assertIn(self.business.name, text)
        self.assertIn(self.business.street_address, text)
        self.assertIn("Phone: +1 780-555-0123", text)
        self.assertIn("Email: office@example.test", text)

    def test_rich_terms_keep_headings_paragraphs_and_quill_lists_separate(self):
        self.quote.general_terms_conditions = (
            "<h2>Scope of work</h2><p>First paragraph.</p>"
            "<p><strong>Second paragraph.</strong></p>"
            '<ol><li data-list="ordered">First requirement.</li>'
            '<li data-list="bullet">Second requirement.</li></ol>'
        )

        pdf, text = self.render()

        self.assertTrue(pdf.getvalue().startswith(b"%PDF"))
        self.assertIn("Scope of work\nFirst paragraph.\nSecond paragraph.", text)
        self.assertIn("First requirement.\nSecond requirement.", text)
        self.assertNotIn("paragraph.Second", text)

    def test_plain_text_line_breaks_are_preserved(self):
        self.quote.terms_conditions = "First condition.\nSecond condition.\n\nFinal condition."

        _, text = self.render()

        self.assertIn("First condition.\nSecond condition.\nFinal condition.", text)

    def test_lengthy_terms_flow_without_losing_the_signature_section(self):
        self.quote.general_terms_conditions = (
            "<h2>Detailed service agreement</h2>"
            + "<p>Scope, materials, scheduling and access remain as agreed.</p>" * 150
            + "<p>Final agreement condition.</p>"
        )

        pdf, text = self.render()

        self.assertTrue(pdf.getvalue().startswith(b"%PDF"))
        self.assertIn("Final agreement condition.", text)
        self.assertIn("SIGNED AND ACCEPTED", text)
        self.assertIn(b"/Subtype /Image", pdf.getvalue())

    def test_terms_links_and_special_characters_render_safely(self):
        self.quote.general_terms_conditions = (
            '<p>Materials &amp; access: <a href="https://example.test/terms?a=1&amp;b=2">'
            "Reference terms</a>.</p><script>Do not display this.</script>"
        )

        _, text = self.render()

        self.assertIn("Materials & access: Reference terms.", text)
        self.assertNotIn("Do not display this.", text)

    def test_ordered_bulleted_and_nested_lists_keep_their_markers(self):
        blocks = parse_pdf_content(
            '<ol><li data-list="ordered">First</li><li data-list="ordered">Second</li>'
            '<li data-list="bullet" class="ql-indent-1">Nested bullet</li></ol>'
        )

        self.assertEqual([block["bullet"] for block in blocks], ["1.", "2.", "-"])
        self.assertEqual(blocks[2]["indent"], 1)
        deeply_nested = parse_pdf_content("<ul>" * 20 + "<li>Nested</li>" + "</ul>" * 20)
        self.assertEqual(deeply_nested[0]["indent"], 8)

    def test_invalid_link_keeps_text_without_breaking_pdf_generation(self):
        self.quote.general_terms_conditions = (
            '<p><a href="https://[invalid">Visible reference text</a></p>'
        )

        _, text = self.render()

        self.assertIn("Visible reference text", text)

    def test_one_long_paragraph_can_split_across_pages(self):
        self.quote.general_terms_conditions = "<p>" + "Agreed service condition. " * 1000 + "</p>"

        pdf, text = self.render()

        self.assertTrue(pdf.getvalue().startswith(b"%PDF"))
        self.assertIn("SIGNED AND ACCEPTED", text)

    def test_signature_is_framed_without_the_blank_canvas_margins(self):
        image = Image.new("RGBA", (600, 450), (255, 255, 255, 0))
        ImageDraw.Draw(image).line([(220, 200), (245, 180), (280, 210)], fill="black", width=3)
        data = BytesIO()
        image.save(data, format="PNG")
        self.quote.signature = SimpleUploadedFile("signature.png", data.getvalue(), content_type="image/png")

        signature = _signature_image(self.quote)

        self.assertLess(signature.imageWidth, 100)
        self.assertLess(signature.imageHeight, 60)
        self.assertLessEqual(signature.drawWidth, 170)
        self.assertLessEqual(signature.drawHeight, 56)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_email_attachment_uses_pdf_with_business_details(self):
        _, text = self.render(lambda: send_signed_quote_copy_email(self.quote))

        self.assertIn("Address: 700 Business Avenue, Suite 12", text)
        self.assertIn("Phone: +1 780-555-0123", text)
        self.assertIn("Email: office@example.test", text)
        message = mail.outbox[0]
        attachment = next(
            part for part in message.message().walk()
            if part.get_content_type() == "application/pdf"
        )
        self.assertTrue(attachment.get_payload(decode=True).startswith(b"%PDF"))
        self.assertEqual(attachment.get_filename(), "Q-TEST-042-signed.pdf")
