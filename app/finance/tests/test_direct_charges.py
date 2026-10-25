"""Account scope and Managed Risk onboarding regressions."""

from types import SimpleNamespace
from unittest.mock import patch

from django.test import SimpleTestCase, override_settings
from django.urls import reverse
from rest_framework import status
import stripe

from core.models import BankingInformation, Payout
from finance.stripe_connect import create_merchant_account, create_onboarding_link
from finance.tests import test_finance_api as workflows
from finance.serializers import BankingInformationSerializer


@override_settings(STRIPE_SECRET_KEY="sk_test_placeholder", FRONTEND_URL="https://example.com")
class ManagedRiskRequestTests(SimpleTestCase):
    def test_connection_states_do_not_treat_an_empty_record_as_a_previous_account(self):
        cases = [
            ({}, "not_connected"),
            ({"stripe_connected_account_id": "acct_old"}, "reconnect_required"),
            ({"stripe_connected_account_id": "acct_new", "stripe_connect_v2": True}, "onboarding"),
            ({"stripe_connected_account_id": "acct_new", "stripe_connect_v2": True,
              "stripe_charges_enabled": True, "stripe_payouts_enabled": True}, "connected"),
        ]
        for attributes, expected in cases:
            with self.subTest(expected=expected):
                bank = BankingInformation(**attributes)
                self.assertEqual(BankingInformationSerializer(bank).data["stripe_connection_status"], expected)

    @patch("finance.stripe_connect.connect_client")
    def test_creates_full_dashboard_merchant_with_stripe_responsibility(self, client):
        business = SimpleNamespace(id=12, email="owner@example.com", name="Example", country="ca")
        create_merchant_account(business, SimpleNamespace(pk=34))
        args = client.return_value.v2.core.accounts.create.call_args
        params = args.args[0]
        self.assertEqual(params["dashboard"], "full")
        self.assertNotIn("type", params)
        self.assertEqual(params["identity"], {"country": "CA"})
        self.assertEqual(params["defaults"]["responsibilities"], {
            "fees_collector": "stripe", "losses_collector": "stripe",
        })
        self.assertTrue(params["configuration"]["merchant"]["capabilities"]["card_payments"]["requested"])
        self.assertEqual(args.kwargs["options"]["idempotency_key"], "merchant-bank-34")

    @patch("finance.stripe_connect.connect_client")
    def test_v2_onboarding_links_use_merchant_account(self, client):
        create_onboarding_link("acct_merchant")
        params = client.return_value.v2.core.account_links.create.call_args.args[0]
        self.assertEqual(params["account"], "acct_merchant")
        self.assertEqual(params["use_case"]["type"], "account_onboarding")
        self.assertEqual(params["use_case"]["account_onboarding"]["return_url"], "https://example.com/user/banking")


