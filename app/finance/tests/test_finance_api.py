"""Tests for invoice payment and payout workflows."""

from datetime import date, timedelta
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import patch
from urllib.parse import parse_qs, urlsplit

from django.contrib.auth import get_user_model
from django.core import mail
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from django.test import TestCase, override_settings
from finance.emails import send_invoice_email
from user.utils import generate_magic_login_token
import stripe

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
        account_patch = patch("finance.views.stripe.Account.retrieve")
        self.mock_account = account_patch.start()
        self.addCleanup(account_patch.stop)
        self.mock_account.return_value = stripe.StripeObject.construct_from({
            "id": "acct_test", "charges_enabled": True, "payouts_enabled": True,
            "controller": {"losses": {"payments": "stripe"}},
        }, "sk_test_placeholder")
        clone_patch = patch("finance.views.stripe.PaymentMethod.create")
        self.mock_clone = clone_patch.start()
        self.addCleanup(clone_patch.stop)
        self.mock_clone.return_value = SimpleNamespace(id="pm_cloned")
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

    def test_customer_can_view_invoices_for_all_their_business_relationships(self):
        other_manager = get_user_model().objects.create_user(
            "other-finance-manager@example.com", "test123", role="MANAGER",
        )
        other_business = create_business(other_manager, slug="other-business")
        other_client = Client.objects.create(business=other_business, user=self.client_user)
        other_invoice = Invoice.objects.create(
            business=other_business, client=other_client,
            due_date=date.today(), status="SENT", subtotal=10,
            tax_rate=0, tax_amount=0, total_amount=10,
        )
        self.client.force_authenticate(self.client_user)
        for invoice in (self.invoice, other_invoice):
            res = self.client.get(reverse("finance:invoice-detail", args=[invoice.pk]))
            self.assertEqual(res.status_code, status.HTTP_200_OK)
        listing = self.client.get(reverse("finance:invoice-list"), {"page": 1})
        self.assertEqual(
            {item["id"] for item in listing.data["results"]},
            {self.invoice.pk, other_invoice.pk},
        )

    def test_business_owner_invoice_list_excludes_their_customer_bills(self):
        self.client_user.role = "MANAGER"
        self.client_user.save(update_fields=["role"])
        own_business = create_business(self.client_user, slug="invoice-customer-business")
        own_client = Client.objects.create(business=own_business, user=self.manager)
        own_invoice = Invoice.objects.create(
            business=own_business, client=own_client, due_date=date.today(),
            status="SENT", subtotal=10, tax_rate=0, tax_amount=0, total_amount=10,
        )
        self.client.force_authenticate(self.client_user)

        listing = self.client.get(reverse("finance:invoice-list"), {"page": 1})

        self.assertEqual(listing.status_code, 200)
        self.assertEqual(
            {item["id"] for item in listing.data["results"]}, {own_invoice.pk},
        )
        self.assertEqual(
            self.client.get(reverse("finance:invoice-detail", args=[self.invoice.pk])).status_code,
            200,
        )

    def test_empty_payment_record_is_not_reported_as_a_saved_card(self):
        BankingInformation.objects.create(client=self.client_record, payment_method_type="CARD")
        self.client.force_authenticate(self.client_user)
        res = self.client.get(reverse("finance:invoice-detail", args=[self.invoice.pk]))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data["has_payment_method"])

    @patch("finance.views.stripe.PaymentIntent.create")
    def test_customer_can_use_their_saved_card_from_another_business_relationship(self, create):
        manager = get_user_model().objects.create_user("second-owner@example.com", "test123", role="MANAGER")
        business = create_business(manager, slug="second-business")
        client_record = Client.objects.create(business=business, user=self.client_user)
        BankingInformation.objects.create(
            client=client_record, payment_method_type="CARD",
            stripe_customer_id="cus_shared", stripe_payment_method_id="pm_shared",
        )
        self.add_business_bank_account()
        create.return_value = SimpleNamespace(id="pi_success", status="succeeded")
        self.client.force_authenticate(self.client_user)
        detail = self.client.get(reverse("finance:invoice-detail", args=[self.invoice.pk]))
        self.assertTrue(detail.data["has_payment_method"])
        self.assertEqual(self.client.post(self.make_payment_url()).status_code, 200)
        self.assertEqual(self.mock_clone.call_args.kwargs["payment_method"], "pm_shared")
        self.assertEqual(self.mock_clone.call_args.kwargs["customer"], "cus_shared")

    @patch("finance.views.stripe.PaymentIntent.create")
    def test_another_customers_card_is_never_used(self, create):
        other = get_user_model().objects.create_user("card-owner@example.com", "test123", role="CLIENT")
        other_client = Client.objects.create(business=self.business, user=other)
        BankingInformation.objects.create(
            client=other_client, payment_method_type="CARD",
            stripe_customer_id="cus_other", stripe_payment_method_id="pm_other",
        )
        self.add_business_bank_account()
        self.client.force_authenticate(self.client_user)
        detail = self.client.get(reverse("finance:invoice-detail", args=[self.invoice.pk]))
        self.assertFalse(detail.data["has_payment_method"])
        self.assertEqual(self.client.post(self.make_payment_url()).status_code, 400)
        create.assert_not_called()
        self.mock_clone.assert_not_called()

    def test_inactive_or_incomplete_cards_are_not_payable(self):
        card = self.add_client_payment_method()
        self.client.force_authenticate(self.client_user)
        for changes in (
            {"is_active": False},
            {"is_active": True, "stripe_customer_id": ""},
            {"stripe_customer_id": "cus_test", "stripe_payment_method_id": None},
        ):
            for field, value in changes.items():
                setattr(card, field, value)
            card.save(update_fields=list(changes))
            detail = self.client.get(reverse("finance:invoice-detail", args=[self.invoice.pk]))
            self.assertFalse(detail.data["has_payment_method"])

    def test_draft_and_deleted_invoices_are_not_visible_to_customers(self):
        self.client.force_authenticate(self.client_user)
        url = reverse("finance:invoice-detail", args=[self.invoice.pk])
        self.invoice.status = "DRAFT"
        self.invoice.save(update_fields=["status"])
        self.assertEqual(self.client.get(url).status_code, 404)
        self.invoice.status = "SENT"
        self.invoice.soft_delete(user=self.manager)
        self.assertEqual(self.client.get(url).status_code, 404)

    def test_customer_cannot_delete_invoice(self):
        self.client.force_authenticate(self.client_user)
        res = self.client.delete(reverse("finance:invoice-detail", args=[self.invoice.pk]))
        self.assertEqual(res.status_code, 403)
        self.assertTrue(Invoice.objects.filter(pk=self.invoice.pk).exists())

    @patch("finance.views.stripe.PaymentIntent.create")
    def test_non_positive_invoice_amount_is_not_charged(self, create):
        self.add_client_payment_method()
        self.add_business_bank_account()
        self.client.force_authenticate(self.client_user)
        for amount in (Decimal("0.00"), Decimal("-1.00")):
            self.invoice.total_amount = amount
            self.invoice.save(update_fields=["total_amount"])
            self.assertEqual(self.client.post(self.make_payment_url()).status_code, 400)
        create.assert_not_called()
        self.mock_clone.assert_not_called()

    @patch("finance.views.stripe.PaymentIntent.create")
    def test_payment_uses_valid_card_instead_of_earlier_incomplete_record(self, create):
        BankingInformation.objects.create(client=self.client_record, payment_method_type="CARD")
        self.add_client_payment_method()
        self.add_business_bank_account()
        create.return_value = SimpleNamespace(id="pi_success", status="succeeded")
        self.client.force_authenticate(self.client_user)
        self.assertEqual(self.client.post(self.make_payment_url()).status_code, 200)
        create.assert_called_once()

    @patch("finance.views.stripe.PaymentIntent.create")
    def test_customer_cannot_pay_cancelled_invoice(self, create):
        self.add_client_payment_method()
        self.add_business_bank_account()
        self.invoice.status = "CANCELLED"
        self.invoice.save(update_fields=["status"])
        self.client.force_authenticate(self.client_user)
        self.assertEqual(self.client.post(self.make_payment_url()).status_code, 400)
        create.assert_not_called()
        self.mock_clone.assert_not_called()

    @patch("finance.views.stripe.PaymentIntent.create")
    def test_business_owner_cannot_charge_customer_via_customer_pay_action(self, create):
        self.add_client_payment_method()
        self.add_business_bank_account()
        self.client.force_authenticate(self.manager)
        self.assertEqual(self.client.post(self.make_payment_url()).status_code, 403)
        create.assert_not_called()

    def test_customer_cannot_mark_invoice_paid_without_payment(self):
        self.client.force_authenticate(self.client_user)
        res = self.client.patch(
            reverse("finance:invoice-detail", args=[self.invoice.pk]),
            {"status": "PAID"}, format="json",
        )
        self.assertEqual(res.status_code, 403)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, "SENT")

    def test_business_owner_is_customer_when_viewing_another_business_invoice(self):
        self.client_user.role = "MANAGER"
        self.client_user.save(update_fields=["role"])
        create_business(self.client_user, slug="customers-own-business")
        self.client.force_authenticate(self.client_user)
        url = reverse("finance:invoice-detail", args=[self.invoice.pk])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["can_manage"])
        self.client.force_authenticate(self.manager)
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["can_manage"])

    @patch("finance.views.stripe.PaymentIntent.create")
    def test_business_owner_as_customer_can_use_their_own_linked_card(self, create):
        own_business = create_business(self.client_user, slug="customers-own-business")
        card = self.add_client_payment_method()
        card.business = own_business
        card.save(update_fields=["business"])
        self.add_business_bank_account()
        create.return_value = SimpleNamespace(id="pi_dual_role", status="succeeded")
        self.client.force_authenticate(self.client_user)
        detail = self.client.get(reverse("finance:invoice-detail", args=[self.invoice.pk]))
        self.assertTrue(detail.data["has_payment_method"])
        self.assertFalse(detail.data["can_manage"])
        self.assertEqual(self.client.post(self.make_payment_url()).status_code, 200)
        create.assert_called_once()

    def test_other_customer_cannot_view_or_pay_invoice(self):
        other = get_user_model().objects.create_user("other-client@example.com", "test123", role="CLIENT")
        self.client.force_authenticate(other)
        self.assertEqual(
            self.client.get(reverse("finance:invoice-detail", args=[self.invoice.pk])).status_code, 404,
        )
        self.assertEqual(self.client.post(self.make_payment_url()).status_code, 404)

    def test_signed_out_customer_cannot_access_invoice_without_login(self):
        self.assertEqual(
            self.client.get(reverse("finance:invoice-detail", args=[self.invoice.pk])).status_code, 401,
        )
        self.assertEqual(self.client.post(self.make_payment_url()).status_code, 401)

    @patch("finance.emails.send_branded_email")
    @patch("finance.views.stripe.PaymentIntent.create")
    def test_invoice_email_link_logs_in_customer_then_views_and_pays(self, create, send):
        self.add_client_payment_method()
        self.add_business_bank_account()
        create.return_value = SimpleNamespace(id="pi_from_email", status="succeeded")
        send_invoice_email(self.invoice)
        values = send.call_args.kwargs
        link = values["action_url"]
        self.assertIn(link, values["text_body"])
        self.assertEqual(values["recipient_list"], [self.client_user.email])
        self.assertEqual(values["reply_to"], [self.business.email])
        self.assertEqual(urlsplit(link).path, f"/user/business/invoice/{self.invoice.pk}")
        magic_token = parse_qs(urlsplit(link).query)["token"][0]
        login = self.client.post(reverse("user:magic-login"), {"token": magic_token}, format="json")
        self.assertEqual(login.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {login.data['token']}")
        self.assertEqual(
            self.client.get(reverse("finance:invoice-detail", args=[self.invoice.pk])).status_code, 200,
        )
        self.assertEqual(self.client.post(self.make_payment_url()).status_code, 200)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, "PAID")

    def test_expired_or_tampered_invoice_login_links_are_rejected(self):
        with patch("django.core.signing.time.time", return_value=0):
            expired = generate_magic_login_token(self.client_user)
        for token in (expired, generate_magic_login_token(self.client_user) + "tampered", ""):
            with self.subTest(token_type="empty" if not token else "invalid"):
                response = self.client.post(reverse("user:magic-login"), {"token": token}, format="json")
                self.assertEqual(response.status_code, 400)
                self.assertNotIn("token", response.data)

    def test_inactive_customer_cannot_use_invoice_magic_link(self):
        token = generate_magic_login_token(self.client_user)
        self.client_user.is_active = False
        self.client_user.save(update_fields=["is_active"])
        response = self.client.post(reverse("user:magic-login"), {"token": token}, format="json")
        self.assertEqual(response.status_code, 400)

    @patch("finance.emails.send_branded_email")
    def test_owner_can_resend_existing_invoice_with_secure_link(self, send):
        self.client.force_authenticate(self.manager)
        response = self.client.post(reverse("finance:invoice-send-invoice", args=[self.invoice.pk]))
        self.assertEqual(response.status_code, 200)
        send.assert_called_once()
        self.assertIn("?token=", send.call_args.kwargs["action_url"])
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, "SENT")
        self.assertFalse(Payout.objects.filter(invoice=self.invoice).exists())

    @patch("finance.views.emails.send_invoice_email")
    def test_customer_cannot_resend_invoice_and_paid_or_cancelled_are_blocked(self, send):
        url = reverse("finance:invoice-send-invoice", args=[self.invoice.pk])
        self.client.force_authenticate(self.client_user)
        self.assertEqual(self.client.post(url).status_code, 403)
        self.client.force_authenticate(self.manager)
        for value in ("PAID", "CANCELLED"):
            self.invoice.status = value
            self.invoice.save(update_fields=["status"])
            self.assertEqual(self.client.post(url).status_code, 400)
        send.assert_not_called()

    @patch("finance.views.emails.send_invoice_email")
    def test_sending_draft_invoice_marks_it_sent(self, send):
        self.invoice.status = "DRAFT"
        self.invoice.save(update_fields=["status"])
        self.client.force_authenticate(self.manager)
        response = self.client.post(reverse("finance:invoice-send-invoice", args=[self.invoice.pk]))
        self.assertEqual(response.status_code, 200)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, "SENT")
        send.assert_called_once()

    @patch("finance.views.logger.exception")
    @patch("finance.views.emails.send_invoice_email", side_effect=RuntimeError("Email provider unavailable"))
    def test_email_failure_keeps_draft_invoice_unsent(self, send, log):
        self.invoice.status = "DRAFT"
        self.invoice.save(update_fields=["status"])
        self.client.force_authenticate(self.manager)
        response = self.client.post(reverse("finance:invoice-send-invoice", args=[self.invoice.pk]))
        self.assertEqual(response.status_code, 503)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, "DRAFT")

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
    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
    )
    def test_successful_payment_creates_exactly_one_payout(
        self,
        mock_payment_intent_create,
    ):
        """Test successful payment marks invoice paid and records one payout."""
        self.add_client_payment_method()
        self.add_business_bank_account()
        mock_payment_intent_create.return_value = SimpleNamespace(id="pi_success", status="succeeded")
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
        self.assertEqual(payout.stripe_account_id, "acct_test")
        params = mock_payment_intent_create.call_args.kwargs
        self.assertEqual(params["stripe_account"], "acct_test")
        self.assertEqual(params["payment_method"], "pm_cloned")
        self.assertNotIn("transfer_data", params)
        self.assertNotIn("customer", params)
        self.mock_clone.assert_called_once_with(
            customer="cus_test", payment_method="pm_test", stripe_account="acct_test",
            idempotency_key=f"payout-{payout.pk}-card",
        )
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.manager.email])
        self.assertIn(self.invoice.invoice_number, mail.outbox[0].subject)

    @patch("finance.views.stripe.PaymentIntent.create")
    def test_repaying_already_paid_invoice_is_blocked(
        self,
        mock_payment_intent_create,
    ):
        """Test paying the same invoice twice is rejected safely."""
        self.add_client_payment_method()
        self.add_business_bank_account()
        mock_payment_intent_create.return_value = SimpleNamespace(id="pi_success", status="succeeded")
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
        mock_refund_create.return_value = SimpleNamespace(id="re_success", status="succeeded", amount=10500)
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

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    @patch("finance.views.stripe.Refund.retrieve")
    @patch("finance.views.stripe.Refund.create")
    def test_partial_refunds_add_up_and_cannot_exceed_payment(self, create, retrieve):
        self.invoice.status = "PAID"
        self.invoice.save(update_fields=["status"])
        total = self.invoice.total_amount
        payout = Payout.objects.create(
            business=self.business, invoice=self.invoice, amount=total,
            currency=self.invoice.currency, status="PAID",
            stripe_payment_intent_id="pi_partial", processed_at=timezone.now(),
        )
        create.side_effect = [
            SimpleNamespace(id="re_1", status="succeeded"),
            SimpleNamespace(id="re_2", status="pending"),
        ]
        self.client.force_authenticate(self.manager)

        first = self.client.post(self.refund_url(payout), {"amount": "30.00"}, format="json")
        self.assertEqual(first.status_code, status.HTTP_200_OK, first.data)
        payout.refresh_from_db()
        self.assertEqual(payout.status, "PARTIALLY_REFUNDED")
        self.assertEqual(payout.refunded_amount, Decimal("30.00"))
        self.assertFalse(payout.is_refunded)
        self.assertEqual(mail.outbox[-1].to, [self.invoice.client.user.email])

        too_much = self.client.post(
            self.refund_url(payout), {"amount": str(total - Decimal("29.99"))}, format="json",
        )
        self.assertEqual(too_much.status_code, status.HTTP_400_BAD_REQUEST)

        rest = str(total - Decimal("30.00"))
        pending = self.client.post(self.refund_url(payout), {"amount": rest}, format="json")
        self.assertEqual(pending.status_code, status.HTTP_202_ACCEPTED)

        retrieve.return_value = SimpleNamespace(id="re_2", status="succeeded")
        settled = self.client.post(self.refund_url(payout), {}, format="json")
        self.assertEqual(settled.status_code, status.HTTP_200_OK, settled.data)

        payout.refresh_from_db()
        self.assertEqual(payout.status, "REFUNDED")
        self.assertTrue(payout.is_refunded)
        self.assertEqual(payout.refunded_amount, total)
        self.assertEqual(create.call_count, 2)
        keys = [call.kwargs["idempotency_key"] for call in create.call_args_list]
        self.assertEqual(len(set(keys)), 2)
        self.assertEqual(
            list(payout.refunds.values_list("status", flat=True)), ["SUCCEEDED", "SUCCEEDED"],
        )

        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, "PAID")
        detail = self.client.get(reverse("finance:invoice-detail", args=[self.invoice.id]))
        self.assertEqual(detail.data["refunded_amount"], f"{total:.2f}")
        self.assertEqual(
            self.client.delete(reverse("finance:payout-detail", args=[payout.id])).status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )
