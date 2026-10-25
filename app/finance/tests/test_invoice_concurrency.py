"""Concurrent invoice payment safety against the real test database."""

from concurrent.futures import ThreadPoolExecutor
from datetime import date
from threading import Barrier
from time import sleep
from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import close_old_connections, connection
from django.test import TransactionTestCase, skipUnlessDBFeature
from django.urls import reverse
from rest_framework.test import APIClient
import stripe

from core.models import BankingInformation, Client, Invoice, Payout
from finance.tests.test_finance_api import create_business


class ConcurrentInvoicePaymentTests(TransactionTestCase):
    @skipUnlessDBFeature("has_select_for_update")
    @patch("finance.views.emails.send_invoice_paid_email")
    @patch("finance.views.stripe.PaymentIntent.create")
    @patch("finance.views.stripe.PaymentMethod.create")
    @patch("finance.views.stripe.Account.retrieve")
    def test_simultaneous_payment_requests_create_one_charge(self, account, clone, create, email):
        manager = get_user_model().objects.create_user("concurrent-owner@example.com", "test123", role="MANAGER")
        user = get_user_model().objects.create_user("concurrent-client@example.com", "test123", role="CLIENT")
        business = create_business(manager)
        client_record = Client.objects.create(business=business, user=user)
        invoice = Invoice.objects.create(
            business=business, client=client_record, due_date=date.today(),
            status="SENT", subtotal="100.00", tax_rate="5.00",
            tax_amount="5.00", total_amount="105.00", currency="CAD",
        )
        BankingInformation.objects.create(
            client=client_record, payment_method_type="CARD",
            stripe_customer_id="cus_concurrent", stripe_payment_method_id="pm_concurrent",
        )
        BankingInformation.objects.create(
            business=business, payment_method_type="BANK_ACCOUNT", stripe_connected_account_id="acct_concurrent",
        )
        account.return_value = stripe.StripeObject.construct_from({
            "charges_enabled": True, "payouts_enabled": True,
            "controller": {"losses": {"payments": "stripe"}},
        }, "sk_test_placeholder")
        clone.return_value = SimpleNamespace(id="pm_cloned")

        def create_intent(**kwargs):
            sleep(0.1)
            return SimpleNamespace(id="pi_concurrent", status="succeeded")

        create.side_effect = create_intent
        ready = Barrier(2)
        url = reverse("finance:invoice-make-payment", args=[invoice.pk])

        def pay():
            close_old_connections()
            try:
                with connection.cursor() as cursor:
                    cursor.execute("SET statement_timeout = '10s'")
                api = APIClient()
                api.force_authenticate(user)
                ready.wait(timeout=5)
                return api.post(url).status_code
            finally:
                connection.close()

        with ThreadPoolExecutor(max_workers=2) as pool:
            responses = list(pool.map(lambda _: pay(), range(2)))

        self.assertEqual(sorted(responses), [200, 400])
        create.assert_called_once()
        clone.assert_called_once()
        email.assert_called_once()
        self.assertEqual(Payout.objects.filter(invoice=invoice).count(), 1)
        invoice.refresh_from_db()
        self.assertEqual(invoice.status, "PAID")
