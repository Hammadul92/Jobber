from django.apps import AppConfig


class SuperAdminConfig(AppConfig):
    name = "super_admin"
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self):
        from . import events  # noqa: F401