class DirectChargeTests(workflows.InvoicePaymentWorkflowTests):
    @patch("finance.views.create_merchant_account")
    def test_stripe_timeout_returns_a_retryable_error_without_duplicate_records(self, create):
        create.side_effect = stripe.APIConnectionError("Connection timed out")
        self.client.force_authenticate(self.manager)
        url = reverse("finance:bankinginformation-add-bank-account")
        for _ in range(2):
            response = self.client.post(url)
            self.assertEqual(response.status_code, 503)
            self.assertIn("Please try connecting again", response.data["detail"])
        self.assertEqual(BankingInformation.objects.filter(business=self.business).count(), 1)

    def direct_payout(self):
        return Payout.objects.create(
            business=self.business, invoice=self.invoice, amount=self.invoice.total_amount,
            currency="CAD", status="PAID", stripe_payment_intent_id="pi_direct",
            stripe_account_id="acct_original",
        )

    @patch("finance.views.stripe.Refund.retrieve")
    @patch("finance.views.stripe.Refund.create")
    def test_pending_refund_is_checked_without_creating_another(self, create, retrieve):
        payout = self.direct_payout()
        create.return_value = SimpleNamespace(id="re_pending", status="pending", amount=10500)
        retrieve.return_value = SimpleNamespace(id="re_pending", status="succeeded", amount=10500)
        self.client.force_authenticate(self.manager)
        url = self.refund_url(payout)
        self.assertEqual(self.client.post(url).status_code, 202)
        payout.refresh_from_db()
        self.assertFalse(payout.is_refunded)
        self.assertEqual(self.client.post(url).status_code, 200)
        create.assert_called_once()
        retrieve.assert_called_once_with("re_pending", stripe_account="acct_original")
        payout.refresh_from_db()
        self.assertTrue(payout.is_refunded)

    @patch("finance.views.stripe.Refund.create")
    def test_invalid_refund_amounts_never_call_stripe(self, create):
        payout = self.direct_payout()
        self.client.force_authenticate(self.manager)
        for amount in ("-1", "0", "105.01", "1.001", "NaN", "invalid"):
            with self.subTest(amount=amount):
                response = self.client.post(self.refund_url(payout), {"amount": amount})
                self.assertEqual(response.status_code, 400)
        create.assert_not_called()

    def test_payment_ledger_cannot_be_created_or_edited_by_api(self):
        payout = self.direct_payout()
        self.client.force_authenticate(self.manager)
        url = reverse("finance:payout-detail", args=[payout.pk])
        self.assertEqual(self.client.patch(url, {"status": "FAILED"}).status_code, 405)
        self.assertEqual(self.client.post(reverse("finance:payout-list"), {}).status_code, 405)

    @patch("finance.views.stripe.PaymentIntent.create")
    def test_unready_merchant_cannot_be_charged(self, create):
        self.add_client_payment_method()
        self.add_business_bank_account()
        self.mock_account.return_value.charges_enabled = False
        self.client.force_authenticate(self.client_user)
        response = self.client.post(self.make_payment_url())
        self.assertEqual(response.status_code, 400)
        create.assert_not_called()
        self.mock_clone.assert_not_called()

    @patch("finance.views.stripe.PaymentIntent.create")
    def test_platform_loss_liability_is_not_silently_used(self, create):
        self.add_client_payment_method()
        self.add_business_bank_account()
        self.mock_account.return_value.controller.losses.payments = "application"
        self.client.force_authenticate(self.client_user)
        self.assertEqual(self.client.post(self.make_payment_url()).status_code, 400)
        create.assert_not_called()

    @patch("finance.views.stripe.PaymentIntent.create")
    def test_processing_payment_is_not_marked_paid(self, create):
        self.add_client_payment_method()
        self.add_business_bank_account()
        create.return_value = SimpleNamespace(id="pi_pending", status="processing")
        self.client.force_authenticate(self.client_user)
        self.assertEqual(self.client.post(self.make_payment_url()).status_code, 409)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, "SENT")
        self.assertEqual(Payout.objects.get(invoice=self.invoice).status, "PENDING")

    @patch("finance.views.stripe.PaymentIntent.retrieve")
    @patch("finance.views.stripe.PaymentIntent.create")
    def test_retry_checks_pending_charge_without_charging_new_account(self, create, retrieve):
        self.add_client_payment_method()
        self.add_business_bank_account()
        payout = Payout.objects.create(
            business=self.business, invoice=self.invoice, amount=self.invoice.total_amount,
            currency="CAD", status="PENDING", stripe_payment_intent_id="pi_pending",
            stripe_account_id="acct_original",
        )
        retrieve.return_value = SimpleNamespace(id="pi_pending", status="succeeded")
        self.client.force_authenticate(self.client_user)
        self.assertEqual(self.client.post(self.make_payment_url()).status_code, 200)
        retrieve.assert_called_once_with("pi_pending", stripe_account="acct_original")
        create.assert_not_called()
        self.mock_clone.assert_not_called()
        payout.refresh_from_db()
        self.assertEqual(payout.status, "PAID")
        self.assertEqual(Payout.objects.filter(invoice=self.invoice).count(), 1)

    @patch("finance.views.stripe.PaymentIntent.create")
    def test_failed_clone_never_marks_invoice_paid(self, create):
        self.add_client_payment_method()
        self.add_business_bank_account()
        self.mock_clone.side_effect = stripe.InvalidRequestError("Invalid payment method", "payment_method")
        self.client.force_authenticate(self.client_user)
        self.assertEqual(self.client.post(self.make_payment_url()).status_code, 400)
        create.assert_not_called()
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, "SENT")
        self.assertEqual(Payout.objects.get(invoice=self.invoice).status, "FAILED")

    @patch("finance.views.stripe.Refund.create")
    def test_refund_uses_original_charge_account_after_business_reconnects(self, create):
        self.add_business_bank_account()
        payout = Payout.objects.create(
            business=self.business, invoice=self.invoice, amount=self.invoice.total_amount,
            currency="CAD", status="PAID", stripe_payment_intent_id="pi_direct",
            stripe_account_id="acct_original",
        )
        create.return_value = SimpleNamespace(id="re_direct", status="succeeded", amount=10500)
        self.client.force_authenticate(self.manager)
        self.assertEqual(self.client.post(self.refund_url(payout)).status_code, 200)
        self.assertEqual(create.call_args.kwargs["stripe_account"], "acct_original")

    @patch("finance.views.stripe.Refund.create")
    def test_legacy_refund_stays_on_platform(self, create):
        payout = Payout.objects.create(
            business=self.business, invoice=self.invoice, amount=self.invoice.total_amount,
            currency="CAD", status="PAID", stripe_payment_intent_id="pi_legacy",
        )
        create.return_value = SimpleNamespace(id="re_legacy", status="succeeded", amount=10500)
        self.client.force_authenticate(self.manager)
        self.assertEqual(self.client.post(self.refund_url(payout)).status_code, 200)
        self.assertNotIn("stripe_account", create.call_args.kwargs)

    @patch("finance.views.create_onboarding_link")
    @patch("finance.views.create_merchant_account")
    def test_onboarding_creates_v2_account_and_reuses_it(self, create, link):
        create.return_value = SimpleNamespace(id="acct_v2")
        link.return_value = SimpleNamespace(url="https://connect.stripe.com/test")
        self.client.force_authenticate(self.manager)
        url = reverse("finance:bankinginformation-add-bank-account")
        for _ in range(2):
            self.assertEqual(self.client.post(url).status_code, status.HTTP_200_OK)
        bank = BankingInformation.objects.get(business=self.business)
        self.assertTrue(bank.stripe_connect_v2)
        self.assertEqual(bank.stripe_connected_account_id, "acct_v2")
        create.assert_called_once()
        self.assertEqual(link.call_count, 2)

    @patch("finance.views.create_merchant_account")
    def test_legacy_connection_requires_explicit_reconnection(self, create):
        self.add_business_bank_account()
        self.client.force_authenticate(self.manager)
        url = reverse("finance:bankinginformation-add-bank-account")
        self.assertEqual(self.client.post(url).status_code, 409)
        create.assert_not_called()

    def test_sync_succeeds_when_full_dashboard_hides_bank_details(self):
        self.add_business_bank_account()
        self.client.force_authenticate(self.manager)
        url = reverse("finance:bankinginformation-check-bank-account")
        self.assertEqual(self.client.post(url).status_code, 200)
        bank = BankingInformation.objects.get(business=self.business)
        self.assertTrue(bank.stripe_charges_enabled)
        self.assertTrue(bank.stripe_payouts_enabled)

    def test_client_cannot_onboard_a_business(self):
        self.client.force_authenticate(self.client_user)
        url = reverse("finance:bankinginformation-add-bank-account")
        self.assertEqual(self.client.post(url).status_code, 403)
