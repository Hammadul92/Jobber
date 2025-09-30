"""
URL mappings for the user API.
"""
from django.urls import path

from user import views


app_name = 'user'

urlpatterns = [
    path('create/', views.CreateUserView.as_view(), name='create'),
    path(
        'verify-email/',
        views.VerifyEmailView.as_view(),
        name='verify-email'
    ),
    path('token/', views.CreateTokenView.as_view(), name='token'),
    path('me/', views.ManageUserView.as_view(), name='me'),
    path(
        "password-reset/request/",
        views.RequestPasswordResetView.as_view(),
        name="password-reset-request"
    ),
    path(
        "password-reset/reset/",
        views.ResetPasswordView.as_view(),
        name="password-reset"
    ),
]
