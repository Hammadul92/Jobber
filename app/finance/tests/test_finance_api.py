"""Tests for invoice payment and payout workflows."""

from datetime import date, timedelta
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from django.test import TestCase

from core.models import (
    BankingInformation,
    Business,
    Client,
    Invoice,
    Payout,
    Service,
)


def create_business(owner, **params):
    """Create and return a sample business."""
    defaults = {
        "name": "Finance Business",
        "slug": "finance-business",
        "phone": "1234567890",
        "email": "finance@example.com",
        "business_description": "Finance test business",
        "street_address": "123 Finance Street",
        "city": "Calgary",
        "country": "CA",
        "province_state": "AB",
        "postal_code": "T2T2T2",
        "business_number": "123456789",
        "tax_rate": Decimal("5.00"),
    }
    defaults.update(params)
    business = Business.objects.create(owner=owner, **defaults)
    business.services_offered.add("Flooring")
    return business


class InvoicePaymentWorkflowTests(TestCase):
    """Test payment blocking, payout creation, and refund regressions."""

    def setUp(self):
        self.client = APIClient()
        self.manager = get_user_model().objects.create_user(
            "finance-manager@example.com",
            "test123",
            role="MANAGER",
        )
        self.client_user = get_user_model().objects.create_user(
            "finance-client@example.com",
            "test123",
            role="CLIENT",
        )
        self.business = create_business(owner=self.manager)
        self.client_record = Client.objects.create(
            business=self.business,
            user=self.client_user,
        )
        self.service = Service.objects.create(
            client=self.client_record,
            business=self.business,
            service_name="Flooring",
            description="Install new flooring",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7),
            service_type="ONE_TIME",
            price=Decimal("100.00"),
            currency="CAD",
            status="ACTIVE",
            street_address="123 Finance Street",
            city="Calgary",
            country="CA",
            province_state="AB",
            postal_code="T2T2T2",
            filled_questionnaire={"Room size": "Large"},
        )
        self.invoice = Invoice.objects.create(
            business=self.business,
            client=self.client_record,
            service=self.service,
            due_date=date.today() + timedelta(days=2),
            status="SENT",
            currency="CAD",
            subtotal=Decimal("100.00"),
            tax_rate=Decimal("5.00"),
            tax_amount=Decimal("5.00"),
            total_amount=Decimal("105.00"),
        )

    def make_payment_url(self):
        return reverse("finance:invoice-make-payment", args=[self.invoice.id])

    def refund_url(self, payout):
        return reverse("finance:payout-refund-payout", args=[payout.id])

    def add_client_payment_method(self):
        return BankingInformation.objects.create(
            client=self.client_record,
            payment_method_type="CARD",
            stripe_customer_id="cus_test",
            stripe_payment_method_id="pm_test",
        )

    def add_business_bank_account(self):
        return BankingInformation.objects.create(
            business=self.business,
            payment_method_type="BANK_ACCOUNT",
            stripe_connected_account_id="acct_test",
        )

    def test_payment_blocked_when_client_has_no_payment_method(self):
        """Test invoice payment fails clearly without client payment method."""
        self.add_business_bank_account()
        self.client.force_authenticate(self.client_user)

        res = self.client.post(self.make_payment_url())

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            res.data["error"],
            "Client does not have an active payment method.",
        )
        self.assertFalse(Payout.objects.filter(invoice=self.invoice).exists())

    def test_payment_blocked_when_business_has_no_connected_bank_account(self):
        """Test invoice payment fails clearly without business Stripe account."""
        self.add_client_payment_method()
        self.client.force_authenticate(self.client_user)

        res = self.client.post(self.make_payment_url())

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            res.data["error"],
            "Business does not have a connected Stripe account.",
        )
        self.assertFalse(Payout.objects.filter(invoice=self.invoice).exists())

    @patch("finance.views.stripe.PaymentIntent.create")
    def test_successful_payment_creates_exactly_one_payout(
        self,
        mock_payment_intent_create,
    ):
        """Test successful payment marks invoice paid and records one payout."""
        self.add_client_payment_method()
        self.add_business_bank_account()
        mock_payment_intent_create.return_value = SimpleNamespace(id="pi_success")
        self.client.force_authenticate(self.client_user)

        res = self.client.post(self.make_payment_url())

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, "PAID")
        self.assertIsNotNone(self.invoice.paid_at)
        self.assertEqual(Payout.objects.filter(invoice=self.invoice).count(), 1)

        payout = Payout.objects.get(invoice=self.invoice)
        self.assertEqual(payout.status, "PAID")
        self.assertEqual(payout.amount, self.invoice.total_amount)
        self.assertEqual(payout.stripe_payment_intent_id, "pi_success")

    @patch("finance.views.stripe.PaymentIntent.create")
    def test_repaying_already_paid_invoice_is_blocked(
        self,
        mock_payment_intent_create,
    ):
        """Test paying the same invoice twice is rejected safely."""
        self.add_client_payment_method()
        self.add_business_bank_account()
        mock_payment_intent_create.return_value = SimpleNamespace(id="pi_success")
        self.client.force_authenticate(self.client_user)

        first_res = self.client.post(self.make_payment_url())
        second_res = self.client.post(self.make_payment_url())

        self.assertEqual(first_res.status_code, status.HTTP_200_OK)
        self.assertEqual(second_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(second_res.data["detail"], "Invoice already paid.")
        self.assertEqual(Payout.objects.filter(invoice=self.invoice).count(), 1)
        self.assertEqual(mock_payment_intent_create.call_count, 1)

    @patch("finance.views.stripe.Refund.create")
    def test_payout_refund_succeeds_once_and_duplicate_refund_is_rejected(
        self,
        mock_refund_create,
    ):
        """Test payout refunds are idempotent from the API perspective."""
        payout = Payout.objects.create(
            business=self.business,
            invoice=self.invoice,
            amount=self.invoice.total_amount,
            currency=self.invoice.currency,
            status="PAID",
            stripe_payment_intent_id="pi_success",
            processed_at=timezone.now(),
        )
        mock_refund_create.return_value = SimpleNamespace(id="re_success")
        self.client.force_authenticate(self.manager)

        first_res = self.client.post(
            self.refund_url(payout),
            {"reason": "Customer requested refund"},
            format="json",
        )
        second_res = self.client.post(
            self.refund_url(payout),
            {"reason": "Duplicate refund"},
            format="json",
        )

        self.assertEqual(first_res.status_code, status.HTTP_200_OK)
        self.assertEqual(second_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            second_res.data["error"],
            "This payout has already been refunded.",
        )
        self.assertEqual(mock_refund_create.call_count, 1)

        payout.refresh_from_db()
        self.assertTrue(payout.is_refunded)
        self.assertEqual(payout.status, "REFUNDED")
        self.assertEqual(payout.stripe_refund_id, "re_success")
