from django.core.mail import send_mail
from django.conf import settings
from django.test import TestCase


class SendGridEmailTest(TestCase):
    def test_sendgrid_email(self):
        result = send_mail(
            subject="SendGrid Test",
            message="This is a test email from SendGrid integration.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=["test@example.com"],
            fail_silently=False,
        )
        self.assertEqual(result, 1)
