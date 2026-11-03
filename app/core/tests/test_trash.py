"""Trash: owners list soft-deleted records and restore them; nothing is purged."""
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from django.utils import timezone

from core.models import Business, Client, Job, Quote, Service, TeamMember


class TrashTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.owner = User.objects.create_user("owner@example.com", "pw", role="MANAGER", name="Owner")
        self.business = Business.objects.create(
            owner=self.owner, name="Biz", slug="biz", phone="1", country="CA", province_state="AB",
        )
        self.business.services_offered.add("Flooring")
        account = User.objects.create_user("alice@example.com", "pw", role="CLIENT", name="Alice")
        self.client_account = account
        self.client_record = Client.objects.create(business=self.business, user=account, company_name="Acme")
        self.service = self.make_service("Alice Street")
        self.quote = Quote.objects.create(
            service=self.service, payment_terms="NET_15", general_terms_conditions="Terms",
            valid_until=date.today() + timedelta(days=5),
        )
        self.api = APIClient()
        self.api.force_authenticate(self.owner)

    def make_service(self, street):
        return Service.objects.create(
            client=self.client_record, business=self.business, service_name="Flooring", description="Work",
            start_date=date.today(), service_type="ONE_TIME", price=Decimal("100.00"), currency="CAD",
            status="PENDING", street_address=street, city="Calgary", country="CA",
            province_state="AB", postal_code="T2T2T2",
        )

    def trash(self, resource, **params):
        return self.api.get(reverse(f"operations:{resource}-trash"), params)

    def restore(self, resource, pk):
        return self.api.post(reverse(f"operations:{resource}-restore", args=[pk]))

    def bulk_restore(self, resource, ids):
        return self.api.post(reverse(f"operations:{resource}-bulk-restore"), {"ids": ids}, format="json")

    def test_deleted_rows_move_to_the_trash_with_a_readable_label(self):
        self.assertEqual(self.api.delete(reverse("operations:client-detail", args=[self.client_record.pk])).status_code, 204)

        page = self.trash("client").data
        self.assertEqual(page["count"], 1)
        row = page["results"][0]
        self.assertEqual((row["label"], row["detail"]), ("Alice", "Acme · alice@example.com"))
        self.assertEqual(row["deleted_by"], "Owner")
        self.assertEqual(row["blocked_reason"], "")

        # The service and quote went with the client, but they can only come back with it.
        service_row = self.trash("service").data["results"][0]
        self.assertIn("Restore client", service_row["blocked_reason"])
        self.assertEqual(self.restore("service", self.service.pk).status_code, 400)

    def test_restore_brings_back_the_record_and_what_was_deleted_with_it(self):
        self.client_record.soft_delete(user=self.owner)

        res = self.restore("client", self.client_record.pk)

        self.assertEqual(res.status_code, 200, res.data)
        for obj in (self.client_record, self.service, self.quote):
            obj.refresh_from_db()
            self.assertFalse(obj.is_deleted)
        self.assertEqual(self.trash("client").data["count"], 0)

    def test_restore_leaves_records_that_were_deleted_separately_earlier(self):
        older = self.make_service("Old Street")
        older.soft_delete(user=self.owner)
        self.client_record.soft_delete(user=self.owner)

        self.restore("client", self.client_record.pk)

        older.refresh_from_db()
        self.service.refresh_from_db()
        self.assertTrue(older.is_deleted)
        self.assertFalse(self.service.is_deleted)

    def test_restore_refuses_to_break_the_one_open_quote_per_service_rule(self):
        self.quote.soft_delete(user=self.owner)
        Quote.objects.create(
            service=self.service, payment_terms="NET_15", general_terms_conditions="Terms",
            valid_until=date.today() + timedelta(days=5),
        )

        res = self.restore("quote", self.quote.pk)

        self.assertEqual(res.status_code, 400)
        self.assertIn("quote already exists", res.data["detail"])
        self.quote.refresh_from_db()
        self.assertTrue(self.quote.is_deleted)

    def test_trash_is_scoped_to_the_owner_and_closed_to_clients(self):
        self.client_record.soft_delete(user=self.owner)
        other = get_user_model().objects.create_user("other@example.com", "pw", role="MANAGER")
        self.api.force_authenticate(other)
        self.assertEqual(self.trash("client").data["count"], 0)
        self.assertEqual(self.restore("client", self.client_record.pk).status_code, 404)

        self.api.force_authenticate(self.client_account)
        self.assertEqual(self.trash("client").status_code, 403)
        self.assertEqual(self.restore("client", self.client_record.pk).status_code, 403)

    def test_live_lists_and_restore_of_live_rows_are_unaffected(self):
        self.assertEqual(self.trash("quote").data["count"], 0)
        self.assertEqual(self.restore("quote", self.quote.pk).status_code, 404)
        self.assertEqual(len(self.api.get(reverse("operations:quote-list")).data), 1)

    def test_trash_search_and_no_purge_endpoint(self):
        self.quote.soft_delete(user=self.owner)
        self.assertEqual(self.trash("quote", search=self.quote.quote_number).data["count"], 1)
        self.assertEqual(self.trash("quote", search="nothing-matches").data["count"], 0)
        # A DELETE on a trashed row must not hard-delete it.
        self.assertEqual(self.api.delete(reverse("operations:quote-detail", args=[self.quote.pk])).status_code, 404)
        self.assertTrue(Quote.all_objects.filter(pk=self.quote.pk).exists())

    def test_bulk_restore_restores_each_row_and_reports_the_rest(self):
        other = self.make_service("Other Street")
        self.service.soft_delete(user=self.owner)
        other.soft_delete(user=self.owner)

        res = self.bulk_restore("service", [self.service.pk, 999999, other.pk])

        self.assertEqual((res.data["succeeded"], res.data["failed"]), (2, 1), res.data)
        self.assertEqual(
            [(row["ok"], row["detail"]) for row in res.data["results"]],
            [(True, ""), (False, "Not found."), (True, "")],
        )
        for obj in (self.service, other, self.quote):
            obj.refresh_from_db()
            self.assertFalse(obj.is_deleted)

    def test_bulk_restore_reports_rows_that_cannot_come_back(self):
        self.client_record.soft_delete(user=self.owner)

        res = self.bulk_restore("service", [self.service.pk])

        self.assertEqual(res.data["failed"], 1)
        self.assertIn("Restore client", res.data["results"][0]["detail"])
        self.api.force_authenticate(self.client_account)
        self.assertEqual(self.bulk_restore("service", [self.service.pk]).status_code, 403)

    def test_removing_a_team_member_keeps_their_jobs_unassigned(self):
        employee = get_user_model().objects.create_user("emp@example.com", "pw", role="EMPLOYEE", name="Emp")
        member = TeamMember.objects.create(business=self.business, employee=employee)
        job = Job.objects.create(
            service=self.service, assigned_to=member, title="Install", scheduled_date=timezone.now(),
        )

        res = self.api.delete(reverse("operations:teammember-detail", args=[member.pk]))

        self.assertEqual(res.status_code, 204)
        job.refresh_from_db()
        self.assertFalse(job.is_deleted)
        self.assertIsNone(job.assigned_to)
        self.assertEqual(self.restore("teammember", member.pk).status_code, 200)

    def test_jobs_still_go_with_the_business_when_everything_is_deleted(self):
        employee = get_user_model().objects.create_user("emp@example.com", "pw", role="EMPLOYEE", name="Emp")
        member = TeamMember.objects.create(business=self.business, employee=employee)
        job = Job.objects.create(
            service=self.service, assigned_to=member, title="Install", scheduled_date=timezone.now(),
        )

        self.business.soft_delete(user=self.owner)
        self.business.restore()

        job.refresh_from_db()
        self.assertFalse(job.is_deleted)
        self.assertEqual(job.assigned_to_id, member.pk)
