"""
Serializers for the user API View.
"""
from django.contrib.auth import (
    get_user_model,
    authenticate,
)
from django.utils.translation import gettext as _

from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    """Serializer for the user object."""

    class Meta:
        model = get_user_model()
        fields = [
            'id', 'email', 'role', 'password', 'name',
            'phone', 'last_login'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'min_length': 6},
            'last_login': {'read_only': True},
        }

    def create(self, validated_data):
        """Create and return a user with encrypted password."""
        user = get_user_model().objects.create_user(**validated_data)
        user.is_active = False
        user.save(update_fields=["is_active"])
        return user

    def update(self, instance, validated_data):
        """Update and return user."""
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)

        if password:
            user.set_password(password)
            user.save()

        return user


class AuthTokenSerializer(serializers.Serializer):
    """Serializer for the user auth token."""
    email = serializers.EmailField()
    password = serializers.CharField(
        style={'input_type': 'password'},
        trim_whitespace=False,
    )

    def validate(self, attrs):
        """Validate and authenticate the user."""
        email = attrs.get('email')
        password = attrs.get('password')
        user = authenticate(
            request=self.context.get('request'),
            username=email,
            password=password,
        )
        if not user:
            msg = _('Unable to authenticate with provided credentials.')
            raise serializers.ValidationError(msg, code='authorization')

        attrs['user'] = user
        return attrs


class RequestPasswordResetSerializer(serializers.Serializer):
    """Serializer for requesting a password reset."""
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    """Serializer for resetting the password."""
    token = serializers.CharField()
    password = serializers.CharField(min_length=8, write_only=True)


class CheckUserExistsSerializer(serializers.Serializer):
    """Serializer for checking if a user exists by email."""
    email = serializers.EmailField(required=True)
