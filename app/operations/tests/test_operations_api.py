"""
Test for business APIs
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APIClient

from core.models import Business

from operations.serializers import BusinessSerializer


BUSINESSES_URL = reverse("operations:business-list")


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
