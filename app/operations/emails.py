from django.conf import settings

from core.emails import send_branded_email
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

    send_branded_email(
        subject=subject,
        text_body=message,
        recipient_list=[quote.service.client.user.email],
        eyebrow="Quote ready",
        heading="Your quote is ready to review.",
        paragraphs=[
            f"Hello {quote.service.client.user.name},",
            f"{quote.service.business.name} sent you a new quote for review and signature.",
        ],
        details=[
            {"label": "Quote", "value": quote.quote_number},
            {"label": "Service", "value": quote.service.service_name},
            {"label": "Valid until", "value": quote.valid_until},
        ],
        action_label="Review and Sign Quote",
        action_url=sign_link,
        notice="This secure link signs you in automatically and expires in 1 hour.",
        signoff=f"The {quote.service.business.name} Team",
        brand_name=quote.service.business.name,
        brand_logo=quote.service.business.logo,
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

    send_branded_email(
        subject=subject,
        text_body=message,
        recipient_list=[service.client.user.email],
        eyebrow="Action required",
        heading="Tell us about your service needs.",
        paragraphs=[
            f"Hello {service.client.user.name},",
            f"{service.business.name} needs a few details before moving your service forward.",
        ],
        details=[
            {"label": "Service", "value": service.service_name},
            {"label": "Business", "value": service.business.name},
        ],
        action_label="Complete Questionnaire",
        action_url=questionnaire_link,
        notice="This secure link signs you in automatically and expires in 1 hour.",
        signoff=f"The {service.business.name} Team",
        brand_name=service.business.name,
        brand_logo=service.business.logo,
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

    send_branded_email(
        subject=subject,
        text_body=message,
        recipient_list=[client.email],
        eyebrow="New service",
        heading="A service was created for you.",
        paragraphs=[
            f"Hello {client.name},",
            f"{business.name} added a new service to your client workspace.",
        ],
        details=[
            {"label": "Service", "value": service.service_name},
            {"label": "Status", "value": service.get_status_display()},
            {"label": "Start date", "value": service.start_date},
            {
                "label": "Address",
                "value": (
                    f"{service.street_address}, {service.city}, "
                    f"{service.province_state} {service.postal_code}"
                ),
            },
        ],
        action_label="View Service",
        action_url=service_link,
        signoff=f"The {business.name} Team",
        brand_name=business.name,
        brand_logo=business.logo,
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

    send_branded_email(
        subject=subject,
        text_body=message,
        recipient_list=[client.email],
        eyebrow="Service update",
        heading="Your service status changed.",
        paragraphs=[
            f"Hello {client.name},",
            f"{business.name} updated your {service.service_name} service.",
        ],
        details=[
            {"label": "Previous status", "value": previous_label},
            {"label": "New status", "value": service.get_status_display()},
        ],
        action_label="View Service",
        action_url=service_link,
        signoff=f"The {business.name} Team",
        brand_name=business.name,
        brand_logo=business.logo,
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

    send_branded_email(
        subject=subject,
        text_body=message,
        recipient_list=[business.owner.email],
        eyebrow="Client activity",
        heading="A questionnaire was submitted.",
        paragraphs=[
            f"Hello {business.owner.name},",
            f"{client.name} completed the requested questionnaire. It is ready for your review.",
        ],
        details=[
            {"label": "Client", "value": client.name},
            {"label": "Service", "value": service.service_name},
        ],
        action_label="Review Submission",
        action_url=service_link,
        brand_name=business.name,
        brand_logo=business.logo,
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

    send_branded_email(
        subject=subject,
        text_body=message,
        recipient_list=[recipient.email],
        eyebrow="Job assignment",
        heading="A new job is ready.",
        paragraphs=[f"Hello {recipient.name},", opening],
        details=[
            {"label": "Job", "value": job.title},
            {"label": "Service", "value": job.service.service_name},
            {"label": "Client", "value": job.service.client.user.name},
            {"label": "Scheduled", "value": job.scheduled_date},
        ],
        action_label="View Job",
        action_url=job_link,
        brand_name=business.name,
        brand_logo=business.logo,
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

    send_branded_email(
        subject=subject,
        text_body=message,
        recipient_list=[business.owner.email],
        eyebrow="Work completed",
        heading="A job was completed.",
        paragraphs=[
            f"Hello {business.owner.name},",
            f"{completed_by} marked this job complete. The job record is ready for review.",
        ],
        details=[
            {"label": "Job", "value": job.title},
            {"label": "Service", "value": job.service.service_name},
            {"label": "Client", "value": job.service.client.user.name},
            {"label": "Completed", "value": job.completed_at},
        ],
        action_label="Review Completed Job",
        action_url=job_link,
        brand_name=business.name,
        brand_logo=business.logo,
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

    send_branded_email(
        subject=subject,
        text_body=message,
        recipient_list=[business.owner.email],
        eyebrow="Quote accepted",
        heading="Your client signed the quote.",
        paragraphs=[
            f"Hello {business.owner.name},",
            f"{client.name} signed the quote for {quote.service.service_name}.",
        ],
        details=[
            {"label": "Quote", "value": quote.quote_number},
            {"label": "Client", "value": client.name},
            {"label": "Service", "value": quote.service.service_name},
        ],
        action_label="View Signed Quote",
        action_url=quote_link,
        brand_name=business.name,
        brand_logo=business.logo,
    )
