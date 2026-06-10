from django.contrib.auth import get_user_model
from django.core.mail import EmailMessage, send_mail
from django.conf import settings


def send_registration_email(user, token):
    """Send email verification to a newly registered user."""
    verification_link = f"{settings.FRONTEND_URL}/sign-in?token={token}"

    subject = "Welcome to Contractorz – Please Verify Your Email"
    message = (
        f"Hello {user.name},\n\n"
        "Welcome to Contractorz! We're excited to have you on board.\n\n"
        "Before you get started, please verify your email address by "
        "clicking the link below:\n"
        f"{verification_link}\n\n"
        "This step helps us keep your account secure. "
        "The link will expire in 24 hours.\n\n"
        "If you did not create an account, "
        "you can safely ignore this email.\n\n"
        "Best regards,\n"
        "Contractorz Team"
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
    )


def send_password_reset_email(user, token):
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    subject = "Reset Your Password - Contractorz"
    message = (
        f"Hello {user.name},\n\n"
        "You requested to reset your password. "
        "Click the link below to set a new password:\n"
        f"{reset_link}\n\n"
        "This link will expire in 1 hour. "
        "If you did not request a password reset, ignore this email.\n\n"
        "Best regards,\n"
        "Contractorz Team"
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
    )


def send_contact_submission_email(contact_data):
    """Send contact form inquiry to all active staff users."""

    staff_emails = list(
        get_user_model()
        .objects.filter(is_staff=True, is_active=True)
        .exclude(email="")
        .values_list("email", flat=True)
        .distinct()
    )

    if not staff_emails:
        raise ValueError("No active staff email recipients are configured.")

    full_name = (
        f"{contact_data['first_name'].strip()} {contact_data['last_name'].strip()}"
    )
    subject = f"New Contact Inquiry from {full_name}"
    message = (
        "A new contact form submission has been received.\n\n"
        f"Name: {full_name}\n"
        f"Work Email: {contact_data['email']}\n"
        f"Company Name: {contact_data['company_name']}\n\n"
        "Message:\n"
        f"{contact_data['message']}\n"
    )

    email = EmailMessage(
        subject=subject,
        body=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=staff_emails,
        reply_to=[contact_data["email"]],
    )
    email.send(fail_silently=False)
