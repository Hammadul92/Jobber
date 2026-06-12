"""
Tests for the user API.
"""
import tempfile
from django.core import mail
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from io import BytesIO

from rest_framework.test import APIClient
from rest_framework import status
from PIL import Image
from core.models import FAQ


CREATE_USER_URL = reverse('user:create')
TOKEN_URL = reverse('user:token')
ME_URL = reverse('user:me')
CONTACT_URL = reverse('user:contact')
FAQS_URL = reverse('user:faqs')


def create_user(**params):
    """Create and return a new user."""
    return get_user_model().objects.create_user(**params)


class PublicUserApiTests(TestCase):
    """Test the public features of the user API."""

    def setUp(self):
        self.client = APIClient()

    def test_create_user_success(self):
        """Test creating a user is successful."""
        payload = {
            'email': 'test@example.com',
            'password': 'testpass123',
            'name': 'Test Name',
            'phone': '1234567890',
            'role': 'USER',
        }
        res = self.client.post(CREATE_USER_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        user = get_user_model().objects.get(email=payload['email'])
        self.assertTrue(user.check_password(payload['password']))
        self.assertNotIn('password', res.data)

    def test_user_with_email_exists_error(self):
        """Test error returned if user with email exists."""
        payload = {
            'email': 'test@example.com',
            'password': 'testpass123',
            'name': 'Test Name',
        }
        create_user(**payload)
        res = self.client.post(CREATE_USER_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_too_short_error(self):
        """Test an error is returned if password less than 5 chars."""
        payload = {
            'email': 'test@example.com',
            'password': 'pw',
            'name': 'Test name',
        }
        res = self.client.post(CREATE_USER_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        user_exists = get_user_model().objects.filter(
            email=payload['email']
        ).exists()
        self.assertFalse(user_exists)

    def test_create_token_for_user(self):
        """Test generates token for valid credentials."""
        user_details = {
            'name': 'Test Name',
            'email': 'test@example.com',
            'password': 'test-user-password123',
        }
        create_user(**user_details)

        payload = {
            'email': user_details['email'],
            'password': user_details['password'],
        }
        res = self.client.post(TOKEN_URL, payload)

        self.assertIn('token', res.data)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_create_token_bad_credentials(self):
        """Test returns error if credentials invalid."""
        create_user(email='test@example.com', password='goodpass')

        payload = {'email': 'test@example.com', 'password': 'badpass'}
        res = self.client.post(TOKEN_URL, payload)

        self.assertNotIn('token', res.data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_token_email_not_found(self):
        """Test error returned if user not found for given email."""
        payload = {'email': 'test@example.com', 'password': 'pass123'}
        res = self.client.post(TOKEN_URL, payload)

        self.assertNotIn('token', res.data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_token_blank_password(self):
        """Test posting a blank password returns an error."""
        payload = {'email': 'test@example.com', 'password': ''}
        res = self.client.post(TOKEN_URL, payload)

        self.assertNotIn('token', res.data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_user_unauthorized(self):
        """Test authentication is required for users."""
        res = self.client.get(ME_URL)

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_submit_contact_form_success(self):
        """Test a valid contact submission emails all active staff users."""
        staff_user = create_user(
            email="staff@example.com",
            password="testpass123",
            name="Staff User",
        )
        staff_user.is_staff = True
        staff_user.save(update_fields=["is_staff"])

        inactive_staff = create_user(
            email="inactive@example.com",
            password="testpass123",
            name="Inactive Staff",
        )
        inactive_staff.is_staff = True
        inactive_staff.is_active = False
        inactive_staff.save(update_fields=["is_staff", "is_active"])

        payload = {
            "first_name": "Ali",
            "last_name": "Ahsan",
            "email": "ali@example.com",
            "company_name": "InsoLogics",
            "message": "I would like to learn more about your product demo.",
            "privacy_agreed": True,
        }

        res = self.client.post(CONTACT_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["staff@example.com"])
        self.assertEqual(mail.outbox[0].reply_to, ["ali@example.com"])
        self.assertIn("InsoLogics", mail.outbox[0].body)

    def test_submit_contact_form_requires_privacy_agreement(self):
        """Test contact form rejects submissions without privacy agreement."""
        payload = {
            "first_name": "Ali",
            "last_name": "Ahsan",
            "email": "ali@example.com",
            "company_name": "InsoLogics",
            "message": "I would like to learn more about your product demo.",
            "privacy_agreed": False,
        }

        res = self.client.post(CONTACT_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("privacy_agreed", res.data)

    def test_submit_contact_form_without_staff_recipients(self):
        """Test contact form returns service unavailable without staff recipients."""
        payload = {
            "first_name": "Ali",
            "last_name": "Ahsan",
            "email": "ali@example.com",
            "company_name": "InsoLogics",
            "message": "I would like to learn more about your product demo.",
            "privacy_agreed": True,
        }

        res = self.client.post(CONTACT_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(len(mail.outbox), 0)

    def test_fetch_faqs_returns_only_active_items_in_order(self):
        """Test FAQ endpoint returns active FAQs ordered by sort order."""
        FAQ.all_objects.all().delete()

        FAQ.objects.create(
            question="Can clients sign quotes online?",
            answer="Yes, clients can sign quotes through a secure link.",
            sort_order=2,
            is_active=True,
        )
        FAQ.objects.create(
            question="How do payouts work?",
            answer="Payouts are tracked from Stripe-connected banking.",
            sort_order=3,
            is_active=False,
        )
        FAQ.objects.create(
            question="Do you support service questionnaires?",
            answer="Yes, businesses can create service-specific questionnaires.",
            sort_order=1,
            is_active=True,
        )

        res = self.client.get(FAQS_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)
        self.assertEqual(
            [item["question"] for item in res.data],
            [
                "Do you support service questionnaires?",
                "Can clients sign quotes online?",
            ],
        )


class PrivateUserApiTests(TestCase):
    """Test API requests that require authentication."""

    def setUp(self):
        self.user = create_user(
            email='test@example.com',
            password='testpass123',
            name='Test Name',
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_retrieve_profile_success(self):
        """Test retrieving profile for logged in user."""
        res = self.client.get(ME_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        expected_data = {
            'id': self.user.id,
            'email': self.user.email,
            'role': self.user.role,
            'name': self.user.name,
            'phone': self.user.phone,
            'last_login': self.user.last_login,
        }
        # Only compare keys that exist in the response
        for key in expected_data:
            self.assertEqual(res.data.get(key), expected_data[key])

    def test_post_me_not_allowed(self):
        """Test POST is not allowed for the me endpoint."""
        res = self.client.post(ME_URL, {})

        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_update_user_profile(self):
        """Test updating the user profile for the authenticated user."""
        payload = {'name': 'Updated name', 'password': 'newpassword123'}

        res = self.client.patch(ME_URL, payload)

        self.user.refresh_from_db()
        self.assertEqual(self.user.name, payload['name'])
        self.assertTrue(self.user.check_password(payload['password']))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_update_user_profile_photo(self):
        """Test uploading and saving a profile image for the authenticated user."""
        buffer = BytesIO()
        Image.new('RGB', (1, 1), color='white').save(buffer, format='PNG')
        buffer.seek(0)

        image = SimpleUploadedFile(
            'profile-photo.png',
            buffer.getvalue(),
            content_type='image/png',
        )

        with tempfile.TemporaryDirectory() as temp_media_root:
            with self.settings(MEDIA_ROOT=temp_media_root):
                res = self.client.patch(
                    ME_URL,
                    {'photo': image},
                    format='multipart',
                )

                self.user.refresh_from_db()

                self.assertEqual(res.status_code, status.HTTP_200_OK)
                self.assertTrue(self.user.photo)
                self.assertIn('uploads/profile_photos/', res.data['photoUrl'])
