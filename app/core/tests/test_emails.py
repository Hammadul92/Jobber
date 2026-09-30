"""Tests for the shared branded email layout."""

from django.contrib.staticfiles import finders
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, override_settings

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
        self.assertEqual(email.alternatives[0][1], "text/html")

        html = email.alternatives[0][0]
        self.assertIn("#09355d", html)
        self.assertIn("#ff7a00", html)
        self.assertIn("Your service status changed.", html)
        self.assertIn("View Service", html)
        self.assertIn("If the button does not work, open this link:", html)
        self.assertIn(
            ">https://getcontractorz.com/user/business/service/1</a>",
            html,
        )
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
            brand_name="InsoLogics",
            brand_logo=business_logo,
        )

        html = mail.outbox[0].alternatives[0][0]
        self.assertIn("InsoLogics", html)
        self.assertIn('alt="GetContractorz logo"', html)
        self.assertIn('alt="InsoLogics logo"', html)
        self.assertIn("cid:contractorz-mark", html)
        self.assertIn("cid:business-logo", html)
        self.assertEqual(len(mail.outbox[0].attachments), 2)
