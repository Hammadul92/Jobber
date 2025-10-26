from django.core.mail import send_mail
from django.conf import settings


def send_quote_email(quote):
    """Send quotation email to client."""

    sign_link = (
        f"{settings.FRONTEND_URL}/dashboard/quote/"
        f"sign/{quote.id}/"
    )

    subject = f"Quote {quote.quote_number} - {quote.service.service_name}"
    message = (
        f"Hello {quote.service.client.user.name},\n\n"
        f"You have received a new quote from "
        f"{quote.service.business.name}.\n\n"
        f"Quote Number: {quote.quote_number}\n"
        f"Service: {quote.service.service_name}\n"
        f"Valid Until: {quote.valid_until}\n"
        f"To view and sign this quote, please click the link below:\n"
        f"{sign_link}\n\n"
        f"Thank you,\n{quote.service.business.name} Team"
    )

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [quote.service.client.user.email],
        fail_silently=False,
    )


def send_service_questionnaire_email(service, questionnaire):
    """Send email to client with questionnaire link."""

    subject = "Please Fill Out Your Service Questionnaire"
    questionnaire_link = (
        f"{settings.FRONTEND_URL}/dashboard/service-questionnaire/"
        f"{questionnaire.id}/form/{service.id}/"
    )

    message = (
        f"Hi {service.client.user.name},\n\n"
        f"Thank you for choosing our services! "
        f"Please fill out your service questionnaire by clicking "
        f"the link below:\n\n"
        f"{questionnaire_link}\n\n"
        f"Best regards,\n"
        f"The {service.business.name} Team"
    )

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [service.client.user.email],
        fail_silently=False,
    )
