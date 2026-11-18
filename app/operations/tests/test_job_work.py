"""Tests for multi-member jobs, job hours and bulk job generation."""
from datetime import date, datetime, timedelta
from decimal import Decimal

import pytz
from django.contrib.auth import get_user_model
from django.core import mail
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from core.models import Client, Job, Service, TeamMember
from operations.job_work import team_member_hours
from operations.tests.test_operations_api import create_business

JOBS_URL = reverse("operations:job-list")
GENERATE_URL = reverse("operations:job-generate")


def job_action(job, name):
    return reverse(f"operations:job-{name}", args=[job.pk])


class JobWorkTests(TestCase):

    def setUp(self):
        users = get_user_model().objects
        self.owner = users.create_user("owner@example.com", "pw", role="MANAGER", name="Owner")
        self.business = create_business(owner=self.owner, slug="snow-co", timezone="America/Edmonton")
        self.members = []
        for name in ("Ava", "Ben", "Cy"):
            employee = users.create_user(f"{name.lower()}@example.com", "pw", role="EMPLOYEE", name=name)
            self.members.append(TeamMember.objects.create(business=self.business, employee=employee))
        client_user = users.create_user("client@example.com", "pw", role="CLIENT", name="Pat")
        self.client_record = Client.objects.create(business=self.business, user=client_user, name="Pat")
        self.services = [self.make_service("Snow removal"), self.make_service("Snow salting")]
        self.api = APIClient()
        self.api.force_authenticate(self.owner)

    def make_service(self, name):
        return Service.objects.create(
            client=self.client_record, business=self.business, service_name=name,
            start_date=date(2026, 1, 1), price=Decimal("50.00"), status="ACTIVE",
            street_address="1 St", city="Calgary", province_state="AB", postal_code="T2T2T2",
        )

    def make_job(self, members):
        job = Job.objects.create(service=self.services[0], title="Plow", scheduled_date=timezone.now())
        job.assignees.add(*members)
        return job

    def test_job_accepts_several_assignees_from_the_same_business(self):
        res = self.api.post(JOBS_URL, {
            "service": self.services[0].pk,
            "assignees": [m.pk for m in self.members[:2]],
            "title": "Plow driveway",
            "scheduled_date": timezone.now().isoformat(),
        }, format="json")

        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertEqual(res.data["assignee_names"], "Ava, Ben")
        self.assertEqual(len(mail.outbox), 2)

        other = create_business(owner=get_user_model().objects.create_user("o2@example.com", "pw", role="MANAGER"),
                                slug="other-co")
        outsider = TeamMember.objects.create(business=other, employee=other.owner)
        res = self.api.patch(reverse("operations:job-detail", args=[res.data["id"]]),
                             {"assignees": [outsider.pk]}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_start_then_complete_credits_each_member_with_elapsed_hours(self):
        job = self.make_job(self.members[:2])
        self.api.post(job_action(job, "start"))
        job.refresh_from_db()
        self.assertEqual(job.status, "IN_PROGRESS")
        Job.objects.filter(pk=job.pk).update(started_at=timezone.now() - timedelta(hours=2, minutes=30))

        res = self.api.post(job_action(job, "complete"), {"member_hours": {str(self.members[1].pk): 1}},
                            format="json")

        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.assertEqual(res.data["status"], "COMPLETED")
        self.assertEqual(res.data["hours_worked"], "2.50")
        self.assertEqual(res.data["person_hours"], "3.50")
        hours = {d["name"]: d["hours_worked"] for d in res.data["assignee_details"]}
        self.assertEqual(hours, {"Ava": "2.50", "Ben": "1.00"})

    def test_complete_rejects_hours_for_someone_not_on_the_job(self):
        job = self.make_job(self.members[:1])
        res = self.api.post(job_action(job, "complete"), {"member_hours": {str(self.members[2].pk): 1}},
                            format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_generate_creates_one_pending_job_per_service_for_the_whole_team(self):
        res = self.api.post(GENERATE_URL, {
            "service_ids": [s.pk for s in self.services],
            "scheduled_date": "2026-12-03T07:00:00-07:00",
        }, format="json")

        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertEqual(len(res.data), 2)
        titles = sorted(job["title"] for job in res.data)
        self.assertEqual(titles, ["Snow removal – Pat – Dec 3", "Snow salting – Pat – Dec 3"])
        for job in Job.objects.all():
            self.assertEqual(job.status, "PENDING")
            self.assertEqual(job.assignees.count(), 3)

    def test_generate_with_chosen_members_and_title(self):
        res = self.api.post(GENERATE_URL, {
            "service_ids": [self.services[0].pk],
            "scheduled_date": "2026-12-03T07:00:00-07:00",
            "title": "Snow storm",
            "assignee_ids": [self.members[0].pk],
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertEqual(res.data[0]["title"], "Snow storm – Pat – Dec 3")
        self.assertEqual(res.data[0]["assignee_names"], "Ava")

    def test_generate_rejects_other_business_services_and_non_owners(self):
        other_owner = get_user_model().objects.create_user("o3@example.com", "pw", role="MANAGER")
        self.api.force_authenticate(other_owner)
        res = self.api.post(GENERATE_URL, {
            "service_ids": [self.services[0].pk], "scheduled_date": "2026-12-03T07:00:00Z",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Job.objects.exists())

        self.api.force_authenticate(self.members[0].employee)
        res = self.api.post(GENERATE_URL, {
            "service_ids": [self.services[0].pk], "scheduled_date": "2026-12-03T07:00:00Z",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_team_member_hours_by_day_month_and_year(self):
        tz = pytz.timezone("America/Edmonton")
        member = self.members[0]
        for when, hours in (
            (datetime(2026, 11, 17, 9), "2.00"),
            (datetime(2026, 11, 17, 23, 30), "1.50"),  # still Nov 17 locally
            (datetime(2026, 11, 2, 12), "4.00"),
            (datetime(2025, 6, 1, 12), "8.00"),
        ):
            job = Job.objects.create(service=self.services[0], title="Plow", scheduled_date=timezone.now(),
                                     status="COMPLETED", completed_at=tz.localize(when))
            job.assignees.add(member, through_defaults={"hours_worked": Decimal(hours)})

        hours = team_member_hours(member, today=date(2026, 11, 17))

        self.assertEqual(hours["today"], "3.50")
        self.assertEqual(hours["this_month"], "7.50")
        self.assertEqual(hours["this_year"], "7.50")
        self.assertEqual(hours["total"], "15.50")
        self.assertEqual(hours["yearly"], [{"year": 2025, "hours": "8.00"}, {"year": 2026, "hours": "7.50"}])
        self.assertEqual(hours["daily"][-1], {"date": "2026-11-17", "hours": "3.50"})
        self.assertEqual(hours["monthly"][-1], {"month": "2026-11", "hours": "7.50"})

        res = self.api.get(reverse("operations:teammember-hours", args=[member.pk]))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["total"], "15.50")
