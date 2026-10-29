"""
Serializers for business APIs
"""

import json
from decimal import Decimal, InvalidOperation
from core.ownership import OwnedRelationsMixin
from core.utils import BusinessTimezoneMixin
from core.pricing import (
    line_items_total, quote_effective_tax_rate, quote_line_items,
    quote_tax_details, service_line_items,
)
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.html import strip_tags
from django.db.models import Prefetch
from django.utils import timezone
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from taggit.models import Tag


from core.models import (
    BankingInformation,
    Business,
    Client,
    Job,
    JobPhoto,
    Quote,
    ServiceQuestionnaire,
    ServiceTermsTemplate,
    Service,
    TeamMember,
)


class BusinessSerializer(BusinessTimezoneMixin, serializers.ModelSerializer):
    """ Serializer for businesses."""
    services_offered = serializers.SerializerMethodField()

    class Meta:
        model = Business
        fields = ['id', 'owner', 'name', 'slug', 'phone', 'website', 'email',
                  'business_description', 'logo', 'street_address',
                  'city', 'country', 'province_state',
                  'postal_code', 'business_number', 'tax_rate', 'tax_label',
                  'default_payment_terms',
                  'services_offered', 'timezone', 'created_at', 'updated_at']

        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    @extend_schema_field(serializers.ListField(child=serializers.CharField()))
    def get_services_offered(self, obj):
        """Return a list of tag names for services_offered."""
        return list(obj.services_offered.names()) \
            if obj.services_offered else []

    def validate(self, attrs):
        attrs = super().validate(attrs)
        raw_services = self.initial_data.get("services_offered")
        if raw_services is None and self.instance:
            self._submitted_services = None
            return attrs
        if isinstance(raw_services, str):
            try:
                raw_services = json.loads(raw_services)
            except json.JSONDecodeError as exc:
                raise serializers.ValidationError(
                    {"services_offered": "Select services from the available options."}
                ) from exc
        if not isinstance(raw_services, list) or not raw_services:
            raise serializers.ValidationError(
                {"services_offered": "Select at least one service option."}
            )

        services = [str(name).strip() for name in raw_services if str(name).strip()]
        if len(services) != len(set(services)):
            raise serializers.ValidationError(
                {"services_offered": "Service selections must be unique."}
            )
        existing = set(
            Tag.objects.filter(name__in=services).values_list("name", flat=True)
        )
        unknown = sorted(set(services) - existing)
        if unknown:
            raise serializers.ValidationError(
                {
                    "services_offered": (
                        "Select only services configured by an administrator. "
                        f"Unknown: {', '.join(unknown)}"
                    )
                }
            )
        self._submitted_services = services
        return attrs

    def create(self, validated_data):
        tags = self._submitted_services
        validated_data.pop('services_offered', None)
        business = super().create(validated_data)
        business.services_offered.set(tags)
        return business

    def update(self, instance, validated_data):
        tags = self._submitted_services
        validated_data.pop('services_offered', None)
        business = super().update(instance, validated_data)
        if tags is not None:
            business.services_offered.set(tags)
        return business


class BusinessMarqueeLogoSerializer(serializers.ModelSerializer):
    """Serializer for public-facing business marquee logos."""

    logo = serializers.SerializerMethodField()

    class Meta:
        model = Business
        fields = ["id", "name", "logo"]

    def get_logo(self, obj):
        if not obj.logo:
            return None

        request = self.context.get("request")
        logo_url = obj.logo.url
        if request:
            return request.build_absolute_uri(logo_url)
        return logo_url


def client_prefetches(prefix=""):
    """Related rows ClientSerializer reads, loaded once per page instead of per row."""
    return [
        Prefetch(f"{prefix}client_services", queryset=Service.objects.filter(is_active=True)),
        Prefetch(
            f"{prefix}banking_information",
            queryset=BankingInformation.objects.filter(is_active=True).order_by("-created_at"),
            to_attr="active_banking",
        ),
    ]


def service_prefetches(prefix=""):
    """Related rows ServiceSerializer reads, loaded once per page instead of per row."""
    return [
        Prefetch(
            f"{prefix}service_quotes",
            queryset=Quote.objects.filter(is_active=True).order_by("id"),
            to_attr="active_quotes",
        ),
        Prefetch(
            f"{prefix}business__service_questionnaires",
            queryset=ServiceQuestionnaire.objects.filter(is_active=True),
            to_attr="active_questionnaires",
        ),
        Prefetch(
            f"{prefix}business__service_terms_templates",
            queryset=ServiceTermsTemplate.objects.filter(is_active=True),
            to_attr="active_terms_templates",
        ),
    ]


