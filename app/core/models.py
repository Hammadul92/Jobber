"""
Database models.
"""
from django.conf import settings
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone

from taggit.managers import TaggableManager


ROLE_CHOICES = [
    ("ADMIN", "Admin"),
    ("MANAGER", "Manager"),
    ("EMPLOYEE", "Employee"),
    ("CLIENT", "Client"),
    ("USER", "User")
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

JOB_PHOTO_TYPE_CHOICES = [
    ("BEFORE", "Before"),
    ("AFTER", "After"),
]

ACCOUNT_HOLDER_CHOICES = [
    ("individual", "Individual"),
    ("company", "Company")
]

INVOICE_STATUS_CHOICES = [
    ("DRAFT", "Draft"),
    ("SENT", "Sent"),
    ("PAID", "Paid"),
    ("CANCELLED", "Cancelled"),
]

PAYOUT_STATUS_CHOICES = [
    ("PENDING", "Pending"),
    ("PAID", "Paid"),
    ("FAILED", "Failed"),
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
        default="USER"
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'


class SoftDeletableModel(models.Model):
    is_deleted = models.BooleanField(default=False)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="deleted_%(class)s_records"
    )
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    def soft_delete(self, user=None, cascade=True):
        """Soft delete the object and optionally its related dependents."""
        if self.is_deleted:
            return

        self.is_deleted = True
        self.deleted_by = user
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_by", "deleted_at"])

        if cascade:
            for related in self._meta.related_objects:
                related_name = related.get_accessor_name()
                related_manager = getattr(self, related_name, None)

                if related_manager is None:
                    continue

                if isinstance(related_manager, models.Model):
                    related_manager.soft_delete(user=user, cascade=True)
                else:
                    for obj in related_manager.all():
                        if hasattr(obj, "soft_delete"):
                            obj.soft_delete(user=user, cascade=True)

    def restore(self, cascade=True):
        """
        Restore a soft-deleted object and optionally
        its related dependents.
        """
        if not self.is_deleted:
            return

        self.is_deleted = False
        self.deleted_by = None
        self.deleted_at = None
        self.save(update_fields=["is_deleted", "deleted_by", "deleted_at"])

        if cascade:
            for related in self._meta.related_objects:
                related_name = related.get_accessor_name()
                related_manager = getattr(self, related_name, None)
                if related_manager is None:
                    continue

                if isinstance(related_manager, models.Model):
                    related_manager.restore(cascade=True)
                else:
                    for obj in related_manager.all():
                        if hasattr(obj, "restore"):
                            obj.restore(cascade=True)


class ActiveManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)


class Business(SoftDeletableModel):
    objects = ActiveManager()
    all_objects = models.Manager()

    # Core business info
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="owned_businesses",
        on_delete=models.CASCADE
    )
    name = models.CharField(max_length=50)
    slug = models.CharField(max_length=50)
    phone = models.CharField(max_length=20)
    email = models.EmailField(max_length=50)
    business_description = models.TextField(max_length=1000)
    website = models.URLField(max_length=100, null=True, blank=True)
    logo = models.ImageField(upload_to="business_logo/", null=True, blank=True)

    # Address info
    street_address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=2, default="CA")
    province_state = models.CharField(max_length=2)
    postal_code = models.CharField(max_length=10)

    # Business registration info
    business_number = models.CharField(max_length=20, null=False)
    tax_rate = models.DecimalField(max_digits=4, default=0, decimal_places=2)

    services_offered = TaggableManager(
        blank=True,
        help_text="Add services offered by this business (comma-separated tags).",
    )

    timezone = models.CharField(max_length=50, default="America/Edmonton")

    # Active / timestamps
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Client(SoftDeletableModel):
    objects = ActiveManager()
    all_objects = models.Manager()

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

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('business', 'user')

    def __str__(self):
        return f"{self.user.name} ({self.business.name})"


