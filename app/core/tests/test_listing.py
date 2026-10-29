"""Server-side paging, filtering, sorting and bulk actions on list endpoints."""
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from core.models import Business, Client, Invoice, Quote, Service

QUOTES_URL = reverse("operations:quote-list")
QUOTES_BULK_URL = reverse("operations:quote-bulk")
CLIENTS_URL = reverse("operations:client-list")


class ListingTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.owner = User.objects.create_user("owner@example.com", "pw", role="MANAGER", name="Owner")
        self.business = Business.objects.create(
            owner=self.owner, name="Biz", slug="biz", phone="1", country="CA", province_state="AB",
        )
        self.business.services_offered.add("Flooring")
        self.clients = []
        self.services = []
        for name in ("Charlie", "Alice", "Bob"):
            account = User.objects.create_user(f"{name.lower()}@example.com", "pw", role="CLIENT", name=name)
            client = Client.objects.create(business=self.business, user=account)
            self.clients.append(client)
            self.services.append(Service.objects.create(
                client=client, business=self.business, service_name="Flooring", description="Work",
                start_date=date.today(), service_type="ONE_TIME", price=Decimal("100.00"), currency="CAD",
                status="PENDING", street_address=f"{name} Street", city="Calgary", country="CA",
                province_state="AB", postal_code="T2T2T2",
            ))
        self.quotes = [
            Quote.objects.create(service=service, payment_terms="NET_15",
                                 valid_until=date.today() + timedelta(days=5))
            for service in self.services
        ]
        self.api = APIClient()
        self.api.force_authenticate(self.owner)

    def test_lists_are_arrays_unless_a_page_is_requested(self):
        self.assertIsInstance(self.api.get(QUOTES_URL).data, list)

        page = self.api.get(QUOTES_URL, {"page": 1, "page_size": 2}).data
        self.assertEqual((page["count"], page["total_pages"], page["current_page"]), (3, 2, 1))
        self.assertEqual(len(page["results"]), 2)

    def test_search_filter_and_sort_run_on_the_server(self):
        names = [row["client_name"] for row in self.api.get(CLIENTS_URL, {"ordering": "name"}).data]
        self.assertEqual(names, ["Alice", "Bob", "Charlie"])
        found = self.api.get(CLIENTS_URL, {"search": "bob@"}).data
        self.assertEqual([row["client_name"] for row in found], ["Bob"])

        Quote.objects.filter(pk=self.quotes[0].pk).update(valid_until=date.today() - timedelta(days=1))
        expired = self.api.get(QUOTES_URL, {"status": "EXPIRED"}).data
        self.assertEqual([row["id"] for row in expired], [self.quotes[0].pk])
        drafts = self.api.get(QUOTES_URL, {"status": "DRAFT"}).data
        self.assertNotIn(self.quotes[0].pk, [row["id"] for row in drafts])

        self.assertEqual(self.api.get(reverse("operations:job-list"), {"scheduled_from": "nope"}).status_code, 400)

    def test_deactivated_clients_stay_listed(self):
        self.api.post(reverse("operations:client-bulk"), {"action": "deactivate", "ids": [self.clients[0].pk]},
                      format="json")
        rows = self.api.get(CLIENTS_URL, {"is_active": "false"}).data
        self.assertEqual([row["id"] for row in rows], [self.clients[0].pk])

    @patch("operations.views.emails.send_quote_email")
    def test_bulk_send_reports_each_row(self, send_email):
        signed = self.quotes[2]
        Quote.objects.filter(pk=signed.pk).update(status="SIGNED")
        res = self.api.post(QUOTES_BULK_URL, {"action": "send", "ids": [q.pk for q in self.quotes] + [999999]},
                            format="json")

        self.assertEqual(res.status_code, 200, res.data)
        by_id = {row["id"]: row for row in res.data["results"]}
        self.assertFalse(by_id["999999"]["ok"])
        self.assertFalse(by_id[str(signed.pk)]["ok"])
        self.assertEqual(res.data["succeeded"] + res.data["failed"], 4)

    def test_bulk_delete_skips_signed_quotes(self):
        Quote.objects.filter(pk=self.quotes[0].pk).update(status="SIGNED")
        res = self.api.post(QUOTES_BULK_URL, {"action": "delete", "ids": [q.pk for q in self.quotes]}, format="json")

        self.assertEqual((res.data["succeeded"], res.data["failed"]), (2, 1))
        self.assertTrue(Quote.objects.filter(pk=self.quotes[0].pk).exists())

    def test_bulk_rejects_unknown_actions_and_non_owners(self):
        bad = self.api.post(QUOTES_BULK_URL, {"action": "explode", "ids": [1]}, format="json")
        self.assertEqual(bad.status_code, 400)

        self.api.force_authenticate(self.clients[0].user)
        res = self.api.post(QUOTES_BULK_URL, {"action": "delete", "ids": [self.quotes[0].pk]}, format="json")
        self.assertEqual(res.status_code, 403)
        self.assertTrue(Quote.objects.filter(pk=self.quotes[0].pk, is_deleted=False).exists())

    def test_other_businesses_rows_are_not_found_in_bulk(self):
        other = get_user_model().objects.create_user("other@example.com", "pw", role="MANAGER")
        Business.objects.create(owner=other, name="Other", slug="other", phone="1")
        self.api.force_authenticate(other)
        res = self.api.post(QUOTES_BULK_URL, {"action": "delete", "ids": [self.quotes[0].pk]}, format="json")
        self.assertEqual(res.data["results"][0], {"id": str(self.quotes[0].pk), "ok": False, "detail": "Not found."})

    def test_paid_invoices_cannot_be_deleted(self):
        invoice = Invoice.objects.create(
            business=self.business, client=self.clients[0], due_date=date.today(), status="PAID",
            subtotal=10, tax_rate=0, tax_amount=0, total_amount=10,
        )
        res = self.api.post(reverse("finance:invoice-bulk"), {"action": "delete", "ids": [invoice.pk]}, format="json")
        self.assertEqual(res.data["failed"], 1)
        self.assertIn("Paid invoices", res.data["results"][0]["detail"])
