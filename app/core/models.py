"""
Database models.
"""
from django.db import models
from django.conf import settings
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)

from taggit.managers import TaggableManager


ROLE_CHOICES = [
    ("ADMIN", "Admin"),
    ("MANAGER", "Manager"),
    ("EMPLOYEE", "Employee"),
]


class UserManager(BaseUserManager):
    """Manager for users."""

    def create_user(self, email, password=None, **extra_fields):
        """Create, save and return a new user."""
        if not email:
            raise ValueError('User must have an email address.')
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(self, email, password):
        """Create and return a new superuser."""
        user = self.create_user(email, password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)

        return user


class User(AbstractBaseUser, PermissionsMixin):
    """User in the system."""
    email = models.EmailField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="MANAGER"
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'


class Business(models.Model):
    """Business entity (like a company in Jobber)."""

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="owned_businesses",
        on_delete=models.CASCADE
    )

    # Core Info
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField(max_length=50, blank=False, null=False)

    # Branding
    logo = models.ImageField(
        upload_to="business_logos/",
        blank=True,
        null=True
    )
    website = models.URLField(blank=True)
    business_description = models.TextField(max_length=1000)

    # Address
    street_address = models.CharField(max_length=255)
    suite_unit = models.CharField(max_length=50, blank=True, null=True)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=2, default="CA")
    province_state = models.CharField(max_length=2)
    postal_code = models.CharField(max_length=10)

    # Tax / Registration
    business_number = models.CharField(max_length=20, null=False)
    tax_rate = models.IntegerField(default=0)

    # Services Offered (as tags)
    services_offered = TaggableManager(blank=True)

    # Preferences
    timezone = models.CharField(max_length=50, default="America/Edmonton")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
