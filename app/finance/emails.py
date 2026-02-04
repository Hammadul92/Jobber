from django.core.mail import send_mail
from django.conf import settings


def send_invoice_email(invoice):
    """Send invoice notification email to client with portal link."""

    portal_link = f"{settings.FRONTEND_URL}/dashboard/invoice/{invoice.id}"

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
