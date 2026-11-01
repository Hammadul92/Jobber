import secrets

from django.core import signing
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.utils.crypto import constant_time_compare, salted_hmac


# Links in verification, password reset and login emails stay valid this long.
EMAIL_TOKEN_MAX_AGE = 60 * 60 * 24 * 7
# Links sent before reusable tokens existed keep their original lifetime.
LEGACY_TOKEN_MAX_AGE = 60 * 60 * 24


def generate_email_token(user):
    return signing.dumps({'user_id': user.id}, salt="email-verify")


def verify_email_token(token):
    try:
        data = signing.loads(token, salt="email-verify", max_age=EMAIL_TOKEN_MAX_AGE)
        return data['user_id']
    except (signing.BadSignature, signing.SignatureExpired):
        return None


def _password_fingerprint(user):
    return salted_hmac("password-reset", user.password).hexdigest()[:16]


def generate_password_reset_token(user):
    """The token stops working once the password changes."""
    return signing.dumps(
        {'user_id': user.id, 'pw': _password_fingerprint(user)},
        salt="password-reset",
    )


def verify_password_reset_token(token, max_age=EMAIL_TOKEN_MAX_AGE):
    try:
        data = signing.loads(token, salt="password-reset", max_age=max_age)
        if 'pw' not in data:
            signing.loads(token, salt="password-reset", max_age=LEGACY_TOKEN_MAX_AGE)
        user = get_user_model().objects.get(id=data.get('user_id'))
    except (
        signing.BadSignature,
        signing.SignatureExpired,
        get_user_model().DoesNotExist
    ):
        return None
    if 'pw' in data and not constant_time_compare(data['pw'], _password_fingerprint(user)):
        return None
    return user


def generate_magic_login_token(user, quote=None):
    """Generate a reusable magic login token.

    Links for a quote last until the end of that quote's current Valid Until
    date, so changing Valid Until extends or shortens them. Other links last
    EMAIL_TOKEN_MAX_AGE.
    """
    data = {'user_id': user.id, 'jti': secrets.token_urlsafe(16)}
    if quote is not None:
        data['quote_id'] = quote.id
    return signing.dumps(data, salt="magic-login")


def _quote_link_is_live(quote_id):
    from core.models import Quote

    valid_until = (
        Quote.objects.filter(id=quote_id).values_list("valid_until", flat=True).first()
    )
    return valid_until is not None and timezone.localdate() <= valid_until


def verify_magic_login_token(token):
    """Return the token's user, or None if the link is invalid or has expired."""
    try:
        data = signing.loads(token, salt="magic-login")
        if 'quote_id' in data:
            if not _quote_link_is_live(data['quote_id']):
                return None
        else:
            # Links sent before reusable tokens existed (no jti) keep their one-day limit.
            max_age = EMAIL_TOKEN_MAX_AGE if 'jti' in data else LEGACY_TOKEN_MAX_AGE
            signing.loads(token, salt="magic-login", max_age=max_age)
        return get_user_model().objects.get(id=data.get('user_id'))
    except (
        signing.BadSignature,
        signing.SignatureExpired,
        get_user_model().DoesNotExist
    ):
        return None