class ClientSerializer(serializers.ModelSerializer):
    """ Serializer for clients."""
    client_name = serializers.CharField(
        source="name",
        required=False
    )
    client_email = serializers.EmailField(
        source="user.email",
        required=False
    )
    client_phone = serializers.CharField(
        source="phone",
        required=False
    )
    payment_method = serializers.SerializerMethodField()
    questionnaires_filled = serializers.SerializerMethodField()
    questionnaires_total = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = ['id', 'user', 'business', 'client_name',
                  'client_email', 'client_phone', 'is_active', 'company_name',
                  'billing_street_address', 'billing_city',
                  'billing_province_state', 'billing_country',
                  'billing_postal_code',
                  'payment_method', 'questionnaires_filled',
                  'questionnaires_total', 'created_at', 'updated_at']

        read_only_fields = [
            'id', 'user', 'business', 'created_at', 'updated_at'
        ]

    def get_payment_method(self, obj):
        """
        Return client's active payment method details if available.
        """
        cards = getattr(obj, "active_banking", None)
        if cards is None:
            cards = obj.banking_information.filter(is_active=True).order_by('-created_at')[:1]
        banking_info = next(iter(cards), None)

        if not banking_info or banking_info.payment_method_type != "CARD":
            return "-"

        return banking_info.payment_method_type

    def get_questionnaires_filled(self, obj):
        """Return active client services with submitted questionnaire answers."""
        return sum(
            1 for service in obj.client_services.all()
            if not service.bypass_questionnaire and bool(service.filled_questionnaire)
        )

    def get_questionnaires_total(self, obj):
        """Return active client services expected to have questionnaires."""
        return sum(1 for service in obj.client_services.all() if not service.bypass_questionnaire)

    def validate(self, attrs):
        user_data = attrs.get("user", {})
        if self.instance is None:
            missing = {
                key: "This field is required."
                for key, value in (
                    ("client_name", attrs.get("name")),
                    ("client_email", user_data.get("email")),
                    ("client_phone", attrs.get("phone")),
                )
                if not value
            }
            if missing:
                raise serializers.ValidationError(missing)
            return attrs

        account = self.instance.user
        if "email" not in user_data or user_data["email"] == account.email:
            attrs.pop("user", None)
            return attrs

        # The login account is shared with every business the person works
        # with, so a business may only fix its email while it is the sole
        # business and the client has never signed in.
        shared = (
            account.role != "CLIENT"
            or account.owned_businesses.exists()
            or Client.all_objects.filter(user=account).exclude(pk=self.instance.pk).exists()
        )
        if shared:
            raise serializers.ValidationError({
                "client_email": "This client's account is shared with another business, "
                                "so only the client can change their email."
            })
        if account.last_login:
            raise serializers.ValidationError({
                "client_email": "This client has already signed in, so only they can change their email."
            })
        if get_user_model().objects.exclude(pk=account.pk).filter(
            email__iexact=user_data["email"]
        ).exists():
            raise serializers.ValidationError({
                "client_email": "A user with this email already exists."
            })
        return attrs

    def create(self, validated_data):
        """Link the person with this email, creating their account if needed."""
        email = validated_data.pop("user")["email"]
        business = validated_data["business"]
        User = get_user_model()
        account = User.objects.filter(email__iexact=email).first()
        if account is None:
            account = User.objects.create_user(
                email, name=validated_data["name"], phone=validated_data["phone"],
                role="CLIENT", is_active=True,
            )
        elif account.pk == business.owner_id:
            raise serializers.ValidationError({"client_email": "You cannot add yourself as a client."})
        else:
            existing = Client.all_objects.filter(business=business, user=account).first()
            if existing:
                raise serializers.ValidationError({
                    "client_email": (
                        "This client was previously removed. Contact support to restore them."
                        if existing.is_deleted else "This person is already your client."
                    )
                })
        return super().create({**validated_data, "user": account})

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        instance = super().update(instance, validated_data)

        user = instance.user
        if instance.is_active and not user.is_active and user.role == "CLIENT":
            # Restore accounts disabled when deactivation was account-wide.
            user_data["is_active"] = True
        if user_data:
            for field, value in user_data.items():
                setattr(user, field, value)
            user.save(update_fields=list(user_data.keys()))

        return instance


