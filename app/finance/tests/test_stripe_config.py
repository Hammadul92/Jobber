"""Tests for the publishable Stripe configuration exposed to the browser."""

from types import SimpleNamespace

from django.test import SimpleTestCase, override_settings
from rest_framework.test import APIRequestFactory, force_authenticate

from finance.views import BankingInformationViewSet


class StripeConfigTests(SimpleTestCase):
    def request_config(self, authenticated=True):
        request = APIRequestFactory().get("/api/finance/banking-information/stripe-config/")
        if authenticated:
            force_authenticate(request, user=SimpleNamespace(is_authenticated=True))
        return BankingInformationViewSet.as_view({"get": "stripe_config"})(request)

    @override_settings(STRIPE_PUBLIC_KEY="pk_live_example", STRIPE_SECRET_KEY="sk_live_private")
    def test_returns_only_publishable_key(self):
        response = self.request_config()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, {"publishable_key": "pk_live_example"})
        self.assertEqual(response["Cache-Control"], "no-store")

    @override_settings(STRIPE_PUBLIC_KEY="pk_test_example")
    def test_supports_development_key(self):
        self.assertEqual(self.request_config().data, {"publishable_key": "pk_test_example"})

    def test_rejects_missing_or_secret_key(self):
        for key in ("", "sk_live_private"):
            with self.subTest(key=key), override_settings(STRIPE_PUBLIC_KEY=key):
                self.assertEqual(self.request_config().status_code, 503)

    def test_requires_authentication(self):
        self.assertEqual(self.request_config(authenticated=False).status_code, 401)
