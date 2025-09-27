"""
Views for business APIs.
"""

from rest_framework import filters, viewsets, pagination
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import Business, Client
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
        serializer.save(owner=self.request.user)


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
            'results': data,
        })


class ClientViewSet(viewsets.ModelViewSet):
    """View for manage business APIs."""
    serializer_class = serializers.ClientSerializer
    queryset = Client.objects.all()
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    filter_backends = [filters.SearchFilter]
    search_fields = ['id', 'name', 'email', 'phone']

    pagination_class = ClientPagination

    def get_queryset(self):
        """Retrieve clients for authenticated user."""
        owned_businesses = Business.objects.filter(owner=self.request.user)
        return self.queryset.filter(business__in=owned_businesses) \
            .order_by('-id')

    def perform_create(self, serializer):
        """Assign business to the client for authenticated user"""
        business = Business.objects.filter(owner=self.request.user).first()
        if not business:
            raise ValueError("You must own a business to create a client.")
        serializer.save(business=business)
