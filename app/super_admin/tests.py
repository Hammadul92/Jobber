from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient


class DashboardSecurityTests(TestCase):
    def test_every_record_and_action_endpoint_rejects_non_superusers(self):
        from .views import RESOURCES

        staff = get_user_model().objects.create_user(
            "matrix-staff@example.test", "password", is_staff=True
        )
        paths = [
            "overview/",
            "system/",
            "search/?q=test",
            "notifications/",
            "documents/invoices/1/",
            "media/users/1/photo/",
        ]
        paths += ["records/%s/" % key for key in RESOURCES]
        paths += ["actions/%s/" % key for key in RESOURCES]
        for user in (None, staff):
            self.client.logout()
            if user:
                self.client.force_login(user)
            for path in paths:
                with self.subTest(user="staff" if user else "anonymous", path=path):
                    self.assertEqual(self.client.get("/api/super-admin/" + path).status_code, 403)

    def test_superusers_are_separate_and_have_readable_platform_role(self):
        from core import models

        regular = get_user_model().objects.create_user(
            "regular@example.test", "password", name="Regular Account", is_staff=True
        )
        inactive = get_user_model().objects.create_user(
            "inactive-admin@example.test", "password", is_superuser=True, is_active=False
        )
        business = models.Business.objects.create(owner=self.user, name="Admin Owned Business")
        self.client.force_login(self.user)
        users = self.client.get("/api/super-admin/records/users/").data
        self.assertEqual([item["id"] for item in users["results"]], [regular.pk])
        admins = self.client.get("/api/super-admin/records/admins/").data
        self.assertEqual({item["id"] for item in admins["results"]}, {self.user.pk, inactive.pk})
        self.assertTrue(all(item["role"] == "Super Admin" for item in admins["results"]))
        self.assertEqual(
            self.client.get("/api/super-admin/records/admins/", {"role": "Super Admin"}).data[
                "count"
            ],
            2,
        )
        exported = self.client.get("/api/super-admin/records/users/?export=csv").content.decode()
        self.assertIn(regular.email, exported)
        self.assertNotIn(self.user.email, exported)
        self.assertNotIn(inactive.email, exported)
        admin_export = self.client.get(
            "/api/super-admin/records/admins/?export=csv"
        ).content.decode()
        self.assertIn("Super Admin", admin_export)
        overview = self.client.get("/api/super-admin/overview/").data
        self.assertEqual(overview["counts"]["users"], 1)
        self.assertEqual(overview["counts"]["admins"], 2)
        related = self.client.get("/api/super-admin/records/businesses/%s/" % business.pk).data
        self.assertEqual(related["record"]["_relations"]["owner"]["resource"], "admins")
        self.assertTrue(
            any(
                link.get("id") == self.user.pk and link["resource"] == "admins"
                for link in related["links"]
            )
        )
        search = self.client.get("/api/super-admin/search/", {"q": self.user.email}).data
        self.assertTrue(any(item["resource"] == "admins" for item in search["results"]))
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, "USER")

    def test_deleted_membership_is_inactive_without_disabling_shared_account(self):
        from core import models

        business = models.Business.objects.create(owner=self.user, name="Team business")
        employee = get_user_model().objects.create_user(
            "member@example.test", "password", name="Team Person", role="EMPLOYEE"
        )
        member = models.TeamMember.objects.create(business=business, employee=employee)
        member.soft_delete(user=self.user)
        self.client.force_login(self.user)
        endpoint = "/api/super-admin/records/team/"
        response = self.client.get(endpoint)
        self.assertFalse(response.data["results"][0]["is_active"])
        self.assertNotIn("employee", [field["name"] for field in response.data["fields"]])
        self.assertEqual(self.client.get(endpoint + "?is_active=true").data["count"], 0)
        self.assertEqual(self.client.get(endpoint + "?is_active=false").data["count"], 1)
        detail = self.client.get(endpoint + str(member.pk) + "/").data
        self.assertFalse(detail["record"]["is_active"])
        self.assertTrue(any(link["resource"] == "users" for link in detail["links"]))
        exported = self.client.get(endpoint + "?export=csv").content.decode()
        self.assertNotIn("Employee", exported.splitlines()[0])
        employee.refresh_from_db()
        self.assertTrue(employee.is_active)
        member.restore()
        self.assertTrue(self.client.get(endpoint).data["results"][0]["is_active"])

    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=True)
        self.user = get_user_model().objects.create_user(
            "super@example.com", "A-valid-test-password", is_superuser=True
        )

    def test_anonymous_cannot_read(self):
        self.assertEqual(self.client.get("/api/super-admin/overview/").status_code, 403)

    def test_staff_only_cannot_read(self):
        self.user.is_superuser = False
        self.user.is_staff = True
        self.user.save()
        self.client.force_login(self.user)
        self.assertEqual(self.client.get("/api/super-admin/overview/").status_code, 403)

    def test_active_superuser_without_staff_can_read(self):
        self.client.force_login(self.user)
        self.assertEqual(self.client.get("/api/super-admin/overview/").status_code, 200)
        response = self.client.get("/api/super-admin/records/admins/")
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("password", response.data["results"][0])

    def test_revocation_takes_effect(self):
        self.client.force_login(self.user)
        self.user.is_superuser = False
        self.user.save()
        self.assertEqual(self.client.get("/api/super-admin/overview/").status_code, 403)

    def test_inactive_cannot_read(self):
        self.user.is_active = False
        self.user.save()
        self.client.force_login(self.user)
        self.assertEqual(self.client.get("/api/super-admin/overview/").status_code, 403)

    def test_login_requires_csrf(self):
        response = self.client.post(
            "/api/super-admin/auth/",
            {"email": self.user.email, "password": "A-valid-test-password"},
        )
        self.assertEqual(response.status_code, 403)

    def test_all_resources_and_details(self):
        from super_admin.views import RESOURCES

        self.client.force_login(self.user)
        for resource in RESOURCES:
            response = self.client.get("/api/super-admin/records/%s/" % resource)
            self.assertEqual(response.status_code, 200, resource)
        detail = self.client.get("/api/super-admin/records/admins/%s/" % self.user.pk)
        self.assertEqual(detail.status_code, 200)
        self.assertNotIn("password", detail.data["record"])

    def test_readonly_and_invalid_filters(self):
        self.client.force_login(self.user)
        self.assertIn(
            self.client.post("/api/super-admin/records/users/", {}).status_code, [403, 405]
        )
        self.assertEqual(
            self.client.get("/api/super-admin/records/users/?page=invalid").status_code, 400
        )

    def test_csrf_login_export_and_logout(self):
        csrf = self.client.get("/api/super-admin/auth/").data["csrf"]
        response = self.client.post(
            "/api/super-admin/auth/",
            {"email": self.user.email, "password": "A-valid-test-password"},
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 200)
        response = self.client.get("/api/super-admin/records/users/?export=csv")
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("password", response.content.decode())
        csrf = self.client.get("/api/super-admin/auth/").data["csrf"]
        self.assertEqual(
            self.client.delete("/api/super-admin/auth/", HTTP_X_CSRFTOKEN=csrf).status_code, 200
        )
        self.assertEqual(self.client.get("/api/super-admin/overview/").status_code, 403)

    def test_model_changes_record_safe_events(self):
        from super_admin.models import PlatformEvent

        self.assertTrue(
            PlatformEvent.objects.filter(entity="user", entity_id=self.user.pk).exists()
        )
        event = PlatformEvent.objects.filter(entity="user", entity_id=self.user.pk).first()
        self.assertNotIn("password", event.summary)
        self.assertNotIn("email", event.summary)

    def test_search_system_and_protected_documents(self):
        self.client.force_login(self.user)
        response = self.client.get("/api/super-admin/search/?q=super")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["results"])
        self.assertEqual(self.client.get("/api/super-admin/system/").status_code, 200)
        self.client.logout()
        for path in ("search/?q=super", "system/", "documents/invoices/1/", "media/users/1/photo/"):
            self.assertEqual(self.client.get("/api/super-admin/" + path).status_code, 403)

    def test_stripe_comparison_is_readonly(self):
        from types import SimpleNamespace
        from unittest.mock import Mock, patch
        from django.test import override_settings

        payment = SimpleNamespace(
            stripe_payment_intent_id="pi_test",
            stripe_account_id="acct_test",
            status="PAID",
            amount="10.00",
        )
        remote = SimpleNamespace(status="succeeded", amount=1000, currency="cad")
        self.client.force_login(self.user)
        csrf = self.client.get("/api/super-admin/auth/").data["csrf"]
        qs = Mock()
        qs.filter.return_value.first.return_value = payment
        with override_settings(STRIPE_SECRET_KEY="sk_test_placeholder"), patch(
            "super_admin.views.queryset", return_value=qs
        ), patch("stripe.PaymentIntent.retrieve", return_value=remote) as retrieve:
            response = self.client.post(
                "/api/super-admin/reconcile/payments/1/", {}, HTTP_X_CSRFTOKEN=csrf
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["provider_status"], "succeeded")
        self.assertEqual(response.data["provider_amount_minor_units"], 1000)
        self.assertEqual(payment.status, "PAID")
        retrieve.assert_called_once_with(
            "pi_test", api_key="sk_test_placeholder", stripe_account="acct_test"
        )

    def test_shared_pagination_and_date_filters(self):
        self.client.force_login(self.user)
        response = self.client.get("/api/super-admin/records/users/?page_size=10")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["page_size"], 10)
        self.assertEqual(
            self.client.get("/api/super-admin/records/users/?page_size=1000").status_code, 400
        )
        self.assertEqual(
            self.client.get(
                "/api/super-admin/records/users/?date_field=last_login&from=2020-01-01"
            ).status_code,
            200,
        )
        self.assertEqual(
            self.client.get(
                "/api/super-admin/records/invoices/?date_field=due_date&from=2020-01-01"
            ).status_code,
            200,
        )

    def test_image_metadata_and_protected_preview(self):
        import io
        import tempfile
        from PIL import Image
        from django.core.files.base import ContentFile
        from django.test import override_settings

        image = io.BytesIO()
        Image.new("RGB", (2, 2), color="white").save(image, format="PNG")
        with tempfile.TemporaryDirectory() as media_root, override_settings(MEDIA_ROOT=media_root):
            self.user.photo.save("avatar.png", ContentFile(image.getvalue()), save=True)
            self.client.force_login(self.user)
            detail = self.client.get("/api/super-admin/records/admins/%s/" % self.user.pk)
            photo_field = next(f for f in detail.data["fields"] if f["name"] == "photo")
            self.assertEqual(photo_field["type"], "ImageField")
            self.assertTrue(detail.data["record"]["photo"])
            response = self.client.get("/api/super-admin/media/admins/%s/photo/" % self.user.pk)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(b"".join(response.streaming_content), image.getvalue())

    def test_readable_relationships_names_and_exports(self):
        import csv
        import io
        from datetime import date, timedelta
        from django.utils import timezone
        from core import models

        self.user.name = "Ada Owner"
        self.user.save()
        business = models.Business.objects.create(
            owner=self.user, name="Clearwater Services", slug="clearwater"
        )
        business.services_offered.add("Floor Cleaning")
        customer = get_user_model().objects.create_user(
            "client@example.test", "password", name="Sam Customer"
        )
        client = models.Client.objects.create(business=business, user=customer, name="")
        employee = get_user_model().objects.create_user(
            "employee@example.test", "password", name="Robin Employee", role="EMPLOYEE"
        )
        member = models.TeamMember.objects.create(business=business, employee=employee)
        service = models.Service.objects.create(
            client=client,
            business=business,
            service_name="Floor Cleaning",
            start_date=date.today(),
            price=100,
        )
        job = models.Job.objects.create(
            service=service, title="Office Clean", scheduled_date=timezone.now()
        )
        models.JobAssignment.objects.create(job=job, team_member=member)
        models.JobPhoto.objects.create(job=job, photo="stored.jpg", photo_type="BEFORE")
        models.ServiceQuestionnaire.objects.create(business=business, service_name="Floor Cleaning")
        models.ServiceTermsTemplate.objects.create(
            business=business, service_name="Floor Cleaning", content="Terms"
        )
        models.Quote.objects.create(service=service, valid_until=date.today() + timedelta(days=10))
        invoice = models.Invoice.objects.create(
            business=business,
            client=client,
            service=service,
            subtotal=100,
            tax_amount=0,
            total_amount=100,
        )
        payment = models.Payout.objects.create(business=business, invoice=invoice, amount=100)
        models.PayoutRefund.objects.create(payout=payment, amount=10, stripe_refund_id="re_fixture")
        models.BankingInformation.objects.create(
            client=client, card_brand="Visa", card_last4="4242"
        )
        models.FAQ.objects.create(question="How does cleaning work?", answer="Book a service.")
        models.ServiceOption.objects.get_or_create(name="Cleaning", defaults={"slug": "cleaning"})
        self.client.force_login(self.user)
        response = self.client.get("/api/super-admin/records/businesses/")
        record = response.data["results"][0]
        self.assertEqual(record["_label"], "Clearwater Services")
        self.assertEqual(record["_relations"]["owner"]["label"], "Ada Owner")
        clients = self.client.get("/api/super-admin/records/clients/").data["results"]
        self.assertEqual(clients[0]["name"], "Sam Customer")
        team = self.client.get("/api/super-admin/records/team/?search=Robin").data["results"]
        self.assertEqual(team[0]["display_name"], "Robin Employee")
        self.assertEqual(
            self.client.get("/api/super-admin/records/businesses/?owner_search=Ada").data["count"],
            1,
        )
        self.assertEqual(
            self.client.get("/api/super-admin/records/businesses/?owner_search=Nobody").data[
                "count"
            ],
            0,
        )
        from super_admin.views import RESOURCES

        for resource in RESOURCES:
            response = self.client.get("/api/super-admin/records/%s/" % resource)
            self.assertEqual(response.status_code, 200, resource)
            self.assertTrue(any(f.get("primary") for f in response.data["fields"]), resource)
            self.assertFalse(
                any(
                    f["name"] == "id" or f["name"].endswith("_id") for f in response.data["fields"]
                ),
                resource,
            )
            export = self.client.get("/api/super-admin/records/%s/?export=csv" % resource)
            self.assertEqual(export.status_code, 200, resource)
        export = self.client.get("/api/super-admin/records/businesses/?export=csv")
        rows = list(csv.DictReader(io.StringIO(export.content.decode())))
        self.assertEqual(rows[0]["Owner"], "Ada Owner")
        self.assertNotIn("Id", rows[0])
        detail = self.client.get("/api/super-admin/records/businesses/%s/" % business.pk)
        self.assertTrue(any("Ada Owner" in link["label"] for link in detail.data["links"]))

    def test_readable_labels_do_not_add_queries_per_row(self):
        from core.models import Business
        from django.db import connection
        from django.test.utils import CaptureQueriesContext

        self.client.force_login(self.user)
        Business.objects.create(owner=self.user, name="First business", slug="first")
        with CaptureQueriesContext(connection) as baseline:
            self.client.get("/api/super-admin/records/businesses/")
        for number in range(4):
            Business.objects.create(
                owner=self.user, name="Business %s" % number, slug="business-%s" % number
            )
        with CaptureQueriesContext(connection) as larger:
            response = self.client.get("/api/super-admin/records/businesses/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(baseline), len(larger))
