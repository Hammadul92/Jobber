"""
Django admin customization.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from core import models


class UserAdmin(BaseUserAdmin):
    """Define the admin pages for users."""
    ordering = ['id']
    list_display = ['email', 'name', 'role', 'is_active', 'is_staff']
    list_filter = ['role', 'is_active', 'is_staff']
    search_fields = ['email', 'name']
    readonly_fields = ['last_login']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal Info'), {'fields': ('name', 'role')}),
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
                'role',
                'is_active',
                'is_staff',
                'is_superuser',
            ),
        }),
    )


class BusinessAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'owner', 'is_active', 'created_at']
    list_filter = ['is_active', 'country', 'province_state']
    search_fields = ['name', 'email', 'phone', 'business_number']
    readonly_fields = ['created_at', 'updated_at']


class ClientAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'business', 'is_active', 'created_at']
    list_filter = ['is_active', 'business', 'country', 'province_state']
    search_fields = ['name', 'email', 'phone']
    readonly_fields = ['created_at', 'updated_at']


class BankingInformationAdmin(admin.ModelAdmin):
    list_display = [
        'business', 'client', 'payment_method_type',
        'bank_name', 'card_brand', 'is_default', 'is_active'
    ]
    list_filter = ['payment_method_type', 'is_active', 'is_default']
    search_fields = ['bank_name', 'account_holder_name', 'card_brand']
    readonly_fields = ['created_at', 'updated_at']


class ServiceAdmin(admin.ModelAdmin):
    list_display = ['service_name', 'client', 'business', 'service_type', 'status', 'price', 'currency']
    list_filter = ['service_type', 'status', 'currency']
    search_fields = ['service_name', 'client__name', 'business__name']
    readonly_fields = ['created_at', 'updated_at']


class JobAdmin(admin.ModelAdmin):
    list_display = ['title', 'service', 'assigned_to', 'status', 'scheduled_date', 'completed_at']
    list_filter = ['status', 'scheduled_date']
    search_fields = ['title', 'description', 'service__service_name']
    readonly_fields = ['created_at', 'updated_at']


class JobPhotoAdmin(admin.ModelAdmin):
    list_display = ['job', 'photo_type', 'uploaded_at']
    list_filter = ['photo_type']
    search_fields = ['job__title']
    readonly_fields = ['uploaded_at']


class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ['employee', 'business', 'phone', 'expertise', 'is_active', 'joined_at']
    list_filter = ['is_active', 'business']
    search_fields = ['employee__name', 'employee__email', 'business__name']
    readonly_fields = ['joined_at']


# Register models
admin.site.register(models.User, UserAdmin)
admin.site.register(models.Business, BusinessAdmin)
admin.site.register(models.Client, ClientAdmin)
admin.site.register(models.BankingInformation, BankingInformationAdmin)
admin.site.register(models.Service, ServiceAdmin)
admin.site.register(models.Job, JobAdmin)
admin.site.register(models.JobPhoto, JobPhotoAdmin)
admin.site.register(models.TeamMember, TeamMemberAdmin)
