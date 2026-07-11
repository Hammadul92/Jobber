"""
Test for business APIs
"""

import tempfile
from io import BytesIO
from datetime import date, timedelta
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import patch

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient

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


BUSINESSES_URL = reverse("operations:business-list")
BUSINESS_MARQUEE_LOGOS_URL = reverse("operations:business-marquee-logos")
SERVICES_URL = reverse("operations:service-list")
QUOTES_URL = reverse("operations:quote-list")
QUOTE_SIGN_URL = "operations:quote-sign-quote"
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


class QuoteInvoiceAutomationTests(TestCase):
    """Test automatic invoice creation around quote signing."""

    def setUp(self):
        self.client = APIClient()
        self.owner = get_user_model().objects.create_user(
            "owner@example.com",
            "test123",
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
        )

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

    @patch("operations.views.emails.send_quote_email")
    @patch("operations.views.emails.send_service_questionnaire_email")
    @patch("finance.views.stripe.PaymentIntent.create")
    def test_full_happy_path_creates_quote_invoice_payment_payout_and_job(
        self,
        mock_payment_intent_create,
        mock_questionnaire_email,
        mock_quote_email,
    ):
        """Test manager/client flow from service setup through paid payout."""
        self.create_questionnaire_and_terms()
        mock_payment_intent_create.return_value = SimpleNamespace(id="pi_success")
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
                "terms_conditions": "Additional terms.",
            },
        )
        self.assertEqual(quote_res.status_code, status.HTTP_201_CREATED)
        quote = Quote.objects.get(id=quote_res.data["id"])

        quote.status = "SENT"
        quote.save(update_fields=["status"])

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
        quote.save(update_fields=["status"])
        first_sign_res = self.sign_quote_as_client(quote)
        self.assertEqual(first_sign_res.status_code, status.HTTP_200_OK)
        second_sign_res = self.sign_quote_as_client(quote)
        self.assertEqual(second_sign_res.status_code, status.HTTP_400_BAD_REQUEST)
