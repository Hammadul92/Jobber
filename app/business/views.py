"""
Views for business APIs.
"""

from rest_framework import status
from rest_framework import filters, viewsets
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import Business, Client, TeamMember, Service, Quote
from business import serializers, paginations


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

    queryset = Service.objects.filter(is_active=True).select_related("client", "business")
    serializer_class = serializers.ServiceSerializer

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()

        if user.role == "ADMIN":
            return qs

        if user.role == "MANAGER":
            return qs.filter(business__owner=user).order_by('-id')

        return qs.none()

    def perform_create(self, serializer):
        # Validate that client belongs to business
        client = serializer.validated_data["client"]
        business = serializer.validated_data["business"]

        if client.business != business:
            raise serializers.ValidationError("Selected client does not belong to this business.")

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
