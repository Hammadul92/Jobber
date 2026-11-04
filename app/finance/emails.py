from django.conf import settings

from core.emails import send_branded_email
from core.payment_terms import business_local_date
from finance.pdf import build_invoice_pdf, invoice_pdf_filename, payment_method_label, refunded_total
from user.utils import generate_magic_login_token


def _amount(invoice):
    return f"${invoice.total_amount:,.2f} {invoice.currency}"


def _invoice_pdf_attachment(invoice):
    with build_invoice_pdf(invoice) as pdf:
        return (invoice_pdf_filename(invoice), pdf.read(), "application/pdf")


def send_invoice_email(invoice):
    """Email the invoice PDF to the client with the payment option chosen on send.

    PAYMENT_LINK adds a secure "View and Pay" link; ETRANSFER gives Interac
    e-Transfer instructions instead and has no online payment link.
    """
    business = invoice.business
    client = invoice.client
    by_etransfer = invoice.payment_option == "ETRANSFER"
    subject = f"Invoice #{invoice.invoice_number} from {business.name}"
    payment_terms_line = (
        f"Payment Terms: {invoice.get_payment_terms_display()}\n"
        if invoice.payment_terms else ""
    )
    details = [
        {"label": "Invoice", "value": invoice.invoice_number},
        {"label": "Amount due", "value": _amount(invoice)},
        {"label": "Due date", "value": invoice.due_date},
        *(
            [{"label": "Payment terms", "value": invoice.get_payment_terms_display()}]
            if invoice.payment_terms else []
        ),
    ]
    summary = (
        f"Invoice Number: {invoice.invoice_number}\n"
        f"Amount Due: {_amount(invoice)}\n"
        f"{payment_terms_line}"
        f"Due Date: {invoice.due_date}\n\n"
    )

    if by_etransfer:
        details += [
            {"label": "e-Transfer to", "value": business.etransfer_email},
            {"label": "e-Transfer message", "value": f"Invoice {invoice.invoice_number}"},
        ]
        how_to_pay = (
            f"Please pay by Interac e-Transfer to {business.etransfer_email}. "
            f"Include invoice number {invoice.invoice_number} in the e-Transfer message "
            "so your payment can be matched."
        )
        message = (
            f"Dear {client.name},\n\n"
            f"You have received a new invoice from {business.name}. "
            "A PDF copy is attached.\n\n"
            f"{summary}"
            "How to pay (Interac e-Transfer):\n"
            f"Send to: {business.etransfer_email}\n"
            f"Amount: {_amount(invoice)}\n"
            f"Message: Invoice {invoice.invoice_number}\n\n"
            "If you have any questions, please reply to this email.\n\n"
            f"Best regards,\n{business.name}"
        )
        action_label = action_url = None
        notice = (
            "Your payment will be confirmed by email once it has been received. "
            "Questions about this invoice should be directed to the business."
        )
    else:
        magic_token = generate_magic_login_token(client.user)
        action_url = (
            f"{settings.FRONTEND_URL}/user/business/invoice/{invoice.id}"
            f"?token={magic_token}"
        )
        action_label = "View and Pay Invoice"
        how_to_pay = "Use the secure button below to view and pay it online."
        message = (
            f"Dear {client.name},\n\n"
            f"You have received a new invoice from {business.name}. "
            "A PDF copy is attached.\n\n"
            f"{summary}"
            f"Use this secure link to view and pay this invoice:\n{action_url}\n\n"
            "This secure link signs you in automatically and expires in 7 days.\n"
            "If it expires, sign in to your client portal to view the invoice.\n\n"
            "If you have any questions, please contact the business directly.\n\n"
            f"Best regards,\n{business.name}"
        )
        notice = (
            "This secure link signs you in automatically and expires in 7 days. "
            "If it expires, sign in to view your invoice. "
            "Questions about this invoice should be directed to the business."
        )

    send_branded_email(
        subject=subject,
        text_body=message,
        recipient_list=[client.user.email],
        eyebrow="Invoice ready",
        heading="You have a new invoice.",
        paragraphs=[
            f"Hello {client.name},",
            f"{business.name} sent you invoice {invoice.invoice_number} for {_amount(invoice)}. "
            "A PDF copy is attached.",
            how_to_pay,
        ],
        details=details,
        action_label=action_label,
        action_url=action_url,
        notice=notice,
        signoff=business.name,
        reply_to=[business.email],
        brand_name=business.name,
        brand_logo=business.logo,
        attachments=[_invoice_pdf_attachment(invoice)],
    )


def send_payment_confirmation_email(invoice):
    """Send the client a payment receipt with the paid invoice PDF attached."""
    business = invoice.business
    client = invoice.client
    paid_on = invoice.paid_at
    if paid_on is not None:
        paid_on = f"{business_local_date(business, paid_on):%B %d, %Y}"
    method = payment_method_label(invoice)
    refunded = refunded_total(invoice)
    settled = (
        "the invoice is now paid in full" if not refunded
        else f"${refunded:,.2f} {invoice.currency} of it has since been refunded"
    )
    refund_line = f"Refunded: ${refunded:,.2f} {invoice.currency}\n" if refunded else ""
    subject = f"Payment received: Invoice #{invoice.invoice_number} from {business.name}"
    message = (
        f"Dear {client.name},\n\n"
        f"Thank you for your payment. {business.name} has received your payment "
        f"for invoice {invoice.invoice_number}, and {settled}.\n\n"
        f"Invoice Number: {invoice.invoice_number}\n"
        f"Amount Paid: {_amount(invoice)}\n"
        f"Payment Date: {paid_on or '-'}\n"
        f"Payment Method: {method}\n"
        f"{refund_line}"
        f"Balance Due: $0.00 {invoice.currency}\n\n"
        "A PDF copy of the paid invoice is attached for your records.\n\n"
        f"Thank you for your business,\n{business.name}"
    )
    send_branded_email(
        subject=subject,
        text_body=message,
        recipient_list=[client.user.email],
        eyebrow="Payment received",
        heading="Thank you for your payment.",
        paragraphs=[
            f"Hello {client.name},",
            f"{business.name} has received your payment for invoice {invoice.invoice_number}, "
            f"and {settled}.",
            "A PDF copy of the paid invoice is attached for your records.",
        ],
        details=[
            {"label": "Invoice", "value": invoice.invoice_number},
            {"label": "Amount paid", "value": _amount(invoice)},
            {"label": "Payment date", "value": paid_on or "-"},
            {"label": "Payment method", "value": method},
            *([{"label": "Refunded", "value": f"${refunded:,.2f} {invoice.currency}"}] if refunded else []),
            {"label": "Balance due", "value": f"$0.00 {invoice.currency}"},
        ],
        notice="Please keep this email for your records. Questions about this payment should be directed to the business.",
        signoff=business.name,
        reply_to=[business.email],
        brand_name=business.name,
        brand_logo=business.logo,
        attachments=[_invoice_pdf_attachment(invoice)],
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
