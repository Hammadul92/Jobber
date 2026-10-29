"""
Test for business APIs
"""

import tempfile
from io import BytesIO
from datetime import date, timedelta
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import patch
import stripe

from django.conf import settings
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.core import mail
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient
from taggit.models import Tag

from core.models import (
    BankingInformation,
    Business,
    Client,
    Invoice,
    Job,
    JobPhoto,
    Payout,
    Quote,
    Service,
    ServiceQuestionnaire,
    ServiceTermsTemplate,
    TeamMember,
)

from operations.serializers import BusinessSerializer, QuoteSerializer
from finance.serializers import InvoiceSerializer


BUSINESSES_URL = reverse("operations:business-list")
BUSINESS_MARQUEE_LOGOS_URL = reverse("operations:business-marquee-logos")
SERVICE_OPTIONS_URL = reverse("operations:business-service-options")
SERVICES_URL = reverse("operations:service-list")
QUOTES_URL = reverse("operations:quote-list")
QUOTE_SIGN_URL = "operations:quote-sign-quote"
QUOTE_DOWNLOAD_PDF_URL = "operations:quote-download-pdf"
JOB_PHOTOS_URL = reverse("operations:jobphoto-list")
SERVICE_TERMS_TEMPLATES_URL = reverse(
    "operations:servicetermstemplate-list"
)
SERVICE_QUESTIONNAIRES_URL = reverse("operations:servicequestionnaire-list")
JOBS_URL = reverse("operations:job-list")


def service_detail_url(service_id):
    return reverse("operations:service-detail", args=[service_id])


def quote_detail_url(quote_id):
    return reverse("operations:quote-detail", args=[quote_id])


def quote_send_url(quote_id):
    return reverse("operations:quote-send-quote", args=[quote_id])


def team_member_detail_url(team_member_id):
    return reverse("operations:teammember-detail", args=[team_member_id])


def invoice_make_payment_url(invoice_id):
    return reverse("finance:invoice-make-payment", args=[invoice_id])


def create_business(owner, **params):
    """Create and return a sample business."""
    defaults = {
        "name": "Test Business",
        "phone": "1234567890",
        "email": "test_business@example.com",
        "business_description": "Test business description",
        "street_address": "123 test street",
        "city": "Calgary",
        "country": "CA",
        "province_state": "AB",
        "business_number": "123456789",
        "tax_rate": 5,
    }

    defaults.update(**params)

    business = Business.objects.create(owner=owner, **defaults)
    return business


def create_test_image_file(name="job-photo.png"):
    """Create a tiny valid PNG image for upload tests."""
    buffer = BytesIO()
    Image.new("RGB", (1, 1), color="white").save(buffer, format="PNG")
    buffer.seek(0)
    return SimpleUploadedFile(
        name,
        buffer.getvalue(),
        content_type="image/png",
    )


class PublicBusinessApiTests(TestCase):
    """Test unauthenticated API requests."""

    def setUp(self):
        self.client = APIClient()

    def test_auth_required(self):
        """Test auth is required to call API."""
        res = self.client.get(BUSINESSES_URL)

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_fetch_marquee_logos_returns_public_active_business_logos(self):
        """Test public marquee endpoint returns up to 10 active business logos."""
        owner = get_user_model().objects.create_user(
            "logos@example.com",
            "test123",
        )
        inactive_owner = get_user_model().objects.create_user(
            "inactive@example.com",
            "test123",
        )

        with tempfile.TemporaryDirectory() as temp_media_root:
            with self.settings(MEDIA_ROOT=temp_media_root):
                for index in range(11):
                    business = create_business(
                        owner=owner,
                        name=f"Business {index}",
                        slug=f"business-{index}",
                        postal_code=f"T2T{index:02d}",
                    )
                    business.logo.save(
                        f"logo-{index}.png",
                        create_test_image_file(f"logo-{index}.png"),
                        save=True,
                    )

                inactive_business = create_business(
                    owner=inactive_owner,
                    name="Inactive Business",
                    slug="inactive-business",
                    postal_code="T2T999",
                    is_active=False,
                )
                inactive_business.logo.save(
                    "inactive-logo.png",
                    create_test_image_file("inactive-logo.png"),
                    save=True,
                )

                create_business(
                    owner=owner,
                    name="No Logo Business",
                    slug="no-logo-business",
                    postal_code="T2T998",
                )

                res = self.client.get(BUSINESS_MARQUEE_LOGOS_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 10)
        self.assertNotIn("Inactive Business", [item["name"] for item in res.data])
        self.assertNotIn("No Logo Business", [item["name"] for item in res.data])
        self.assertTrue(all(item["logo"] for item in res.data))


