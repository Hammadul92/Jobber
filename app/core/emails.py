"""Shared branded email delivery helpers."""

from email.mime.image import MIMEImage
from io import BytesIO

from django.conf import settings
from django.contrib.staticfiles import finders
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from PIL import Image


LOGO_STATIC_PATH = "public_site/images/favicon.png"
PLATFORM_LOGO_CONTENT_ID = "contractorz-mark"
BUSINESS_LOGO_CONTENT_ID = "business-logo"
DEFAULT_LOGO_SIZE = (42, 42)
BUSINESS_LOGO_MAX_SIZE = (132, 44)


def _read_platform_logo():
    """Return the GetContractorz logo used in every email header."""
    logo_path = finders.find(LOGO_STATIC_PATH)
    if not logo_path:
        return None

    with open(logo_path, "rb") as logo_file:
        return (
            logo_file.read(),
            "png",
            DEFAULT_LOGO_SIZE[0],
            DEFAULT_LOGO_SIZE[1],
        )


def _read_business_logo(brand_logo):
    """Return uploaded business logo bytes and email-safe dimensions."""
    if not brand_logo:
        return None

    try:
        brand_logo.open("rb")
        image_data = brand_logo.read()
        brand_logo.close()
        with Image.open(BytesIO(image_data)) as image:
            image_format = (image.format or "png").lower()
            width, height = image.size

        max_width, max_height = BUSINESS_LOGO_MAX_SIZE
        scale = min(max_width / width, max_height / height, 1)
        return (
            image_data,
            "jpeg" if image_format == "jpg" else image_format,
            max(1, round(width * scale)),
            max(1, round(height * scale)),
        )
    except (FileNotFoundError, OSError, ValueError):
        return None


def _attach_inline_image(email, image_data, image_subtype, content_id, filename):
    """Attach an image for reliable display without a public media URL."""
    logo = MIMEImage(image_data, _subtype=image_subtype)
    logo.add_header("Content-ID", f"<{content_id}>")
    logo.add_header(
        "Content-Disposition",
        "inline",
        filename=f"{filename}.{image_subtype}",
    )
    email.attach(logo)


def send_branded_email(
    *,
    subject,
    text_body,
    recipient_list,
    eyebrow,
    heading,
    paragraphs,
    details=None,
    action_label=None,
    action_url=None,
    notice=None,
    signoff="Contractorz Team",
    reply_to=None,
    brand_name=None,
    brand_logo=None,
):
    """Send a responsive branded HTML email with a plain-text fallback."""
    platform_logo = _read_platform_logo()
    business_logo = _read_business_logo(brand_logo)

    context = {
        "subject": subject,
        "preheader": paragraphs[0] if paragraphs else subject,
        "eyebrow": eyebrow,
        "heading": heading,
        "paragraphs": paragraphs,
        "details": details or [],
        "action_label": action_label,
        "action_url": action_url,
        "notice": notice,
        "signoff": signoff,
        "support_email": settings.DEFAULT_FROM_EMAIL,
        "platform_logo_src": f"cid:{PLATFORM_LOGO_CONTENT_ID}",
        "business_logo_src": f"cid:{BUSINESS_LOGO_CONTENT_ID}",
        "business_logo_width": business_logo[2] if business_logo else None,
        "business_logo_height": business_logo[3] if business_logo else None,
        "brand_name": brand_name,
    }
    html_body = render_to_string("emails/transactional.html", context)
    email = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=recipient_list,
        reply_to=reply_to,
    )
    email.attach_alternative(html_body, "text/html")

    if platform_logo:
        _attach_inline_image(
            email,
            platform_logo[0],
            platform_logo[1],
            PLATFORM_LOGO_CONTENT_ID,
            "getcontractorz-logo",
        )
    if business_logo:
        _attach_inline_image(
            email,
            business_logo[0],
            business_logo[1],
            BUSINESS_LOGO_CONTENT_ID,
            "business-logo",
        )
    if platform_logo or business_logo:
        email.mixed_subtype = "related"

    return email.send(fail_silently=False)
