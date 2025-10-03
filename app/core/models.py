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

PAYMENT_METHOD_CHOICES = [
    ("BANK_ACCOUNT", "Bank Account"),
    ("CARD", "Credit/Debit Card"),
]

SERVICE_TYPE_CHOICES = [
    ("ONE_TIME", "One Time"),
    ("SUBSCRIPTION", "Subscription"),
]

JOB_STATUS_CHOICES = [
    ("PENDING", "Pending"),
    ("IN_PROGRESS", "In Progress"),
    ("COMPLETED", "Completed"),
    ("CANCELLED", "Cancelled"),
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
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="owned_businesses",
        on_delete=models.CASCADE
    )

    # Core Info
    name = models.CharField(max_length=50)
    phone = models.CharField(max_length=20)
    email = models.EmailField(max_length=50)
    business_description = models.TextField(max_length=1000)

    # Address
    street_address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=2, default="CA")
    province_state = models.CharField(max_length=2)
    postal_code = models.CharField(max_length=10)

    # Tax / Registration
    business_number = models.CharField(max_length=20, null=False)
    tax_rate = models.IntegerField(default=0)

    # Services Offered (as tags)
    services_offered = TaggableManager(
        blank=True,
        help_text=(
            "Add services offered by this business "
            "(comma-separated tags)."
        ),
    )

    # Preferences
    timezone = models.CharField(max_length=50, default="America/Edmonton")

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Client(models.Model):
    business = models.ForeignKey(
        Business,
        related_name="clients",
        on_delete=models.CASCADE,
    )
    name = models.CharField(max_length=50)
    email = models.EmailField(max_length=50)
    phone = models.CharField(max_length=20)

    # Billing Address
    street_address = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=2, default="CA")
    province_state = models.CharField(max_length=2, blank=True, null=True)
    postal_code = models.CharField(max_length=10, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["business", "email"],
                name="unique_client_email_per_business"
            ),
            models.UniqueConstraint(
                fields=["business", "phone"],
                name="unique_client_phone_per_business"
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.business.name})"


class BankingInformation(models.Model):
    business = models.ForeignKey(
        Business,
        related_name="banking_information",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    client = models.ForeignKey(
        Client,
        related_name="banking_information",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )

    payment_method_type = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
    )

    # Bank account details
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    account_holder_name = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )
    transit_number = models.CharField(max_length=10, blank=True, null=True)
    account_number_last4 = models.CharField(
        max_length=4,
        blank=True,
        null=True
    )
    routing_number = models.CharField(max_length=20, blank=True, null=True)

    # Card details
    card_brand = models.CharField(max_length=50, blank=True, null=True)
    card_last4 = models.CharField(max_length=4, blank=True, null=True)
    card_exp_month = models.IntegerField(blank=True, null=True)
    card_exp_year = models.IntegerField(blank=True, null=True)

    # Stripe references
    stripe_customer_id = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )
    stripe_payment_method_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        """Ensure either business or client is set, not both or neither."""
        if not self.business and not self.client:
            raise ValueError(
                "Banking Info must be linked to either a Business or a Client."
            )
        if self.business and self.client:
            raise ValueError(
                "Banking Info cannot belong to both Business and Client."
            )

    def __str__(self):
        owner = self.business.name if self.business else self.client.name
        if self.payment_method_type == "BANK_ACCOUNT":
            return f"Bank ••••{self.account_number_last4 or '----'} ({owner})"

        return (
            f"{self.card_brand or 'Card'} ••••{self.card_last4 or '----'} "
            f"({owner})"
        )


class Service(models.Model):
    client = models.ForeignKey(
        Client,
        related_name="client_services",
        on_delete=models.CASCADE,
    )
    business = models.ForeignKey(
        Business,
        related_name="business_services",
        on_delete=models.CASCADE,
    )
    service_name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)

    service_type = models.CharField(
        max_length=20,
        choices=SERVICE_TYPE_CHOICES,
        default="ONE_TIME",
    )

    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="CAD")

    BILLING_CYCLE_CHOICES = [
        ("MONTHLY", "Monthly"),
        ("YEARLY", "Yearly"),
    ]
    billing_cycle = models.CharField(
        max_length=20,
        choices=BILLING_CYCLE_CHOICES,
        blank=True,
        null=True,
    )

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("ACTIVE", "Active"),
        ("CANCELLED", "Cancelled"),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return (
            f"{self.service_name} ({self.get_service_type_display()}) "
            f"for {self.client.name} - {self.get_status_display()}"
        )


class Job(models.Model):
    service = models.ForeignKey(
        Service,
        related_name="jobs",
        on_delete=models.CASCADE,
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="assigned_jobs",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    scheduled_date = models.DateTimeField()
    completed_at = models.DateTimeField(blank=True, null=True)

    status = models.CharField(
        max_length=20,
        choices=JOB_STATUS_CHOICES,
        default="PENDING",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return (
            f"Job {self.title} - {self.get_status_display()} "
            f"(Service: {self.service.service_name})"
        )


class JobPhoto(models.Model):
    JOB_PHOTO_TYPE_CHOICES = [
        ("BEFORE", "Before"),
        ("AFTER", "After"),
    ]

    job = models.ForeignKey(
        Job,
        related_name="photos",
        on_delete=models.CASCADE,
    )
    photo = models.ImageField(upload_to="jobs/photos/")
    photo_type = models.CharField(
        max_length=10,
        choices=JOB_PHOTO_TYPE_CHOICES
    )

    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.photo_type} photo for Job {self.job.id}"


class TeamMember(models.Model):
    business = models.ForeignKey(
        Business,
        related_name="team_members",
        on_delete=models.CASCADE,
    )
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="business_roles",
        on_delete=models.CASCADE,
        limit_choices_to={"role__in": ["MANAGER", "EMPLOYEE"]},
    )
    phone = models.CharField(max_length=20, blank=True, null=True)
    job_duties = models.TextField(blank=True, null=True)
    expertise = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("business", "employee")

    def __str__(self):
        return f"{self.employee.name} @ {self.business.name}"