class PrivateBusinessApiTests(TestCase):
    """Test authenticated API requests."""

    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            "test@example.com",
            "test123",
        )
        self.client.force_authenticate(self.user)

    def test_retrieve_businesses(self):
        """Test retrieving a list of businesses."""
        create_business(owner=self.user)

        res = self.client.get(BUSINESSES_URL)
        businesses = Business.objects.all().order_by("-id")
        serializer = BusinessSerializer(businesses, many=True)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, serializer.data)

    def test_business_list_limited_to_user(self):
        """Test list of businesses is limited to authenticated user."""
        other_user = get_user_model().objects.create_user(
            "other@example.com",
            "test123",
        )
        create_business(owner=other_user)
        create_business(owner=self.user)

        res = self.client.get(BUSINESSES_URL)
        businesses = Business.objects.filter(owner=self.user).order_by("-id")
        serializer = BusinessSerializer(businesses, many=True)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, serializer.data)

    def _business_payload(self, services):
        return {
            "name": "Catalog Services",
            "slug": "catalog-services",
            "phone": "+1 403-555-0100",
            "email": "catalog@example.com",
            "business_description": "Catalog validation business.",
            "street_address": "1 Main Street",
            "city": "Calgary",
            "country": "CA",
            "province_state": "AB",
            "postal_code": "T2P 1J9",
            "business_number": "CATALOG-1",
            "tax_rate": "5.00",
            "services_offered": services,
            "timezone": "America/Edmonton",
        }

    def test_service_options_returns_admin_managed_catalog(self):
        Tag.objects.get_or_create(name="Custom Admin Service")

        res = self.client.get(SERVICE_OPTIONS_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("Custom Admin Service", [option["name"] for option in res.data])

    def test_business_accepts_only_catalog_service_options(self):
        Tag.objects.get_or_create(name="Window Cleaning")

        res = self.client.post(
            BUSINESSES_URL,
            self._business_payload(["Window Cleaning"]),
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        business = Business.objects.get(pk=res.data["id"])
        self.assertEqual(list(business.services_offered.names()), ["Window Cleaning"])

    def test_business_rejects_unknown_service_without_creating_tag(self):
        res = self.client.post(
            BUSINESSES_URL,
            self._business_payload(["Unconfigured Service"]),
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("services_offered", res.data)
        self.assertFalse(Tag.objects.filter(name="Unconfigured Service").exists())

    def test_registration_refresh_exposes_manager_role_and_team_membership(self):
        """A post-save user refresh immediately reflects business ownership."""
        Tag.objects.get_or_create(name="Cleaning")
        me_url = reverse("user:me")
        self.assertEqual(self.client.get(me_url).data["role"], "USER")

        res = self.client.post(
            BUSINESSES_URL,
            self._business_payload(["Cleaning"]),
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, "MANAGER")
        self.assertEqual(self.client.get(me_url).data["role"], "MANAGER")
        self.assertTrue(TeamMember.objects.filter(
            business_id=res.data["id"], employee=self.user,
        ).exists())

    def test_failed_registration_does_not_grant_manager_role(self):
        """Invalid business details leave account permissions unchanged."""
        res = self.client.post(
            BUSINESSES_URL,
            self._business_payload(["Not in the catalog"]),
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertEqual(self.client.get(reverse("user:me")).data["role"], "USER")
        self.assertFalse(Business.objects.filter(owner=self.user).exists())
        self.assertFalse(TeamMember.objects.filter(employee=self.user).exists())

    def test_business_update_preserves_manager_role(self):
        """Editing a registered business keeps manager access available."""
        Tag.objects.get_or_create(name="Cleaning")
        res = self.client.post(
            BUSINESSES_URL,
            self._business_payload(["Cleaning"]),
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        updated = self.client.patch(
            reverse("operations:business-detail", args=[res.data["id"]]),
            {"name": "Updated Business"},
            format="json",
        )

        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.client.get(reverse("user:me")).data["role"], "MANAGER")


class QuoteInvoiceAutomationTests(TestCase):
    """Test automatic invoice creation around quote signing."""

    def setUp(self):
        self.client = APIClient()
        self.owner = get_user_model().objects.create_user(
            "owner@example.com",
            "test123",
            role="MANAGER",
        )
        self.client_user = get_user_model().objects.create_user(
            "client@example.com",
            "test123",
            role="CLIENT",
        )
        self.business = create_business(
            owner=self.owner,
            slug="test-business",
            postal_code="T2T2T2",
            tax_rate=Decimal("5.00"),
        )
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
            billing_cycle=None,
            status="ACTIVE",
            street_address="123 Test Street",
            city="Calgary",
            country="CA",
            province_state="AB",
            postal_code="T2T2T2",
            filled_questionnaire={"Room size": "Large"},
            auto_generate_quote=True,
            auto_generate_invoices=True,
        )
        self.quote = Quote.objects.create(
            service=self.service,
            payment_terms="NET_15",
            valid_until=date.today() + timedelta(days=2),
            terms_conditions="Test terms",
            notes="Test notes",
            status="SENT",
            tax_rate=Decimal("5.00"),
            tax_label="GST",
        )

    def test_signing_quote_creates_invoice_for_active_service(self):
        """Test signing a quote auto-creates an invoice for eligible services."""
        self.client.force_authenticate(self.client_user)
        signature = create_test_image_file("signature.png")

        with tempfile.TemporaryDirectory() as temp_media_root:
            with self.settings(MEDIA_ROOT=temp_media_root):
                res = self.client.post(
                    reverse(QUOTE_SIGN_URL, args=[self.quote.id]),
                    {"status": "SIGNED", "signature": signature},
                    format="multipart",
                )

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(Invoice.objects.filter(service=self.service).count(), 1)

        invoice = Invoice.objects.get(service=self.service)
        self.assertEqual(invoice.client, self.client_record)
        self.assertEqual(invoice.business, self.business)
        self.assertEqual(invoice.subtotal, Decimal("100.00"))
        self.assertEqual(invoice.tax_amount, Decimal("5.00"))
        self.assertEqual(invoice.total_amount, Decimal("105.00"))

    @patch("operations.views.emails.send_quote_email")
    def test_sending_quote_snapshots_tax_and_exposes_payable_total(self, send_email):
        self.quote.tax_rate = None
        self.quote.save(update_fields=["tax_rate"])
        self.client.force_authenticate(self.owner)

        response = self.client.post(quote_send_url(self.quote.id))

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        send_email.assert_called_once()
        self.quote.refresh_from_db()
        self.assertEqual(self.quote.tax_rate, Decimal("5.00"))
        self.assertEqual(self.quote.tax_label, "GST")
        detail = self.client.get(quote_detail_url(self.quote.id)).data
        self.assertEqual(detail["quoted_subtotal"], "100.00")
        self.assertEqual(detail["quoted_tax_amount"], "5.00")
        self.assertEqual(detail["quoted_total"], "105.00")

    def test_invoice_keeps_tax_rate_accepted_on_quote(self):
        self.business.tax_rate = Decimal("8.00")
        self.business.save(update_fields=["tax_rate"])
        self.client.force_authenticate(self.client_user)

        with tempfile.TemporaryDirectory() as temp_media_root:
            with self.settings(MEDIA_ROOT=temp_media_root):
                response = self.client.post(
                    reverse(QUOTE_SIGN_URL, args=[self.quote.id]),
                    {"status": "SIGNED", "signature": create_test_image_file("signature.png")},
                    format="multipart",
                )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        invoice = Invoice.objects.get(service=self.service)
        self.assertEqual(invoice.tax_rate, Decimal("5.00"))
        self.assertEqual(invoice.total_amount, Decimal("105.00"))

    def test_older_sent_quote_requires_resend_before_signing(self):
        self.quote.tax_rate = None
        self.quote.save(update_fields=["tax_rate"])
        self.client.force_authenticate(self.client_user)
        response = self.client.post(
            reverse(QUOTE_SIGN_URL, args=[self.quote.id]),
            {"status": "SIGNED", "signature": create_test_image_file("signature.png")},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("resend", response.data["detail"])
        self.assertFalse(Invoice.objects.filter(service=self.service).exists())

    def test_invoice_uses_signed_quote_item_snapshot(self):
        self.quote.line_items = [
            {"title": "Plowing", "description": "Parking lot", "price": "120.00"},
            {"title": "Walkways", "description": "Entrances", "price": "30.00"},
        ]
        self.quote.save(update_fields=["line_items"])
        self.service.price = Decimal("999.00")
        self.service.save(update_fields=["price"])
        self.client.force_authenticate(self.client_user)

        with tempfile.TemporaryDirectory() as temp_media_root:
            with self.settings(MEDIA_ROOT=temp_media_root):
                response = self.client.post(
                    reverse(QUOTE_SIGN_URL, args=[self.quote.id]),
                    {"status": "SIGNED", "signature": create_test_image_file("signature.png")},
                    format="multipart",
                )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        invoice = Invoice.objects.get(service=self.service)
        self.assertEqual(invoice.line_items, self.quote.line_items)
        self.assertEqual(invoice.subtotal, Decimal("150.00"))
        self.assertEqual(invoice.tax_amount, Decimal("7.50"))
        self.assertEqual(invoice.total_amount, Decimal("157.50"))

    def test_manager_can_download_signed_quote_pdf_with_signature(self):
        self.quote.status = "SIGNED"
        self.quote.signed_at = timezone.now()

        with tempfile.TemporaryDirectory() as temp_media_root:
            with self.settings(MEDIA_ROOT=temp_media_root):
                self.quote.signature.save(
                    "signature.png",
                    create_test_image_file("signature.png"),
                    save=True,
                )
                self.client.force_authenticate(self.owner)

                res = self.client.get(
                    reverse(QUOTE_DOWNLOAD_PDF_URL, args=[self.quote.id])
                )
                content = b"".join(res.streaming_content)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res["Content-Type"], "application/pdf")
        self.assertIn(
            f'{self.quote.quote_number}-signed.pdf',
            res["Content-Disposition"],
        )
        self.assertTrue(content.startswith(b"%PDF"))

    def test_unsigned_quote_cannot_be_downloaded_as_pdf(self):
        self.client.force_authenticate(self.owner)

        res = self.client.get(
            reverse(QUOTE_DOWNLOAD_PDF_URL, args=[self.quote.id])
        )

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            res.data["detail"],
            "Only signed quotations can be downloaded as PDF.",
        )

    def test_user_without_business_role_sees_no_services_jobs_or_photos(self):
        outsider = get_user_model().objects.create_user(
            "outsider@example.com", "test123", role="USER",
        )
        self.client.force_authenticate(user=outsider)

        for url in (SERVICES_URL, JOBS_URL, JOB_PHOTOS_URL):
            res = self.client.get(url)
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            rows = res.data["results"] if isinstance(res.data, dict) else res.data
            self.assertEqual(len(rows), 0, url)

    def test_invoice_numbers_skip_deleted_and_compare_numerically(self):
        prefix = f"INV-{timezone.now().year}-"
        fields = dict(
            business=self.business, client=self.client_record,
            due_date=date.today(), status="SENT", subtotal=10,
            tax_rate=0, tax_amount=0, total_amount=10,
        )
        Invoice.objects.create(invoice_number=f"{prefix}999", **fields)
        first = Invoice.objects.create(**fields)
        self.assertEqual(first.invoice_number, f"{prefix}1000")

        first.soft_delete(user=self.owner)
        second = Invoice.objects.create(**fields)
        self.assertEqual(second.invoice_number, f"{prefix}1001")

    def _other_business_records(self):
        other_owner = get_user_model().objects.create_user(
            "other-owner@example.com", "test123", role="MANAGER",
        )
        other_business = create_business(owner=other_owner, slug="other-business")
        other_client = Client.objects.create(
            business=other_business,
            user=get_user_model().objects.create_user("other-client@example.com", "test123", role="CLIENT"),
        )
        other_service = Service.objects.create(
            client=other_client, business=other_business, service_name="Flooring",
            description="Other", start_date=date.today(), service_type="ONE_TIME",
            price=Decimal("100.00"), currency="CAD", status="PENDING",
            street_address="9 Other Street", city="Calgary", country="CA",
            province_state="AB", postal_code="T2T2T2",
        )
        return other_business, other_client, other_service

    def test_owner_cannot_link_another_business_records(self):
        other_business, other_client, other_service = self._other_business_records()
        self.client.force_authenticate(self.owner)

        job = self.client.post(JOBS_URL, {
            "service": other_service.id, "title": "Job", "scheduled_date": timezone.now().isoformat(),
        }, format="json")
        self.assertEqual(job.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("service", job.data)

        quote = self.client.post(QUOTES_URL, {
            "service": other_service.id, "payment_terms": "NET_15",
            "valid_until": (date.today() + timedelta(days=5)).isoformat(),
        }, format="json")
        self.assertEqual(quote.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("service", quote.data)

        questionnaire = self.client.post(SERVICE_QUESTIONNAIRES_URL, {
            "business": other_business.id, "service_name": "Flooring", "questions": [],
        }, format="json")
        self.assertEqual(questionnaire.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("business", questionnaire.data)

        moved = self.client.patch(
            service_detail_url(self.service.id), {"client": other_client.id}, format="json",
        )
        self.assertEqual(moved.status_code, status.HTTP_400_BAD_REQUEST)
        self.service.refresh_from_db()
        self.assertEqual(self.service.client, self.client_record)

    def test_unchanged_relations_are_accepted_on_update(self):
        self.business.services_offered.add("Flooring")
        self.client.force_authenticate(self.owner)
        res = self.client.patch(service_detail_url(self.service.id), {
            "business": self.business.id, "client": self.client_record.id,
            "description": "Updated description",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)

    def test_invoice_client_must_belong_to_invoice_business(self):
        _, other_client, _ = self._other_business_records()
        invoice = Invoice.objects.create(
            business=self.business, client=self.client_record, due_date=date.today(),
            status="DRAFT", subtotal=10, tax_rate=0, tax_amount=0, total_amount=10,
        )
        self.client.force_authenticate(self.owner)
        res = self.client.patch(
            reverse("finance:invoice-detail", args=[invoice.id]), {"client": other_client.id}, format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        invoice.refresh_from_db()
        self.assertEqual(invoice.client, self.client_record)

    def _add_client(self, **overrides):
        payload = {
            "client_name": "New Client", "client_email": "new-client@example.com",
            "client_phone": "1234567890", "billing_street_address": "1 Main St",
        }
        payload.update(overrides)
        return self.client.post(reverse("operations:client-list"), payload, format="json")

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_adding_client_creates_account_without_signup_email(self):
        self.client.force_authenticate(self.owner)
        res = self._add_client(role="ADMIN", user=self.owner.id)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        account = get_user_model().objects.get(email="new-client@example.com")
        self.assertEqual(account.role, "CLIENT")
        self.assertTrue(account.is_active)
        self.assertFalse(account.has_usable_password())
        self.assertEqual(res.data["user"], account.id)
        self.assertEqual(len(mail.outbox), 0)

        duplicate = self._add_client(client_email="NEW-client@example.com")
        self.assertEqual(duplicate.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("client_email", duplicate.data)

        invalid = self._add_client(client_email="not-an-email")
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_existing_account_is_linked_without_email_or_changes(self):
        other_business, _, _ = self._other_business_records()
        self.client.force_authenticate(self.owner)
        res = self._add_client(
            client_email="other-client@example.com", client_name="Renamed", client_phone="999",
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        account = get_user_model().objects.get(email="other-client@example.com")
        self.assertEqual(Client.objects.filter(user=account).count(), 2)
        self.assertNotEqual(account.name, "Renamed")
        self.assertEqual(len(mail.outbox), 0)

    def test_only_business_owner_can_add_clients(self):
        outsider = get_user_model().objects.create_user("outsider@example.com", "test123")
        self.client.force_authenticate(outsider)
        self.assertEqual(self._add_client().status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(get_user_model().objects.filter(email="new-client@example.com").exists())

        self.client.force_authenticate(None)
        self.assertEqual(self._add_client().status_code, status.HTTP_401_UNAUTHORIZED)

    def test_owner_cannot_add_themselves_as_client(self):
        self.client.force_authenticate(self.owner)
        res = self._add_client(client_email=self.owner.email)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_shared_client_account_cannot_be_edited_by_a_business(self):
        _, other_client, _ = self._other_business_records()
        self.client.force_authenticate(self.owner)
        linked = self._add_client(client_email="other-client@example.com")
        detail = reverse("operations:client-detail", args=[linked.data["id"]])

        hijack = self.client.patch(detail, {"client_email": "attacker@example.com"}, format="json")
        self.assertEqual(hijack.status_code, status.HTTP_400_BAD_REQUEST)
        other_client.user.refresh_from_db()
        self.assertEqual(other_client.user.email, "other-client@example.com")

        unchanged = self.client.patch(detail, {
            "client_email": "other-client@example.com", "company_name": "Acme",
        }, format="json")
        self.assertEqual(unchanged.status_code, status.HTTP_200_OK, unchanged.data)

    def test_deactivating_client_only_affects_this_business(self):
        _, other_client, other_service = self._other_business_records()
        self.client.force_authenticate(self.owner)
        linked = self._add_client(client_email="other-client@example.com")
        detail = reverse("operations:client-detail", args=[linked.data["id"]])

        res = self.client.patch(detail, {"is_active": False}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        account = other_client.user
        account.refresh_from_db()
        self.assertTrue(account.is_active)
        self.client.force_authenticate(account)
        services = self.client.get(SERVICES_URL).data
        services = services["results"] if isinstance(services, dict) else services
        self.assertEqual([s["id"] for s in services], [other_service.id])

    def test_sole_business_can_fix_email_until_client_signs_in(self):
        self.client.force_authenticate(self.owner)
        created = self._add_client()
        detail = reverse("operations:client-detail", args=[created.data["id"]])

        fixed = self.client.patch(detail, {"client_email": "fixed@example.com"}, format="json")
        self.assertEqual(fixed.status_code, status.HTTP_200_OK, fixed.data)

        account = get_user_model().objects.get(email="fixed@example.com")
        account.last_login = timezone.now()
        account.save(update_fields=["last_login"])
        blocked = self.client.patch(detail, {"client_email": "again@example.com"}, format="json")
        self.assertEqual(blocked.status_code, status.HTTP_400_BAD_REQUEST)
        renamed = self.client.patch(detail, {"client_name": "Fixed Name"}, format="json")
        self.assertEqual(renamed.status_code, status.HTTP_200_OK, renamed.data)


class ServiceTermsTemplateApiTests(TestCase):
    """Test service terms template integration with services and quotes."""

    def setUp(self):
        self.client = APIClient()
        self.owner = get_user_model().objects.create_user(
            "manager@example.com",
            "test123",
            role="MANAGER",
        )
        self.client.force_authenticate(self.owner)
        self.business = create_business(
            owner=self.owner,
            slug="service-terms-business",
            postal_code="T2T2T2",
            tax_rate=Decimal("5.00"),
        )
        self.business.services_offered.add("Flooring")
        self.client_user = get_user_model().objects.create_user(
            "flooring-client@example.com",
            "test123",
            role="CLIENT",
        )
        self.client_record = Client.objects.create(
            business=self.business,
            user=self.client_user,
        )
        ServiceQuestionnaire.objects.create(
            business=self.business,
            service_name="Flooring",
            additional_questions_form=[
                {"text": "Room size", "type": "input", "required": True},
            ],
        )

    def test_create_service_requires_active_terms_template(self):
        """Test service creation fails without an active terms template."""
        payload = {
            "client": self.client_record.id,
            "business": self.business.id,
            "service_name": "Flooring",
            "description": "Install flooring",
            "start_date": date.today(),
            "end_date": date.today() + timedelta(days=7),
            "service_type": "ONE_TIME",
            "price": "100.00",
            "currency": "CAD",
            "status": "PENDING",
            "street_address": "101 Demo Street",
            "city": "Calgary",
            "country": "CA",
            "province_state": "AB",
            "postal_code": "T2T2T2",
        }

        res = self.client.post(SERVICES_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("service_name", res.data)

    def test_create_terms_template_accepts_formatted_html_content(self):
        """Test Quill-formatted terms content is accepted and stored."""
        payload = {
            "business": self.business.id,
            "service_name": "Flooring",
            "content": "<h2>Payment Terms</h2><p>Payment is due on receipt.</p>",
            "is_active": True,
        }

        res = self.client.post(SERVICE_TERMS_TEMPLATES_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        terms = ServiceTermsTemplate.objects.get(id=res.data["id"])
        self.assertEqual(terms.content, payload["content"])

    def test_create_terms_template_rejects_empty_html_content(self):
        """Test empty Quill HTML is treated as blank content."""
        payload = {
            "business": self.business.id,
            "service_name": "Flooring",
            "content": "<p><br></p>",
            "is_active": True,
        }

        res = self.client.post(SERVICE_TERMS_TEMPLATES_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("content", res.data)

    def test_create_quote_copies_general_terms_snapshot(self):
        """Test quote stores service general terms plus additional terms."""
        ServiceTermsTemplate.objects.create(
            business=self.business,
            service_name="Flooring",
            content="General flooring terms apply.",
            is_active=True,
        )
        service = Service.objects.create(
            client=self.client_record,
            business=self.business,
            service_name="Flooring",
            description="Install new flooring",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7),
            service_type="ONE_TIME",
            price=Decimal("100.00"),
            currency="CAD",
            billing_cycle=None,
            status="PENDING",
            street_address="123 Test Street",
            city="Calgary",
            country="CA",
            province_state="AB",
            postal_code="T2T2T2",
        )

        res = self.client.post(
            QUOTES_URL,
            {
                "service": service.id,
                "valid_until": date.today() + timedelta(days=2),
                "payment_terms": "NET_15",
                "terms_conditions": "Remove furniture before work begins.",
                "notes": "Quote notes",
            },
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        quote = Quote.objects.get(id=res.data["id"])
        self.assertEqual(quote.general_terms_conditions, "General flooring terms apply.")
        self.assertEqual(quote.terms_conditions, "Remove furniture before work begins.")
        self.assertIn("General flooring terms apply.", res.data["combined_terms_conditions"])
        self.assertIn("Remove furniture before work begins.", res.data["combined_terms_conditions"])


class JobPhotoStatusAutomationTests(TestCase):
    """Test job status automation when before/after photos are uploaded."""

    def setUp(self):
        self.client = APIClient()
        self.owner = get_user_model().objects.create_user(
            "jobs-manager@example.com",
            "test123",
            role="MANAGER",
        )
        self.employee_user = get_user_model().objects.create_user(
            "employee@example.com",
            "test123",
            role="EMPLOYEE",
        )
        self.business = create_business(
            owner=self.owner,
            slug="jobs-business",
            postal_code="T2T2T2",
            tax_rate=Decimal("5.00"),
        )
        self.client_user = get_user_model().objects.create_user(
            "jobs-client@example.com",
            "test123",
            role="CLIENT",
        )
        self.client_record = Client.objects.create(
            business=self.business,
            user=self.client_user,
        )
        self.team_member = TeamMember.objects.create(
            business=self.business,
            employee=self.employee_user,
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
            billing_cycle=None,
            status="ACTIVE",
            street_address="123 Test Street",
            city="Calgary",
            country="CA",
            province_state="AB",
            postal_code="T2T2T2",
            filled_questionnaire={"Room size": "Large"},
        )
        self.job = Job.objects.create(
            service=self.service,
            assigned_to=self.team_member,
            title="Flooring Visit",
            description="Take progress photos",
            scheduled_date=timezone.now() + timedelta(days=1),
            status="PENDING",
        )

    def test_uploading_before_photo_sets_job_in_progress(self):
        """Test uploading a before photo updates job status to IN_PROGRESS."""
        self.client.force_authenticate(self.employee_user)

        with tempfile.TemporaryDirectory() as temp_media_root:
            with self.settings(MEDIA_ROOT=temp_media_root):
                res = self.client.post(
                    JOB_PHOTOS_URL,
                    {
                        "job": self.job.id,
                        "photo_type": "BEFORE",
                        "photo": create_test_image_file("before.png"),
                    },
                    format="multipart",
                )

        self.job.refresh_from_db()
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.job.status, "IN_PROGRESS")
        self.assertIsNone(self.job.completed_at)

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
    )
    def test_uploading_after_photo_sets_job_completed(self):
        """Test uploading an after photo updates job status to COMPLETED."""
        self.client.force_authenticate(self.employee_user)

        with tempfile.TemporaryDirectory() as temp_media_root:
            with self.settings(MEDIA_ROOT=temp_media_root):
                res = self.client.post(
                    JOB_PHOTOS_URL,
                    {
                        "job": self.job.id,
                        "photo_type": "AFTER",
                        "photo": create_test_image_file("after.png"),
                    },
                    format="multipart",
                )

        self.job.refresh_from_db()
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.job.status, "COMPLETED")
        self.assertIsNotNone(self.job.completed_at)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.owner.email])
        self.assertIn(self.job.title, mail.outbox[0].subject)

    def test_cannot_upload_duplicate_photo_type_for_same_job(self):
        """Test duplicate before/after uploads are rejected for a job."""
        self.client.force_authenticate(self.employee_user)

        with tempfile.TemporaryDirectory() as temp_media_root:
            with self.settings(MEDIA_ROOT=temp_media_root):
                JobPhoto.objects.create(
                    job=self.job,
                    photo=create_test_image_file("existing-before.png"),
                    photo_type="BEFORE",
                )

                res = self.client.post(
                    JOB_PHOTOS_URL,
                    {
                        "job": self.job.id,
                        "photo_type": "BEFORE",
                        "photo": create_test_image_file("duplicate-before.png"),
                    },
                    format="multipart",
                )

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("photo_type", res.data)


class WorkflowRegressionTests(TestCase):
    """High-value workflow regression scenarios across operations APIs."""

    def setUp(self):
        self.client = APIClient()
        self.manager = get_user_model().objects.create_user(
            "workflow-manager@example.com",
            "test123",
            role="MANAGER",
        )
        self.client_user = get_user_model().objects.create_user(
            "workflow-client@example.com",
            "test123",
            role="CLIENT",
        )
        self.employee_user = get_user_model().objects.create_user(
            "workflow-employee@example.com",
            "test123",
            role="EMPLOYEE",
        )
        self.business = create_business(
            owner=self.manager,
            slug="workflow-business",
            postal_code="T2T2T2",
            tax_rate=Decimal("5.00"),
        )
        self.business.services_offered.add("Flooring")
        self.client_record = Client.objects.create(
            business=self.business,
            user=self.client_user,
        )
        self.team_member = TeamMember.objects.create(
            business=self.business,
            employee=self.employee_user,
        )

    def test_client_billing_address_and_company_can_be_created_and_edited(self):
        self.client.force_authenticate(self.manager)
        url = reverse("operations:client-list")
        created = self.client.post(url, {
            "client_name": "Billing Client",
            "client_email": "billing-client@example.com",
            "client_phone": "1234567890",
            "company_name": "Northstar Projects",
            "billing_street_address": "10 Billing Lane",
            "billing_city": "Calgary",
            "billing_province_state": "AB",
            "billing_country": "CA",
            "billing_postal_code": "T2P 1J9",
        }, format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED, created.data)
        self.assertEqual(created.data["company_name"], "Northstar Projects")
        self.assertEqual(created.data["billing_street_address"], "10 Billing Lane")

        edited = self.client.patch(
            reverse("operations:client-detail", args=[created.data["id"]]),
            {"company_name": "", "billing_street_address": "20 Updated Road"},
            format="json",
        )
        self.assertEqual(edited.status_code, status.HTTP_200_OK, edited.data)
        self.assertEqual(edited.data["company_name"], "")
        self.assertEqual(edited.data["billing_street_address"], "20 Updated Road")
        self.assertEqual(edited.data["billing_city"], "Calgary")

    def test_invoice_exposes_separate_billing_and_service_addresses(self):
        self.client_record.company_name = "Northstar Projects"
        self.client_record.billing_street_address = "10 Billing Lane"
        self.client_record.billing_city = "Calgary"
        self.client_record.billing_province_state = "AB"
        self.client_record.billing_country = "CA"
        self.client_record.billing_postal_code = "T2P 1J9"
        self.client_record.save()
        service = self.create_service(auto_generate_quote=False)
        invoice = Invoice.objects.create(
            business=self.business, client=self.client_record, service=service,
            due_date=date.today() + timedelta(days=2), currency="CAD",
            subtotal=Decimal("100.00"), tax_rate=Decimal("5.00"),
            tax_amount=Decimal("5.00"), total_amount=Decimal("105.00"),
        )

        data = InvoiceSerializer(invoice).data
        self.assertEqual(data["client_company_name"], "Northstar Projects")
        self.assertEqual(data["billing_street_address"], "10 Billing Lane")
        self.assertEqual(data["service_street_address"], "123 Workflow Street")
        self.assertNotEqual(data["billing_street_address"], data["service_street_address"])

    def create_questionnaire_and_terms(self, terms="General flooring terms."):
        questionnaire = ServiceQuestionnaire.objects.create(
            business=self.business,
            service_name="Flooring",
            additional_questions_form=[
                {"text": "Room size", "type": "input", "required": True},
            ],
        )
        terms_template = ServiceTermsTemplate.objects.create(
            business=self.business,
            service_name="Flooring",
            content=terms,
            is_active=True,
        )
        return questionnaire, terms_template

    def service_payload(self, **overrides):
        payload = {
            "client": self.client_record.id,
            "business": self.business.id,
            "service_name": "Flooring",
            "description": "Install new flooring",
            "start_date": date.today(),
            "end_date": date.today() + timedelta(days=7),
            "service_type": "ONE_TIME",
            "price": "100.00",
            "currency": "CAD",
            "status": "PENDING",
            "auto_generate_quote": True,
            "auto_generate_invoices": True,
            "street_address": "123 Workflow Street",
            "city": "Calgary",
            "country": "CA",
            "province_state": "AB",
            "postal_code": "T2T2T2",
        }
        payload.update(overrides)
        return payload

    def test_service_items_are_optional_and_sum_when_present(self):
        self.create_questionnaire_and_terms()
        self.client.force_authenticate(self.manager)
        items = [
            {"title": "Plowing", "description": "Parking lot", "price": "120.00"},
            {"title": "Walkways", "description": "Entrances", "price": "30.00"},
        ]
        response = self.client.post(
            SERVICES_URL,
            self.service_payload(items=items, price="999.00", auto_generate_quote=False),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(Decimal(response.data["price"]), Decimal("150.00"))
        self.assertEqual(response.data["items"], items)

    def test_invalid_service_item_price_is_rejected(self):
        self.create_questionnaire_and_terms()
        self.client.force_authenticate(self.manager)
        response = self.client.post(
            SERVICES_URL,
            self.service_payload(items=[{"title": "Plowing", "price": "-1.00"}]),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("items", response.data)

    def create_service(self, **overrides):
        payload = self.service_payload(**overrides)
        return Service.objects.create(
            client=self.client_record,
            business=self.business,
            service_name=payload["service_name"],
            description=payload["description"],
            start_date=payload["start_date"],
            end_date=payload["end_date"],
            service_type=payload["service_type"],
            price=Decimal(payload["price"]),
            currency=payload["currency"],
            billing_cycle=payload.get("billing_cycle"),
            status=payload["status"],
            auto_generate_quote=payload["auto_generate_quote"],
            auto_generate_invoices=payload["auto_generate_invoices"],
            street_address=payload["street_address"],
            city=payload["city"],
            country=payload["country"],
            province_state=payload["province_state"],
            postal_code=payload["postal_code"],
            filled_questionnaire=payload.get("filled_questionnaire"),
            bypass_questionnaire=payload.get("bypass_questionnaire", False),
        )

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    @patch("operations.views.emails.send_service_questionnaire_email")
    def test_bypass_creates_without_questionnaire_and_generates_draft(self, questionnaire_email):
        questionnaire, _ = self.create_questionnaire_and_terms()
        questionnaire.delete()
        self.client.force_authenticate(self.manager)

        res = self.client.post(SERVICES_URL, self.service_payload(bypass_questionnaire=True))
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        service = Service.objects.get(id=res.data["id"])
        self.assertTrue(service.bypass_questionnaire)
        self.assertIsNone(service.filled_questionnaire)
        self.assertEqual(service.status, "PENDING")
        self.assertEqual(res.data["service_questionnaires"], {})
        quote = service.service_quotes.get()
        self.assertEqual(quote.status, "DRAFT")
        self.assertEqual(quote.general_terms_conditions, "General flooring terms.")
        questionnaire_email.assert_not_called()
        self.assertEqual(len(mail.outbox), 0)

        res = self.client.patch(service_detail_url(service.id), {"status": "ACTIVE"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.assertEqual(service.service_quotes.count(), 1)
        self.assertFalse(Invoice.objects.filter(service=service).exists())

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    @patch("operations.views.emails.send_service_questionnaire_email")
    def test_bypass_skips_existing_questionnaire_and_blocks_resend_and_answers(self, questionnaire_email):
        self.create_questionnaire_and_terms()
        self.client.force_authenticate(self.manager)
        res = self.client.post(
            SERVICES_URL, self.service_payload(bypass_questionnaire=True, auto_generate_quote=False),
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        service = Service.objects.get(id=res.data["id"])
        self.assertFalse(service.service_quotes.exists())
        questionnaire_email.assert_not_called()
        res = self.client.post(reverse("operations:service-resend-questionnaire", args=[service.id]))
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        res = self.client.patch(
            service_detail_url(service.id), {"filled_questionnaire": {"Room size": "Large"}}, format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bypass_does_not_skip_terms_requirement(self):
        self.client.force_authenticate(self.manager)
        res = self.client.post(
            SERVICES_URL, self.service_payload(bypass_questionnaire=True, auto_generate_quote=False),
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("terms and conditions", str(res.data))
        self.assertFalse(Service.objects.exists())

    def test_questionnaire_remains_required_by_default(self):
        questionnaire, _ = self.create_questionnaire_and_terms()
        questionnaire.delete()
        self.client.force_authenticate(self.manager)
        res = self.client.post(SERVICES_URL, self.service_payload())
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("questionnaire", str(res.data))

    def test_client_cannot_bypass_questionnaire(self):
        self.create_questionnaire_and_terms()
        service = self.create_service()
        self.client.force_authenticate(self.client_user)
        res = self.client.patch(
            service_detail_url(service.id), {"bypass_questionnaire": True}, format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        service.refresh_from_db()
        self.assertFalse(service.bypass_questionnaire)

    def test_cannot_remove_bypass_without_questionnaire_or_change_after_activation(self):
        service = self.create_service(bypass_questionnaire=True, auto_generate_quote=False)
        self.client.force_authenticate(self.manager)
        res = self.client.patch(
            service_detail_url(service.id), {"bypass_questionnaire": False}, format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.create_questionnaire_and_terms()
        service.status = "ACTIVE"
        service.save()
        res = self.client.patch(
            service_detail_url(service.id), {"bypass_questionnaire": False}, format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_pending_service_can_enable_bypass_and_generate_quote_once(self):
        self.create_questionnaire_and_terms()
        service = self.create_service()
        self.client.force_authenticate(self.manager)
        for _ in range(2):
            res = self.client.patch(
                service_detail_url(service.id), {"bypass_questionnaire": True}, format="json",
            )
            self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.assertEqual(service.service_quotes.count(), 1)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_activating_bypassed_service_repairs_missing_draft_once(self):
        self.create_questionnaire_and_terms()
        self.client_user.is_active = False
        self.client_user.save(update_fields=["is_active"])
        self.client.force_authenticate(self.manager)
        client_res = self.client.patch(
            reverse("operations:client-detail", args=[self.client_record.id]),
            {"is_active": True},
            format="json",
        )
        self.assertEqual(client_res.status_code, status.HTTP_200_OK, client_res.data)
        self.client_user.refresh_from_db()
        self.assertTrue(self.client_user.is_active)

        service = self.create_service(bypass_questionnaire=True)

        for _ in range(2):
            res = self.client.patch(
                service_detail_url(service.id), {"status": "ACTIVE"}, format="json",
            )
            self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)

        quote = service.service_quotes.get()
        self.assertEqual(quote.status, "DRAFT")
        self.assertEqual(quote.general_terms_conditions, "General flooring terms.")
        self.assertEqual(len(res.data["quotations"]), 1)
        self.assertFalse(Invoice.objects.filter(service=service).exists())

    def test_questionnaire_can_be_created_after_terms_template(self):
        ServiceTermsTemplate.objects.create(
            business=self.business, service_name="Flooring", content="Flooring terms.",
        )
        self.client.force_authenticate(self.manager)
        res = self.client.post(
            SERVICE_QUESTIONNAIRES_URL,
            {
                "business": self.business.id,
                "service_name": "Flooring",
                "additional_questions_form": [{"text": "Room size", "type": "input", "required": True}],
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        res = self.client.patch(
            reverse("operations:servicequestionnaire-detail", args=[res.data["id"]]),
            {"additional_questions_form": [{"text": "Room count", "type": "input"}]},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)

    def test_duplicate_questionnaire_returns_field_error(self):
        self.create_questionnaire_and_terms()
        self.client.force_authenticate(self.manager)
        res = self.client.post(
            SERVICE_QUESTIONNAIRES_URL,
            {"business": self.business.id, "service_name": "Flooring", "additional_questions_form": []},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("service_name", res.data)
        self.assertEqual(ServiceQuestionnaire.objects.count(), 1)

    def test_questionnaire_for_unoffered_service_returns_field_error(self):
        self.client.force_authenticate(self.manager)
        res = self.client.post(
            SERVICE_QUESTIONNAIRES_URL,
            {"business": self.business.id, "service_name": "Not offered", "additional_questions_form": []},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("service_name", res.data)

    def sign_quote_as_client(self, quote):
        self.client.force_authenticate(self.client_user)
        with tempfile.TemporaryDirectory() as temp_media_root:
            with self.settings(MEDIA_ROOT=temp_media_root):
                return self.client.post(
                    reverse(QUOTE_SIGN_URL, args=[quote.id]),
                    {
                        "status": "SIGNED",
                        "signature": create_test_image_file("signature.png"),
                    },
                    format="multipart",
                )

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
    )
    @patch("operations.views.emails.send_service_questionnaire_email")
    def test_service_creation_only_sends_questionnaire_email(
        self,
        mock_questionnaire_email,
    ):
        """Creating a service does not send a service-created notification."""
        self.create_questionnaire_and_terms()
        self.client.force_authenticate(self.manager)

        res = self.client.post(SERVICES_URL, self.service_payload())

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        mock_questionnaire_email.assert_called_once()
        self.assertEqual(len(mail.outbox), 0)

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
    )
    def test_manager_status_changes_do_not_email_client(self):
        """Service status changes save without sending customer notifications."""
        service = self.create_service(
            auto_generate_quote=False,
            auto_generate_invoices=False,
            filled_questionnaire={"Room size": "Large"},
        )
        self.client.force_authenticate(self.manager)

        for new_status in ("ACTIVE", "ACTIVE", "COMPLETED", "CANCELLED", "PENDING"):
            with self.subTest(status=new_status):
                res = self.client.patch(
                    service_detail_url(service.id),
                    {"status": new_status},
                    format="json",
                )
                self.assertEqual(res.status_code, status.HTTP_200_OK)
                service.refresh_from_db()
                self.assertEqual(service.status, new_status)
                self.assertEqual(len(mail.outbox), 0)

        edit_res = self.client.patch(
            service_detail_url(service.id),
            {"description": "Updated description"},
            format="json",
        )

        self.assertEqual(edit_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
    )
    def test_questionnaire_submission_notifies_business_owner(self):
        """Test first questionnaire submission emails the business owner."""
        self.create_questionnaire_and_terms()
        service = self.create_service(auto_generate_quote=False)
        self.client.force_authenticate(self.client_user)

        res = self.client.patch(
            service_detail_url(service.id),
            {"filled_questionnaire": {"Room size": "Large"}},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.manager.email])
        self.assertIn("Questionnaire submitted", mail.outbox[0].subject)

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
    )
    def test_signed_quote_notifies_business_owner_once(self):
        """Test signing a quote emails the business owner only once."""
        service = self.create_service(
            auto_generate_quote=False,
            auto_generate_invoices=False,
            filled_questionnaire={"Room size": "Large"},
        )
        quote = Quote.objects.create(
            service=service,
            valid_until=date.today() + timedelta(days=2),
            status="SENT",
            tax_rate=Decimal("5.00"),
            tax_label="GST",
        )

        first_res = self.sign_quote_as_client(quote)
        second_res = self.sign_quote_as_client(quote)

        self.assertEqual(first_res.status_code, status.HTTP_200_OK)
        self.assertEqual(second_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(len(mail.outbox), 2)
        owner_emails = [email for email in mail.outbox if email.to == [self.manager.email]]
        self.assertEqual(len(owner_emails), 1)
        self.assertIn(quote.quote_number, owner_emails[0].subject)
        client_emails = [email for email in mail.outbox if email.to == [self.client_user.email]]
        self.assertEqual(len(client_emails), 1)

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
    )
    def test_signed_quote_emails_client_pdf_with_stored_signature(self):
        service = self.create_service(
            auto_generate_quote=False,
            auto_generate_invoices=False,
            filled_questionnaire={"Room size": "Large"},
        )
        quote = Quote.objects.create(
            service=service,
            valid_until=date.today() + timedelta(days=2),
            general_terms_conditions="Original agreed terms.",
            terms_conditions="Additional agreed terms.",
            status="SENT",
            tax_rate=Decimal("5.00"),
            tax_label="GST",
        )

        res = self.sign_quote_as_client(quote)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        quote.refresh_from_db()
        self.assertEqual(quote.status, "SIGNED")
        self.assertIsNotNone(quote.signed_at)
        self.assertTrue(quote.signature)
        client_email = next(
            email for email in mail.outbox if email.to == [self.client_user.email]
        )
        self.assertIn(quote.quote_number, client_email.subject)
        self.assertIn("PDF copy of your signed quote is attached", client_email.body)
        self.assertIn(f"/user/business/quote/{quote.id}", client_email.body)
        self.assertEqual(client_email.alternatives[0][1], "text/html")
        pdf_attachments = [
            part for part in client_email.message().walk()
            if part.get_content_type() == "application/pdf"
        ]
        self.assertEqual(len(pdf_attachments), 1)
        attachment = pdf_attachments[0]
        self.assertEqual(attachment.get_filename(), f"{quote.quote_number}-signed.pdf")
        self.assertEqual(attachment.get_content_disposition(), "attachment")
        pdf_content = attachment.get_payload(decode=True)
        self.assertTrue(pdf_content.startswith(b"%PDF"))
        self.assertTrue(pdf_content.rstrip().endswith(b"%%EOF"))
        self.assertIn(b"/Subtype /Image", pdf_content)

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
    )
    def test_declined_quote_does_not_email_signed_copy(self):
        service = self.create_service(auto_generate_quote=False)
        quote = Quote.objects.create(
            service=service,
            valid_until=date.today() + timedelta(days=2),
            status="SENT",
        )
        self.client.force_authenticate(self.client_user)

        res = self.client.post(
            reverse(QUOTE_SIGN_URL, args=[quote.id]),
            {"status": "DECLINED"},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
    )
    def test_missing_signature_or_wrong_user_does_not_email_signed_copy(self):
        service = self.create_service(auto_generate_quote=False)
        quote = Quote.objects.create(
            service=service,
            valid_until=date.today() + timedelta(days=2),
            status="SENT",
        )
        self.client.force_authenticate(self.client_user)
        missing_signature_res = self.client.post(
            reverse(QUOTE_SIGN_URL, args=[quote.id]),
            {"status": "SIGNED"},
            format="json",
        )
        self.client.force_authenticate(self.manager)
        wrong_user_res = self.client.post(
            reverse(QUOTE_SIGN_URL, args=[quote.id]),
            {"status": "SIGNED"},
            format="json",
        )

        self.assertEqual(missing_signature_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(wrong_user_res.status_code, status.HTTP_403_FORBIDDEN)
        quote.refresh_from_db()
        self.assertEqual(quote.status, "SENT")
        self.assertEqual(len(mail.outbox), 0)

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
    )
    def test_invalid_signature_does_not_sign_quote_or_send_email(self):
        service = self.create_service(auto_generate_quote=False)
        quote = Quote.objects.create(
            service=service,
            valid_until=date.today() + timedelta(days=2),
            status="SENT",
            tax_rate=Decimal("5.00"),
            tax_label="GST",
        )
        self.client.force_authenticate(self.client_user)
        res = self.client.post(
            reverse(QUOTE_SIGN_URL, args=[quote.id]),
            {
                "status": "SIGNED",
                "signature": SimpleUploadedFile(
                    "signature.png", b"not-an-image", content_type="image/png",
                ),
            },
            format="multipart",
        )

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("signature", res.data)
        quote.refresh_from_db()
        self.assertEqual(quote.status, "SENT")
        self.assertIsNone(quote.signed_at)
        self.assertEqual(len(mail.outbox), 0)

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
    )
    def test_job_creation_notifies_assigned_employee(self):
        """Test creating an assigned job emails the employee."""
        service = self.create_service(
            auto_generate_quote=False,
            auto_generate_invoices=False,
            filled_questionnaire={"Room size": "Large"},
        )
        self.client.force_authenticate(self.manager)
        updated_email = "updated-business@example.com"
        business_update = self.client.patch(
            reverse("operations:business-detail", args=[self.business.id]),
            {"email": updated_email},
        )
        self.assertEqual(business_update.status_code, status.HTTP_200_OK)
        self.business.refresh_from_db()
        self.assertEqual(self.business.email, updated_email)

        res = self.client.post(
            JOBS_URL,
            {
                "service": service.id,
                "assigned_to": self.team_member.id,
                "title": "Flooring Visit",
                "description": "Install flooring",
                "scheduled_date": timezone.now() + timedelta(days=1),
                "status": "PENDING",
            },
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.employee_user.email])
        self.assertIn("Flooring Visit", mail.outbox[0].subject)
        self.assertEqual(
            mail.outbox[0].from_email,
            f"{self.business.name} Support <{settings.DEFAULT_FROM_EMAIL}>",
        )
        self.assertEqual(mail.outbox[0].reply_to, [self.business.email])

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
    )
    def test_job_status_completion_notifies_business_owner_once(self):
        """Test a direct completed transition emails the business owner once."""
        service = self.create_service(
            auto_generate_quote=False,
            auto_generate_invoices=False,
            filled_questionnaire={"Room size": "Large"},
        )
        job = Job.objects.create(
            service=service,
            assigned_to=self.team_member,
            title="Flooring Visit",
            scheduled_date=timezone.now() + timedelta(days=1),
        )
        self.client.force_authenticate(self.manager)
        detail_url = reverse("operations:job-detail", args=[job.id])

        first_res = self.client.patch(
            detail_url,
            {"status": "COMPLETED"},
            format="json",
        )
        second_res = self.client.patch(
            detail_url,
            {"status": "COMPLETED"},
            format="json",
        )

        job.refresh_from_db()
        self.assertEqual(first_res.status_code, status.HTTP_200_OK)
        self.assertEqual(second_res.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(job.completed_at)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.manager.email])

    def test_manager_can_update_employee_role(self):
        """Test manager can promote or demote another team member."""
        self.client.force_authenticate(self.manager)

        res = self.client.patch(
            team_member_detail_url(self.team_member.id),
            {"role": "MANAGER", "job_duties": "Lead field visits"},
            format="json",
        )

        self.employee_user.refresh_from_db()
        self.team_member.refresh_from_db()
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["role"], "MANAGER")
        self.assertEqual(self.employee_user.role, "MANAGER")
        self.assertEqual(self.team_member.job_duties, "Lead field visits")

    def test_manager_cannot_update_own_team_member_role(self):
        """Test manager cannot change their own role through team members."""
        manager_member = TeamMember.objects.create(
            business=self.business,
            employee=self.manager,
        )
        self.client.force_authenticate(self.manager)

        res = self.client.patch(
            team_member_detail_url(manager_member.id),
            {"role": "EMPLOYEE"},
            format="json",
        )

        self.manager.refresh_from_db()
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("role", res.data)
        self.assertEqual(self.manager.role, "MANAGER")

    def test_team_member_create_explains_ineligible_or_duplicate_accounts(self):
        self.client.force_authenticate(self.manager)
        url = reverse("operations:teammember-list")
        for employee, expected in (
            (self.manager, "business owner"),
            (self.client_user, "not a manager or employee"),
            (self.employee_user, "already on this team"),
        ):
            with self.subTest(employee=employee.email):
                response = self.client.post(url, {
                    "business": self.business.id, "employee": employee.id,
                    "role": "MANAGER",
                }, format="json")
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn(expected, str(response.data).lower())

    def test_team_member_create_applies_selected_role_and_checks_business_owner(self):
        new_employee = get_user_model().objects.create_user(
            "new-team-member@example.com", "test123", role="EMPLOYEE",
        )
        url = reverse("operations:teammember-list")
        self.client.force_authenticate(self.client_user)
        forbidden = self.client.post(url, {
            "business": self.business.id, "employee": new_employee.id,
            "role": "MANAGER",
        }, format="json")
        self.assertEqual(forbidden.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("business", forbidden.data)
        self.assertFalse(TeamMember.objects.filter(employee=new_employee).exists())

        self.client.force_authenticate(self.manager)
        created = self.client.post(url, {
            "business": self.business.id, "employee": new_employee.id,
            "role": "MANAGER",
        }, format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED, created.data)
        new_employee.refresh_from_db()
        self.assertEqual(new_employee.role, "MANAGER")

    @patch("operations.views.emails.send_quote_email")
    @patch("operations.views.emails.send_service_questionnaire_email")
    @patch("finance.views.stripe.Account.retrieve")
    @patch("finance.views.stripe.PaymentMethod.create")
    @patch("finance.views.stripe.PaymentIntent.create")
    def test_full_happy_path_creates_quote_invoice_payment_payout_and_job(
        self,
        mock_payment_intent_create,
        mock_clone,
        mock_account,
        mock_questionnaire_email,
        mock_quote_email,
    ):
        """Test manager/client flow from service setup through paid payout."""
        self.create_questionnaire_and_terms()
        mock_payment_intent_create.return_value = SimpleNamespace(id="pi_success", status="succeeded")
        mock_clone.return_value = SimpleNamespace(id="pm_cloned")
        mock_account.return_value = stripe.StripeObject.construct_from({
            "id": "acct_test", "charges_enabled": True, "payouts_enabled": True,
            "controller": {"losses": {"payments": "stripe"}},
        }, "sk_test_placeholder")
        self.client.force_authenticate(self.manager)

        service_res = self.client.post(SERVICES_URL, self.service_payload())
        self.assertEqual(service_res.status_code, status.HTTP_201_CREATED)
        mock_questionnaire_email.assert_called_once()

        service_id = service_res.data["id"]
        self.client.force_authenticate(self.client_user)
        questionnaire_res = self.client.patch(
            service_detail_url(service_id),
            {"filled_questionnaire": {"Room size": "Large"}},
            format="json",
        )
        self.assertEqual(questionnaire_res.status_code, status.HTTP_200_OK)

        service = Service.objects.get(id=service_id)
        quote = Quote.objects.get(service=service)
        self.assertEqual(quote.status, "DRAFT")
        self.assertEqual(
            quote.valid_until,
            timezone.now().date() + timedelta(days=2),
        )

        self.client.force_authenticate(self.manager)
        terms_res = self.client.patch(
            quote_detail_url(quote.id), {"payment_terms": "NET_15"}, format="json",
        )
        self.assertEqual(terms_res.status_code, status.HTTP_200_OK)
        send_res = self.client.post(quote_send_url(quote.id))
        self.assertEqual(send_res.status_code, status.HTTP_200_OK)
        mock_quote_email.assert_called_once()

        quote.refresh_from_db()
        sign_res = self.sign_quote_as_client(quote)
        self.assertEqual(sign_res.status_code, status.HTTP_200_OK)
        self.assertEqual(Invoice.objects.filter(service=service).count(), 0)

        self.client.force_authenticate(self.manager)
        activate_res = self.client.patch(
            service_detail_url(service.id),
            {"status": "ACTIVE"},
            format="json",
        )
        self.assertEqual(activate_res.status_code, status.HTTP_200_OK)
        self.assertEqual(Invoice.objects.filter(service=service).count(), 1)

        invoice = Invoice.objects.get(service=service)
        invoice.status = "SENT"
        invoice.save(update_fields=["status"])
        BankingInformation.objects.create(
            client=self.client_record,
            payment_method_type="CARD",
            stripe_customer_id="cus_test",
            stripe_payment_method_id="pm_test",
        )
        BankingInformation.objects.create(
            business=self.business,
            payment_method_type="BANK_ACCOUNT",
            stripe_connected_account_id="acct_test",
        )

        self.client.force_authenticate(self.client_user)
        payment_res = self.client.post(invoice_make_payment_url(invoice.id))
        self.assertEqual(payment_res.status_code, status.HTTP_200_OK)

        invoice.refresh_from_db()
        self.assertEqual(invoice.status, "PAID")
        self.assertIsNotNone(invoice.paid_at)
        self.assertEqual(Payout.objects.filter(invoice=invoice).count(), 1)

        self.client.force_authenticate(self.manager)
        job_res = self.client.post(
            JOBS_URL,
            {
                "service": service.id,
                "assigned_to": self.team_member.id,
                "title": "Flooring Visit",
                "description": "Install flooring",
                "scheduled_date": timezone.now() + timedelta(days=1),
                "status": "PENDING",
            },
        )
        self.assertEqual(job_res.status_code, status.HTTP_201_CREATED)

    @patch("operations.views.emails.send_service_questionnaire_email")
    def test_deleted_questionnaire_invalidates_pending_submission_and_resend(
        self,
        mock_questionnaire_email,
    ):
        """Test deleting a questionnaire invalidates unfilled service links."""
        questionnaire, _ = self.create_questionnaire_and_terms()
        self.client.force_authenticate(self.manager)
        service_res = self.client.post(SERVICES_URL, self.service_payload())
        self.assertEqual(service_res.status_code, status.HTTP_201_CREATED)
        service_id = service_res.data["id"]

        delete_res = self.client.delete(
            reverse("operations:servicequestionnaire-detail", args=[questionnaire.id])
        )
        self.assertEqual(delete_res.status_code, status.HTTP_204_NO_CONTENT)

        resend_res = self.client.post(
            reverse("operations:service-resend-questionnaire", args=[service_id])
        )
        self.assertEqual(resend_res.status_code, status.HTTP_404_NOT_FOUND)

        self.client.force_authenticate(self.client_user)
        submit_res = self.client.patch(
            service_detail_url(service_id),
            {"filled_questionnaire": {"Room size": "Large"}},
            format="json",
        )
        self.assertEqual(submit_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("filled_questionnaire", submit_res.data)

        self.client.force_authenticate(self.manager)
        duplicate_res = self.client.post(
            SERVICES_URL,
            self.service_payload(street_address="456 Workflow Street"),
        )
        self.assertEqual(duplicate_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("service_name", duplicate_res.data)
        self.assertEqual(Service.objects.get(id=service_id).is_active, True)
        self.assertEqual(mock_questionnaire_email.call_count, 1)

    def test_deleted_terms_blocks_auto_quote_generation(self):
        """Test deleted general terms stop questionnaire-driven auto quotes."""
        _, terms_template = self.create_questionnaire_and_terms()
        service = self.create_service()
        terms_template.soft_delete(user=self.manager)

        self.client.force_authenticate(self.client_user)
        res = self.client.patch(
            service_detail_url(service.id),
            {"filled_questionnaire": {"Room size": "Large"}},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("filled_questionnaire", res.data)
        service.refresh_from_db()
        self.assertIsNone(service.filled_questionnaire)
        self.assertFalse(Quote.objects.filter(service=service).exists())

        self.client.force_authenticate(self.manager)
        quote_res = self.client.post(
            QUOTES_URL,
            {
                "service": service.id,
                "valid_until": date.today() + timedelta(days=2),
                "payment_terms": "NET_15",
                "terms_conditions": "Additional terms.",
            },
        )
        self.assertEqual(quote_res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_terms_edit_after_sent_quote_keeps_quote_snapshot(self):
        """Test sent quotes keep their general terms snapshot after edits."""
        _, terms_template = self.create_questionnaire_and_terms(
            terms="Version one general terms."
        )
        service = self.create_service(
            filled_questionnaire={"Room size": "Large"},
        )

        self.client.force_authenticate(self.manager)
        quote_res = self.client.post(
            QUOTES_URL,
            {
                "service": service.id,
                "valid_until": date.today() + timedelta(days=2),
                "payment_terms": "NET_15",
                "terms_conditions": "Additional terms.",
            },
        )
        self.assertEqual(quote_res.status_code, status.HTTP_201_CREATED)
        quote = Quote.objects.get(id=quote_res.data["id"])

        quote.status = "SENT"
        quote.tax_rate = self.business.tax_rate
        quote.tax_label = "GST"
        quote.save(update_fields=["status", "tax_rate", "tax_label"])

        terms_template.content = "Version two general terms."
        terms_template.save(update_fields=["content", "updated_at"])

        sign_res = self.sign_quote_as_client(quote)
        self.assertEqual(sign_res.status_code, status.HTTP_200_OK)

        quote.refresh_from_db()
        self.assertEqual(quote.general_terms_conditions, "Version one general terms.")
        self.assertIn(
            "Version one general terms.",
            QuoteSerializer(quote).data["combined_terms_conditions"],
        )
        self.assertNotIn(
            "Version two general terms.",
            QuoteSerializer(quote).data["combined_terms_conditions"],
        )

    def test_signed_pending_service_creates_invoice_once_when_activated(self):
        """Test pending signed quote invoices only once after activation."""
        self.create_questionnaire_and_terms()
        service = self.create_service(
            filled_questionnaire={"Room size": "Large"},
            status="PENDING",
        )
        quote = Quote.objects.create(
            service=service,
            valid_until=date.today() + timedelta(days=2),
            general_terms_conditions="General terms.",
            terms_conditions="Additional terms.",
            status="SENT",
            tax_rate=Decimal("5.00"),
            tax_label="GST",
        )

        sign_res = self.sign_quote_as_client(quote)
        self.assertEqual(sign_res.status_code, status.HTTP_200_OK)
        self.assertEqual(Invoice.objects.filter(service=service).count(), 0)

        self.client.force_authenticate(self.manager)
        activate_res = self.client.patch(
            service_detail_url(service.id),
            {"status": "ACTIVE"},
            format="json",
        )
        self.assertEqual(activate_res.status_code, status.HTTP_200_OK)
        self.assertEqual(Invoice.objects.filter(service=service).count(), 1)

        cancel_res = self.client.patch(
            service_detail_url(service.id),
            {"status": "CANCELLED"},
            format="json",
        )
        self.assertEqual(cancel_res.status_code, status.HTTP_200_OK)

        reactivate_res = self.client.patch(
            service_detail_url(service.id),
            {"status": "ACTIVE"},
            format="json",
        )
        self.assertEqual(reactivate_res.status_code, status.HTTP_200_OK)
        self.assertEqual(Invoice.objects.filter(service=service).count(), 1)

    def test_role_filtered_job_querysets_for_manager_client_and_employee(self):
        """Test each role sees the expected job scope from the API."""
        self.create_questionnaire_and_terms()
        service = self.create_service(
            filled_questionnaire={"Room size": "Large"},
            status="ACTIVE",
        )
        assigned_job = Job.objects.create(
            service=service,
            assigned_to=self.team_member,
            title="Assigned Job",
            scheduled_date=timezone.now() + timedelta(days=1),
        )
        other_employee = get_user_model().objects.create_user(
            "other-employee@example.com",
            "test123",
            role="EMPLOYEE",
        )
        other_member = TeamMember.objects.create(
            business=self.business,
            employee=other_employee,
        )
        Job.objects.create(
            service=service,
            assigned_to=other_member,
            title="Other Employee Job",
            scheduled_date=timezone.now() + timedelta(days=1),
        )

        self.client.force_authenticate(self.manager)
        manager_res = self.client.get(JOBS_URL)
        self.assertEqual(manager_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(manager_res.data), 2)

        self.client.force_authenticate(self.client_user)
        client_res = self.client.get(JOBS_URL)
        self.assertEqual(client_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(client_res.data), 2)

        self.client.force_authenticate(self.employee_user)
        employee_res = self.client.get(JOBS_URL)
        self.assertEqual(employee_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(employee_res.data), 1)
        self.assertEqual(employee_res.data[0]["id"], assigned_job.id)

    def test_soft_delete_cascades_and_restore_recovers_workflow_records(self):
        """Test soft delete/restore preserves related workflow records."""
        questionnaire, terms_template = self.create_questionnaire_and_terms()
        service = self.create_service(
            filled_questionnaire={"Room size": "Large"},
            status="ACTIVE",
        )
        quote = Quote.objects.create(
            service=service,
            valid_until=date.today() + timedelta(days=2),
            general_terms_conditions="General terms.",
        )
        invoice = Invoice.objects.create(
            business=self.business,
            client=self.client_record,
            service=service,
            due_date=date.today() + timedelta(days=2),
            subtotal=Decimal("100.00"),
            tax_rate=Decimal("5.00"),
            tax_amount=Decimal("5.00"),
            total_amount=Decimal("105.00"),
        )
        payout = Payout.objects.create(
            business=self.business,
            invoice=invoice,
            amount=invoice.total_amount,
            currency=invoice.currency,
        )
        job = Job.objects.create(
            service=service,
            assigned_to=self.team_member,
            title="Restore Job",
            scheduled_date=timezone.now() + timedelta(days=1),
        )

        self.client_record.soft_delete(user=self.manager)
        for obj in [self.client_record, service, quote, invoice, payout, job]:
            obj.refresh_from_db()
            self.assertTrue(obj.is_deleted)

        questionnaire.refresh_from_db()
        terms_template.refresh_from_db()
        self.assertFalse(questionnaire.is_deleted)
        self.assertFalse(terms_template.is_deleted)

        self.client_record.restore()
        for obj in [self.client_record, service, quote, invoice, payout, job]:
            obj.refresh_from_db()
            self.assertFalse(obj.is_deleted)

    def test_duplicate_service_quote_signing_and_payment_submissions_are_safe(self):
        """Test repeated workflow actions do not create duplicate records."""
        self.create_questionnaire_and_terms()
        service = self.create_service(
            filled_questionnaire={"Room size": "Large"},
            status="ACTIVE",
        )
        self.client.force_authenticate(self.manager)
        first_service_res = self.client.post(
            SERVICES_URL,
            self.service_payload(street_address="789 Workflow Street"),
        )
        self.assertEqual(first_service_res.status_code, status.HTTP_201_CREATED)
        duplicate_service_res = self.client.post(
            SERVICES_URL,
            self.service_payload(street_address="789 Workflow Street"),
        )
        self.assertEqual(
            duplicate_service_res.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        quote_res = self.client.post(
            QUOTES_URL,
            {
                "service": service.id,
                "valid_until": date.today() + timedelta(days=2),
                "payment_terms": "NET_15",
            },
        )
        self.assertEqual(quote_res.status_code, status.HTTP_201_CREATED)
        duplicate_quote_res = self.client.post(
            QUOTES_URL,
            {
                "service": service.id,
                "valid_until": date.today() + timedelta(days=3),
            },
        )
        self.assertEqual(
            duplicate_quote_res.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        quote = Quote.objects.get(id=quote_res.data["id"])
        quote.status = "SENT"
        quote.tax_rate = self.business.tax_rate
        quote.tax_label = "GST"
        quote.save(update_fields=["status", "tax_rate", "tax_label"])
        first_sign_res = self.sign_quote_as_client(quote)
        self.assertEqual(first_sign_res.status_code, status.HTTP_200_OK)
        second_sign_res = self.sign_quote_as_client(quote)
        self.assertEqual(second_sign_res.status_code, status.HTTP_400_BAD_REQUEST)
