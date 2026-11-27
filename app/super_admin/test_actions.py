from datetime import date, timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from core import models
from super_admin.views import RESOURCES


class RecordActionsTests(TestCase):
    def setUp(self):
        self.actor = models.User.objects.create_user(
            "actions-admin@example.test", "Test-Password-123!", is_superuser=True
        )
        self.customer = models.User.objects.create_user("customer@example.test", "password")
        self.business = models.Business.objects.create(owner=self.actor, name="Action Business")
        self.business.services_offered.add("Floor Cleaning")
        self.customer_record = models.Client.objects.create(
            business=self.business, user=self.customer, name="Action Customer"
        )
        self.service = models.Service.objects.create(
            business=self.business,
            client=self.customer_record,
            service_name="Floor Cleaning",
            start_date=date.today(),
            price=100,
        )
        self.quote = models.Quote.objects.create(
            service=self.service, valid_until=date.today() + timedelta(days=10)
        )
        self.invoice = models.Invoice.objects.create(
            business=self.business,
            client=self.customer_record,
            service=self.service,
            subtotal=100,
            total_amount=100,
        )
        self.payment = models.Payout.objects.create(
            business=self.business, invoice=self.invoice, amount=100
        )
        self.refund = models.PayoutRefund.objects.create(
            payout=self.payment, amount=10, stripe_refund_id="re_action_test"
        )
        self.job = models.Job.objects.create(
            service=self.service, title="Action Job", scheduled_date=timezone.now()
        )
        self.photo = models.JobPhoto.objects.create(
            job=self.job, photo="action.jpg", photo_type="BEFORE"
        )
        self.employee = models.User.objects.create_user(
            "employee-actions@example.test", "password", role="EMPLOYEE"
        )
        self.member = models.TeamMember.objects.create(
            business=self.business, employee=self.employee
        )
        self.assignment = models.JobAssignment.objects.create(
            job=self.job, team_member=self.member, hours_worked=2
        )
        self.client = APIClient()
        self.client.force_login(self.actor)

    def endpoint(self, resource, obj=None):
        return "/api/super-admin/actions/%s/%s" % (resource, str(obj.pk) + "/" if obj else "")

    def action(self, resource, obj, operation):
        endpoint = self.endpoint(resource, obj)
        preview = self.client.get(endpoint, {"operation": operation})
        self.assertEqual(preview.status_code, 200, preview.data)
        response = self.client.post(
            endpoint, {"operation": operation, "token": preview.data["token"]}, format="json"
        )
        self.assertEqual(response.status_code, 200, response.data)
        return preview.data

    def test_service_cascade_exactly_matches_preview_and_restores(self):
        prior = models.JobPhoto.objects.create(job=self.job, photo="old.jpg", photo_type="AFTER")
        prior.soft_delete(user=self.actor)
        preview = self.action("services", self.service, "delete")
        expected = {
            ("services", self.service.pk),
            ("quotes", self.quote.pk),
            ("invoices", self.invoice.pk),
            ("payments", self.payment.pk),
            ("refunds", self.refund.pk),
            ("jobs", self.job.pk),
            ("photos", self.photo.pk),
            ("assignments", self.assignment.pk),
        }
        self.assertEqual({(r["resource"], r["id"]) for r in preview["records"]}, expected)
        for obj in (
            self.service,
            self.quote,
            self.invoice,
            self.payment,
            self.refund,
            self.job,
            self.photo,
        ):
            obj.refresh_from_db()
            self.assertTrue(obj.is_deleted)
        self.business.refresh_from_db()
        self.customer_record.refresh_from_db()
        self.customer.refresh_from_db()
        self.assertFalse(self.business.is_deleted)
        self.assertFalse(self.customer_record.is_deleted)
        self.assertFalse(self.customer.is_deleted)
        blocked = self.client.get(self.endpoint("invoices", self.invoice), {"operation": "restore"})
        self.assertEqual(blocked.status_code, 400)
        self.action("services", self.service, "restore")
        for obj in (
            self.service,
            self.quote,
            self.invoice,
            self.payment,
            self.refund,
            self.job,
            self.photo,
        ):
            obj.refresh_from_db()
            self.assertFalse(obj.is_deleted)
        prior.refresh_from_db()
        self.assertTrue(prior.is_deleted)
        self.assignment.refresh_from_db()
        self.assertEqual(self.assignment.hours_worked, 2)

    def test_member_delete_unassigns_children_without_deleting_job_or_account(self):
        self.action("team", self.member, "delete")
        self.assertFalse(models.JobAssignment.objects.filter(pk=self.assignment.pk).exists())
        for filters in ({}, {"is_deleted": "true"}):
            listing = self.client.get("/api/super-admin/records/assignments/", filters)
            self.assertEqual(listing.status_code, 200, listing.data)
            self.assertEqual(listing.data["count"], 1)
            self.assertTrue(listing.data["results"][0]["is_deleted"])
        detail = self.client.get("/api/super-admin/records/assignments/%s/" % self.assignment.pk)
        self.assertEqual(detail.status_code, 200, detail.data)
        self.assertTrue(detail.data["record"]["is_deleted"])
        blocked = self.client.get(
            self.endpoint("assignments", self.assignment), {"operation": "restore"}
        )
        self.assertEqual(blocked.status_code, 400)
        self.job.refresh_from_db()
        self.employee.refresh_from_db()
        self.assertFalse(self.job.is_deleted)
        self.assertTrue(self.employee.is_active)
        self.action("team", self.member, "restore")
        self.assertTrue(models.JobAssignment.objects.filter(pk=self.assignment.pk).exists())
        self.assertEqual(
            self.client.get("/api/super-admin/records/assignments/", {"is_deleted": "true"}).data[
                "count"
            ],
            0,
        )

    def test_catalog_delete_reports_unlinks_without_deleting_business(self):
        self.business.services_offered.add("Action Catalog Option")
        option = models.ServiceOption.objects.get(name="Action Catalog Option")
        preview = self.action("catalog", option, "delete")
        self.assertTrue(any(item["effect"] == "Unlink" for item in preview["records"]))
        self.business.refresh_from_db()
        self.assertFalse(self.business.is_deleted)
        self.action("catalog", option, "restore")
        self.assertTrue(
            self.business.services_offered.filter(name="Action Catalog Option").exists()
        )

    def test_all_soft_deleted_tables_partition_all_into_yes_and_no(self):
        admin = models.User.objects.create_user(
            "other-admin@example.test", "password", is_superuser=True
        )
        questionnaire = models.ServiceQuestionnaire.objects.create(
            business=self.business, service_name="Floor Cleaning"
        )
        terms = models.ServiceTermsTemplate.objects.create(
            business=self.business, service_name="Floor Cleaning", content="Test terms"
        )
        method = models.BankingInformation.objects.create(business=self.business)
        faq = models.FAQ.objects.create(question="Deletion filters?", answer="Checked")
        records = {
            "users": self.customer,
            "admins": admin,
            "businesses": self.business,
            "clients": self.customer_record,
            "team": self.member,
            "services": self.service,
            "questionnaires": questionnaire,
            "terms-templates": terms,
            "jobs": self.job,
            "photos": self.photo,
            "quotes": self.quote,
            "invoices": self.invoice,
            "payments": self.payment,
            "refunds": self.refund,
            "payment-methods": method,
            "faqs": faq,
        }
        expected = {
            key for key, model in RESOURCES.items() if issubclass(model, models.SoftDeletableModel)
        }
        self.assertEqual(set(records), expected)
        for resource, obj in records.items():
            with self.subTest(resource=resource):
                prior = {f: getattr(obj, f) for f in ("is_deleted", "deleted_at", "deleted_by_id")}
                if hasattr(obj, "is_active"):
                    prior["is_active"] = obj.is_active
                models.SoftDeletableModel.soft_delete(obj, user=self.actor, cascade=False)
                endpoint = "/api/super-admin/records/%s/" % resource
                results = []
                for deleted in ("", "true", "false"):
                    response = self.client.get(endpoint, {"is_deleted": deleted, "page_size": 100})
                    self.assertEqual(response.status_code, 200, response.data)
                    rows = response.data["results"]
                    self.assertEqual(response.data["count"], len(rows))
                    self.assertEqual(response.data["pages"], 1)
                    results.append({item["id"] for item in rows})
                all_ids, deleted_ids, live_ids = results
                self.assertIn(obj.pk, all_ids)
                self.assertIn(obj.pk, deleted_ids)
                self.assertNotIn(obj.pk, live_ids)
                self.assertEqual(all_ids, deleted_ids | live_ids)
                self.assertFalse(deleted_ids & live_ids)
                obj.__class__.all_objects.filter(pk=obj.pk).update(**prior)

    def test_direct_assignment_delete_and_restore(self):
        self.action("assignments", self.assignment, "delete")
        listing = self.client.get("/api/super-admin/records/assignments/?is_deleted=true")
        self.assertEqual(listing.status_code, 200, listing.data)
        self.assertEqual(listing.data["results"][0]["_actions"], ["restore"])
        self.action("assignments", self.assignment, "restore")
        self.assertTrue(models.JobAssignment.objects.filter(pk=self.assignment.pk).exists())

    def test_catalog_all_merges_deleted_records_before_sorting_and_pagination(self):
        options = [
            models.ServiceOption.objects.create(name="Mixed Catalog %02d" % i) for i in range(12)
        ]
        deleted = options[-1]
        self.action("catalog", deleted, "delete")
        endpoint = "/api/super-admin/records/catalog/"
        filters = {"search": "Mixed Catalog", "page_size": 10}
        combined = self.client.get(endpoint, filters).data
        self.assertEqual(combined["count"], 12)
        self.assertEqual(combined["pages"], 2)
        self.assertEqual(combined["results"][0]["id"], deleted.pk)
        self.assertTrue(combined["results"][0]["is_deleted"])
        self.assertEqual(combined["results"][0]["_actions"], ["restore"])
        second = self.client.get(endpoint, dict(filters, page=2)).data
        self.assertEqual(len(second["results"]), 2)
        self.assertEqual(
            self.client.get(endpoint, dict(filters, is_deleted="true")).data["count"], 1
        )
        self.assertEqual(
            self.client.get(endpoint, dict(filters, is_deleted="false")).data["count"], 11
        )
        exported = self.client.get(endpoint, dict(filters, export="csv")).content.decode()
        self.assertIn(deleted.name, exported)
        self.action("catalog", deleted, "restore")
        restored = self.client.get(endpoint, filters).data
        self.assertEqual(restored["count"], 12)
        self.assertFalse(any(item["is_deleted"] for item in restored["results"]))

    def test_assignment_all_includes_archive_with_related_filters(self):
        self.action("assignments", self.assignment, "delete")
        endpoint = "/api/super-admin/records/assignments/"
        result = self.client.get(endpoint).data
        self.assertEqual(result["count"], 1)
        self.assertTrue(result["results"][0]["is_deleted"])
        self.assertEqual(self.client.get(endpoint, {"is_deleted": "false"}).data["count"], 0)
        self.assertEqual(self.client.get(endpoint, {"job": self.job.pk}).data["count"], 1)
        self.assertEqual(self.client.get(endpoint, {"job": self.job.pk + 1}).data["count"], 0)

    def test_mixed_assignments_use_numeric_sort_and_consistent_date_filters(self):
        models.JobAssignment.objects.filter(pk=self.assignment.pk).update(
            created_at=timezone.now() - timedelta(days=3), hours_worked=12
        )
        self.action("assignments", self.assignment, "delete")
        job = models.Job.objects.create(
            service=self.service, title="Second job", scheduled_date=timezone.now()
        )
        live = models.JobAssignment.objects.create(job=job, team_member=self.member, hours_worked=2)
        endpoint = "/api/super-admin/records/assignments/"
        ordered = self.client.get(endpoint, {"ordering": "hours_worked"}).data
        self.assertEqual([r["id"] for r in ordered["results"]], [live.pk, self.assignment.pk])
        recent = self.client.get(endpoint, {"from": timezone.now().date().isoformat()}).data
        self.assertEqual([r["id"] for r in recent["results"]], [live.pk])
        deleted_today = self.client.get(
            endpoint, {"from": timezone.now().date().isoformat(), "date_field": "deleted_at"}
        ).data
        self.assertEqual([r["id"] for r in deleted_today["results"]], [self.assignment.pk])

    def test_edit_schemas_for_every_existing_resource(self):
        for resource, model in RESOURCES.items():
            if resource in ("audit", "activity"):
                continue
            manager = getattr(model, "all_objects", model._default_manager)
            obj = manager.first()
            if resource == "users":
                obj = self.customer
            if resource == "admins":
                obj = self.actor
            if obj:
                response = self.client.get(self.endpoint(resource, obj))
                self.assertEqual(response.status_code, 200, (resource, response.data))

    def test_stale_missing_and_cross_actor_confirmation_rejected(self):
        endpoint = self.endpoint("services", self.service)
        self.assertEqual(
            self.client.post(endpoint, {"operation": "delete"}, format="json").status_code, 409
        )
        preview = self.client.get(endpoint, {"operation": "delete"}).data
        models.JobPhoto.objects.create(job=self.job, photo="new.jpg", photo_type="AFTER")
        response = self.client.post(
            endpoint, {"operation": "delete", "token": preview["token"]}, format="json"
        )
        self.assertEqual(response.status_code, 409)
        self.service.refresh_from_db()
        self.assertFalse(self.service.is_deleted)
        preview = self.client.get(endpoint, {"operation": "delete"}).data
        another = models.User.objects.create_user(
            "another-admin@example.test", "password", is_superuser=True
        )
        self.client.force_login(another)
        self.assertEqual(
            self.client.post(
                endpoint, {"operation": "delete", "token": preview["token"]}, format="json"
            ).status_code,
            409,
        )

    def test_all_mutable_entities_offer_valid_form_schemas(self):
        for resource in RESOURCES:
            response = self.client.get(self.endpoint(resource))
            if resource in ("audit", "activity"):
                self.assertEqual(response.status_code, 400)
            else:
                self.assertEqual(response.status_code, 200, (resource, response.data))
                self.assertTrue(response.data["fields"], resource)
                self.assertNotIn("password", [f["name"] for f in response.data["fields"]])

    def test_create_edit_validation_and_activation(self):
        response = self.client.post(
            self.endpoint("faqs"),
            {"question": "Action FAQ", "answer": "Initial", "sort_order": 1},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        faq = models.FAQ.objects.get(pk=response.data["id"])
        response = self.client.post(
            self.endpoint("faqs", faq),
            {"question": "Updated FAQ", "answer": "Updated", "sort_order": 2},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        faq.refresh_from_db()
        self.assertEqual(faq.answer, "Updated")
        self.action("faqs", faq, "deactivate")
        faq.refresh_from_db()
        self.assertFalse(faq.is_active)
        self.action("faqs", faq, "activate")
        self.assertEqual(
            self.client.post(
                self.endpoint("faqs", faq), {"question": ""}, format="json"
            ).status_code,
            400,
        )

    def test_accounts_soft_delete_and_restore_inactive_self_protection(self):
        endpoint = self.endpoint("admins", self.actor)
        self.assertEqual(self.client.get(endpoint, {"operation": "delete"}).status_code, 400)
        self.assertEqual(self.client.get(endpoint, {"operation": "deactivate"}).status_code, 400)
        self.action("users", self.customer, "delete")
        self.customer.refresh_from_db()
        self.assertTrue(self.customer.is_deleted)
        self.assertFalse(self.customer.is_active)
        self.action("users", self.customer, "restore")
        self.customer.refresh_from_db()
        self.assertFalse(self.customer.is_deleted)
        self.assertFalse(self.customer.is_active)
        self.action("users", self.customer, "activate")
        self.customer.refresh_from_db()
        self.assertTrue(self.customer.is_active)

    def test_ordinary_users_and_csrf_cannot_mutate(self):
        self.client.force_login(self.customer)
        self.assertEqual(self.client.get(self.endpoint("services", self.service)).status_code, 403)
        self.assertEqual(self.client.post(self.endpoint("faqs"), {}).status_code, 403)
        csrf_client = APIClient(enforce_csrf_checks=True)
        csrf_client.force_login(self.actor)
        self.assertEqual(csrf_client.post(self.endpoint("faqs"), {}).status_code, 403)

    def test_relationship_options_use_names(self):
        response = self.client.get(
            self.endpoint("services", self.service),
            {"field": "client", "search": "Action Customer"},
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(
            response.data["options"],
            [{"value": str(self.customer_record.pk), "label": "Action Customer"}],
        )

    def schema_payload(self, resource, obj):
        response = self.client.get(self.endpoint(resource, obj))
        self.assertEqual(response.status_code, 200, response.data)
        return {f["name"]: f["value"] for f in response.data["fields"] if f["type"] != "file"}

    def test_edit_forms_round_trip_all_existing_mutable_resources(self):
        # Use complete records: the API correctly requires omitted legacy profile fields.
        models.User.all_objects.filter(pk__in=[self.actor.pk, self.customer.pk]).update(
            name="Round trip account", phone="+14035550123"
        )
        address = dict(
            street_address="123 Main St", city="Calgary", province_state="AB", postal_code="T2P 1J9"
        )
        models.Business.all_objects.filter(pk=self.business.pk).update(
            slug="action-business",
            phone="+14035550123",
            email="business@example.test",
            business_description="Test business",
            business_number="QA123",
            **address
        )
        models.Service.all_objects.filter(pk=self.service.pk).update(**address)
        models.FAQ.objects.create(question="Round trip FAQ", answer="Answer")
        models.BankingInformation.objects.create(business=self.business)
        models.ServiceQuestionnaire.objects.create(
            business=self.business, service_name="Floor Cleaning"
        )
        models.ServiceTermsTemplate.objects.create(
            business=self.business, service_name="Floor Cleaning", content="Terms"
        )
        for resource, model in RESOURCES.items():
            if resource in ("audit", "activity"):
                continue
            obj = getattr(model, "all_objects", model._default_manager).first()
            if resource == "users":
                obj = self.customer
            if resource == "admins":
                obj = self.actor
            if obj:
                with self.subTest(resource=resource):
                    response = self.client.post(
                        self.endpoint(resource, obj),
                        self.schema_payload(resource, obj),
                        format="json",
                    )
                    self.assertEqual(response.status_code, 200, response.data)

        self.assertEqual(list(self.business.services_offered.names()), ["Floor Cleaning"])

    def test_overview_counts_include_archived_catalog_and_cascaded_assignments(self):
        option = models.ServiceOption.objects.create(name="Archived Count Needle")
        self.action("catalog", option, "delete")
        self.action("team", self.member, "delete")
        counts = self.client.get("/api/super-admin/overview/").data["counts"]
        for resource in ("catalog", "assignments"):
            self.assertEqual(
                counts[resource],
                self.client.get("/api/super-admin/records/%s/" % resource).data["count"],
            )

    def test_search_covers_catalog_faq_members_and_related_financial_labels(self):
        option = models.ServiceOption.objects.create(name="Search Catalog Needle")
        faq = models.FAQ.objects.create(question="Search FAQ Needle", answer="Searchable answer")
        for term, resource, pk in [
            ("Search Catalog Needle", "catalog", option.pk),
            ("Search FAQ Needle", "faqs", faq.pk),
            ("employee-actions", "team", self.member.pk),
            (self.invoice.invoice_number, "payments", self.payment.pk),
            ("Action Job", "photos", self.photo.pk),
        ]:
            with self.subTest(resource=resource):
                results = self.client.get("/api/super-admin/search/", {"q": term}).data["results"]
                self.assertIn((resource, pk), {(r["resource"], r["id"]) for r in results})
        self.action("catalog", option, "delete")
        results = self.client.get("/api/super-admin/search/", {"q": "Search Catalog Needle"}).data[
            "results"
        ]
        self.assertIn(("catalog", option.pk), {(r["resource"], r["id"]) for r in results})

    def test_invalid_filters_are_400_even_for_empty_archives(self):
        for resource in ("catalog", "assignments", "users", "services"):
            for filters in (
                {"is_deleted": "maybe"},
                {"from": "invalid"},
                {"from": "2026-12-01", "to": "2026-01-01"},
                {"page": "0"},
                {"page_size": "bad"},
            ):
                with self.subTest(resource=resource, filters=filters):
                    response = self.client.get("/api/super-admin/records/%s/" % resource, filters)
                    self.assertEqual(response.status_code, 400, response.data)
        for deleted in ("", "true", "false"):
            response = self.client.get(
                "/api/super-admin/records/assignments/", {"job": "bad", "is_deleted": deleted}
            )
            self.assertEqual(response.status_code, 400)

    def test_large_and_unicode_numeric_searches_do_not_crash(self):
        for text in ("9" * 100, "²²"):
            for endpoint, key in (("search/", "q"), ("records/users/", "search")):
                response = self.client.get("/api/super-admin/" + endpoint, {key: text})
                self.assertEqual(response.status_code, 200, response.data)

    def test_exports_escape_spreadsheet_formulas_without_disclosing_passwords(self):
        self.customer.name = '=HYPERLINK("https://example.test", "Example")'
        self.customer.save(update_fields=["name"])
        response = self.client.get("/api/super-admin/records/users/", {"export": "csv"})
        import csv
        import io

        rows = list(csv.DictReader(io.StringIO(response.content.decode())))
        exported = next(row for row in rows if row["Email"] == self.customer.email)
        self.assertEqual(exported["Name"], "'" + self.customer.name)
        self.assertNotIn("Password", exported)
        self.assertNotIn(self.customer.password, response.content.decode())

    def test_document_and_media_routes_validate_resource_and_field(self):
        draft = self.client.get("/api/super-admin/documents/quotes/%s/" % self.quote.pk)
        self.assertEqual(draft.status_code, 400)
        detail = self.client.get("/api/super-admin/records/quotes/%s/" % self.quote.pk)
        self.assertEqual(detail.data["documents"], [])
        models.Quote.all_objects.filter(pk=self.quote.pk).update(
            signed_at=timezone.now(), status="SIGNED"
        )
        for resource, obj in (("quotes", self.quote), ("invoices", self.invoice)):
            response = self.client.get("/api/super-admin/documents/%s/%s/" % (resource, obj.pk))
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response["Content-Type"], "application/pdf")
            self.assertTrue(b"".join(response.streaming_content).startswith(b"%PDF"))
        for path in (
            "documents/users/1/",
            "media/users/%s/password/" % self.customer.pk,
            "media/unknown/1/photo/",
            "records/unknown/",
            "records/users/999999999/",
        ):
            self.assertEqual(self.client.get("/api/super-admin/" + path).status_code, 404, path)

    def test_expired_confirmation_does_not_delete_record(self):
        import time
        from unittest.mock import patch

        token = self.client.get(
            self.endpoint("services", self.service), {"operation": "delete"}
        ).data["token"]
        with patch("django.core.signing.time.time", return_value=time.time() + 601):
            response = self.client.post(
                self.endpoint("services", self.service),
                {"operation": "delete", "token": token},
                format="json",
            )
        self.assertEqual(response.status_code, 409)
        self.service.refresh_from_db()
        self.assertFalse(self.service.is_deleted)

    def test_negative_amount_and_cross_business_changes_leave_records_unchanged(self):
        for resource, obj, field in (
            ("services", self.service, "price"),
            ("payments", self.payment, "amount"),
            ("assignments", self.assignment, "hours_worked"),
        ):
            payload = self.schema_payload(resource, obj)
            payload[field] = "-1"
            response = self.client.post(self.endpoint(resource, obj), payload, format="json")
            self.assertEqual(response.status_code, 400, response.data)
            obj.refresh_from_db()
            self.assertGreaterEqual(getattr(obj, field), 0)
        other = models.Business.objects.create(owner=self.customer, name="Other business")
        payload = self.schema_payload("invoices", self.invoice)
        payload["business"] = other.pk
        response = self.client.post(self.endpoint("invoices", self.invoice), payload, format="json")
        self.assertEqual(response.status_code, 400, response.data)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.business_id, self.business.pk)
