from django.conf import settings

from core.emails import send_branded_email


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

    send_branded_email(
        subject=subject,
        text_body=message,
        recipient_list=[invoice.client.user.email],
        eyebrow="Invoice ready",
        heading="You have a new invoice.",
        paragraphs=[
            f"Hello {invoice.client.user.name},",
            f"{invoice.business.name} sent you a new invoice for review and payment.",
        ],
        details=[
            {"label": "Invoice", "value": invoice.invoice_number},
            {
                "label": "Amount",
                "value": f"{invoice.total_amount} {invoice.currency}",
            },
            {"label": "Due date", "value": invoice.due_date},
        ],
        action_label="View and Pay Invoice",
        action_url=portal_link,
        notice="Questions about this invoice should be directed to the business.",
        signoff=invoice.business.name,
        brand_name=invoice.business.name,
        brand_logo=invoice.business.logo,
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

    send_branded_email(
        subject=subject,
        text_body=message,
        recipient_list=[business.owner.email],
        eyebrow="Payment received",
        heading="An invoice was paid.",
        paragraphs=[
            f"Hello {business.owner.name},",
            f"{client.name} successfully paid an invoice for {business.name}.",
        ],
        details=[
            {"label": "Invoice", "value": invoice.invoice_number},
            {"label": "Client", "value": client.name},
            {
                "label": "Amount",
                "value": f"{invoice.total_amount} {invoice.currency}",
            },
            {"label": "Paid", "value": invoice.paid_at},
        ],
        action_label="View Invoice",
        action_url=invoice_link,
        brand_name=business.name,
        brand_logo=business.logo,
    )
