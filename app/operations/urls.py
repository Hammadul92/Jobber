"""
URL mappings for the operations app.
"""
from django.urls import (
    path,
    include,
)

from rest_framework.routers import DefaultRouter

from . import dashboard, views

router = DefaultRouter()
router.register('business', views.BusinessViewSet)
router.register('client', views.ClientViewSet)
router.register('service-questionnaire', views.ServiceQuestionnaireViewSet)
router.register('service-terms-template', views.ServiceTermsTemplateViewSet)
router.register('team-member', views.TeamMemberViewSet)
router.register('service', views.ServiceViewSet)
router.register('quote', views.QuoteViewSet)
router.register('job', views.JobViewSet)
router.register('job-photo', views.JobPhotoViewSet)

app_name = 'operations'

urlpatterns = [
    path('dashboard/', dashboard.DashboardView.as_view(), name='dashboard'),
    path('dashboard/todos/', dashboard.DashboardTodosView.as_view(), name='dashboard-todos'),
    path('', include(router.urls)),
]
