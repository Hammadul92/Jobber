from django.conf import settings

from core.emails import send_branded_email
from user.utils import generate_magic_login_token


def send_invoice_email(invoice):
    """Send invoice notification email to client with portal link."""

    magic_token = generate_magic_login_token(invoice.client.user)
    portal_link = (
        f"{settings.FRONTEND_URL}/user/business/invoice/{invoice.id}"
        f"?token={magic_token}"
    )

    subject = f"Invoice #{invoice.invoice_number} from {invoice.business.name}"
    payment_terms_line = (
        f"Payment Terms: {invoice.get_payment_terms_display()}\n"
        if invoice.payment_terms else ""
    )
    message = (
        f"Dear {invoice.client.name},\n\n"
        f"You have received a new invoice from {invoice.business.name}.\n"
        f"Invoice Number: {invoice.invoice_number}\n"
        f"Amount: {invoice.total_amount} {invoice.currency}\n"
        f"{payment_terms_line}"
        f"Due Date: {invoice.due_date}\n\n"
        f"Use this secure link to view and pay this invoice:\n"
        f"{portal_link}\n\n"
        "This secure link signs you in automatically and expires in 7 days.\n"
        "If it expires, sign in to your client portal to view the invoice.\n\n"
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
            f"Hello {invoice.client.name},",
            f"{invoice.business.name} sent you a new invoice for review and payment.",
        ],
        details=[
            {"label": "Invoice", "value": invoice.invoice_number},
            {
                "label": "Amount",
                "value": f"{invoice.total_amount} {invoice.currency}",
            },
            {"label": "Due date", "value": invoice.due_date},
            *(
                [{"label": "Payment terms", "value": invoice.get_payment_terms_display()}]
                if invoice.payment_terms else []
            ),
        ],
        action_label="View and Pay Invoice",
        action_url=portal_link,
        notice=(
            "This secure link signs you in automatically and expires in 7 days. "
            "If it expires, sign in to view your invoice. "
            "Questions about this invoice should be directed to the business."
        ),
        signoff=invoice.business.name,
        reply_to=[invoice.business.email],
        brand_name=invoice.business.name,
        brand_logo=invoice.business.logo,
    )


def send_invoice_paid_email(invoice):
    """Notify the business owner after a client successfully pays an invoice."""
    invoice_link = f"{settings.FRONTEND_URL}/user/business/invoice/{invoice.id}"
    business = invoice.business
    client = invoice.client

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
        reply_to=[business.email],
        brand_name=business.name,
        brand_logo=business.logo,
    )


def send_refund_issued_email(payout, refund):
    """Tell the client a refund was issued for their invoice payment."""
    invoice = payout.invoice
    business = invoice.business
    client = invoice.client
    remaining = payout.amount - (payout.refunded_amount or 0)

    subject = f"Refund issued for invoice {invoice.invoice_number}"
    message = (
        f"Hello {client.name},\n\n"
        f"{business.name} refunded {refund.amount} {payout.currency} for invoice "
        f"{invoice.invoice_number}.\n\n"
        f"Total refunded: {payout.refunded_amount} {payout.currency}\n"
        f"Payment kept: {remaining} {payout.currency}\n\n"
        "Refunds usually reach your card within 5-10 business days.\n\n"
        f"Thank you,\n{business.name}"
    )

    send_branded_email(
        subject=subject,
        text_body=message,
        recipient_list=[client.user.email],
        eyebrow="Refund issued",
        heading="Your refund is on its way.",
        paragraphs=[
            f"Hello {client.name},",
            f"{business.name} refunded part or all of your payment for invoice {invoice.invoice_number}.",
        ],
        details=[
            {"label": "Invoice", "value": invoice.invoice_number},
            {"label": "This refund", "value": f"{refund.amount} {payout.currency}"},
            {"label": "Total refunded", "value": f"{payout.refunded_amount} {payout.currency}"},
            {"label": "Payment kept", "value": f"{remaining} {payout.currency}"},
        ],
        notice="Refunds usually reach your card within 5-10 business days.",
        signoff=f"{business.name} Team",
        reply_to=[business.email],
        brand_name=business.name,
        brand_logo=business.logo,
    )
