"""
Views for business APIs.
"""

from rest_framework import viewsets
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated

from core.models import Business
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
