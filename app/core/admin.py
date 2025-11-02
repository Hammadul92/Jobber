"""
Django admin customization.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from core import models


class SoftDeletableAdminMixin:
    """
    Adds soft deletion info to Django admin:
    - Shows 'is_deleted', 'deleted_at', and 'deleted_by'
    - Allows filtering by deleted state
    """

    def get_queryset(self, request):
        """Include soft-deleted records in admin list."""
        qs = self.model.all_objects.all()
        return qs

    def get_list_display(self, request):
        """
        Append soft delete fields to list_display if not already included.
        """
        base_fields = list(super().get_list_display(request))
        for field in ("is_deleted",):
            if field not in base_fields:
                base_fields.append(field)
        return tuple(base_fields)

    def get_list_filter(self, request):
        """Append is_deleted to filters if not already included."""
        base_filters = list(super().get_list_filter(request))
        if "is_deleted" not in base_filters:
            base_filters.append("is_deleted")
        return tuple(base_filters)

    def get_readonly_fields(self, request, obj=None):
        """Include deleted_at and deleted_by as readonly fields."""
        base_fields = list(super().get_readonly_fields(request, obj))
        for field in ("deleted_at", "deleted_by"):
            if field not in base_fields:
                base_fields.append(field)
        return tuple(base_fields)


class UserAdmin(BaseUserAdmin):
    """Define the admin pages for users."""
    ordering = ['id']
    list_display = ['email', 'name', 'phone', 'role', 'is_active', 'is_staff']
    list_filter = ['role', 'is_active', 'is_staff']
    search_fields = ['email', 'name', 'phone']
    readonly_fields = ['last_login']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal Info'), {'fields': ('name', 'phone', 'role')}),
        (
            _('Permissions'),
            {
                'fields': (
                    'is_active',
                    'is_staff',
                    'is_superuser',
                    'groups',
                    'user_permissions',
                )
            }
        ),
        (_('Important dates'), {'fields': ('last_login',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email',
                'password1',
                'password2',
                'name',
                'phone',
                'role',
                'is_active',
                'is_staff',
                'is_superuser',
            ),
        }),
    )


class BusinessAdmin(SoftDeletableAdminMixin, admin.ModelAdmin):
    list_display = [
        'name', 'email', 'phone', 'owner', 'is_active', 'created_at'
    ]
    list_filter = ['is_active', 'country', 'province_state']
    search_fields = ['name', 'email', 'phone', 'business_number']
    readonly_fields = ['created_at', 'updated_at']


class ClientAdmin(SoftDeletableAdminMixin, admin.ModelAdmin):
    list_display = ['user', 'business', 'is_active', 'created_at']
    list_filter = ['is_active', 'business']
    search_fields = ['user__name', 'user__email', 'user__phone']
    readonly_fields = ['created_at', 'updated_at']


class BankingInformationAdmin(SoftDeletableAdminMixin, admin.ModelAdmin):
    list_display = [
        'business', 'client', 'payment_method_type',
        'bank_name', 'card_brand', 'is_active'
    ]
    list_filter = ['payment_method_type', 'is_active']
    search_fields = ['bank_name', 'account_holder_name', 'card_brand']
    readonly_fields = ['created_at', 'updated_at']


class ServiceAdmin(SoftDeletableAdminMixin, admin.ModelAdmin):
    list_display = [
        'service_name', 'client', 'business', 'service_type',
        'status', 'price', 'currency'
    ]
    list_filter = ['service_type', 'status', 'currency']
    search_fields = ['service_name', 'client__user__name', 'business__name']
    readonly_fields = ['created_at', 'updated_at']


class JobAdmin(SoftDeletableAdminMixin, admin.ModelAdmin):
    list_display = [
        'title',
        'service',
        'get_business',
        'get_client',
        'assigned_to',
        'get_assigned_employee',
        'status',
        'scheduled_date',
        'completed_at',
    ]
    list_filter = ['status', 'scheduled_date', 'service__business']
    search_fields = [
        'title',
        'description',
        'service__service_name',
        'service__client__user__name',
        'assigned_to__employee__name',
    ]
    readonly_fields = ['created_at', 'updated_at']

    def get_business(self, obj):
        return obj.service.business.name
    get_business.short_description = "Business"
    get_business.admin_order_field = "service__business__name"

    def get_client(self, obj):
        return obj.service.client.user.name
    get_client.short_description = "Client"
    get_client.admin_order_field = "service__client__user__name"

    def get_assigned_employee(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.employee.name
        return "-"
    get_assigned_employee.short_description = "Assigned Employee"
    get_assigned_employee.admin_order_field = "assigned_to__employee__name"


class JobPhotoAdmin(SoftDeletableAdminMixin, admin.ModelAdmin):
    list_display = ['job', 'photo_type', 'uploaded_at']
    list_filter = ['photo_type']
    search_fields = ['job__title']
    readonly_fields = ['uploaded_at']


class TeamMemberAdmin(SoftDeletableAdminMixin, admin.ModelAdmin):
    list_display = [
        'employee', 'business', 'expertise', 'is_active', 'joined_at'
    ]
    list_filter = ['is_active', 'business']
    search_fields = ['employee__name', 'employee__email', 'business__name']
    readonly_fields = ['joined_at']


class QuoteAdmin(SoftDeletableAdminMixin, admin.ModelAdmin):
    list_display = [
        'quote_number', 'service', 'status', 'valid_until',
        'is_active', 'created_at'
    ]
    list_filter = ['status', 'is_active', 'valid_until']
    search_fields = ['quote_number', 'service__service_name']
    readonly_fields = ['quote_number', 'created_at', 'updated_at', 'signed_at']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']


class ServiceQuestionnaireAdmin(SoftDeletableAdminMixin, admin.ModelAdmin):
    list_display = [
        'service_name', 'business', 'is_active',
        'created_at', 'updated_at'
    ]
    list_filter = ['is_active', 'business']
    search_fields = ['service_name', 'business__name']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']


class InvoiceAdmin(SoftDeletableAdminMixin, admin.ModelAdmin):
    list_display = [
        'invoice_number', 'business', 'client', 'service',
        'subtotal', 'tax_rate', 'tax_amount', 'total_amount',
        'status', 'currency', 'paid_at', 'is_active', 'created_at'
    ]
    list_filter = ['status', 'currency', 'is_active', 'business']
    search_fields = [
        'invoice_number', 'business__name', 'client__user__name',
        'service__service_name'
    ]
    readonly_fields = ['invoice_number', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']


admin.site.register(models.User, UserAdmin)
admin.site.register(models.Business, BusinessAdmin)
admin.site.register(models.Client, ClientAdmin)
admin.site.register(models.BankingInformation, BankingInformationAdmin)
admin.site.register(models.Service, ServiceAdmin)
admin.site.register(models.Job, JobAdmin)
admin.site.register(models.JobPhoto, JobPhotoAdmin)
admin.site.register(models.TeamMember, TeamMemberAdmin)
admin.site.register(models.Quote, QuoteAdmin)
admin.site.register(models.ServiceQuestionnaire, ServiceQuestionnaireAdmin)
admin.site.register(models.Invoice, InvoiceAdmin)
