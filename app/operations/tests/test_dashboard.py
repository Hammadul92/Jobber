"""
Tests for the dashboard aggregate endpoints.
"""

from datetime import date, datetime
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from core.models import (
    BankingInformation,
    Business,
    Client,
    Invoice,
    Job,
    Quote,
    Service,
    ServiceQuestionnaire,
    ServiceTermsTemplate,
    TeamMember,
)

DASHBOARD_URL = reverse("operations:dashboard")
TODOS_URL = reverse("operations:dashboard-todos")

# A Monday in June; the business is in America/Edmonton (UTC-6 in summer).
NOW = datetime(2026, 6, 15, 18, 0, tzinfo=timezone.utc)


def utc(year, month, day, hour=18):
    return datetime(year, month, day, hour, tzinfo=timezone.utc)


def create_user(email, role):
    return get_user_model().objects.create_user(email, "test123", role=role, name=email.split("@")[0])


def create_business(owner, slug):
    return Business.objects.create(
        owner=owner, name=f"Business {slug}", slug=slug, phone="1234567890",
        email=f"{slug}@example.com", business_description="Test", street_address="1 Main St",
        city="Calgary", country="CA", province_state="AB", postal_code="T2T2T2",
        business_number="123456789", timezone="America/Edmonton",
    )


class DashboardTestMixin:
    def make_client(self, business, email, created_at=None):
        record = Client.objects.create(business=business, user=create_user(email, "CLIENT"))
        if created_at:
            Client.objects.filter(pk=record.pk).update(created_at=created_at)
        return record

    def make_service(self, client, **params):
        self.service_count = getattr(self, "service_count", 0) + 1
        fields = {
            "service_name": "Flooring", "start_date": date(2026, 6, 1), "price": Decimal("100.00"),
            "currency": "CAD", "status": "PENDING", "street_address": f"{self.service_count} Test St",
            "city": "Calgary", "country": "CA", "province_state": "AB", "postal_code": "T2T2T2",
        }
        fields.update(params)
        updated_at = fields.pop("updated_at", None)
        service = Service.objects.create(client=client, business=client.business, **fields)
        if updated_at:
            Service.objects.filter(pk=service.pk).update(updated_at=updated_at)
        return service

    def make_quote(self, service, status_value, created_at=None, updated_at=None):
        quote = Quote.objects.create(service=service, valid_until=date(2026, 12, 31), status=status_value)
        Quote.objects.filter(pk=quote.pk).update(
            created_at=created_at or utc(2026, 6, 1), updated_at=updated_at or created_at or utc(2026, 6, 1),
        )
        return quote

    def make_invoice(self, client, total, status_value, created_at, paid_at=None, due_date=None, service=None):
        invoice = Invoice.objects.create(
            business=client.business, client=client, service=service, status=status_value,
            subtotal=Decimal(total), total_amount=Decimal(total), paid_at=paid_at, due_date=due_date,
        )
        Invoice.objects.filter(pk=invoice.pk).update(created_at=created_at, updated_at=paid_at or created_at)
        return invoice

    def make_job(self, service, status_value, scheduled_date, assigned_to=None, title="Job"):
        return Job.objects.create(
            service=service, status=status_value, scheduled_date=scheduled_date, assigned_to=assigned_to, title=title,
        )

    def get_dashboard(self, user, **params):
        api = APIClient()
        api.force_authenticate(user)
        with patch("django.utils.timezone.now", return_value=NOW):
            res = api.get(DASHBOARD_URL, params)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        return res.data


