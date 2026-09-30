from django.core.mail import send_mail
from django.conf import settings


def send_invoice_email(invoice):
    """Send invoice notification email to client with portal link."""

    portal_link = f"{settings.FRONTEND_URL}/user/business/invoice/{invoice.id}"

    subject = f"Invoice #{invoice.invoice_number} from {invoice.business.name}"
    message = (
        f"Dear {invoice.client.user.name},\n\n"
        f"You have received a new invoice from {invoice.business.name}.\n"
        f"Invoice Number: {invoice.invoice_number}\n"
        f"Amount: {invoice.total_amount} {invoice.currency}\n"
        f"Due Date: {invoice.due_date}\n\n"
        f"You can log in to your client portal to view and pay this invoice:\n"
        f"{portal_link}\n\n"
        "If you have any questions, please contact the business directly.\n\n"
        f"Best regards,\n"
        f"{invoice.business.name}"
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[invoice.client.user.email],
        fail_silently=False,
    )


def send_invoice_paid_email(invoice):
    """Notify the business owner after a client successfully pays an invoice."""
    invoice_link = f"{settings.FRONTEND_URL}/user/business/invoice/{invoice.id}"
    business = invoice.business
    client = invoice.client.user

    subject = f"Invoice paid: {invoice.invoice_number}"
    message = (
        f"Hello {business.owner.name},\n\n"
        f"{client.name} paid invoice {invoice.invoice_number}.\n\n"
        f"Amount: {invoice.total_amount} {invoice.currency}\n"
        f"Paid at: {invoice.paid_at}\n\n"
        f"View the invoice here:\n{invoice_link}\n\n"
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
