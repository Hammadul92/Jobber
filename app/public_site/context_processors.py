import json
from urllib.parse import unquote, urlsplit

from django.conf import settings


def _safe_profile_photo_url(value):
    if not isinstance(value, str) or len(value) > 2048:
        return ""

    value = value.strip()
    parsed = urlsplit(value)
    if parsed.scheme and parsed.scheme not in {"http", "https"}:
        return ""
    if not parsed.path.startswith("/media/"):
        return ""
    return value


def _public_session_user(request):
    raw_session = request.COOKIES.get("contractorz_public_session", "")
    if not raw_session or len(raw_session) > 4096:
        return None

    try:
        session = json.loads(unquote(raw_session))
    except (TypeError, ValueError, json.JSONDecodeError):
        return None

    if not isinstance(session, dict):
        return None

    name = session.get("name")
    email = session.get("email")
    role = session.get("role")
    photo_url = _safe_profile_photo_url(session.get("photoUrl"))
    if not isinstance(name, str) or not name.strip():
        return None

    return {
        "name": name.strip()[:80],
        "email": email.strip()[:254] if isinstance(email, str) else "",
        "role": role if role in {"USER", "MANAGER", "CLIENT", "EMPLOYEE"} else "",
        "photo_url": photo_url,
    }


def public_site_assets(request):
    return {
        "public_site_css_url": settings.PUBLIC_SITE_CSS_URL,
        "frontend_url": settings.FRONTEND_URL.rstrip("/"),
        "public_session_user": _public_session_user(request),
    }
