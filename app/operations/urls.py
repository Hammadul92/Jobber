"""
URL mappings for the operations app.
"""
from django.urls import (
    path,
    include,
)

from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register('business', views.BusinessViewSet)
router.register('client', views.ClientViewSet)
router.register('service-questionnaire', views.ServiceQuestionnaireViewSet)
router.register('team-member', views.TeamMemberViewSet)
router.register('service', views.ServiceViewSet)
router.register('quote', views.QuoteViewSet)
router.register('job', views.JobViewSet)
router.register('job-photo', views.JobPhotoViewSet)

app_name = 'operations'

urlpatterns = [
    path('', include(router.urls)),
]