class TeamMemberSerializer(OwnedRelationsMixin, serializers.ModelSerializer):
    owned_relations = ("business",)
    employee = serializers.PrimaryKeyRelatedField(queryset=get_user_model().objects.all())
    employee_name = serializers.CharField(
        source="employee.name",
        read_only=True
    )
    employee_email = serializers.CharField(
        source="employee.email",
        read_only=True
    )
    employee_phone = serializers.CharField(
        source="employee.phone",
        read_only=True
    )
    is_active = serializers.CharField(
        source="employee.is_active",
        read_only=True
    )
    role = serializers.SerializerMethodField()
    business_name = serializers.CharField(
        source="business.name",
        read_only=True
    )

    class Meta:
        model = TeamMember
        validators = []
        fields = [
            "id", "business", "business_name", "employee",
            "employee_name", "employee_email", "is_active", "role",
            "job_duties", "expertise", "employee_phone",
            "is_active", "joined_at",
        ]

        read_only_fields = ["id", "joined_at"]

    def validate(self, attrs):
        employee = attrs.get("employee")
        business = attrs.get("business") or getattr(self.instance, "business", None)
        role = self.initial_data.get("role")

        if self.instance and employee and employee.pk != self.instance.employee_id:
            raise serializers.ValidationError({"employee": "A team member's account cannot be changed."})

        # Prevent adding any business owner as a team member
        if employee and hasattr(employee, "owned_businesses"):
            if employee.owned_businesses.exists():
                raise serializers.ValidationError(
                    f"User '{employee.name}' is already a business owner "
                    f"and cannot be added as a team member."
                )

        if employee and employee.role not in {"MANAGER", "EMPLOYEE"}:
            raise serializers.ValidationError({
                "employee": "This account is not a manager or employee. Use a different email address."
            })

        if employee and business and not self.instance:
            existing = TeamMember.all_objects.filter(
                business=business, employee=employee,
            ).first()
            if existing:
                message = (
                    "This account was previously on this team. Contact support to restore it."
                    if existing.is_deleted else "This account is already on this team."
                )
                raise serializers.ValidationError({"employee": message})

        if role is not None:
            normalized_role = str(role).strip().upper()
            if normalized_role not in {"MANAGER", "EMPLOYEE"}:
                raise serializers.ValidationError(
                    {"role": "Role must be Manager or Employee."}
                )

            request = self.context.get("request")
            if (
                self.instance
                and request
                and self.instance.employee_id == request.user.id
            ):
                raise serializers.ValidationError(
                    {"role": "You cannot change your own role."}
                )

            attrs["role"] = normalized_role

        return attrs

    def get_role(self, obj):
        return obj.employee.role

    def create(self, validated_data):
        role = validated_data.pop("role", None)
        instance = super().create(validated_data)
        if role and instance.employee.role != role:
            instance.employee.role = role
            instance.employee.save(update_fields=["role"])
        return instance

    def update(self, instance, validated_data):
        role = validated_data.pop("role", None)
        instance = super().update(instance, validated_data)
        if role and instance.employee.role != role:
            instance.employee.role = role
            instance.employee.save(update_fields=["role"])
        return instance


