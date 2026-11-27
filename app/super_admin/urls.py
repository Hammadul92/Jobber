from django.urls import path
from .views import Auth, Overview, Records, Search, System, Document, Media, Reconcile
from .actions import Actions
from .notifications import Notifications

urlpatterns = [
    path("notifications/", Notifications.as_view()),
    path("actions/<str:resource>/", Actions.as_view()),
    path("actions/<str:resource>/<int:pk>/", Actions.as_view()),
    path("reconcile/<str:resource>/<int:pk>/", Reconcile.as_view()),
    path("media/<str:resource>/<int:pk>/<str:field>/", Media.as_view()),
    path("documents/<str:resource>/<int:pk>/", Document.as_view()),
    path("search/", Search.as_view()),
    path("system/", System.as_view()),
    path("auth/", Auth.as_view()),
    path("overview/", Overview.as_view()),
    path("records/<str:resource>/", Records.as_view()),
    path("records/<str:resource>/<int:pk>/", Records.as_view()),
]
