from django.core.mail import send_mail
from django.conf import settings

from user.utils import generate_magic_login_token


def send_quote_email(quote):
    """Send quotation email to client."""
    magic_token = generate_magic_login_token(quote.service.client.user)
    sign_link = f"{settings.FRONTEND_URL}/user/business/quote/sign/{quote.id}/?token={magic_token}"

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


def send_service_questionnaire_email(service, questionnaire, magic_token=None):
    """Send email to client with questionnaire magic link (no login required)."""
    if not magic_token:
        magic_token = generate_magic_login_token(service.client.user)

    subject = "Please Fill Out Your Service Questionnaire"
    questionnaire_link = (
        f"{settings.FRONTEND_URL}/service-questionnaire/"
        f"{questionnaire.id}/form/{service.id}?token={magic_token}"
    )

    message = (
        f"Hi {service.client.user.name},\n\n"
        f"Thank you for choosing our services! "
        f"Please fill out your service questionnaire by clicking "
        f"the link below:\n\n"
        f"{questionnaire_link}\n\n"
        f"This link will log you in automatically and expires in 1 hour.\n\n"
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


def send_service_created_email(service):
    """Notify a client that a service was created for them."""
    client = service.client.user
    business = service.business
    service_link = f"{settings.FRONTEND_URL}/user/business/service/{service.id}"

    subject = f"New service from {business.name}: {service.service_name}"
    message = (
        f"Hello {client.name},\n\n"
        f"{business.name} created a new service for you.\n\n"
        f"Service: {service.service_name}\n"
        f"Status: {service.get_status_display()}\n"
        f"Start date: {service.start_date}\n"
        f"Address: {service.street_address}, {service.city}, "
        f"{service.province_state} {service.postal_code}\n\n"
        f"View the service here:\n{service_link}\n\n"
        f"Best regards,\nThe {business.name} Team"
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[client.email],
        fail_silently=False,
    )


def send_service_status_changed_email(service, previous_status):
    """Notify a client that their service status changed."""
    client = service.client.user
    business = service.business
    service_link = f"{settings.FRONTEND_URL}/user/business/service/{service.id}"
    previous_label = dict(service._meta.get_field("status").choices).get(
        previous_status,
        previous_status.replace("_", " ").title(),
    )

    subject = f"Service status updated: {service.service_name}"
    message = (
        f"Hello {client.name},\n\n"
        f"{business.name} updated the status of your "
        f"{service.service_name} service.\n\n"
        f"Previous status: {previous_label}\n"
        f"New status: {service.get_status_display()}\n\n"
        f"View the service here:\n{service_link}\n\n"
        f"Best regards,\nThe {business.name} Team"
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[client.email],
        fail_silently=False,
    )


def send_questionnaire_submitted_email(service):
    """Notify the business owner that a client submitted a questionnaire."""
    service_link = f"{settings.FRONTEND_URL}/user/business/service/{service.id}"
    client = service.client.user
    business = service.business

    subject = f"Questionnaire submitted - {client.name}"
    message = (
        f"Hello {business.owner.name},\n\n"
        f"{client.name} submitted the questionnaire for "
        f"{service.service_name}.\n\n"
        f"Review the submitted information here:\n{service_link}\n\n"
        "Best regards,\n"
        "Contractorz Team"
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[business.owner.email],
        fail_silently=False,
    )


def send_job_created_email(job):
    """Notify the assigned employee, or owner for an unassigned job."""
    business = job.service.business
    employee = job.assigned_to.employee if job.assigned_to else None
    recipient = employee or business.owner
    job_link = f"{settings.FRONTEND_URL}/user/business/job/{job.id}"

    if employee:
        opening = f"A new job has been assigned to you by {business.name}."
    else:
        opening = f"A new unassigned job has been created for {business.name}."

    subject = f"New job: {job.title}"
    message = (
        f"Hello {recipient.name},\n\n"
        f"{opening}\n\n"
        f"Job: {job.title}\n"
        f"Service: {job.service.service_name}\n"
        f"Client: {job.service.client.user.name}\n"
        f"Scheduled for: {job.scheduled_date}\n\n"
        f"View the job here:\n{job_link}\n\n"
        "Best regards,\n"
        "Contractorz Team"
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[recipient.email],
        fail_silently=False,
    )


def send_job_completed_email(job):
    """Notify the business owner when a job is completed."""
    business = job.service.business
    employee = job.assigned_to.employee if job.assigned_to else None
    completed_by = employee.name if employee else "A team member"
    job_link = f"{settings.FRONTEND_URL}/user/business/job/{job.id}"

    subject = f"Job completed: {job.title}"
    message = (
        f"Hello {business.owner.name},\n\n"
        f"{completed_by} completed the job {job.title}.\n\n"
        f"Service: {job.service.service_name}\n"
        f"Client: {job.service.client.user.name}\n"
        f"Completed at: {job.completed_at}\n\n"
        f"Review the completed job here:\n{job_link}\n\n"
        "Best regards,\n"
        "Contractorz Team"
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[business.owner.email],
        fail_silently=False,
    )


def send_quote_signed_email(quote):
    """Notify the business owner when a client signs a quote."""
    business = quote.service.business
    client = quote.service.client.user
    quote_link = f"{settings.FRONTEND_URL}/user/business/quote/{quote.id}"

    subject = f"Quote signed: {quote.quote_number}"
    message = (
        f"Hello {business.owner.name},\n\n"
        f"{client.name} signed quote {quote.quote_number} for "
        f"{quote.service.service_name}.\n\n"
        f"Review the signed quote here:\n{quote_link}\n\n"
        "Best regards,\n"
        "Contractorz Team"
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[business.owner.email],
        fail_silently=False,
    )
