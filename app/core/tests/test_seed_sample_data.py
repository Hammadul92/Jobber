import json
import tempfile
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase

from core.models import (
    Business,
    Client,
    Job,
    Quote,
    Service,
    ServiceQuestionnaire,
    ServiceTermsTemplate,
    TeamMember,
)


class SeedSampleDataCommandTests(TestCase):
    def setUp(self):
        self.media_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.media_directory.cleanup)
        self.media_override = self.settings(MEDIA_ROOT=self.media_directory.name)
        self.media_override.enable()
        self.addCleanup(self.media_override.disable)
        self.admin = get_user_model().objects.create_superuser(
            "admin@example.com", "AdminPass123!"
        )
        self.fixture = {
            "default_password": "SamplePass123!",
            "businesses": [
                {
                    "name": "Sample Services",
                    "slug": "sample-services",
                    "phone": "+1 555-555-0100",
                    "email": "hello@sample.example",
                    "business_description": "A test business.",
                    "street_address": "1 Main Street",
                    "city": "Edmonton",
                    "province_state": "AB",
                    "postal_code": "T5J 0N3",
                    "business_number": "TEST-001",
                    "services_offered": ["Cleaning"],
                    "service_templates": [
                        {
                            "service_name": "Cleaning",
                            "questions": [
                                {
                                    "text": "Which rooms should be cleaned?",
                                    "type": "input",
                                    "inputType": "text",
                                    "options": [],
                                    "required": True,
                                }
                            ],
                            "terms_and_conditions": "General cleaning terms.",
                        }
                    ],
                    "owner": {
                        "name": "Owner User",
                        "email": "owner@sample.example",
                        "phone": "+1 555-555-0101",
                    },
                    "team_members": [
                        {
                            "name": "Employee User",
                            "email": "employee@sample.example",
                            "phone": "+1 555-555-0102",
                        }
                    ],
                    "clients": [
                        {
                            "name": "Client User",
                            "email": "client@sample.example",
                            "phone": "+1 555-555-0103",
                        }
                    ],
                    "services": [
                        {
                            "client_email": "client@sample.example",
                            "service_name": "Cleaning",
                            "price": "100.00",
                            "street_address": "2 Main Street",
                            "city": "Edmonton",
                            "province_state": "AB",
                            "postal_code": "T5J 0N4",
                            "status": "ACTIVE",
                            "filled_questionnaire": {
                                "Which rooms should be cleaned?": "Kitchen"
                            },
                            "quote": {
                                "status": "SIGNED",
                                "signature": "sample-signature.png",
                                "additional_terms": "Client-specific terms.",
                            },
                            "jobs": [
                                {
                                    "title": "First visit",
                                    "assigned_to_email": "employee@sample.example",
                                    "scheduled_in_days": 1,
                                }
                            ],
                        }
                    ],
                }
            ],
        }

    def _fixture_path(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        fixture_path = Path(directory.name) / "sample-data.json"
        fixture_path.write_text(json.dumps(self.fixture), encoding="utf-8")
        (Path(directory.name) / "sample-signature.png").write_bytes(b"fixture")
        return str(fixture_path)

    def test_reset_preserves_admin_and_seeds_relationships(self):
        old_user = get_user_model().objects.create_user("old@example.com", "password")
        Business.objects.create(
            owner=old_user,
            name="Old Business",
            slug="old-business",
            phone="555",
            email="old@example.com",
            business_description="Old data",
            street_address="Old Street",
            city="Edmonton",
            province_state="AB",
            postal_code="T5J 0N1",
            business_number="OLD-1",
        )

        call_command("seed_sample_data", "--reset", "--input", self._fixture_path())

        self.assertTrue(get_user_model().objects.filter(pk=self.admin.pk).exists())
        self.assertFalse(get_user_model().objects.filter(email="old@example.com").exists())
        self.assertEqual(Business.objects.count(), 1)
        self.assertEqual(ServiceQuestionnaire.objects.count(), 1)
        self.assertEqual(ServiceTermsTemplate.objects.count(), 1)
        self.assertEqual(TeamMember.objects.count(), 1)
        self.assertEqual(Client.objects.count(), 1)
        self.assertEqual(Service.objects.count(), 1)
        self.assertEqual(Quote.objects.count(), 1)
        self.assertEqual(Job.objects.count(), 1)
        self.assertEqual(
            Job.objects.get().assigned_to.employee.email, "employee@sample.example"
        )
        self.assertTrue(
            get_user_model()
            .objects.get(email="owner@sample.example")
            .check_password("SamplePass123!")
        )
        quote = Quote.objects.get()
        self.assertEqual(quote.status, "SIGNED")
        self.assertEqual(quote.general_terms_conditions, "General cleaning terms.")
        self.assertIsNotNone(quote.signed_at)
        self.assertTrue(quote.signature.name.startswith("signatures/"))

    def test_reset_requires_an_admin(self):
        self.admin.delete()

        with self.assertRaisesMessage(CommandError, "no superuser"):
            call_command("seed_sample_data", "--reset", "--input", self._fixture_path())

    def test_dry_run_rolls_back_changes(self):
        call_command("seed_sample_data", "--dry-run", "--input", self._fixture_path())

        self.assertEqual(Business.objects.count(), 0)
        self.assertEqual(get_user_model().objects.count(), 1)

    def test_remove_deletes_only_fixture_data(self):
        unrelated_user = get_user_model().objects.create_user(
            "unrelated@example.com", "password"
        )
        call_command("seed_sample_data", "--input", self._fixture_path())

        call_command("seed_sample_data", "--remove", "--input", self._fixture_path())

        self.assertEqual(Business.objects.count(), 0)
        self.assertEqual(ServiceQuestionnaire.objects.count(), 0)
        self.assertEqual(ServiceTermsTemplate.objects.count(), 0)
        self.assertEqual(TeamMember.objects.count(), 0)
        self.assertEqual(Client.objects.count(), 0)
        self.assertEqual(Service.objects.count(), 0)
        self.assertEqual(Quote.objects.count(), 0)
        self.assertEqual(Job.objects.count(), 0)
        self.assertTrue(get_user_model().objects.filter(pk=self.admin.pk).exists())
        self.assertTrue(
            get_user_model().objects.filter(pk=unrelated_user.pk).exists()
        )
        self.assertFalse(
            get_user_model().objects.filter(email="owner@sample.example").exists()
        )

    def test_remove_is_idempotent(self):
        call_command("seed_sample_data", "--remove", "--input", self._fixture_path())

        self.assertEqual(Business.objects.count(), 0)
        self.assertEqual(get_user_model().objects.count(), 1)

    def test_remove_dry_run_rolls_back_changes(self):
        call_command("seed_sample_data", "--input", self._fixture_path())

        call_command(
            "seed_sample_data",
            "--remove",
            "--dry-run",
            "--input",
            self._fixture_path(),
        )

        self.assertEqual(Business.objects.count(), 1)
        self.assertTrue(
            get_user_model().objects.filter(email="owner@sample.example").exists()
        )

    def test_update_logos_requires_existing_fixture_business(self):
        with self.assertRaisesMessage(CommandError, "business does not exist"):
            call_command(
                "seed_sample_data",
                "--update-logos",
                "--input",
                self._fixture_path(),
            )

    def test_update_phones_changes_only_fixture_records(self):
        call_command("seed_sample_data", "--input", self._fixture_path())
        owner = get_user_model().objects.get(email="owner@sample.example")
        owner.phone = "+1 555-555-9999"
        owner.save(update_fields=["phone"])

        call_command(
            "seed_sample_data",
            "--update-phones",
            "--input",
            self._fixture_path(),
        )

        owner.refresh_from_db()
        self.assertEqual(owner.phone, "+1 555-555-0101")
        self.assertEqual(Business.objects.get().phone, "+1 555-555-0100")

    def test_seed_rejects_invalid_phone_format(self):
        self.fixture["businesses"][0]["owner"]["phone"] = "+1-555-555-0101"

        with self.assertRaisesMessage(CommandError, "phone must use"):
            call_command("seed_sample_data", "--input", self._fixture_path())

    def test_jobs_require_completed_questionnaire(self):
        self.fixture["businesses"][0]["services"][0][
            "filled_questionnaire"
        ] = None

        with self.assertRaisesMessage(CommandError, "completed questionnaire"):
            call_command("seed_sample_data", "--input", self._fixture_path())

    def test_jobs_require_signed_quote(self):
        self.fixture["businesses"][0]["services"][0]["quote"]["status"] = "SENT"

        with self.assertRaisesMessage(CommandError, "signed quote"):
            call_command("seed_sample_data", "--input", self._fixture_path())

    def test_signed_quote_requires_signature(self):
        self.fixture["businesses"][0]["services"][0]["quote"].pop("signature")

        with self.assertRaisesMessage(CommandError, "requires a signature"):
            call_command("seed_sample_data", "--input", self._fixture_path())

    def test_templates_must_cover_every_offered_service(self):
        self.fixture["businesses"][0]["service_templates"] = []

        with self.assertRaisesMessage(CommandError, "must cover every offered service"):
            call_command("seed_sample_data", "--input", self._fixture_path())
