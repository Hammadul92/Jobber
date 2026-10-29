"""Tests for the shared branded email layout."""

from base64 import b64decode

from django.conf import settings
from django.contrib.staticfiles import finders
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, override_settings
from sendgrid_backend.mail import SendgridBackend

from core.emails import send_branded_email


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class BrandedEmailTests(SimpleTestCase):
    """Test HTML branding without requiring database access."""

    def test_email_has_plain_text_html_cta_and_inline_brand_mark(self):
        send_branded_email(
            subject="Service status updated",
            text_body="Your service is now active.",
            recipient_list=["client@example.com"],
            eyebrow="Service update",
            heading="Your service status changed.",
            paragraphs=["Hello Client,", "Your service is ready to move forward."],
            details=[
                {"label": "Previous status", "value": "Pending"},
                {"label": "New status", "value": "Active"},
            ],
            action_label="View Service",
            action_url="https://getcontractorz.com/user/business/service/1",
        )

        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]
        self.assertEqual(email.body, "Your service is now active.")
        self.assertEqual(email.to, ["client@example.com"])
        self.assertEqual(
            email.from_email,
            f"GetContractorz Support <{settings.DEFAULT_FROM_EMAIL}>",
        )
        self.assertEqual(email.reply_to, [])
        self.assertEqual(email.alternatives[0][1], "text/html")

        html = email.alternatives[0][0]
        self.assertIn("#09355d", html)
        self.assertIn("#ff7a00", html)
        self.assertIn("Your service status changed.", html)
        self.assertIn("View Service", html)
        self.assertNotIn("If the button does not work, open this link:", html)
        self.assertNotIn(
            ">https://getcontractorz.com/user/business/service/1</a>",
            html,
        )
        self.assertIn('href="https://getcontractorz.com/user/business/service/1"', html)
        self.assertIn("cid:contractorz-mark", html)
        self.assertEqual(len(email.attachments), 1)
        self.assertEqual(email.attachments[0]["Content-ID"], "<contractorz-mark>")

    def test_business_brand_replaces_default_header_identity(self):
        logo_path = finders.find("public_site/images/favicon.png")
        with open(logo_path, "rb") as logo_file:
            business_logo = SimpleUploadedFile(
                "business-logo.png",
                logo_file.read(),
                content_type="image/png",
            )

        send_branded_email(
            subject="New job",
            text_body="A job was assigned.",
            recipient_list=["employee@example.com"],
            eyebrow="Job assignment",
            heading="A new job is ready.",
            paragraphs=["Hello Employee,"],
            reply_to=["office@insologics.example"],
            brand_name="InsoLogics",
            brand_logo=business_logo,
        )

        html = mail.outbox[0].alternatives[0][0]
        self.assertEqual(
            mail.outbox[0].from_email,
            f"InsoLogics Support <{settings.DEFAULT_FROM_EMAIL}>",
        )
        self.assertEqual(mail.outbox[0].reply_to, ["office@insologics.example"])
        sendgrid_payload = SendgridBackend(api_key="SG.test-key")._build_sg_mail(
            mail.outbox[0]
        )
        self.assertEqual(sendgrid_payload["from"], {
            "email": settings.DEFAULT_FROM_EMAIL,
            "name": "InsoLogics Support",
        })
        self.assertEqual(sendgrid_payload["reply_to"]["email"], "office@insologics.example")
        self.assertIn("InsoLogics", html)
        self.assertIn('alt="GetContractorz logo"', html)
        self.assertIn('alt="InsoLogics logo"', html)
        self.assertIn("cid:contractorz-mark", html)
        self.assertIn("cid:business-logo", html)
        self.assertEqual(len(mail.outbox[0].attachments), 2)

    def test_email_supports_pdf_attachments_with_inline_branding(self):
        pdf_content = b"%PDF-1.4\nTest attachment\n%%EOF"
        logo_path = finders.find("public_site/images/favicon.png")
        with open(logo_path, "rb") as logo_file:
            business_logo = SimpleUploadedFile(
                "business-logo.png", logo_file.read(), content_type="image/png",
            )
        send_branded_email(
            subject="Your signed quote",
            text_body="Your signed quote is attached.",
            recipient_list=["client@example.com"],
            eyebrow="Signed quote",
            heading="Your signed quote, for your records.",
            paragraphs=["Your signed quote is attached."],
            brand_name="Test Business",
            brand_logo=business_logo,
            attachments=[("Q-123-signed.pdf", pdf_content, "application/pdf")],
        )

        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0].message()
        self.assertEqual(message.get_content_type(), "multipart/mixed")
        pdf_parts = [
            part for part in message.walk()
            if part.get_content_type() == "application/pdf"
        ]
        self.assertEqual(len(pdf_parts), 1)
        self.assertEqual(pdf_parts[0].get_filename(), "Q-123-signed.pdf")
        self.assertEqual(pdf_parts[0].get_content_disposition(), "attachment")
        self.assertEqual(pdf_parts[0].get_payload(decode=True), pdf_content)
        self.assertTrue(any(
            part.get("Content-ID") == "<contractorz-mark>"
            and part.get_content_disposition() == "inline"
            for part in message.walk()
        ))

        payload = SendgridBackend(api_key="SG.test-key")._build_sg_mail(mail.outbox[0])
        attachments = {item["filename"]: item for item in payload["attachments"]}
        pdf_attachment = attachments["Q-123-signed.pdf"]
        self.assertEqual(pdf_attachment["type"], "application/pdf")
        self.assertEqual(b64decode(pdf_attachment["content"]), pdf_content)
        self.assertEqual(attachments["getcontractorz-logo.png"]["disposition"], "inline")
        self.assertEqual(attachments["business-logo.png"]["disposition"], "inline")

    def test_unicode_business_name_and_reply_to_reach_sendgrid(self):
        send_branded_email(
            subject="Business update",
            text_body="An update is ready.",
            recipient_list=["client@example.com"],
            eyebrow="Update",
            heading="An update is ready.",
            paragraphs=["An update is ready."],
            reply_to=["owner@cafe.example"],
            brand_name="Café & Sons, Ltd.",
        )

        payload = SendgridBackend(api_key="SG.test-key")._build_sg_mail(
            mail.outbox[0]
        )
        self.assertEqual(payload["from"]["name"], "Café & Sons, Ltd. Support")
        self.assertEqual(payload["from"]["email"], settings.DEFAULT_FROM_EMAIL)
        self.assertEqual(payload["reply_to"]["email"], "owner@cafe.example")
