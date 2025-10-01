from django.core import signing
from django.contrib.auth import get_user_model


def generate_email_token(user):
    return signing.dumps({'user_id': user.id}, salt="email-verify")


def verify_email_token(token):
    try:
        data = signing.loads(token, salt="email-verify", max_age=60*60*24)
        return data['user_id']
    except (signing.BadSignature, signing.SignatureExpired):
        return None


def generate_password_reset_token(user):
    return signing.dumps({'user_id': user.id}, salt="password-reset")


def verify_password_reset_token(token, max_age=3600):
    try:
        data = signing.loads(token, salt="password-reset", max_age=max_age)
        user_id = data.get('user_id')
        return get_user_model().objects.get(id=user_id)
    except (
        signing.BadSignature,
        signing.SignatureExpired,
        get_user_model().DoesNotExist
    ):
        return None
