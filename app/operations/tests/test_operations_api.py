"""
Test for business APIs
"""

import tempfile
from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile

from rest_framework import status
from rest_framework.test import APIClient

from core.models import (
    Business,
    Client,
    Invoice,
    Quote,
    Service,
    ServiceQuestionnaire,
    ServiceTermsTemplate,
)

from operations.serializers import BusinessSerializer


BUSINESSES_URL = reverse("operations:business-list")
SERVICES_URL = reverse("operations:service-list")
QUOTES_URL = reverse("operations:quote-list")
QUOTE_SIGN_URL = "operations:quote-sign-quote"


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


class PublicBusinessApiTests(TestCase):
    """Test unauthenticated API requests."""

    def setUp(self):
        self.client = APIClient()

    def test_auth_required(self):
        """Test auth is required to call API."""
        res = self.client.get(BUSINESSES_URL)

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


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
