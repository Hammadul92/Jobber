"""Payment terms stay aligned across quotes, invoices, and delivery."""

from datetime import date, datetime, timedelta, timezone as datetime_timezone
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from core.models import Business, Client, Invoice, Quote, Service, ServiceTermsTemplate
from core.payment_terms import due_date_for_terms, prepare_first_send
from finance.emails import send_invoice_email
from operations.emails import send_quote_email
from operations.serializers import QuoteSerializer
from operations.views import create_auto_invoice_for_service, create_auto_quote_for_service


class PaymentTermDateTests(SimpleTestCase):
    def test_all_terms_use_business_local_calendar_date(self):
        business = SimpleNamespace(timezone="America/Edmonton")
        instant = datetime(2026, 10, 27, 1, 0, tzinfo=datetime_timezone.utc)
        self.assertEqual(due_date_for_terms("UPFRONT", business, instant), date(2026, 10, 26))
        self.assertEqual(due_date_for_terms("NET_15", business, instant), date(2026, 11, 10))
        self.assertEqual(due_date_for_terms("NET_30", business, instant), date(2026, 11, 25))

    def test_calendar_days_cross_month_and_daylight_saving(self):
        business = SimpleNamespace(timezone="America/Edmonton")
        instant = datetime(2026, 10, 31, 22, 0, tzinfo=datetime_timezone.utc)
        self.assertEqual(due_date_for_terms("NET_15", business, instant), date(2026, 11, 15))