class ServiceSerializer(OwnedRelationsMixin, BusinessTimezoneMixin, serializers.ModelSerializer):
    """Serializer for services with optimized validation."""
    owned_relations = ("business", "client")
    quotations = serializers.SerializerMethodField()
    service_questionnaires = serializers.SerializerMethodField()
    service_terms_template = serializers.SerializerMethodField()
    tax_rate = serializers.SerializerMethodField()
    client_name = serializers.CharField(
        source="client.name",
        read_only=True
    )

    class Meta:
        model = Service
        fields = [
            "id", "client", "client_name", "business", "quotations",
            "service_name", "service_questionnaires", "service_terms_template",
            "filled_questionnaire", "bypass_questionnaire",
            "description", "items", "start_date", "end_date", "service_type",
            "price", "currency", "billing_cycle", "status", "tax_rate",
            "auto_generate_quote", "auto_generate_invoices",
            "street_address", "city", "country", "province_state",
            "postal_code", "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]
        extra_kwargs = {"price": {"required": False}}

    def validate_items(self, value):
        if not isinstance(value, list) or len(value) > 50:
            raise serializers.ValidationError("Provide up to 50 service items.")
        normalized = []
        for number, item in enumerate(value, 1):
            if not isinstance(item, dict):
                raise serializers.ValidationError(f"Item {number} must be an object.")
            title = item.get("title")
            description = item.get("description", "")
            if not isinstance(title, str) or not title.strip() or len(title.strip()) > 100:
                raise serializers.ValidationError(f"Item {number} needs a title of up to 100 characters.")
            if not isinstance(description, str):
                raise serializers.ValidationError(f"Item {number} description must be text.")
            try:
                price = Decimal(str(item["price"]))
            except (KeyError, InvalidOperation, TypeError, ValueError):
                raise serializers.ValidationError(f"Item {number} needs a valid price.")
            if not price.is_finite() or price < 0 or price.as_tuple().exponent < -2 or price > Decimal("99999999.99"):
                raise serializers.ValidationError(f"Item {number} needs a nonnegative price with two decimal places.")
            normalized.append({"title": title.strip(), "description": description.strip(), "price": f"{price:.2f}"})
        if line_items_total(normalized) > Decimal("99999999.99"):
            raise serializers.ValidationError("The service total is too large.")
        return normalized

    def get_quotations(self, obj):
        """Return related active quotes."""
        quotes = getattr(obj, "active_quotes", None)
        if quotes is None:
            quotes = obj.service_quotes.filter(is_active=True)
        quotations = []
        for quote in quotes:
            subtotal, _, _, total = quote_tax_details(quote)
            rate = quote_effective_tax_rate(quote)
            quotations.append({
                "id": quote.id,
                "quote_number": quote.quote_number,
                "status": quote.status,
                "valid_until": quote.valid_until,
                "payment_terms": quote.payment_terms,
                "created_at": quote.created_at,
                "line_items": quote_line_items(quote),
                "quoted_subtotal": str(subtotal),
                "quoted_tax_rate": str(rate) if rate is not None else None,
                "quoted_total": str(total),
                "quoted_currency": quote.currency or obj.currency,
            })
        return quotations

    def _active_for_service(self, obj, prefetched_attr, related_name):
        """The business's active record for this service name, from a prefetch if present."""
        records = getattr(obj.business, prefetched_attr, None)
        if records is None:
            return getattr(obj.business, related_name).filter(
                service_name=obj.service_name, is_active=True,
            ).first()
        return next((record for record in records if record.service_name == obj.service_name), None)

    def get_service_questionnaires(self, obj):
        """Return the active questionnaire for this service if exists."""
        if obj.bypass_questionnaire:
            return {}
        questionnaire = self._active_for_service(obj, "active_questionnaires", "service_questionnaires")
        if questionnaire:
            return {
                "id": questionnaire.id,
                "questionnaire": questionnaire.additional_questions_form,
            }
        return {}

    def get_tax_rate(self, obj):
        """Return the business tax rate associated with this service."""
        return float(obj.business.tax_rate / 100)

    def get_service_terms_template(self, obj):
        """Return the active general terms template for this service if exists."""
        template = self._active_for_service(obj, "active_terms_templates", "service_terms_templates")
        if template:
            return {
                "id": template.id,
                "content": template.content,
            }
        return {}

    def validate(self, data):
        """
        Validates:
        - client belongs to business
        - service_name is offered by business
        - questionnaire existence unless explicitly bypassed by the business
        - cannot activate until questionnaire is filled or bypassed
        - no duplicate address for same service_name within a business
        """
        items = data.get("items", getattr(self.instance, "items", []))
        if items:
            data["price"] = line_items_total(items)
        elif not self.instance and "price" not in data:
            raise serializers.ValidationError({"price": "Enter a service price when no items are added."})

        business = (
            data.get("business") or
            getattr(self.instance, "business", None)
        )
        client = data.get("client") or getattr(self.instance, "client", None)
        service_name = (
            data.get("service_name") or
            getattr(self.instance, "service_name", None)
        )

        errors = {}

        bypass = data.get("bypass_questionnaire", getattr(self.instance, "bypass_questionnaire", False))
        previous_bypass = getattr(self.instance, "bypass_questionnaire", False)
        if bypass != previous_bypass:
            user = getattr(self.context.get("request"), "user", None)
            if not user or not (
                user.role == "ADMIN" or (user.role == "MANAGER" and business and business.owner_id == user.pk)
            ):
                errors["bypass_questionnaire"] = "Only the business owner can change questionnaire requirements."
            if self.instance and self.instance.status != "PENDING":
                errors["bypass_questionnaire"] = (
                    "Questionnaire bypass can only be changed while the service is pending."
                )

        if business and service_name:
            allowed_services = {
                s.name for s in business.services_offered.all()
            }
            if service_name not in allowed_services:
                errors["service_name"] = (
                    "This service is not offered by the selected business."
                )

        if business and client and client.business != business:
            errors["client"] = (
                "This client does not belong to the selected business."
            )

        should_require_service_templates = (
            not self.instance or
            (
                "service_name" in data and
                data.get("service_name") != getattr(self.instance, "service_name", None)
            )
        )

        # Only require service templates on create or when service_name changes
        if not bypass and (should_require_service_templates or previous_bypass):
            has_questionnaire = business.service_questionnaires.filter(
                service_name=service_name,
                is_active=True
            ).exists()
            if not has_questionnaire:
                errors["service_name"] = (
                    "Cannot create this service because there is no active "
                    "questionnaire for the selected service name."
                )

        if should_require_service_templates:
            has_terms_template = business.service_terms_templates.filter(
                service_name=service_name,
                is_active=True,
            ).exists()
            if not has_terms_template:
                errors["service_name"] = (
                    "Cannot create this service because there is no active "
                    "terms and conditions template for the selected service name."
                )

        will_auto_quote = data.get("auto_generate_quote", getattr(self.instance, "auto_generate_quote", False))
        if bypass and will_auto_quote:
            has_quote = self.instance and self.instance.service_quotes.filter(is_active=True).exclude(
                status="DECLINED",
            ).exists()
            if not has_quote and not business.service_terms_templates.filter(
                service_name=service_name, is_active=True,
            ).exists():
                errors["bypass_questionnaire"] = "An active terms template is required to generate a quote."

        if not self.instance and data.get("status") == "ACTIVE" and not bypass and not data.get("filled_questionnaire"):
            errors["status"] = "Cannot activate this service until the questionnaire is completed or bypassed."

        if bypass and data.get("filled_questionnaire"):
            errors["filled_questionnaire"] = "This service bypasses the questionnaire."

        # Prevent activation before questionnaire is filled
        if self.instance:
            new_status = data.get("status")
            filled_questionnaire = (
                data.get("filled_questionnaire")
                or getattr(self.instance, "filled_questionnaire", None)
            )
            is_submitting_questionnaire = (
                "filled_questionnaire" in data
                and data.get("filled_questionnaire")
                and not getattr(self.instance, "filled_questionnaire", None)
            )

            if new_status == "ACTIVE" and not filled_questionnaire and not bypass:
                errors["status"] = (
                    "Cannot mark this service as active until the client "
                    "has filled out the questionnaire."
                )

            if is_submitting_questionnaire and bypass:
                errors["filled_questionnaire"] = "This service bypasses the questionnaire."
            elif is_submitting_questionnaire:
                has_questionnaire = business.service_questionnaires.filter(
                    service_name=service_name,
                    is_active=True,
                ).exists()
                if not has_questionnaire:
                    errors["filled_questionnaire"] = (
                        "No active questionnaire found for this service."
                    )

                will_auto_generate_quote = data.get(
                    "auto_generate_quote",
                    getattr(self.instance, "auto_generate_quote", False),
                )
                has_active_quote = (
                    self.instance.service_quotes.filter(is_active=True)
                    .exclude(status="DECLINED")
                    .exists()
                )
                has_terms_template = business.service_terms_templates.filter(
                    service_name=service_name,
                    is_active=True,
                ).exists()
                if (
                    will_auto_generate_quote
                    and not has_active_quote
                    and not has_terms_template
                ):
                    errors.setdefault(
                        "filled_questionnaire",
                        (
                            "No active terms and conditions template exists "
                            "for this service."
                        ),
                    )

        # Prevent duplicate address for same service_name within a business
        if business and service_name:
            street = (
                data.get("street_address") or
                getattr(self.instance, "street_address", None)
            )
            city = (
                data.get("city") or
                getattr(self.instance, "city", None)
            )
            province = (
                data.get("province_state") or
                getattr(self.instance, "province_state", None)
            )
            postal = (
                data.get("postal_code") or
                getattr(self.instance, "postal_code", None)
            )
            country = (
                data.get("country") or getattr(self.instance, "country", None)
            )

            duplicate_qs = Service.objects.filter(
                business=business,
                client=client,
                service_name=service_name,
                street_address__iexact=street.strip() if street else "",
                city__iexact=city.strip() if city else "",
                province_state__iexact=province.strip() if province else "",
                postal_code__iexact=postal.strip() if postal else "",
                country__iexact=country.strip() if country else "",
                is_active=True,
            )

            if self.instance:
                duplicate_qs = duplicate_qs.exclude(pk=self.instance.pk)

            if duplicate_qs.exists():
                errors["street_address"] = (
                    "A service with this address and service name already "
                    "exists for this client."
                )

        if errors:
            raise serializers.ValidationError(errors)

        return data


class QuoteSerializer(OwnedRelationsMixin, serializers.ModelSerializer):
    """ Serializer for quotes."""
    owned_relations = ("service",)

    service_data = ServiceSerializer(source="service", read_only=True)
    client = ClientSerializer(source="service.client", read_only=True)
    combined_terms_conditions = serializers.SerializerMethodField()
    line_items = serializers.SerializerMethodField()
    quoted_total = serializers.SerializerMethodField()
    quoted_subtotal = serializers.SerializerMethodField()
    quoted_tax_rate = serializers.SerializerMethodField()
    quoted_tax_label = serializers.SerializerMethodField()
    quoted_tax_amount = serializers.SerializerMethodField()
    quoted_currency = serializers.SerializerMethodField()
    service_name = serializers.CharField(
        source="service.service_name",
        read_only=True
    )
    client_name = serializers.CharField(
        source="service.client.name",
        read_only=True
    )
    business_name = serializers.CharField(
        source="service.business.name",
        read_only=True
    )

    class Meta:
        model = Quote
        fields = [
            "id", "quote_number", "service", "service_data", "client",
            "service_name", "client_name", "business_name", "valid_until",
            "payment_terms",
            "status", "signed_at", "signature", "general_terms_conditions",
            "terms_conditions", "combined_terms_conditions",
            "notes", "line_items", "quoted_subtotal", "quoted_tax_rate", "quoted_tax_label",
            "quoted_tax_amount", "quoted_total", "quoted_currency", "is_active", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "quote_number", "status", "general_terms_conditions",
            "combined_terms_conditions", "is_active", "created_at", "updated_at",
        ]

    def validate_valid_until(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError(
                "The 'valid_until' date must be in the future."
            )
        return value

    def validate(self, attrs):
        """Ensure a service cannot have more than one active non-declined quote."""
        if self.instance is None and not attrs.get("payment_terms"):
            raise serializers.ValidationError({"payment_terms": "Choose payment terms."})
        service = attrs.get("service") or getattr(self.instance, "service", None)

        if service:
            existing_quotes = (
                Quote.objects.filter(service=service, is_active=True)
                .exclude(id=getattr(self.instance, "id", None))
                .exclude(status="DECLINED")
            )

            if existing_quotes.exists():
                raise serializers.ValidationError(
                    {
                        "service": (
                            "A quote already exists for this service. "
                            "You cannot create another unless the existing "
                            "one is declined or expired."
                        )
                    }
                )

        return attrs

    def get_combined_terms_conditions(self, obj):
        general_terms = (obj.general_terms_conditions or "").strip()
        additional_terms = (obj.terms_conditions or "").strip()

        if general_terms and additional_terms:
            return f"{general_terms}\n\nAdditional Terms:\n{additional_terms}"
        return general_terms or additional_terms

    def get_line_items(self, obj):
        return quote_line_items(obj)

    def get_quoted_total(self, obj):
        return str(quote_tax_details(obj)[3])

    def get_quoted_subtotal(self, obj):
        return str(quote_tax_details(obj)[0])

    def get_quoted_tax_rate(self, obj):
        rate = quote_effective_tax_rate(obj)
        return str(rate) if rate is not None else None

    def get_quoted_tax_label(self, obj):
        return quote_tax_details(obj)[1]

    def get_quoted_tax_amount(self, obj):
        amount = quote_tax_details(obj)[2]
        return str(amount) if amount is not None else None

    def get_quoted_currency(self, obj):
        return obj.currency or obj.service.currency

    def create(self, validated_data):
        service = validated_data["service"]
        template = service.business.service_terms_templates.filter(
            service_name=service.service_name,
            is_active=True,
        ).first()
        if not template:
            raise serializers.ValidationError(
                {
                    "service": (
                        "No active terms and conditions template exists for "
                        "this service."
                    )
                }
            )

        validated_data["general_terms_conditions"] = template.content
        validated_data["line_items"] = service_line_items(service)
        validated_data["currency"] = service.currency
        return super().create(validated_data)


class ServiceTermsTemplateSerializer(OwnedRelationsMixin, serializers.ModelSerializer):
    owned_relations = ("business",)
    business_name = serializers.CharField(
        source="business.name",
        read_only=True,
    )

    class Meta:
        model = ServiceTermsTemplate
        fields = [
            "id",
            "business",
            "business_name",
            "service_name",
            "content",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "business_name",
            "created_at",
            "updated_at",
        ]

    def validate_content(self, value):
        plain_text = strip_tags(value or "").strip()
        word_count = len(plain_text.split()) if plain_text else 0
        if not plain_text:
            raise serializers.ValidationError(
                "General terms and conditions cannot be blank."
            )
        if word_count > 10000:
            raise serializers.ValidationError(
                "General terms and conditions cannot exceed 10,000 words."
            )
        return value


class ServiceQuestionnaireSerializer(OwnedRelationsMixin, serializers.ModelSerializer):
    owned_relations = ("business",)
    business_name = serializers.CharField(
        source='business.name',
        read_only=True
    )
    no_of_questions = serializers.SerializerMethodField()

    class Meta:
        model = ServiceQuestionnaire
        fields = [
            'id',
            'business',
            'business_name',
            'service_name',
            'additional_questions_form',
            'no_of_questions',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'business_name',
            'no_of_questions',
            'created_at',
            'updated_at',
        ]

    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict) from exc

    def update(self, instance, validated_data):
        try:
            return super().update(instance, validated_data)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict) from exc

    def get_no_of_questions(self, obj):
        """Return the count of questions in the questionnaire."""
        if (
            obj.additional_questions_form and
            isinstance(obj.additional_questions_form, list)
        ):
            return len(obj.additional_questions_form)
        return 0


