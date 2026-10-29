"""Shared API permissions."""

from rest_framework.permissions import SAFE_METHODS, BasePermission


class ClientLimitedWrite(BasePermission):
    """Clients may read, plus the actions a viewset lists in client_actions.

    client_fields optionally limits which fields a client may send to those
    actions, e.g. questionnaire answers on a service update.
    """

    message = "Clients cannot make this change."

    def has_permission(self, request, view):
        if getattr(request.user, "role", None) != "CLIENT" or request.method in SAFE_METHODS:
            return True
        if view.action not in getattr(view, "client_actions", ()):
            return False
        allowed_fields = getattr(view, "client_fields", None)
        return allowed_fields is None or set(request.data) <= set(allowed_fields)
