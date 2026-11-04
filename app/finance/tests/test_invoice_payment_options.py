"""Invoice payment options (payment link vs e-Transfer) and payment confirmations."""

from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import Client, Invoice, Payout, Service
from finance.pdf import build_invoice_pdf
from finance.tests.test_finance_api import create_business


class InvoicePaymentOptionTests(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.manager = get_user_model().objects.create_user(
            "options-manager@example.com", "test123", role="MANAGER",
        )
        self.client_user = get_user_model().objects.create_user(
            "options-client@example.com", "test123", role="CLIENT",
        )
        self.business = create_business(owner=self.manager, etransfer_email="pay@example.com")
        self.client_record = Client.objects.create(
            business=self.business, user=self.client_user, name="Casey Client",
        )
        self.service = Service.objects.create(
            client=self.client_record, business=self.business, service_name="Flooring",
            start_date=date.today(), service_type="ONE_TIME", price=Decimal("100.00"),
            currency="CAD", status="ACTIVE", street_address="1 Main St", city="Calgary",
            country="CA", province_state="AB", postal_code="T2T2T2",
        )
        self.invoice = Invoice.objects.create(
            business=self.business, client=self.client_record, service=self.service,
            due_date=date.today() + timedelta(days=5), status="DRAFT", currency="CAD",
            subtotal=Decimal("100.00"), tax_rate=Decimal("5.00"),
            tax_amount=Decimal("5.00"), total_amount=Decimal("105.00"),
        )
        self.api.force_authenticate(self.manager)

    def send(self, **body):
        return self.api.post(
            reverse("finance:invoice-send-invoice", args=[self.invoice.pk]), body, format="json",
        )

    def confirm(self):
        return self.api.post(
            reverse("finance:invoice-send-payment-confirmation", args=[self.invoice.pk]),
        )

    def test_etransfer_send_has_instructions_pdf_and_no_payment_link(self):
        response = self.send(payment_option="ETRANSFER")
        self.assertEqual(response.status_code, 200)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.payment_option, "ETRANSFER")
        self.assertEqual(self.invoice.status, "SENT")
        message = mail.outbox[0]
        self.assertIn("pay@example.com", message.body)
        self.assertNotIn("?token=", message.body)
        html = message.alternatives[0][0]
        self.assertNotIn("View and Pay", html)
        self.assertIn("pay@example.com", html)
        name, content, mimetype = message.attachments[0]
        self.assertEqual(name, f"{self.invoice.invoice_number}.pdf")
        self.assertEqual(mimetype, "application/pdf")
        self.assertTrue(content.startswith(b"%PDF"))

    def test_payment_link_send_keeps_pay_button_and_attaches_pdf(self):
        response = self.send(payment_option="PAYMENT_LINK")
        self.assertEqual(response.status_code, 200)
        message = mail.outbox[0]
        self.assertIn("?token=", message.body)
        self.assertIn("View and Pay", message.alternatives[0][0])
        self.assertTrue(message.attachments[0][1].startswith(b"%PDF"))

    def test_etransfer_requires_business_etransfer_email(self):
        self.business.etransfer_email = ""
        self.business.save(update_fields=["etransfer_email"])
        response = self.send(payment_option="ETRANSFER")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(len(mail.outbox), 0)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, "DRAFT")

    def test_unknown_payment_option_is_rejected(self):
        self.assertEqual(self.send(payment_option="CASH").status_code, 400)
        self.assertEqual(len(mail.outbox), 0)

    def test_non_string_payment_option_is_rejected(self):
        self.assertEqual(self.send(payment_option=["ETRANSFER"]).status_code, 400)
        self.assertEqual(len(mail.outbox), 0)

    def test_confirmation_after_refund_does_not_claim_paid_in_full(self):
        self.invoice.status = "PAID"
        self.invoice.paid_at = timezone.now()
        self.invoice.save()
        Payout.objects.create(
            business=self.business, invoice=self.invoice, amount=Decimal("105.00"),
            currency="CAD", status="PARTIALLY_REFUNDED", refunded_amount=Decimal("40.00"),
        )
        self.assertEqual(self.confirm().status_code, 200)
        body = mail.outbox[0].body
        self.assertNotIn("paid in full", body)
        self.assertIn("Refunded: $40.00 CAD", body)

    def test_resend_without_option_keeps_previous_choice(self):
        self.send(payment_option="ETRANSFER")
        self.assertEqual(self.send().status_code, 200)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.payment_option, "ETRANSFER")
        self.assertNotIn("?token=", mail.outbox[1].body)

    def test_client_cannot_pay_etransfer_invoice_online(self):
        self.send(payment_option="ETRANSFER")
        self.api.force_authenticate(self.client_user)
        response = self.api.post(reverse("finance:invoice-make-payment", args=[self.invoice.pk]))
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Payout.all_objects.filter(invoice=self.invoice).exists())

    def test_payment_confirmation_requires_paid_invoice(self):
        self.assertEqual(self.confirm().status_code, 400)
        self.assertEqual(len(mail.outbox), 0)

    def test_payment_confirmation_emails_paid_pdf_and_records_time(self):
        self.invoice.status = "PAID"
        self.invoice.payment_option = "ETRANSFER"
        self.invoice.paid_at = timezone.now()
        self.invoice.save()
        response = self.confirm()
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.data["payment_confirmation_sent_at"])
        message = mail.outbox[0]
        self.assertEqual(message.to, [self.client_user.email])
        self.assertIn("Payment received", message.subject)
        self.assertIn("Interac e-Transfer", message.body)
        self.assertIn("Balance Due: $0.00 CAD", message.body)
        name, content, _ = message.attachments[0]
        self.assertEqual(name, f"{self.invoice.invoice_number}-paid.pdf")
        self.assertTrue(content.startswith(b"%PDF"))

    def test_mark_unpaid_clears_confirmation(self):
        self.invoice.status = "PAID"
        self.invoice.sent_at = timezone.now()
        self.invoice.paid_at = timezone.now()
        self.invoice.payment_confirmation_sent_at = timezone.now()
        self.invoice.save()
        response = self.api.post(reverse("finance:invoice-mark-unpaid", args=[self.invoice.pk]))
        self.assertEqual(response.status_code, 200)
        self.invoice.refresh_from_db()
        self.assertIsNone(self.invoice.payment_confirmation_sent_at)

    def test_client_cannot_send_payment_confirmation(self):
        self.invoice.status = "PAID"
        self.invoice.save(update_fields=["status"])
        self.api.force_authenticate(self.client_user)
        self.assertEqual(self.confirm().status_code, 403)

    @patch("finance.views.emails.send_payment_confirmation_email", side_effect=RuntimeError("down"))
    def test_failed_confirmation_is_not_recorded(self, _send):
        self.invoice.status = "PAID"
        self.invoice.save(update_fields=["status"])
        self.assertEqual(self.confirm().status_code, 503)
        self.invoice.refresh_from_db()
        self.assertIsNone(self.invoice.payment_confirmation_sent_at)

    def test_pdf_builds_with_notes_and_line_items(self):
        self.invoice.notes = "Thanks <for> & your business"
        self.invoice.line_items = [
            {"title": "Labour", "description": "Install", "price": "60.00"},
            {"title": "Materials", "description": "", "price": "40.00"},
        ]
        for status_value in ("SENT", "PAID"):
            self.invoice.status = status_value
            self.invoice.paid_at = timezone.now() if status_value == "PAID" else None
            with self.subTest(status=status_value), build_invoice_pdf(self.invoice) as pdf:
                self.assertTrue(pdf.read().startswith(b"%PDF"))

    def test_business_can_save_etransfer_email(self):
        response = self.api.patch(
            reverse("operations:business-detail", args=[self.business.pk]),
            {"etransfer_email": "new-pay@example.com"}, format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.business.refresh_from_db()
        self.assertEqual(self.business.etransfer_email, "new-pay@example.com")
