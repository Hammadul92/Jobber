"""List endpoints must not run extra queries for every row."""
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from rest_framework.test import APIClient

from core.models import (
    BankingInformation, Business, Client, Invoice, Job, Payout, Quote, Service,
    ServiceQuestionnaire, ServiceTermsTemplate, TeamMember,
)

LIST_URLS = {
    "clients": reverse("operations:client-list"),
    "services": reverse("operations:service-list"),
    "quotes": reverse("operations:quote-list"),
    "jobs": reverse("operations:job-list"),
    "team": reverse("operations:teammember-list"),
    "invoices": reverse("finance:invoice-list"),
    "payouts": reverse("finance:payout-list"),
}


class ListQueryCountTests(TestCase):
    def setUp(self):
        self.owner = get_user_model().objects.create_user("owner@example.com", "pw", role="MANAGER", name="Owner")
        self.business = Business.objects.create(owner=self.owner, name="Biz", slug="biz", phone="1")
        self.business.services_offered.add("Flooring")
        ServiceQuestionnaire.objects.create(business=self.business, service_name="Flooring")
        ServiceTermsTemplate.objects.create(business=self.business, service_name="Flooring", content="<p>Terms</p>")
        self.api = APIClient()
        self.api.force_authenticate(self.owner)
        self.created = 0

    def add_rows(self, count):
        for _ in range(count):
            self.created += 1
            n = self.created
            user = get_user_model().objects.create_user(f"client{n}@example.com", "pw", role="CLIENT")
            client = Client.objects.create(business=self.business, user=user, name=f"Client {n}")
            BankingInformation.objects.create(client=client, payment_method_type="CARD", is_active=True)
            service = Service.objects.create(
                client=client, business=self.business, service_name="Flooring", description="Work",
                start_date=date.today(), service_type="ONE_TIME", price=Decimal("100.00"), currency="CAD",
                status="PENDING", street_address=f"{n} Street", city="Calgary", country="CA",
                province_state="AB", postal_code="T2T2T2",
            )
            Quote.objects.create(service=service, payment_terms="NET_15",
                                 valid_until=date.today() + timedelta(days=5))
            employee = get_user_model().objects.create_user(f"emp{n}@example.com", "pw", role="EMPLOYEE")
            member = TeamMember.objects.create(business=self.business, employee=employee)
            Job.objects.create(service=service, assigned_to=member, title=f"Job {n}",
                               scheduled_date=date.today())
            invoice = Invoice.objects.create(
                business=self.business, client=client, service=service, due_date=date.today(), status="SENT",
                subtotal=10, tax_rate=0, tax_amount=0, total_amount=10,
            )
            Payout.objects.create(business=self.business, invoice=invoice, amount=10, status="PAID")

    def query_counts(self):
        counts = {}
        for name, url in LIST_URLS.items():
            with CaptureQueriesContext(connection) as queries:
                response = self.api.get(url, {"page": 1, "page_size": 50})
            self.assertEqual(response.status_code, 200, (name, response.data))
            counts[name] = len(queries)
        return counts

    def test_query_count_does_not_grow_with_rows(self):
        self.add_rows(2)
        few = self.query_counts()
        self.add_rows(6)
        many = self.query_counts()
        self.assertEqual(few, many)
