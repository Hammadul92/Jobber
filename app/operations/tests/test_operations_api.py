"""
Test for business APIs
"""

import tempfile
from io import BytesIO
from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient
from taggit.models import Tag

from core.models import (
    Business,
    Client,
    Invoice,
    Job,
    JobPhoto,
    Quote,
    Service,
    ServiceQuestionnaire,
    ServiceTermsTemplate,
    TeamMember,
)

from operations.serializers import BusinessSerializer


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
            valid_until=date.today() + timedelta(days=2),
            terms_conditions="Test terms",
            notes="Test notes",
            status="SENT",
        )

    def test_signing_quote_creates_invoice_for_active_service(self):
        """Test signing a quote auto-creates an invoice for eligible services."""
        self.client.force_authenticate(self.client_user)
        signature = SimpleUploadedFile(
            "signature.png",
            b"signature-bytes",
            content_type="image/png",
        )

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
