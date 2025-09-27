from django.core import signing


def generate_email_token(user):
    return signing.dumps({'user_id': user.id})


def verify_email_token(token):
    try:
        data = signing.loads(token, max_age=60*60*24)
        return data['user_id']
    except signing.BadSignature:
        return None
    except signing.SignatureExpired:
        return None