class DashboardApiTests(DashboardTestMixin, TestCase):
    def setUp(self):
        self.owner = create_user("owner@example.com", "MANAGER")
        self.business = create_business(self.owner, "main")
        self.client_a = self.make_client(self.business, "alice@example.com", created_at=utc(2026, 6, 3))
        self.client_b = self.make_client(self.business, "bob@example.com", created_at=utc(2026, 5, 10))
        deleted = self.make_client(self.business, "gone@example.com", created_at=utc(2026, 6, 4))
        deleted.soft_delete()

        self.employee = create_user("worker@example.com", "EMPLOYEE")
        self.member = TeamMember.objects.create(business=self.business, employee=self.employee)
        TeamMember.objects.filter(pk=self.member.pk).update(joined_at=utc(2026, 6, 2))

        self.service_active = self.make_service(
            self.client_a, status="ACTIVE", filled_questionnaire={"q": "a"}, updated_at=utc(2026, 6, 10),
        )
        self.service_pending = self.make_service(
            self.client_b, filled_questionnaire={"q": "b"}, updated_at=utc(2026, 5, 1),
        )
        self.service_empty = self.make_service(self.client_b, filled_questionnaire={})

        self.make_quote(self.service_active, "SIGNED", created_at=utc(2026, 5, 2), updated_at=utc(2026, 6, 14))
        self.make_quote(self.service_pending, "DRAFT", created_at=utc(2026, 6, 5))
        self.make_quote(self.service_empty, "SENT", created_at=utc(2026, 5, 6), updated_at=utc(2026, 6, 12))

        # Paid: 100 in June, 50 in May, and 7 paid at 03:00 UTC on June 1 = May 31 locally.
        self.make_invoice(self.client_a, "100", "PAID", utc(2026, 6, 2), paid_at=utc(2026, 6, 10))
        self.make_invoice(self.client_b, "50", "PAID", utc(2026, 5, 1), paid_at=utc(2026, 5, 20))
        self.make_invoice(self.client_b, "7", "PAID", utc(2026, 5, 25), paid_at=utc(2026, 6, 1, hour=3))
        self.make_invoice(self.client_a, "30", "SENT", utc(2026, 6, 3), due_date=date(2026, 6, 5))
        self.make_invoice(self.client_a, "20", "DRAFT", utc(2026, 6, 4), due_date=date(2026, 6, 25))
        self.make_invoice(self.client_a, "999", "CANCELLED", utc(2025, 3, 1))
        self.make_invoice(self.client_a, "400", "PAID", utc(2019, 1, 1), paid_at=utc(2019, 1, 2))

        self.make_job(self.service_active, "IN_PROGRESS", utc(2026, 6, 12), self.member, title="Current")
        self.make_job(self.service_active, "IN_PROGRESS", utc(2026, 5, 12), title="Earlier")
        self.make_job(self.service_active, "PENDING", utc(2026, 6, 20), title="Next")
        self.make_job(self.service_active, "COMPLETED", utc(2026, 4, 1))
        self.make_job(self.service_active, "CANCELLED", utc(2026, 6, 1))

        # Another business whose data must never leak into the owner's numbers.
        other_owner = create_user("other@example.com", "MANAGER")
        other_business = create_business(other_owner, "other")
        other_client = self.make_client(other_business, "stranger@example.com", created_at=utc(2026, 6, 3))
        other_service = self.make_service(other_client, status="ACTIVE", filled_questionnaire={"q": "x"})
        self.make_quote(other_service, "DRAFT", created_at=utc(2026, 6, 3))
        self.make_invoice(other_client, "1000", "PAID", utc(2026, 6, 3), paid_at=utc(2026, 6, 4))
        self.make_invoice(other_client, "1000", "SENT", utc(2026, 6, 3), due_date=date(2026, 6, 4))
        self.make_job(other_service, "IN_PROGRESS", utc(2026, 6, 3))
        TeamMember.objects.create(business=other_business, employee=create_user("ow@example.com", "EMPLOYEE"))

    def test_auth_required(self):
        res = APIClient().get(DASHBOARD_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_manager_stats_cover_only_their_business(self):
        data = self.get_dashboard(self.owner)
        stats = data["stats"]

        self.assertEqual(data["timezone"], "America/Edmonton")
        self.assertEqual(stats["clients"], {"value": 2, "current": 1, "previous": 1})
        self.assertEqual(stats["team_members"], {"value": 1, "current": 1, "previous": 0})
        self.assertEqual(stats["pending_quotes"], {"value": 2, "current": 1, "previous": 1})
        self.assertEqual(stats["active_jobs"], {"value": 2, "current": 1, "previous": 1})
        # Unpaid: the SENT and DRAFT invoices; only the SENT one is due so far this month.
        self.assertEqual(stats["unpaid_invoices"], {"value": 2, "current": 1, "previous": 0})
        self.assertEqual(stats["monthly_revenue"], {"value": 100.0, "current": 100.0, "previous": 57.0})
        self.assertEqual(data["job_status"], {"IN_PROGRESS": 2, "PENDING": 1, "COMPLETED": 1, "CANCELLED": 1})
        # Answered services: ACTIVE (updated this week) and PENDING (updated in May).
        self.assertEqual(data["questionnaires"], {"new": 1, "pending": 1, "done": 1})

    def test_monthly_revenue_series(self):
        data = self.get_dashboard(self.owner)
        series = data["revenue"]["series"]

        self.assertEqual(data["revenue"]["range"], "monthly")
        self.assertEqual([row["label"] for row in series][:3], ["Jan", "Feb", "Mar"])
        self.assertEqual(len(series), 12)
        by_label = {row["label"]: row for row in series}
        self.assertEqual(by_label["May"], {"label": "May", "revenue": 57.0, "collected": 57.0})
        self.assertEqual(by_label["Jun"], {"label": "Jun", "revenue": 150.0, "collected": 100.0})
        self.assertEqual(sum(row["revenue"] for row in series), 207.0)
        self.assertEqual(sum(row["collected"] for row in series), 157.0)

    def test_weekly_revenue_series(self):
        series = self.get_dashboard(self.owner, range="Weekly")["revenue"]["series"]

        self.assertEqual(len(series), 8)
        self.assertEqual(series[0]["label"], "Apr 27")
        self.assertEqual(series[-1]["label"], "Jun 15")
        by_label = {row["label"]: (row["revenue"], row["collected"]) for row in series}
        self.assertEqual(by_label["Apr 27"], (50.0, 0.0))
        self.assertEqual(by_label["May 18"], (0.0, 50.0))
        self.assertEqual(by_label["May 25"], (7.0, 7.0))
        self.assertEqual(by_label["Jun 1"], (150.0, 0.0))
        self.assertEqual(by_label["Jun 8"], (0.0, 100.0))

    def test_yearly_revenue_series(self):
        series = self.get_dashboard(self.owner, range="yearly")["revenue"]["series"]

        self.assertEqual([row["label"] for row in series], ["2021", "2022", "2023", "2024", "2025", "2026"])
        by_label = {row["label"]: (row["revenue"], row["collected"]) for row in series}
        self.assertEqual(by_label["2025"], (999.0, 0.0))
        self.assertEqual(by_label["2026"], (207.0, 157.0))

    def test_unknown_range_falls_back_to_monthly(self):
        data = self.get_dashboard(self.owner, range="hourly")
        self.assertEqual(data["revenue"]["range"], "monthly")

    def test_lists(self):
        data = self.get_dashboard(self.owner)

        self.assertEqual([job["title"] for job in data["upcoming_jobs"]], ["Earlier", "Current", "Next"])
        current = data["upcoming_jobs"][1]
        self.assertEqual(current["assigned_to_name"], "worker")
        self.assertEqual(current["service_name"], "Flooring")
        # Shown in the business's local time like the job serializer.
        self.assertEqual(current["scheduled_date"], "2026-06-12 12:00:00")

        quotes = data["recent_quotes"]
        self.assertEqual(len(quotes), 3)
        self.assertEqual(quotes[0]["status"], "SIGNED")
        self.assertEqual(quotes[0]["client_name"], "alice")
        self.assertEqual(Decimal(quotes[0]["amount"]), Decimal("100.00"))

        invoices = data["recent_invoices"]
        self.assertEqual(len(invoices), 5)
        self.assertNotIn("1000.00", [str(row["total_amount"]) for row in invoices])

        activity = data["recent_activity"]
        self.assertLessEqual(len(activity), 10)
        self.assertEqual(activity[0]["id"], f"quote-{Quote.objects.get(status='SIGNED').pk}")
        self.assertEqual(activity[0]["title"], "Quote approved")
        dates = [item["date"] for item in activity]
        self.assertEqual(dates, sorted(dates, reverse=True))
        self.assertFalse(any("stranger" in item["description"] for item in activity))
        self.assertFalse(any("gone" in item["description"] for item in activity))

    def test_client_sees_only_their_own_records(self):
        data = self.get_dashboard(self.client_a.user)
        stats = data["stats"]

        self.assertEqual(stats["clients"]["value"], 0)
        self.assertEqual(stats["team_members"]["value"], 0)
        # One SIGNED quote; DRAFT invoices are hidden from clients.
        self.assertEqual(stats["pending_quotes"]["value"], 0)
        self.assertEqual(stats["unpaid_invoices"]["value"], 1)
        self.assertEqual(stats["monthly_revenue"]["value"], 100.0)
        self.assertEqual(data["job_status"]["IN_PROGRESS"], 2)
        self.assertEqual(len(data["recent_invoices"]), 4)

    def test_employee_sees_only_assigned_jobs(self):
        data = self.get_dashboard(self.employee)

        self.assertEqual(data["job_status"], {"IN_PROGRESS": 1, "PENDING": 0, "COMPLETED": 0, "CANCELLED": 0})
        self.assertEqual([job["title"] for job in data["upcoming_jobs"]], ["Current"])
        self.assertEqual(data["stats"]["clients"]["value"], 0)
        self.assertEqual(data["stats"]["monthly_revenue"]["value"], 0.0)
        self.assertEqual(data["recent_quotes"], [])

    def test_user_without_role_sees_nothing(self):
        data = self.get_dashboard(create_user("nobody@example.com", "USER"))

        self.assertEqual(data["timezone"], "UTC")
        self.assertTrue(all(stat["value"] == 0 for stat in data["stats"].values()))
        self.assertEqual(data["recent_activity"], [])

    def test_query_count_does_not_grow_with_data(self):
        def count_queries():
            with CaptureQueriesContext(connection) as context:
                self.get_dashboard(self.owner, range="weekly")
            return len(context.captured_queries)

        baseline = count_queries()
        for index in range(15):
            client = self.make_client(self.business, f"extra{index}@example.com", created_at=utc(2026, 6, 6))
            service = self.make_service(client, filled_questionnaire={"q": index})
            self.make_quote(service, "SENT")
            self.make_invoice(client, "10", "PAID", utc(2026, 6, 6), paid_at=utc(2026, 6, 7), service=service)
            self.make_job(service, "PENDING", utc(2026, 6, 20))

        self.assertEqual(count_queries(), baseline)
        self.assertLessEqual(baseline, 16)


class DashboardTodosApiTests(DashboardTestMixin, TestCase):
    def setUp(self):
        self.owner = create_user("owner@example.com", "MANAGER")
        self.business = create_business(self.owner, "main")
        self.business.services_offered.add("Flooring", "Painting")
        ServiceQuestionnaire.objects.create(business=self.business, service_name="Flooring")
        ServiceTermsTemplate.objects.create(business=self.business, service_name="Flooring", content="Terms")
        self.client_a = self.make_client(self.business, "alice@example.com")

        self.needs_answers = self.make_service(self.client_a)
        self.needs_quote = self.make_service(self.client_a, bypass_questionnaire=True, auto_generate_quote=True)
        self.needs_invoice = self.make_service(
            self.client_a, status="ACTIVE", filled_questionnaire={"q": "a"}, auto_generate_invoices=True,
        )
        self.make_quote(self.needs_invoice, "SIGNED")
        invoiced = self.make_service(
            self.client_a, status="ACTIVE", filled_questionnaire={"q": "a"}, auto_generate_invoices=True,
        )
        self.make_quote(invoiced, "SIGNED")
        self.make_invoice(self.client_a, "10", "SENT", utc(2026, 6, 1), due_date=date(2026, 7, 1), service=invoiced)
        self.make_service(self.client_a, status="COMPLETED")

        self.draft = self.make_quote(self.make_service(self.client_a, bypass_questionnaire=True), "DRAFT")
        self.sent = self.make_quote(self.make_service(self.client_a, bypass_questionnaire=True), "SENT")
        self.overdue = self.make_invoice(self.client_a, "10", "SENT", utc(2026, 5, 1), due_date=date(2026, 6, 14))
        self.make_invoice(self.client_a, "10", "PAID", utc(2026, 5, 1), due_date=date(2026, 6, 1))
        self.unassigned = self.make_job(self.needs_invoice, "PENDING", utc(2026, 6, 20))
        self.make_job(self.needs_invoice, "COMPLETED", utc(2026, 6, 1))

        other_owner = create_user("other@example.com", "MANAGER")
        other_business = create_business(other_owner, "other")
        other_client = self.make_client(other_business, "stranger@example.com")
        self.make_quote(self.make_service(other_client, bypass_questionnaire=True), "DRAFT")
        self.make_invoice(other_client, "10", "SENT", utc(2026, 5, 1), due_date=date(2026, 6, 1))

    def get_todos(self, user):
        api = APIClient()
        api.force_authenticate(user)
        with patch("django.utils.timezone.now", return_value=NOW):
            res = api.get(TODOS_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        return res.data

    def test_manager_todos(self):
        data = self.get_todos(self.owner)
        ids = [item["id"] for item in data["items"]]

        expected = {
            "questionnaire:painting",
            "terms:painting",
            "banking:business-payout",
            f"service-questionnaire-response:{self.needs_answers.pk}",
            f"quote-missing:{self.needs_quote.pk}",
            f"invoice-missing:{self.needs_invoice.pk}",
            f"quote-draft:{self.draft.pk}",
            f"quote-sent:{self.sent.pk}",
            f"invoice-overdue:{self.overdue.pk}",
            f"job-unassigned:{self.unassigned.pk}",
        }
        self.assertEqual(set(ids), expected)
        self.assertEqual(data["count"], len(expected))
        # High-priority items come first.
        priorities = [item["priority"] for item in data["items"]]
        self.assertEqual(priorities, sorted(priorities, key=lambda value: value != "high"))
        answers = next(item for item in data["items"] if item["id"].startswith("service-questionnaire-response"))
        self.assertEqual(answers["to"], f"/user/business/client/{self.client_a.pk}/services")
        self.assertEqual(answers["description"], "alice still needs to complete the service questionnaire.")

    def test_banking_and_setup_todos_clear(self):
        BankingInformation.objects.create(business=self.business)
        self.business.services_offered.remove("Painting")

        ids = [item["id"] for item in self.get_todos(self.owner)["items"]]
        self.assertFalse(any(todo_id.split(":")[0] in ("banking", "questionnaire", "terms") for todo_id in ids))

    def test_non_manager_gets_no_todos(self):
        self.assertEqual(self.get_todos(self.client_a.user), {"count": 0, "items": []})

    def test_count_reports_more_than_returned_items(self):
        with patch("operations.dashboard.TODO_LIMIT", 2):
            data = self.get_todos(self.owner)
        self.assertEqual(data["count"], 10)
        self.assertEqual(len(data["items"]), 2)

    def test_query_count_does_not_grow_with_data(self):
        def count_queries():
            with CaptureQueriesContext(connection) as context:
                self.get_todos(self.owner)
            return len(context.captured_queries)

        baseline = count_queries()
        for _ in range(10):
            service = self.make_service(self.client_a, bypass_questionnaire=True)
            self.make_quote(service, "DRAFT")
            self.make_job(service, "PENDING", utc(2026, 6, 20))
            self.make_invoice(self.client_a, "10", "SENT", utc(2026, 5, 1), due_date=date(2026, 6, 1))

        self.assertEqual(count_queries(), baseline)
        self.assertLessEqual(baseline, 13)
