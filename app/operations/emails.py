from django.conf import settings

from core.emails import send_branded_email
from core.pricing import quote_tax_details
from operations.pdf import build_signed_quote_pdf
from user.utils import generate_magic_login_token


def send_quote_email(quote):
    """Send quotation email to client."""
    magic_token = generate_magic_login_token(quote.service.client.user, quote=quote)
    sign_link = f"{settings.FRONTEND_URL}/user/business/quote/sign/{quote.id}/?token={magic_token}"
    subtotal, tax_label, tax_amount, total = quote_tax_details(quote)
    currency = quote.currency or quote.service.currency
    period = " per month" if quote.service.billing_cycle == "MONTHLY" else ""
    # A revision says which signed version it updates or replaces.
    previous = getattr(quote, "replaces", None)
    if previous is None or not previous.is_live or previous.status not in ("SIGNED", "VOID") \
            or not previous.signed_at:
        previous = None
    revised = previous is not None
    label = f"{quote.quote_number} (revision {quote.revision})" if revised else quote.quote_number
    signed_on = (
        f"{previous.signed_at:%B} {previous.signed_at.day}, {previous.signed_at.year}" if revised else ""
    )
    if not revised:
        void_note = ""
    elif previous.status == "SIGNED":
        void_note = (
            f"This revised quote updates quote {quote.quote_number} that you signed on {signed_on}. "
            f"That version stays in effect until you sign this one."
        )
    else:
        void_note = (
            f"This revised quote replaces quote {quote.quote_number} that you signed on {signed_on}, "
            f"which is now void. Reason: {previous.void_reason}. Please review and sign this revision."
        )

    subject = (
        f"Revised quote {label} - {quote.service.service_name}"
        if revised else f"Quote {quote.quote_number} - {quote.service.service_name}"
    )
    payment_terms_line = (
        f"Payment Terms: {quote.get_payment_terms_display()}\n"
        if quote.payment_terms else ""
    )
    message = (
        f"Hello {quote.service.client.name},\n\n"
        f"You have received a new quote from "
        f"{quote.service.business.name}.\n\n"
        f"{void_note + chr(10) + chr(10) if void_note else ''}"
        f"Quote Number: {label}\n"
        f"Service: {quote.service.service_name}\n"
        f"Valid Until: {quote.valid_until}\n"
        f"{payment_terms_line}"
        f"Subtotal: ${subtotal:,.2f} {currency}\n"
        f"{tax_label} ({quote.tax_rate}%): ${tax_amount:,.2f} {currency}\n"
        f"Total{period}: ${total:,.2f} {currency}\n"
        f"To view and sign this quote, please click the link below:\n"
        f"{sign_link}\n\n"
        f"Thank you,\n{quote.service.business.name} Team"
    )

    send_branded_email(
        subject=subject,
        text_body=message,
        recipient_list=[quote.service.client.user.email],
        eyebrow="Revised quote" if revised else "Quote ready",
        heading="Your revised quote is ready to review." if revised else "Your quote is ready to review.",
        paragraphs=[
            f"Hello {quote.service.client.name},",
            f"{quote.service.business.name} sent you a new quote for review and signature.",
            *([void_note] if void_note else []),
        ],
        details=[
            {"label": "Quote", "value": label},
            {"label": "Service", "value": quote.service.service_name},
            {"label": "Valid until", "value": quote.valid_until},
            *([{"label": "Payment terms", "value": quote.get_payment_terms_display()}] if quote.payment_terms else []),
            {"label": f"Total{period}", "value": f"${total:,.2f} {currency}"},
        ],
        action_label="Review and Sign Quote",
        action_url=sign_link,
        notice=f"This secure link signs you in automatically and works until the quote expires on {quote.valid_until}.",
        signoff=f"The {quote.service.business.name} Team",
        reply_to=[quote.service.business.email],
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
        f"Hi {service.client.name},\n\n"
        f"Thank you for choosing our services! "
        f"Please fill out your service questionnaire by clicking "
        f"the link below:\n\n"
        f"{questionnaire_link}\n\n"
        f"This link will log you in automatically and expires in 7 days.\n\n"
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
            f"Hello {service.client.name},",
            f"{service.business.name} needs a few details before moving your service forward.",
        ],
        details=[
            {"label": "Service", "value": service.service_name},
            {"label": "Business", "value": service.business.name},
        ],
        action_label="Complete Questionnaire",
        action_url=questionnaire_link,
        notice="This secure link signs you in automatically and expires in 7 days.",
        signoff=f"The {service.business.name} Team",
        reply_to=[service.business.email],
        brand_name=service.business.name,
        brand_logo=service.business.logo,
    )


