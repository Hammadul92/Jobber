from django.core.mail import send_mail
from django.conf import settings


def send_registration_email(user, token):
    """Send email verification to a newly registered user."""
    verification_link = f"{settings.FRONTEND_URL}/sign-in?token={token}"

    subject = "Welcome to ZS Projects – Please Verify Your Email"
    message = (
        f"Hello {user.name},\n\n"
        "Welcome to ZS Projects! We're excited to have you on board.\n\n"
        "Before you get started, please verify your email address by "
        "clicking the link below:\n"
        f"{verification_link}\n\n"
        "This step helps us keep your account secure. "
        "The link will expire in 24 hours.\n\n"
        "If you did not create an account, "
        "you can safely ignore this email.\n\n"
        "Best regards,\n"
        "ZS Projects Team"
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
    )


def send_password_reset_email(user, token):
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    subject = "Reset Your Password - ZS Projects"
    message = (
        f"Hello {user.name},\n\n"
        "You requested to reset your password. "
        "Click the link below to set a new password:\n"
        f"{reset_link}\n\n"
        "This link will expire in 1 hour. "
        "If you did not request a password reset, ignore this email.\n\n"
        "Best regards,\n"
        "ZS Projects Team"
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
    )
