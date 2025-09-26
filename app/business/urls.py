"""
URL mappings for the business app.
"""
from django.urls import (
    path,
    include,
)

from rest_framework.routers import DefaultRouter

from business import views

router = DefaultRouter()
router.register('business', views.BusinessViewSet)

app_name = 'business'

urlpatterns = [
    path('', include(router.urls)),
]
