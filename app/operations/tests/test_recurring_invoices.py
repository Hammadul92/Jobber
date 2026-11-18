"""Tests for auto-generated subscription invoices."""
from datetime import date
from decimal import Decimal
from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.db import IntegrityError, transaction
from django.test import TestCase

from core.models import Client, Invoice, Quote, Service
from operations.recurring_invoices import (
    billing_period_for,
    create_auto_invoice_for_service,
    generate_due_subscription_invoices,
)
from operations.tests.test_operations_api import create_business


class BillingPeriodTests(TestCase):
    """Billing periods are anchored on the service start date."""

    def service(self, start, end=None, cycle="MONTHLY"):
        return Service(start_date=start, end_date=end, billing_cycle=cycle)

    def test_monthly_periods(self):
        service = self.service(date(2026, 1, 15))
        self.assertEqual(
            billing_period_for(service, date(2026, 1, 15)),
            (date(2026, 1, 15), date(2026, 2, 14)),
        )
        self.assertEqual(
            billing_period_for(service, date(2026, 2, 14)),
            (date(2026, 1, 15), date(2026, 2, 14)),
        )
        self.assertEqual(
            billing_period_for(service, date(2026, 3, 20)),
            (date(2026, 3, 15), date(2026, 4, 14)),
        )

    def test_month_end_start_clamps_without_drifting(self):
        service = self.service(date(2026, 1, 31))
        self.assertEqual(
            billing_period_for(service, date(2026, 2, 28)),
            (date(2026, 2, 28), date(2026, 3, 30)),
        )
        self.assertEqual(
            billing_period_for(service, date(2026, 3, 31)),
            (date(2026, 3, 31), date(2026, 4, 29)),
        )

    def test_yearly_periods(self):
        service = self.service(date(2026, 3, 1), cycle="YEARLY")
        self.assertEqual(
            billing_period_for(service, date(2027, 2, 28)),
            (date(2026, 3, 1), date(2027, 2, 28)),
        )
        self.assertEqual(
            billing_period_for(service, date(2027, 3, 1)),
            (date(2027, 3, 1), date(2028, 2, 29)),
        )

    def test_before_start_is_first_period_and_after_end_is_none(self):
        service = self.service(date(2026, 5, 10), end=date(2026, 6, 20))
        self.assertEqual(
            billing_period_for(service, date(2026, 4, 1)),
            (date(2026, 5, 10), date(2026, 6, 9)),
        )
        self.assertEqual(
            billing_period_for(service, date(2026, 6, 15)),
            (date(2026, 6, 10), date(2026, 6, 20)),
        )
        self.assertIsNone(billing_period_for(service, date(2026, 7, 15)))


class SubscriptionInvoiceTests(TestCase):
    """Subscriptions get one draft invoice per billing period."""

    def setUp(self):
        owner = get_user_model().objects.create_user(
            "owner@example.com", "test123", role="MANAGER",
        )
        client_user = get_user_model().objects.create_user(
            "client@example.com", "test123", role="CLIENT",
        )
        self.business = create_business(owner=owner, slug="recurring-business")
        client = Client.objects.create(business=self.business, user=client_user)
        self.service = Service.objects.create(
            client=client,
            business=self.business,
            service_name="Lawn care",
            items=[{"title": "Weekly mowing", "description": "", "price": "80.00"}],
            start_date=date(2026, 1, 15),
            service_type="SUBSCRIPTION",
            billing_cycle="MONTHLY",
            price=Decimal("80.00"),
            status="ACTIVE",
            street_address="1 Test St",
            city="Calgary",
            province_state="AB",
            postal_code="T2T2T2",
            bypass_questionnaire=True,
            auto_generate_invoices=True,
        )
        Quote.objects.create(
            service=self.service,
            payment_terms="NET_15",
            valid_until=date(2026, 1, 20),
            terms_conditions="Terms",
            status="SIGNED",
        )

    def test_creates_one_invoice_per_period(self):
        first = create_auto_invoice_for_service(self.service, date(2026, 1, 15))
        self.assertEqual(first.billing_period_start, date(2026, 1, 15))
        self.assertEqual(first.status, "DRAFT")
        self.assertIn("Jan 15, 2026 – Feb 14, 2026", first.notes)

        # Same period again: nothing new.
        self.assertIsNone(create_auto_invoice_for_service(self.service, date(2026, 2, 10)))

        second = create_auto_invoice_for_service(self.service, date(2026, 2, 15))
        self.assertEqual(second.billing_period_start, date(2026, 2, 15))
        self.assertEqual(Invoice.objects.filter(service=self.service).count(), 2)

    def test_job_skips_trashed_period_and_ineligible_services(self):
        invoice = create_auto_invoice_for_service(self.service, date(2026, 3, 16))
        invoice.soft_delete()
        self.assertEqual(generate_due_subscription_invoices(date(2026, 3, 20)), [])

        self.service.status = "COMPLETED"
        self.service.save()
        self.assertEqual(generate_due_subscription_invoices(date(2026, 4, 20)), [])

    def test_stops_after_end_date(self):
        self.service.end_date = date(2026, 2, 1)
        self.service.save()
        self.assertIsNone(create_auto_invoice_for_service(self.service, date(2026, 2, 20)))

    def test_one_time_service_still_gets_a_single_invoice(self):
        self.service.service_type = "ONE_TIME"
        self.service.save()
        self.assertIsNotNone(create_auto_invoice_for_service(self.service, date(2026, 1, 15)))
        self.assertIsNone(create_auto_invoice_for_service(self.service, date(2026, 3, 15)))
        self.assertIsNone(Invoice.objects.get(service=self.service).billing_period_start)

    def test_database_rejects_duplicate_period(self):
        create_auto_invoice_for_service(self.service, date(2026, 1, 15))
        duplicate = Invoice.objects.get(service=self.service)
        duplicate.pk = None
        duplicate.invoice_number = None
        with self.assertRaises(IntegrityError), transaction.atomic():
            duplicate.save()

    def test_command_runs_once(self):
        out = StringIO()
        call_command("generate_recurring_invoices", stdout=out)
        self.assertIn("Created 1 recurring invoice(s).", out.getvalue())
        self.assertEqual(Invoice.objects.filter(service=self.service).count(), 1)