class BankingInformation(SoftDeletableModel):
    objects = ActiveManager()
    all_objects = models.Manager()

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
        default="CARD"
    )

    bank_name = models.CharField(max_length=100, blank=True, null=True)
    account_holder_name = models.CharField(
        max_length=100, blank=True, null=True
    )
    account_holder_type = models.CharField(
        max_length=20,
        choices=ACCOUNT_HOLDER_CHOICES,
        blank=True,
        null=True,
    )
    country = models.CharField(max_length=2, blank=True, null=True)
    currency = models.CharField(max_length=10, blank=True, null=True)
    account_number_last4 = models.CharField(
        max_length=4, blank=True, null=True
    )

    auto_payments = models.BooleanField(default=False)
    card_brand = models.CharField(max_length=50, blank=True, null=True)
    card_last4 = models.CharField(max_length=4, blank=True, null=True)
    card_exp_month = models.IntegerField(blank=True, null=True)
    card_exp_year = models.IntegerField(blank=True, null=True)

    stripe_customer_id = models.CharField(
        max_length=255, blank=True, null=True
    )
    stripe_payment_method_id = models.CharField(
        max_length=255, blank=True, null=True
    )

    stripe_connected_account_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="The Stripe connected account this bank account belongs to."
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if not self.business and not self.client:
            raise ValueError(
                "Banking Info must be linked to either a Business or a Client."
            )
        if self.business and self.client:
            raise ValueError(
                "Banking Info cannot belong to both Business and Client."
            )

    def __str__(self):
        owner = self.business.name if self.business else self.client.user.name
        if self.payment_method_type == "BANK_ACCOUNT":
            return f"Bank ••••{self.account_number_last4 or '----'} ({owner})"
        return (
            f"{self.card_brand or 'Card'} ••••"
            f"{self.card_last4 or '----'} ({owner})"
        )


