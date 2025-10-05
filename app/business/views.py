"""
Views for business APIs.
"""

from rest_framework import status
from rest_framework import filters, viewsets, pagination
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import Business, Client, TeamMember, Service
from business import serializers


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

        # Auto-create TeamMember entry for the manager (owner)
        TeamMember.objects.get_or_create(
            business=business,
            employee=user,
        )


class ClientPagination(pagination.PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'page_size': self.get_page_size(self.request),
            'columns': [
                {'name': 'name', 'title': 'Name'},
                {'name': 'email', 'title': 'Email'},
                {'name': 'phone', 'title': 'Phone'}
            ],
            'results': data,
        })


class ClientViewSet(viewsets.ModelViewSet):
    """View for manage business APIs."""
    serializer_class = serializers.ClientSerializer
    queryset = Client.objects.filter(is_active=True)
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    filter_backends = [filters.SearchFilter]
    search_fields = ['id', 'name', 'email', 'phone']

    pagination_class = ClientPagination

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
        """Assign business to the client for authenticated user"""
        business = Business.objects.filter(owner=self.request.user).first()
        if not business:
            raise ValueError("You must own a business to create a client.")
        serializer.save(business=business)

    def destroy(self, request, *args, **kwargs):
        """Instead of deleting, mark client as inactive"""
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=["is_active"])
        return Response(
            {"detail": "Client deleted successfully."},
            status=status.HTTP_204_NO_CONTENT
        )


class TeamMemberPagination(pagination.PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'page_size': self.get_page_size(self.request),
            'columns': [
                {'name': 'employee_name', 'title': 'Name'},
                {'name': 'employee_email', 'title': 'Email'},
                {'name': 'phone', 'title': 'Phone'},
                {'name': 'role', 'title': 'Role'}
            ],
            'results': data,
        })


class TeamMemberViewSet(viewsets.ModelViewSet):
    """View for manage team member APIs."""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = TeamMember.objects.filter(is_active=True) \
        .select_related("business", "employee")
    serializer_class = serializers.TeamMemberSerializer

    filter_backends = [filters.SearchFilter]
    search_fields = [
        "id",
        "employee__name",
        "employee__email",
        "job_duties",
        "expertise",
    ]

    pagination_class = TeamMemberPagination

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