class PaymentTermWorkflowTests(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.owner = get_user_model().objects.create_user(
            "terms-owner@example.com", "test123", role="MANAGER",
        )
        self.customer = get_user_model().objects.create_user(
            "terms-customer@example.com", "test123", role="CLIENT",
        )
        self.business = Business.objects.create(
            owner=self.owner, name="Terms Business", slug="terms-business",
            email="terms@example.com", phone="1234567890",
            business_description="Payment terms tests", street_address="1 Main Street",
            city="Edmonton", province_state="AB", country="CA",
            postal_code="T5J1N3", business_number="123456789",
            tax_rate=Decimal("5.00"), timezone="America/Edmonton",
        )
        self.customer_record = Client.objects.create(business=self.business, user=self.customer)
        self.service = Service.objects.create(
            business=self.business, client=self.customer_record,
            service_name="Flooring", description="Install flooring",
            start_date=date.today(), end_date=date.today() + timedelta(days=7),
            service_type="ONE_TIME", price=Decimal("100.00"), currency="CAD",
            status="ACTIVE", street_address="1 Main Street", city="Edmonton",
            province_state="AB", country="CA", postal_code="T5J1N3",
            filled_questionnaire={"room": "large"}, auto_generate_invoices=True,
        )
        self.api.force_authenticate(self.owner)

    def invoice(self, terms="NET_15", due_date=None):
        return Invoice.objects.create(
            business=self.business, client=self.customer_record, service=self.service,
            payment_terms=terms, due_date=due_date, subtotal=Decimal("100.00"),
            tax_rate=Decimal("5.00"), tax_amount=Decimal("5.00"),
            total_amount=Decimal("105.00"), currency="CAD",
        )

    @patch("finance.views.emails.send_invoice_email")
    def test_first_send_sets_due_date_and_resend_preserves_it(self, send_email):
        invoice = self.invoice("NET_15")
        url = reverse("finance:invoice-send-invoice", args=[invoice.pk])
        with patch("core.payment_terms.timezone.now", return_value=datetime(
            2026, 10, 27, 1, 0, tzinfo=datetime_timezone.utc,
        )):
            response = self.api.post(url)
        self.assertEqual(response.status_code, 200)
        invoice.refresh_from_db()
        self.assertEqual(invoice.status, "SENT")
        self.assertEqual(invoice.due_date, date(2026, 11, 10))
        first_sent_at = invoice.sent_at
        self.api.post(url)
        invoice.refresh_from_db()
        self.assertEqual(invoice.sent_at, first_sent_at)
        self.assertEqual(invoice.due_date, date(2026, 11, 10))
        self.assertEqual(send_email.call_count, 2)

    @patch("finance.views.emails.send_invoice_email")
    def test_status_update_send_uses_same_due_date_rule(self, send_email):
        invoice = self.invoice("UPFRONT")
        url = reverse("finance:invoice-detail", args=[invoice.pk])
        with patch("core.payment_terms.timezone.now", return_value=datetime(
            2026, 10, 27, 1, 0, tzinfo=datetime_timezone.utc,
        )):
            response = self.api.patch(url, {"status": "SENT"}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        invoice.refresh_from_db()
        self.assertEqual(invoice.due_date, date(2026, 10, 26))
        self.assertIsNotNone(invoice.sent_at)
        send_email.assert_called_once()

    @patch("finance.views.logger.exception")
    @patch("finance.views.emails.send_invoice_email", side_effect=RuntimeError("send failed"))
    def test_failed_send_does_not_set_due_date_or_sent_at(self, send_email, logger):
        invoice = self.invoice("NET_30")
        response = self.api.post(reverse("finance:invoice-send-invoice", args=[invoice.pk]))
        self.assertEqual(response.status_code, 503)
        invoice.refresh_from_db()
        self.assertEqual(invoice.status, "DRAFT")
        self.assertIsNone(invoice.due_date)
        self.assertIsNone(invoice.sent_at)

    @patch("finance.views.logger.exception")
    @patch("finance.views.emails.send_invoice_email", side_effect=RuntimeError("send failed"))
    def test_failed_status_update_rolls_back_first_send(self, send_email, logger):
        invoice = self.invoice("NET_15")
        response = self.api.patch(
            reverse("finance:invoice-detail", args=[invoice.pk]),
            {"status": "SENT"}, format="json",
        )
        self.assertEqual(response.status_code, 503)
        invoice.refresh_from_db()
        self.assertEqual(invoice.status, "DRAFT")
        self.assertIsNone(invoice.due_date)
        self.assertIsNone(invoice.sent_at)

    @patch("finance.views.emails.send_invoice_email")
    def test_legacy_invoice_keeps_its_original_due_date(self, send_email):
        original_date = date(2026, 12, 1)
        invoice = self.invoice(None, original_date)
        response = self.api.post(reverse("finance:invoice-send-invoice", args=[invoice.pk]))
        self.assertEqual(response.status_code, 200)
        invoice.refresh_from_db()
        self.assertEqual(invoice.due_date, original_date)
        self.assertIsNone(invoice.sent_at)

    def test_new_invoice_requires_terms_and_accepts_optional_due_date(self):
        payload = {
            "business": self.business.pk, "client": self.customer_record.pk,
            "service": self.service.pk, "subtotal": "100.00", "tax_rate": "5.00",
            "tax_amount": "5.00", "total_amount": "105.00", "currency": "CAD",
        }
        url = reverse("finance:invoice-list")
        missing = self.api.post(url, payload, format="json")
        self.assertEqual(missing.status_code, 400)
        self.assertIn("payment_terms", missing.data)
        created = self.api.post(url, {**payload, "payment_terms": "NET_30"}, format="json")
        self.assertEqual(created.status_code, 201, created.data)
        self.assertIsNone(created.data["due_date"])
        custom_date = self.api.post(url, {
            **payload, "payment_terms": "NET_15", "due_date": "2026-12-01",
        }, format="json")
        self.assertEqual(custom_date.status_code, 201, custom_date.data)
        self.assertEqual(custom_date.data["due_date"], "2026-12-01")

    def test_signed_quote_terms_are_inherited_and_cannot_be_overridden(self):
        quote = Quote.objects.create(
            service=self.service, valid_until=date.today() + timedelta(days=5),
            status="SIGNED", payment_terms="NET_30", tax_rate=Decimal("5.00"),
        )
        payload = {
            "business": self.business.pk, "client": self.customer_record.pk,
            "service": self.service.pk, "subtotal": "100.00", "tax_rate": "5.00",
            "tax_amount": "5.00", "total_amount": "105.00", "currency": "CAD",
        }
        url = reverse("finance:invoice-list")
        mismatch = self.api.post(url, {**payload, "payment_terms": "NET_15"}, format="json")
        self.assertEqual(mismatch.status_code, 400)
        self.assertIn("payment_terms", mismatch.data)
        created = self.api.post(url, payload, format="json")
        self.assertEqual(created.status_code, 201, created.data)
        self.assertEqual(created.data["payment_terms"], quote.payment_terms)

    def test_automatic_invoice_copies_signed_quote_terms(self):
        Quote.objects.create(
            service=self.service, valid_until=date.today() + timedelta(days=5),
            status="SIGNED", payment_terms="UPFRONT", tax_rate=Decimal("5.00"),
        )
        invoice = create_auto_invoice_for_service(self.service)
        self.assertEqual(invoice.payment_terms, "UPFRONT")
        self.assertIsNone(invoice.due_date)

    def test_automatic_quote_uses_business_default(self):
        self.business.default_payment_terms = "NET_30"
        self.business.save(update_fields=["default_payment_terms"])
        self.business.services_offered.add("Flooring")
        ServiceTermsTemplate.objects.create(
            business=self.business, service_name="Flooring", content="General terms.",
        )
        self.service.auto_generate_quote = True
        self.service.save(update_fields=["auto_generate_quote"])
        create_auto_quote_for_service(self.service)
        quote = Quote.objects.get(service=self.service)
        self.assertEqual(quote.payment_terms, "NET_30")

    def test_terms_are_immutable_but_draft_due_date_can_be_edited(self):
        invoice = self.invoice("NET_15")
        url = reverse("finance:invoice-detail", args=[invoice.pk])
        response = self.api.patch(url, {"payment_terms": "NET_30"}, format="json")
        self.assertEqual(response.status_code, 400)
        response = self.api.patch(url, {"due_date": "2026-12-01"}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        invoice.refresh_from_db()
        self.assertEqual(invoice.due_date, date(2026, 12, 1))

    @patch("finance.views.emails.send_invoice_email")
    def test_manual_due_date_survives_first_send_and_locks(self, send_email):
        invoice = self.invoice("NET_15", date(2026, 12, 1))
        response = self.api.post(reverse("finance:invoice-send-invoice", args=[invoice.pk]))
        self.assertEqual(response.status_code, 200)
        invoice.refresh_from_db()
        self.assertEqual(invoice.due_date, date(2026, 12, 1))
        self.assertIsNotNone(invoice.sent_at)
        response = self.api.patch(
            reverse("finance:invoice-detail", args=[invoice.pk]),
            {"due_date": "2026-12-02"}, format="json",
        )
        self.assertEqual(response.status_code, 400)

    @patch("finance.views.emails.send_invoice_email")
    def test_past_manual_due_date_blocks_sending(self, send_email):
        invoice = self.invoice("NET_30", date(2020, 1, 1))
        response = self.api.post(reverse("finance:invoice-send-invoice", args=[invoice.pk]))
        self.assertEqual(response.status_code, 400)
        invoice.refresh_from_db()
        self.assertEqual(invoice.status, "DRAFT")
        self.assertIsNone(invoice.sent_at)
        send_email.assert_not_called()

    def test_paid_and_cancelled_invoice_dates_are_locked(self):
        for status in ("PAID", "CANCELLED"):
            with self.subTest(status=status):
                invoice = self.invoice("NET_15")
                invoice.status = status
                invoice.save(update_fields=["status"])
                response = self.api.patch(
                    reverse("finance:invoice-detail", args=[invoice.pk]),
                    {"due_date": "2026-12-01"}, format="json",
                )
                self.assertEqual(response.status_code, 400)

    @patch("finance.emails.send_branded_email")
    def test_invoice_email_contains_terms_and_fixed_due_date(self, send_email):
        invoice = self.invoice("NET_30", date(2026, 12, 1))
        send_invoice_email(invoice)
        self.assertIn("Payment Terms: Net 30 days", send_email.call_args.kwargs["text_body"])
        self.assertIn("Due Date: 2026-12-01", send_email.call_args.kwargs["text_body"])

    @patch("operations.emails.send_branded_email")
    def test_quote_email_contains_agreed_terms(self, send_email):
        quote = Quote.objects.create(
            service=self.service, valid_until=date.today() + timedelta(days=5),
            payment_terms="UPFRONT", tax_rate=Decimal("5.00"),
        )
        send_quote_email(quote)
        self.assertIn("Payment Terms: Due on Receipt", send_email.call_args.kwargs["text_body"])

    def test_quote_requires_valid_terms_and_old_draft_cannot_be_sent(self):
        for value in (None, "INVALID"):
            data = {"service": self.service.pk, "valid_until": date.today() + timedelta(days=5)}
            if value is not None:
                data["payment_terms"] = value
            serializer = QuoteSerializer(data=data)
            self.assertFalse(serializer.is_valid())
            self.assertIn("payment_terms", serializer.errors)
        old_quote = Quote.objects.create(
            service=self.service, valid_until=date.today() + timedelta(days=5),
        )
        response = self.api.post(reverse("operations:quote-send-quote", args=[old_quote.pk]))
        self.assertEqual(response.status_code, 400)
        self.assertIn("payment_terms", response.data)

    def test_preparing_an_already_sent_invoice_does_not_restart_terms(self):
        invoice = self.invoice("NET_15")
        prepare_first_send(invoice)
        original = (invoice.sent_at, invoice.due_date)
        self.assertFalse(prepare_first_send(invoice, datetime(
            2030, 1, 1, tzinfo=datetime_timezone.utc,
        )))
        self.assertEqual((invoice.sent_at, invoice.due_date), original)