class ServiceQuestionnaire(SoftDeletableModel):
    objects = ActiveManager()
    all_objects = models.Manager()

    business = models.ForeignKey(
        'Business',
        related_name='service_questionnaires',
        on_delete=models.CASCADE
    )
    service_name = models.CharField(
        max_length=100,
        help_text="Name of the service this questionnaire is for"
    )
    additional_questions_form = models.JSONField(
        blank=True,
        null=True,
        help_text="Stores the dynamic questionnaire structure for the service"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['business', 'service_name']

    def __str__(self):
        return f"{self.service_name} Questionnaire ({self.business.name})"

    def clean(self):
        offered_services = self.business.services_offered.names()
        if self.service_name not in offered_services:
            raise ValidationError({
                'service_name': (
                    f"Service must be one of the business's offered services: "
                    f"{offered_services}"
                )
            })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class Service(SoftDeletableModel):
    objects = ActiveManager()
    all_objects = models.Manager()

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

    # Save filled questionnaire form
    filled_questionnaire = models.JSONField(
        blank=True,
        null=True,
        help_text=(
            "Stores client responses for this service's "
            "questionnaire in JSON format"
        )
    )

    auto_generate_quote = models.BooleanField(default=False)
    auto_generate_invoices = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return (
            f"{self.service_name} for {self.client.user.name}"
        )


class Job(SoftDeletableModel):
    objects = ActiveManager()
    all_objects = models.Manager()

    service = models.ForeignKey(
        Service,
        related_name="jobs",
        on_delete=models.CASCADE,
    )
    assigned_to = models.ForeignKey(
        "TeamMember",
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


class JobPhoto(SoftDeletableModel):
    objects = ActiveManager()
    all_objects = models.Manager()

    job = models.ForeignKey(
        Job,
        related_name="photos",
        on_delete=models.CASCADE,
    )
    photo = models.ImageField(upload_to="job_photos/")
    photo_type = models.CharField(
        max_length=10,
        choices=JOB_PHOTO_TYPE_CHOICES
    )

    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.photo_type} photo for Job {self.job.id}"


class TeamMember(SoftDeletableModel):
    objects = ActiveManager()
    all_objects = models.Manager()

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


class Quote(SoftDeletableModel):
    objects = ActiveManager()
    all_objects = models.Manager()

    service = models.ForeignKey(
        "Service",
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
    signature = models.ImageField(
        upload_to="signatures/",
        null=True,
        blank=True
    )

    terms_conditions = models.TextField()
    notes = models.TextField(blank=True, null=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.quote_number} for {self.service.client}"

    def clean(self):
        """Ensure only one active (non-declined) quote exists per service."""
        if self.service_id:
            existing_quotes = Quote.objects.filter(
                service=self.service,
                is_active=True
            ).exclude(
                id=self.id
            ).exclude(
                status="DECLINED"
            )

            if existing_quotes.exists():
                raise ValidationError({
                    "service": (
                        "A quote already exists for this service. "
                        "You cannot create another unless the existing "
                        "one is declined or expired."
                    )
                })

    def save(self, *args, **kwargs):
        self.full_clean()

        if not self.quote_number:
            self.quote_number = self.generate_quote_number()

        super().save(*args, **kwargs)

    def generate_quote_number(self):
        """Generates a unique quote number in the format: Q-YYYY-XXX."""
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


class Invoice(SoftDeletableModel):
    objects = ActiveManager()
    all_objects = models.Manager()

    business = models.ForeignKey(
        Business,
        related_name="invoices",
        on_delete=models.CASCADE,
    )
    client = models.ForeignKey(
        Client,
        related_name="invoices",
        on_delete=models.CASCADE,
    )
    service = models.ForeignKey(
        Service,
        related_name="invoices",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    invoice_number = models.CharField(
        max_length=20, unique=True, editable=False
    )
    due_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=INVOICE_STATUS_CHOICES,
        default="DRAFT"
    )

    currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default="CAD"
    )

    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax_rate = models.DecimalField(
        max_digits=4, default=0, decimal_places=2
    )
    tax_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(blank=True, null=True)

    paid_at = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Invoice {self.invoice_number} for {self.client.user.name}"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = self.generate_invoice_number()
        super().save(*args, **kwargs)

    def generate_invoice_number(self):
        year = timezone.now().year
        prefix = f"INV-{year}-"
        last_invoice = Invoice.objects.filter(
            invoice_number__startswith=prefix
        ).order_by("invoice_number").last()
        new_number = 1
        if last_invoice:
            try:
                last_number = int(last_invoice.invoice_number.split("-")[-1])
                new_number = last_number + 1
            except ValueError:
                pass
        return f"{prefix}{new_number:03d}"


class Payout(SoftDeletableModel):
    objects = ActiveManager()
    all_objects = models.Manager()

    business = models.ForeignKey(
        Business,
        related_name="payouts",
        on_delete=models.CASCADE,
    )
    invoice = models.ForeignKey(
        Invoice,
        related_name="payouts",
        on_delete=models.CASCADE,
    )

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default="CAD"
    )

    status = models.CharField(
        max_length=20,
        choices=PAYOUT_STATUS_CHOICES,
        default="PENDING"
    )

    # Stripe tracking fields
    stripe_payment_intent_id = models.CharField(
        max_length=255, blank=True, null=True,
        help_text="ID of the Stripe PaymentIntent used for the original charge."
    )
    stripe_refund_id = models.CharField(
        max_length=255, blank=True, null=True,
        help_text="ID of the Stripe Refund if this payout was refunded."
    )

    # Refund tracking
    is_refunded = models.BooleanField(default=False)
    refunded_amount = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True,
        help_text="Amount refunded from this payout (if partial refund)."
    )
    refund_reason = models.TextField(blank=True, null=True)

    # Timestamps
    processed_at = models.DateTimeField(blank=True, null=True)
    refunded_at = models.DateTimeField(blank=True, null=True)
    failure_reason = models.TextField(blank=True, null=True)

    # General
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return (
            f"Payout {self.id} for {self.invoice.invoice_number} "
            f"({self.get_status_display()})"
        )