class JobSerializer(OwnedRelationsMixin, BusinessTimezoneMixin, serializers.ModelSerializer):
    """Serializer for Job model."""
    owned_relations = ("service", "assigned_to")

    service_name = serializers.CharField(
        source="service.service_name",
        read_only=True
    )
    assigned_to_name = serializers.CharField(
        source="assigned_to.employee.name",
        read_only=True
    )
    business_name = serializers.CharField(
        source="service.business.name",
        read_only=True
    )

    class Meta:
        model = Job
        fields = [
            "id",
            "service",
            "service_name",
            "assigned_to",
            "assigned_to_name",
            "business_name",
            "title",
            "description",
            "scheduled_date",
            "completed_at",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate(self, data):
        """Ensure job assignment is within the same business as service."""
        service = (
            data.get("service")
            or getattr(self.instance, "service", None)
        )
        assigned_to = (
            data.get("assigned_to")
            or getattr(self.instance, "assigned_to", None)
        )

        errors = {}

        if assigned_to and service:
            # Validate that assigned team member belongs to same business
            if assigned_to.business != service.business:
                errors["assigned_to"] = (
                    "Assigned team member must belong to the same "
                    "business as the service."
                )

        if errors:
            raise serializers.ValidationError(errors)

        return data


class JobPhotoSerializer(OwnedRelationsMixin, serializers.ModelSerializer):
    owned_relations = ("job",)

    def can_link(self, field, target, user):
        assigned = target.assigned_to
        return super().can_link(field, target, user) or bool(assigned and assigned.employee_id == user.pk)

    def validate(self, attrs):
        job = attrs.get("job") or getattr(self.instance, "job", None)
        photo_type = (
            attrs.get("photo_type")
            or getattr(self.instance, "photo_type", None)
        )

        if job and photo_type:
            existing_photos = job.photos.filter(
                photo_type=photo_type,
                is_deleted=False,
            )

            if self.instance:
                existing_photos = existing_photos.exclude(id=self.instance.id)

            if existing_photos.exists():
                raise serializers.ValidationError(
                    {
                        "photo_type": (
                            f"A {photo_type.lower()} photo has already been "
                            "uploaded for this job."
                        )
                    }
                )

        return attrs

    class Meta:
        model = JobPhoto
        fields = [
            "id",
            "job",
            "photo",
            "photo_type",
            "uploaded_at",
        ]
        read_only_fields = ["uploaded_at"]