def send_questionnaire_submitted_email(service):
    """Notify the business owner that a client submitted a questionnaire."""
    service_link = f"{settings.FRONTEND_URL}/user/business/service/{service.id}"
    client = service.client
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
        reply_to=[business.email],
        brand_name=business.name,
        brand_logo=business.logo,
    )


def send_job_created_email(job):
    """Notify each assigned team member, or the owner for an unassigned job."""
    business = job.service.business
    employees = [a.team_member.employee for a in job.assignments.select_related("team_member__employee")]
    if not employees:
        _send_job_created_email(job, business.owner, f"A new unassigned job has been created for {business.name}.")
        return
    for employee in employees:
        _send_job_created_email(job, employee, f"A new job has been assigned to you by {business.name}.")


def _send_job_created_email(job, recipient, opening):
    business = job.service.business
    job_link = f"{settings.FRONTEND_URL}/user/business/job/{job.id}"

    subject = f"New job: {job.title}"
    message = (
        f"Hello {recipient.name},\n\n"
        f"{opening}\n\n"
        f"Job: {job.title}\n"
        f"Service: {job.service.service_name}\n"
        f"Client: {job.service.client.name}\n"
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
            {"label": "Client", "value": job.service.client.name},
            {"label": "Scheduled", "value": job.scheduled_date},
        ],
        action_label="View Job",
        action_url=job_link,
        reply_to=[business.email],
        brand_name=business.name,
        brand_logo=business.logo,
    )


def send_job_completed_email(job):
    """Notify the business owner when a job is completed."""
    business = job.service.business
    names = [a.team_member.employee.name for a in job.assignments.select_related("team_member__employee")]
    completed_by = ", ".join(names) if names else "A team member"
    job_link = f"{settings.FRONTEND_URL}/user/business/job/{job.id}"

    subject = f"Job completed: {job.title}"
    message = (
        f"Hello {business.owner.name},\n\n"
        f"{completed_by} completed the job {job.title}.\n\n"
        f"Service: {job.service.service_name}\n"
        f"Client: {job.service.client.name}\n"
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
            {"label": "Client", "value": job.service.client.name},
            {"label": "Completed", "value": job.completed_at},
        ],
        action_label="Review Completed Job",
        action_url=job_link,
        reply_to=[business.email],
        brand_name=business.name,
        brand_logo=business.logo,
    )


def send_quote_signed_email(quote):
    """Notify the business owner when a client signs a quote."""
    business = quote.service.business
    client = quote.service.client
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
        reply_to=[business.email],
        brand_name=business.name,
        brand_logo=business.logo,
    )


def send_signed_quote_copy_email(quote):
    """Send the signing client a PDF copy of their finalized quote."""
    business = quote.service.business
    client = quote.service.client
    quote_link = f"{settings.FRONTEND_URL}/user/business/quote/{quote.id}"
    subject = f"Your signed quote: {quote.quote_number}"
    message = (
        f"Hello {client.name},\n\n"
        f"You signed quote {quote.quote_number} from {business.name} for "
        f"{quote.service.service_name}.\n\n"
        "A PDF copy of your signed quote is attached for your records.\n\n"
        f"View your signed quote here:\n{quote_link}\n\n"
        f"Best regards,\nThe {business.name} Team"
    )

    with build_signed_quote_pdf(quote) as pdf:
        send_branded_email(
            subject=subject,
            text_body=message,
            recipient_list=[client.user.email],
            eyebrow="Signed quote",
            heading="Your signed quote, for your records.",
            paragraphs=[
                f"Hello {client.name},",
                f"You signed the quote from {business.name} for {quote.service.service_name}.",
                "A PDF copy of your signed quote is attached for your records.",
            ],
            details=[
                {"label": "Quote", "value": quote.quote_number},
                {"label": "Service", "value": quote.service.service_name},
                {"label": "Signed", "value": quote.signed_at},
            ],
            action_label="View Signed Quote",
            action_url=quote_link,
            signoff=f"The {business.name} Team",
            reply_to=[business.email],
            brand_name=business.name,
            brand_logo=business.logo,
            attachments=[
                (f"{quote.quote_number}-signed.pdf", pdf.read(), "application/pdf"),
            ],
        )
