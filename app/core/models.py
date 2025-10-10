"""
Database models.
"""
import base64
from django.core.files.base import ContentFile
from django.conf import settings
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models
from django.utils import timezone


from taggit.managers import TaggableManager


ROLE_CHOICES = [
    ("ADMIN", "Admin"),
    ("MANAGER", "Manager"),
    ("EMPLOYEE", "Employee"),
    ("CLIENT", "Client")
]

PAYMENT_METHOD_CHOICES = [
    ("BANK_ACCOUNT", "Bank Account"),
    ("CARD", "Credit/Debit Card"),
]

SERVICE_TYPE_CHOICES = [
    ("ONE_TIME", "One Time"),
    ("SUBSCRIPTION", "Subscription"),
]

SERVICE_STATUS_CHOICES = [
    ("PENDING", "Pending"),
    ("ACTIVE", "Active"),
    ("COMPLETED", "Completed"),
    ("CANCELLED", "Cancelled"),
]

JOB_STATUS_CHOICES = [
    ("PENDING", "Pending"),
    ("IN_PROGRESS", "In Progress"),
    ("COMPLETED", "Completed"),
    ("CANCELLED", "Cancelled"),
]

BILLING_CYCLE_CHOICES = [
    ("MONTHLY", "Monthly"),
    ("YEARLY", "Yearly"),
]

CURRENCY_CHOICES = [
    ("CAD", "CAD"),
    ("USD", "USD"),
]

QUOTE_STATUS_CHOICES = [
    ("DRAFT", "Draft"),
    ("SENT", "Sent"),
    ("SIGNED", "Signed"),
    ("DECLINED", "Declined")
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
    name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255, unique=True)
    phone = models.CharField(max_length=20)
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

    name = models.CharField(max_length=50)
    phone = models.CharField(max_length=20)
    email = models.EmailField(max_length=50)
    business_description = models.TextField(max_length=1000)

    street_address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=2, default="CA")
    province_state = models.CharField(max_length=2)
    postal_code = models.CharField(max_length=10)

    business_number = models.CharField(max_length=20, null=False)
    tax_rate = models.IntegerField(default=0)

    services_offered = TaggableManager(
        blank=True,
        help_text=(
            "Add services offered by this business "
            "(comma-separated tags)."
        ),
    )

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
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="users",
        on_delete=models.CASCADE,
    )

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
        unique_together = ('business', 'user')

    def __str__(self):
        return f"{self.user.name} ({self.business.name})"


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
    currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default="CAD"
    )

    billing_cycle = models.CharField(
        max_length=20,
        choices=BILLING_CYCLE_CHOICES,
        blank=True,
        null=True,
    )

    status = models.CharField(
        max_length=20,
        choices=SERVICE_STATUS_CHOICES,
        default="PENDING",
    )

    # Service Address
    street_address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=2, default="CA")
    province_state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return (
            f"{self.service_name} ({self.get_service_type_display()}) "
            f"for {self.client.user.name} - {self.get_status_display()}"
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
    job_duties = models.TextField(blank=True, null=True)
    expertise = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("business", "employee")

    def __str__(self):
        return f"{self.employee.name} @ {self.business.name}"


class Quote(models.Model):
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name="service_quotes"
    )
    quote_number = models.CharField(max_length=20, unique=True, editable=False)
    date_created = models.DateTimeField(auto_now_add=True)
    valid_until = models.DateField()

    status = models.CharField(
        max_length=20,
        choices=QUOTE_STATUS_CHOICES,
        default="DRAFT"
    )
    signed_at = models.DateTimeField(null=True, blank=True)
    signature = models.ImageField(upload_to="media/signatures/", null=True, blank=True)

    terms_conditions = models.TextField()
    notes = models.TextField(blank=True, null=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.quote_number} for {self.service.client}"

    def save(self, *args, **kwargs):
        if not self.quote_number:
            self.quote_number = self.generate_quote_number()
        super().save(*args, **kwargs)

    def generate_quote_number(self):
        """
        Generates a unique quote number in the format: Q-YYYY-XXX
        Example: Q-2025-001
        """
        year = timezone.now().year
        prefix = f"Q-{year}-"

        last_quote = Quote.objects.filter(quote_number__startswith=prefix) \
            .order_by("quote_number").last()

        if last_quote:
            last_number = int(last_quote.quote_number.split("-")[-1])
            new_number = last_number + 1
        else:
            new_number = 1

        return f"{prefix}{new_number:03d}"

    def set_signature_from_base64(self, base64_data):
        """
        Saves a base64-encoded signature image (PNG) to the `signature` field.
        """
        if not base64_data:
            return

        if not base64_data.startswith("data:image"):
            raise ValueError("Invalid signature format")

        try:
            format, imgstr = base64_data.split(";base64,")
            ext = format.split("/")[-1]
            file_name = f"signature_{self.quote_number}.{ext}"
            self.signature.save(file_name, ContentFile(base64.b64decode(imgstr)), save=False)
        except Exception as e:
            raise ValueError(f"Error decoding signature: {e}")