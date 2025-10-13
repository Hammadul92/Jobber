"""
Views for business APIs.
"""
from django.utils import timezone
from rest_framework import status
from rest_framework import viewsets
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import Business, Client, ServiceQuestionnaire, TeamMember, Service, Quote
from business import serializers, paginations, emails


class BusinessViewSet(viewsets.ModelViewSet):
    """View for manage business APIs."""
    serializer_class = serializers.BusinessSerializer
    queryset = Business.objects.all()
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Retrieve businesses for authenticated user."""
        return self.queryset.filter(owner=self.request.user).order_by('-id')

    def perform_create(self, serializer):
        """Assign the owner to the logged-in user."""
        user = self.request.user
        business = serializer.save(owner=user)

        TeamMember.objects.get_or_create(
            business=business,
            employee=user,
        )


class ClientViewSet(viewsets.ModelViewSet):
    """View for manage business APIs."""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.ClientSerializer
    queryset = Client.objects.filter(is_active=True)
    pagination_class = paginations.ClientPagination

    def get_queryset(self):
        """Retrieve clients for authenticated user."""
        user = self.request.user
        qs = super().get_queryset()

        if user.role == "ADMIN":
            return qs

        if user.role == "MANAGER":
            return qs.filter(business__owner=user) \
                .order_by('-id')

        return qs.none()

    def perform_create(self, serializer):
        """Assign business and user to the client for authenticated user"""
        business = Business.objects.filter(owner=self.request.user).first()
        if not business:
            raise ValueError("You must own a business to create a client.")

        user_id = self.request.data.get("user")
        if not user_id:
            raise ValueError("Client must have a user assigned.")

        serializer.save(business=business, user_id=user_id)

    def destroy(self, request, *args, **kwargs):
        """Instead of deleting, mark client as inactive"""
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=["is_active"])
        return Response(
            {"detail": "Client deleted successfully."},
            status=status.HTTP_204_NO_CONTENT
        )


class TeamMemberViewSet(viewsets.ModelViewSet):
    """View for manage team member APIs."""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = TeamMember.objects.filter(is_active=True) \
        .select_related("business", "employee")
    serializer_class = serializers.TeamMemberSerializer
    pagination_class = paginations.TeamMemberPagination

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()

        if user.role == "ADMIN":
            return qs

        if user.role == "MANAGER":
            return qs.filter(business__owner=user).order_by('-id')

        return qs.none()

    def destroy(self, request, *args, **kwargs):
        """Instead of deleting, mark team member as inactive"""
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=["is_active"])
        return Response(
            {"detail": "Team member deleted successfully."},
            status=status.HTTP_204_NO_CONTENT
        )


class ServiceViewSet(viewsets.ModelViewSet):
    """View for manage service APIs."""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    queryset = Service.objects.filter(is_active=True) \
        .select_related("client", "business")
    serializer_class = serializers.ServiceSerializer

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()

        client_id = self.request.query_params.get("client")
        if client_id:
            qs = qs.filter(client_id=client_id)

        if user.role == "ADMIN":
            return qs.order_by('-id')

        if user.role == "MANAGER":
            return qs.filter(business__owner=user).order_by('-id')

        if user.role == "CLIENT":
            return qs.filter(client__user=user).order_by('-id')

        return qs.none()

    def perform_create(self, serializer):
        # Validate that client belongs to business
        client = serializer.validated_data["client"]
        business = serializer.validated_data["business"]

        if client.business != business:
            raise serializers.ValidationError(
                "Selected client does not belong to this business."
            )

        serializer.save()


class QuoteViewSet(viewsets.ModelViewSet):
    """View for manage quote APIs."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.QuoteSerializer
    queryset = Quote.objects.filter(is_active=True).select_related("service")
    pagination_class = paginations.QuotePagination

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()

        if user.role == "ADMIN":
            return qs
        if user.role == "MANAGER":
            return qs.filter(service__business__owner=user).order_by('-id')
        if user.role == "CLIENT":
            return qs.filter(service__client__user=user).order_by('-id')

        return qs.none()

    def perform_create(self, serializer):
        """Automatically handle quote creation logic."""
        serializer.save()

    def perform_destroy(self, instance):
        """Soft-delete quote instead of removing it from DB."""
        instance.is_active = False
        instance.save()

    def update(self, request, *args, **kwargs):
        """Prevent updates if quote is already signed."""
        instance = self.get_object()
        if instance.status == "SIGNED":
            return Response(
                {"detail": "Cannot update a signed quote."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="send-quote")
    def send_quote(self, request, pk=None):
        """Send quote details and signing link to the client."""

        quote = self.get_object()

        try:
            emails.send_quote_email(quote)
            quote.status = "SENT"
            quote.save(update_fields=["status"])

            return Response(
                {"detail": "Quote sent successfully."},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"detail": f"Failed to send quote: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"], url_path="sign-quote")
    def sign_quote(self, request, pk=None):
        """
        Endpoint for client to accept (sign) or decline a quote.
        """
        user = request.user
        try:
            quote = self.get_object()
        except Quote.DoesNotExist:
            return Response(
                {"detail": "Quote not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if quote.service.client.user != user:
            return Response(
                {"detail": "You are not authorized to sign this quote."},
                status=status.HTTP_403_FORBIDDEN
            )

        new_status = request.data.get("status")
        signature_data = request.data.get("signature")

        if new_status not in ["SIGNED", "DECLINED"]:
            return Response(
                {"detail": "Invalid status. Must be 'SIGNED' or 'DECLINED'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if quote.status in ["SIGNED", "DECLINED"]:
            return Response(
                {"detail": f"Quote already {quote.status.lower()}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_status == "SIGNED":
            if not signature_data:
                return Response(
                    {"detail": "Signature is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            quote.signed_at = timezone.now()
            quote.status = "SIGNED"

            try:
                quote.set_signature_from_base64(signature_data)
            except ValueError as e:
                return Response(
                    {"detail": str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )

        elif new_status == "DECLINED":
            quote.status = "DECLINED"
            quote.signed_at = timezone.now()
            quote.signature = None

        quote.save(update_fields=["status", "signed_at", "signature"])

        return Response(
            {"detail": f"Quote successfully {new_status.lower()}."},
            status=status.HTTP_200_OK,
        )


class ServiceQuestionnaireViewSet(viewsets.ModelViewSet):
    """View for manage service questionnaires APIs."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = ServiceQuestionnaire.objects.all().select_related('business')
    serializer_class = serializers.ServiceQuestionnaireSerializer
    pagination_class = paginations.ServiceQuestionnairePagination

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()

        if user.role == "ADMIN":
            return qs
        if user.role == "MANAGER":
            return qs.filter(business__owner=user).order_by('-id')
        if user.role == "CLIENT":
            return qs.filter(business__clients__user=user).order_by('-id')

        return qs.none()
