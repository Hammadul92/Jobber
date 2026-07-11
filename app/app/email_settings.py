"""Helpers for selecting the configured email backend."""


def get_email_backend(debug, sendgrid_api_key):
    """Return SendGrid in production with a key, otherwise console email."""
    if not debug and sendgrid_api_key:
        return "sendgrid_backend.SendgridBackend"
    return "django.core.mail.backends.console.EmailBackend"
