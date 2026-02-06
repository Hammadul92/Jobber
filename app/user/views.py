"""
Views for the user API.
"""

from django.contrib.auth import get_user_model
from django.utils import timezone


from rest_framework import generics, authentication, permissions, status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.settings import api_settings
from rest_framework.views import APIView

from user.serializers import (
    UserSerializer,
    AuthTokenSerializer,
    RequestPasswordResetSerializer,
    ResetPasswordSerializer,
    CheckUserExistsSerializer,
)
from user.utils import (
    generate_email_token,
    verify_email_token,
    generate_password_reset_token,
    verify_password_reset_token,
)
from user.emails import send_registration_email, send_password_reset_email


class CreateUserView(generics.CreateAPIView):
    """Create a new user in the system."""

    serializer_class = UserSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        token = generate_email_token(user)
        send_registration_email(user, token)


class VerifyEmailView(APIView):
    """Verify user email via token."""

    def get(self, request):
        token = request.query_params.get("token")
        user_id = verify_email_token(token)
        if not user_id:
            return Response(
                {"detail": "Invalid or expired token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = get_user_model().objects.get(id=user_id)
            if user.is_active:
                return Response(
                    {"detail": "Email already verified."}, status=status.HTTP_200_OK
                )

            user.is_active = True
            user.save(update_fields=["is_active"])
            return Response(
                {"detail": "Email verified successfully."}, status=status.HTTP_200_OK
            )
        except get_user_model().DoesNotExist:
            return Response(
                {"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND
            )


class CreateTokenView(ObtainAuthToken):
    """Create a new auth token for user and update last_login."""

    serializer_class = AuthTokenSerializer
    renderer_classes = api_settings.DEFAULT_RENDERER_CLASSES

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        token = Token.objects.get(key=response.data["token"])
        user = token.user
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])
        return response


class ManageUserView(generics.RetrieveUpdateAPIView):
    """Manage the authenticated user."""

    serializer_class = UserSerializer
    authentication_classes = [authentication.TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """Retrieve and return the authenticated user."""
        return self.request.user


class RequestPasswordResetView(generics.GenericAPIView):
    """Generate password reset email with token."""

    serializer_class = RequestPasswordResetSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        try:
            user = get_user_model().objects.get(email=email)
            token = generate_password_reset_token(user)
            send_password_reset_email(user, token)
        except get_user_model().DoesNotExist:
            pass

        return Response(
            {
                "detail": (
                    "If an account exists for this email, a reset link will be sent."
                )
            },
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(generics.GenericAPIView):
    """Reset password using token."""

    serializer_class = ResetPasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data["token"]
        new_password = serializer.validated_data["password"]

        user = verify_password_reset_token(token)
        if not user:
            return Response(
                {"detail": "Invalid or expired token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()

        return Response(
            {"detail": "Password reset successfully."}, status=status.HTTP_200_OK
        )


class CheckUserExistsView(generics.GenericAPIView):
    """Check if a user exists by email, authenticated only."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = CheckUserExistsSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        user = get_user_model().objects.filter(email=email).first()
        return Response({"id": user.id if user else None}, status=status.HTTP_200_OK)
