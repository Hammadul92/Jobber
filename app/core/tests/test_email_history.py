"""Email snapshots, tenant isolation, and email token expiry."""
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from core.emails import send_branded_email
from core.models import Business, BusinessEmail
from user.utils import (
    generate_magic_login_token, verify_magic_login_token,
    generate_password_reset_token, verify_password_reset_token,
)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class EmailHistoryTests(TestCase):
    def setUp(self):
        self.owner = get_user_model().objects.create_user("owner@example.com", "password", role="MANAGER")
        self.other = get_user_model().objects.create_user("other@example.com", "password", role="MANAGER")
        self.business = Business.objects.create(owner=self.owner, name="Example Business")
        self.api = APIClient()
        self.api.force_authenticate(self.owner)
        self.options = dict(
            business=self.business, subject="Quote Q-1", text_body="Review https://example.com/?token=secret",
            recipient_list=["client@example.com"], eyebrow="Quote", heading="Review quote",
            paragraphs=["Hello client"], action_url="https://example.com/?token=secret",
        )

    def test_snapshot_matches_sent_message_and_each_resend_is_retained(self):
        send_branded_email(**self.options)
        send_branded_email(**self.options)
        self.assertEqual(BusinessEmail.objects.count(), 2)
        record = BusinessEmail.objects.first()
        sent = mail.outbox[-1]
        self.assertEqual(record.text_body, sent.body)
        self.assertEqual(record.html_body, sent.alternatives[0][0])
        self.assertEqual(record.from_email, sent.from_email)
        self.assertEqual(record.recipients, sent.to)
        self.assertEqual(record.reply_to, sent.reply_to)
        self.assertEqual(record.action_url, self.options["action_url"])
        self.assertEqual(record.status, "SENT")
        self.assertIsNotNone(record.sent_at)

    def test_failed_and_zero_sends_are_not_marked_sent(self):
        with patch("core.emails.EmailMultiAlternatives.send", side_effect=RuntimeError("failure")):
            with self.assertRaises(RuntimeError):
                send_branded_email(**self.options)
        with patch("core.emails.EmailMultiAlternatives.send", return_value=0):
            with self.assertRaises(RuntimeError):
                send_branded_email(**self.options)
        self.assertEqual(BusinessEmail.objects.filter(status="FAILED", sent_at=None).count(), 2)

    def test_platform_account_emails_are_not_shared_with_business(self):
        options = {key: value for key, value in self.options.items() if key != "business"}
        send_branded_email(**options)
        self.assertFalse(BusinessEmail.objects.exists())

    def test_owner_can_list_and_read_but_cannot_modify_history(self):
        send_branded_email(**self.options)
        record = BusinessEmail.objects.get()
        url = reverse("operations:businessemail-list")
        response = self.api.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertNotIn("text_body", response.data["results"][0])
        self.assertNotIn("action_url", response.data["results"][0])
        detail = reverse("operations:businessemail-detail", args=[record.pk])
        response = self.api.get(detail)
        self.assertEqual(response.data["action_url"], self.options["action_url"])
        self.assertEqual(response["Cache-Control"], "no-store")
        self.assertEqual(self.api.patch(detail, {"subject": "changed"}).status_code, 405)
        self.assertEqual(self.api.delete(detail).status_code, 405)
        self.assertEqual(self.api.post(url, {}).status_code, 405)

    def test_other_owner_client_employee_and_anonymous_cannot_read_history(self):
        send_branded_email(**self.options)
        record = BusinessEmail.objects.get()
        url = reverse("operations:businessemail-list")
        detail = reverse("operations:businessemail-detail", args=[record.pk])
        for role in ["MANAGER", "CLIENT", "EMPLOYEE"]:
            self.other.role = role
            self.other.save()
            self.api.force_authenticate(self.other)
            response = self.api.get(url, {"business": self.business.pk})
            self.assertEqual(response.data["count"], 0)
            self.assertEqual(self.api.get(detail).status_code, 404)
        self.api.force_authenticate(None)
        self.assertEqual(self.api.get(url).status_code, 401)

    def test_email_tokens_work_after_one_hour_and_expire_after_one_day(self):
        for generate, verify in [
            (generate_magic_login_token, verify_magic_login_token),
            (generate_password_reset_token, verify_password_reset_token),
        ]:
            with self.subTest(generate=generate.__name__):
                with patch("django.core.signing.time.time", return_value=100000):
                    token = generate(self.owner)
                with patch("django.core.signing.time.time", return_value=100000 + 3601):
                    self.assertEqual(verify(token), self.owner)
                with patch("django.core.signing.time.time", return_value=100000 + 86400):
                    self.assertEqual(verify(token), self.owner)
                with patch("django.core.signing.time.time", return_value=100000 + 86401):
                    self.assertIsNone(verify(token))
                self.assertIsNone(verify(token + "tampered"))
