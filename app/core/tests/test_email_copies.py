"""Admin reference copies of outgoing emails and email token expiry."""
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail, signing
from django.core.mail.backends.locmem import EmailBackend as LocmemBackend
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from core.emails import send_branded_email
from user.utils import (
    EMAIL_TOKEN_MAX_AGE,
    generate_magic_login_token, verify_magic_login_token,
    generate_password_reset_token, verify_password_reset_token,
)


class SendgridLikeBackend(LocmemBackend):
    """Writes delivery details into sent messages, as django-sendgrid-v5 does."""

    def send_messages(self, messages):
        for message in messages:
            assert "status" not in message.extra_headers, "copy reused the sent message's headers"
        sent = super().send_messages(messages)
        for message in messages:
            message.extra_headers["status"] = 202
            message.extra_headers["message_id"] = "sg-message-id"
        return sent


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    EMAIL_COPY_RECIPIENT="admin@example.com",
)
class EmailCopyTests(TestCase):
    def setUp(self):
        self.options = dict(
            subject="Quote Q-1", text_body="Review your quote",
            recipient_list=["client@example.com"], eyebrow="Quote", heading="Review quote",
            paragraphs=["Hello client"], attachments=[("quote.pdf", b"%PDF-1.4", "application/pdf")],
        )

    def test_sent_email_is_copied_to_admin(self):
        send_branded_email(**self.options)

        self.assertEqual(len(mail.outbox), 2)
        original, copy = mail.outbox
        self.assertEqual(original.to, ["client@example.com"])
        self.assertEqual(original.subject, "Quote Q-1")
        self.assertEqual(copy.to, ["admin@example.com"])
        self.assertEqual(copy.subject, "Quote Q-1 (copy)")
        self.assertIn("Copy of an email sent to: client@example.com", copy.body)
        self.assertIn("Copy of an email sent to client@example.com", copy.alternatives[0][0])
        self.assertNotIn("Copy of an email", original.alternatives[0][0])
        self.assertIn("quote.pdf", [item[0] for item in copy.attachments if isinstance(item, tuple)])

    @override_settings(EMAIL_BACKEND="core.tests.test_email_copies.SendgridLikeBackend")
    def test_copy_does_not_reuse_headers_written_by_the_backend(self):
        self.assertEqual(send_branded_email(**self.options), 1)

        self.assertEqual([message.to for message in mail.outbox], [["client@example.com"], ["admin@example.com"]])
        self.assertEqual(mail.outbox[1].extra_headers["message_id"], "sg-message-id")
        self.assertIsNot(mail.outbox[0].extra_headers, mail.outbox[1].extra_headers)

    def test_no_copy_when_admin_is_the_recipient_or_disabled(self):
        send_branded_email(**{**self.options, "recipient_list": ["Admin@example.com"]})
        self.assertEqual(len(mail.outbox), 1)

        with self.settings(EMAIL_COPY_RECIPIENT=""):
            send_branded_email(**self.options)
        self.assertEqual(len(mail.outbox), 2)

    def test_failed_send_is_not_copied(self):
        with patch("core.emails.EmailMultiAlternatives.send", return_value=0) as send:
            with self.assertRaises(RuntimeError):
                send_branded_email(**self.options)
        self.assertEqual(send.call_count, 1)

    def test_copy_failure_does_not_fail_original_send(self):
        with patch(
            "core.emails.EmailMultiAlternatives.send", side_effect=[1, RuntimeError("down")]
        ):
            self.assertEqual(send_branded_email(**self.options), 1)


class EmailTokenExpiryTests(TestCase):
    def setUp(self):
        self.owner = get_user_model().objects.create_user("owner@example.com", "password", role="MANAGER")

    def test_email_tokens_work_for_seven_days_then_expire(self):
        for generate, verify in [
            (generate_magic_login_token, verify_magic_login_token),
            (generate_password_reset_token, verify_password_reset_token),
        ]:
            with self.subTest(generate=generate.__name__):
                with patch("django.core.signing.time.time", return_value=100000):
                    token = generate(self.owner)
                with patch("django.core.signing.time.time", return_value=100000 + 86401):
                    self.assertEqual(verify(token), self.owner)
                with patch("django.core.signing.time.time", return_value=100000 + EMAIL_TOKEN_MAX_AGE):
                    self.assertEqual(verify(token), self.owner)
                with patch("django.core.signing.time.time", return_value=100000 + EMAIL_TOKEN_MAX_AGE + 1):
                    self.assertIsNone(verify(token))
                self.assertIsNone(verify(token + "tampered"))


class SingleUseLinkTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user("client@example.com", "password", role="CLIENT")
        self.api = APIClient()

    def test_login_link_works_once(self):
        token = generate_magic_login_token(self.user)
        url = reverse("user:magic-login")

        first = self.api.post(url, {"token": token})
        self.assertEqual(first.status_code, 200)
        self.assertEqual(self.api.post(url, {"token": token}).status_code, 400)

        other_link = generate_magic_login_token(self.user)
        self.assertEqual(self.api.post(url, {"token": other_link}).status_code, 200)

    def test_inactive_user_does_not_use_up_link(self):
        token = generate_magic_login_token(self.user)
        self.user.is_active = False
        self.user.save(update_fields=["is_active"])
        self.assertEqual(self.api.post(reverse("user:magic-login"), {"token": token}).status_code, 400)
        self.assertEqual(verify_magic_login_token(token), self.user)

    def test_password_reset_link_stops_working_after_reset(self):
        token = generate_password_reset_token(self.user)
        url = reverse("user:password-reset")

        first = self.api.post(url, {"token": token, "password": "newpassword123"})
        self.assertEqual(first.status_code, 200, first.data)
        second = self.api.post(url, {"token": token, "password": "otherpassword123"})
        self.assertEqual(second.status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newpassword123"))

    def test_links_sent_before_upgrade_keep_their_one_day_limit(self):
        with patch("django.core.signing.time.time", return_value=100000):
            legacy = signing.dumps({"user_id": self.user.id}, salt="magic-login")
        with patch("django.core.signing.time.time", return_value=100000 + 3600):
            self.assertEqual(verify_magic_login_token(legacy), self.user)
        with patch("django.core.signing.time.time", return_value=100000 + 86401):
            self.assertIsNone(verify_magic_login_token(legacy))
