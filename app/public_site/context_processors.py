from django.conf import settings


def public_site_assets(request):
    return {
        "public_site_css_url": settings.PUBLIC_SITE_CSS_URL,
        "frontend_url": settings.FRONTEND_URL.rstrip("/"),
    }
