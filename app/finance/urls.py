"""
URL mappings for the business app.
"""
from django.urls import (
    path,
    include,
)

from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register('banking-information', views.BankingInformationViewSet)
router.register('invoice', views.InvoiceViewSet)
router.register('payout', views.PayoutViewSet)

app_name = 'finance'

urlpatterns = [
    path('', include(router.urls)),
]
