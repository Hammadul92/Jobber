"""Tests for environment-specific email backend selection."""

from django.test import SimpleTestCase

from app.email_settings import get_email_backend


class EmailBackendSelectionTests(SimpleTestCase):
    """Test local and production email backend selection."""

    def test_local_uses_console_email_backend(self):
        """Test DEBUG/local configuration writes email to console."""
        backend = get_email_backend(debug=True, sendgrid_api_key="test-key")

        self.assertEqual(
            backend,
            "django.core.mail.backends.console.EmailBackend",
        )

    def test_production_with_sendgrid_key_uses_sendgrid_backend(self):
        """Test production configuration uses SendGrid when key is present."""
        backend = get_email_backend(debug=False, sendgrid_api_key="test-key")

        self.assertEqual(backend, "sendgrid_backend.SendgridBackend")

    def test_production_without_sendgrid_key_falls_back_to_console(self):
        """Test production without a key does not select SendGrid."""
        backend = get_email_backend(debug=False, sendgrid_api_key="")

        self.assertEqual(
            backend,
            "django.core.mail.backends.console.EmailBackend",
        )
