import secrets
from datetime import timedelta

from django.core import signing
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.utils import timezone
from django.utils.crypto import constant_time_compare, salted_hmac


# Links in verification, password reset and login emails stay valid this long.
EMAIL_TOKEN_MAX_AGE = 60 * 60 * 24 * 7
# Links sent before single-use tokens existed keep their original lifetime.
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


def generate_magic_login_token(user):
    """Generate a single-use magic login token (valid for 7 days)."""
    return signing.dumps(
        {'user_id': user.id, 'jti': secrets.token_urlsafe(16)},
        salt="magic-login",
    )


def verify_magic_login_token(token, max_age=EMAIL_TOKEN_MAX_AGE, consume=False):
    """Return the token's user, or None. With consume, the link is used up."""
    from core.models import UsedLoginToken

    try:
        data = signing.loads(token, salt="magic-login", max_age=max_age)
        if 'jti' not in data:
            signing.loads(token, salt="magic-login", max_age=LEGACY_TOKEN_MAX_AGE)
        user = get_user_model().objects.get(id=data.get('user_id'))
    except (
        signing.BadSignature,
        signing.SignatureExpired,
        get_user_model().DoesNotExist
    ):
        return None

    jti = data.get('jti')
    if jti:
        if not consume:
            return None if UsedLoginToken.objects.filter(jti=jti).exists() else user
        try:
            with transaction.atomic():
                UsedLoginToken.objects.create(jti=jti)
        except IntegrityError:
            return None
        UsedLoginToken.objects.filter(
            used_at__lt=timezone.now() - timedelta(seconds=EMAIL_TOKEN_MAX_AGE)
        ).delete()
    return user
