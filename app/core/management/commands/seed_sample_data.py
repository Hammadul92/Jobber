import json
import re
from datetime import timedelta
from decimal import Decimal
from pathlib import Path

from django.contrib.auth import get_user_model
from django.contrib.sessions.models import Session
from django.core.files import File
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from rest_framework.authtoken.models import Token
from taggit.models import Tag

from core.models import (
    BankingInformation,
    Business,
    Client,
    FAQ,
    Invoice,
    Job,
    Quote,
    Service,
    ServiceQuestionnaire,
    ServiceTermsTemplate,
    TeamMember,
)


DEFAULT_FIXTURE = Path(__file__).resolve().parents[2] / "fixtures" / "sample_data.json"
PHONE_PATTERN = re.compile(r"^\+1 \d{3}-\d{3}-\d{4}$")


class Command(BaseCommand):
    help = "Reset non-admin data and seed sample businesses from JSON."

    def add_arguments(self, parser):
        parser.add_argument(
            "--input",
            type=Path,
            default=DEFAULT_FIXTURE,
            help=f"Seed JSON path (default: {DEFAULT_FIXTURE}).",
        )
        actions = parser.add_mutually_exclusive_group()
        actions.add_argument(
            "--reset",
            action="store_true",
            help="Delete application data and non-admin users before seeding.",
        )
        actions.add_argument(
            "--remove",
            action="store_true",
            help="Remove only businesses and users defined in the seed JSON.",
        )
        actions.add_argument(
            "--update-logos",
            action="store_true",
            help="Update logos on existing businesses defined in the seed JSON.",
        )
        actions.add_argument(
            "--update-phones",
            action="store_true",
            help="Update phones on existing businesses and users from seed JSON.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Validate the JSON and roll back all database changes.",
        )

    def handle(self, *args, **options):
        payload = self._load_payload(options["input"])

        try:
            self._validate_payload(payload)
            with transaction.atomic():
                if options["remove"]:
                    counts = self._remove(payload)
                elif options["update_logos"]:
                    counts = self._update_logos(
                        payload,
                        options["input"].resolve().parent,
                        write_files=not options["dry_run"],
                    )
                elif options["update_phones"]:
                    counts = self._update_phones(payload)
                else:
                    if options["reset"]:
                        self._reset_data()
                    counts = self._seed(
                        payload,
                        options["input"].resolve().parent,
                        write_files=not options["dry_run"],
                    )
                if options["dry_run"]:
                    transaction.set_rollback(True)
        except (KeyError, TypeError, ValueError) as exc:
            raise CommandError(f"Invalid seed data: {exc}") from exc

        if options["dry_run"]:
            if options["remove"]:
                action = "Validated removal of"
            elif options["update_logos"]:
                action = "Validated logo updates for"
            elif options["update_phones"]:
                action = "Validated phone updates for"
            else:
                action = "Validated"
        else:
            if options["remove"]:
                action = "Removed"
            elif options["update_logos"]:
                action = "Updated logos for"
            elif options["update_phones"]:
                action = "Updated phones for"
            else:
                action = "Seeded"
        summary = ", ".join(f"{name}={count}" for name, count in counts.items())
        self.stdout.write(self.style.SUCCESS(f"{action} sample data: {summary}"))

    def _load_payload(self, path):
        try:
            with path.open(encoding="utf-8") as fixture:
                payload = json.load(fixture)
        except FileNotFoundError as exc:
            raise CommandError(f"Seed file does not exist: {path}") from exc
        except json.JSONDecodeError as exc:
            raise CommandError(f"Seed file is not valid JSON: {exc}") from exc

        if not isinstance(payload.get("businesses"), list) or not payload["businesses"]:
            raise CommandError("Seed file must contain a non-empty 'businesses' list.")
        return payload

    def _validate_payload(self, payload):
        """Reject cross-domain inconsistencies before creating any records."""
        seen_slugs = set()
        seen_emails = set()
        valid_quote_statuses = {"DRAFT", "SENT", "SIGNED", "DECLINED"}
        valid_job_statuses = {"PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"}
        valid_invoice_statuses = {"DRAFT", "SENT", "PAID", "CANCELLED"}
        catalog_services = set(Tag.objects.values_list("name", flat=True))

        for business_data in payload["businesses"]:
            slug = business_data["slug"]
            if slug in seen_slugs:
                raise ValueError(f"duplicate business slug '{slug}'")
            seen_slugs.add(slug)

            offered_services = business_data.get("services_offered", [])
            if not offered_services or len(offered_services) != len(
                set(offered_services)
            ):
                raise ValueError(
                    f"services_offered must be non-empty and unique for '{slug}'"
                )
            offered_services = set(offered_services)
            unknown_catalog_services = sorted(offered_services - catalog_services)
            if unknown_catalog_services:
                raise ValueError(
                    f"services_offered contains options not configured by an "
                    f"administrator for '{slug}': {unknown_catalog_services}"
                )

            template_data = business_data.get("service_templates", [])
            template_names = [item["service_name"] for item in template_data]
            if len(template_names) != len(set(template_names)):
                raise ValueError(f"duplicate service template for '{slug}'")
            if set(template_names) != offered_services:
                raise ValueError(
                    f"service_templates must cover every offered service for '{slug}'"
                )
            templates = {item["service_name"]: item for item in template_data}

            team_emails = set()
            client_emails = set()
            user_data = [business_data["owner"]]
            user_data.extend(business_data.get("team_members", []))
            user_data.extend(business_data.get("clients", []))
            for user in user_data:
                email = user["email"].lower()
                if email in seen_emails:
                    raise ValueError(f"duplicate user email '{email}'")
                seen_emails.add(email)

            for member in business_data.get("team_members", []):
                team_emails.add(member["email"].lower())
            for client in business_data.get("clients", []):
                client_emails.add(client["email"].lower())

            seen_client_services = set()
            for service_data in business_data.get("services", []):
                service_name = service_data["service_name"]
                client_email = service_data["client_email"].lower()
                service_key = (client_email, service_name)

                if service_name not in offered_services:
                    raise ValueError(
                        f"service '{service_name}' is not offered by '{slug}'"
                    )
                if client_email not in client_emails:
                    raise ValueError(f"unknown client '{client_email}' for '{slug}'")
                if service_key in seen_client_services:
                    raise ValueError(
                        f"duplicate service '{service_name}' for client "
                        f"'{client_email}' in '{slug}'"
                    )
                seen_client_services.add(service_key)

                questionnaire = service_data.get("filled_questionnaire")
                template_questions = templates[service_name].get("questions", [])
                if not template_questions:
                    raise ValueError(
                        f"questionnaire has no questions for '{service_name}'"
                    )
                if questionnaire is not None and not isinstance(questionnaire, dict):
                    raise ValueError(
                        f"filled_questionnaire must be an object for '{service_name}'"
                    )
                questionnaire = questionnaire or {}
                defined_questions = {item["text"] for item in template_questions}
                unknown_answers = set(questionnaire) - defined_questions
                if unknown_answers:
                    raise ValueError(
                        f"questionnaire answers undefined questions for '{service_name}': "
                        f"{sorted(unknown_answers)}"
                    )
                missing_answers = {
                    item["text"]
                    for item in template_questions
                    if item.get("required") and not questionnaire.get(item["text"])
                }
                if missing_answers:
                    if service_data.get("jobs"):
                        raise ValueError(
                            f"jobs require a completed questionnaire for "
                            f"'{service_name}'; missing required answers: "
                            f"{sorted(missing_answers)}"
                        )
                    raise ValueError(
                        f"questionnaire is missing required answers for "
                        f"'{service_name}': {sorted(missing_answers)}"
                    )

                quote_data = service_data.get("quote")
                quote_status = quote_data.get("status", "DRAFT") if quote_data else None
                if quote_status and quote_status not in valid_quote_statuses:
                    raise ValueError(
                        f"invalid quote status '{quote_status}' for '{service_name}'"
                    )
                if quote_status == "SIGNED" and not quote_data.get("signature"):
                    raise ValueError(
                        f"signed quote requires a signature for '{service_name}'"
                    )

                jobs = service_data.get("jobs", [])
                if jobs and not questionnaire:
                    raise ValueError(
                        f"jobs require a completed questionnaire for '{service_name}'"
                    )
                if jobs and quote_status != "SIGNED":
                    raise ValueError(
                        f"jobs require a signed quote for '{service_name}'"
                    )

                for job_data in jobs:
                    assigned_email = job_data.get("assigned_to_email", "").lower()
                    if assigned_email and assigned_email not in team_emails:
                        raise ValueError(
                            f"unknown team member '{assigned_email}' for '{slug}'"
                        )
                    job_status = job_data.get("status", "PENDING")
                    if job_status not in valid_job_statuses:
                        raise ValueError(
                            f"invalid job status '{job_status}' for '{service_name}'"
                        )
                    completed_days_ago = job_data.get("completed_days_ago")
                    if job_status == "COMPLETED" and completed_days_ago is None:
                        raise ValueError(
                            f"completed job requires completed_days_ago for "
                            f"'{service_name}'"
                        )
                    if job_status != "COMPLETED" and completed_days_ago is not None:
                        raise ValueError(
                            f"only completed jobs may set completed_days_ago for "
                            f"'{service_name}'"
                        )

                invoice_data = service_data.get("invoice")
                if invoice_data:
                    if quote_status != "SIGNED":
                        raise ValueError(
                            f"invoice requires a signed quote for '{service_name}'"
                        )
                    invoice_status = invoice_data.get("status", "DRAFT")
                    if invoice_status not in valid_invoice_statuses:
                        raise ValueError(
                            f"invalid invoice status '{invoice_status}' for "
                            f"'{service_name}'"
                        )
                    if invoice_status == "PAID" and not any(
                        job.get("status") == "COMPLETED" for job in jobs
                    ):
                        raise ValueError(
                            f"paid invoice requires completed work for '{service_name}'"
                        )
                    paid_days_ago = invoice_data.get("paid_days_ago")
                    if invoice_status == "PAID" and paid_days_ago is None:
                        raise ValueError(
                            f"paid invoice requires paid_days_ago for '{service_name}'"
                        )
                    if invoice_status != "PAID" and paid_days_ago is not None:
                        raise ValueError(
                            f"only paid invoices may set paid_days_ago for "
                            f"'{service_name}'"
                        )

    def _reset_data(self):
        User = get_user_model()
        admins = User.objects.filter(is_superuser=True) | User.objects.filter(
            is_staff=True
        ) | User.objects.filter(role="ADMIN")
        admins = admins.distinct()
        if not admins.exists():
            raise CommandError(
                "Reset aborted because no superuser, staff user, or ADMIN user exists."
            )

        # Business cascades through clients, services, jobs, quotes, and finance data.
        Business.all_objects.all().delete()
        BankingInformation.all_objects.all().delete()
        ServiceQuestionnaire.all_objects.all().delete()
        ServiceTermsTemplate.all_objects.all().delete()
        FAQ.all_objects.all().delete()
        Token.objects.exclude(user__in=admins).delete()
        Session.objects.all().delete()
        User.objects.exclude(pk__in=admins.values("pk")).delete()

    def _remove(self, payload):
        User = get_user_model()
        slugs = []
        emails = []

        for business_data in payload["businesses"]:
            slugs.append(business_data["slug"])
            emails.append(business_data["owner"]["email"].lower())
            emails.extend(
                member["email"].lower()
                for member in business_data.get("team_members", [])
            )
            emails.extend(
                client["email"].lower()
                for client in business_data.get("clients", [])
            )

        if len(slugs) != len(set(slugs)):
            raise ValueError("duplicate business slug in removal data")
        if len(emails) != len(set(emails)):
            raise ValueError("duplicate user email in removal data")

        businesses = Business.all_objects.filter(slug__in=slugs)
        stored_logos = list(
            businesses.exclude(logo="").exclude(logo__isnull=True).values_list(
                "logo", flat=True
            )
        )
        stored_signatures = list(
            Quote.all_objects.filter(service__business__in=businesses)
            .exclude(signature="")
            .exclude(signature__isnull=True)
            .values_list("signature", flat=True)
            .distinct()
        )
        counts = {
            "businesses": businesses.count(),
            "questionnaires": ServiceQuestionnaire.all_objects.filter(
                business__in=businesses
            ).count(),
            "terms_templates": ServiceTermsTemplate.all_objects.filter(
                business__in=businesses
            ).count(),
            "team_members": TeamMember.all_objects.filter(business__in=businesses).count(),
            "clients": Client.all_objects.filter(business__in=businesses).count(),
            "services": Service.all_objects.filter(business__in=businesses).count(),
            "quotes": Quote.all_objects.filter(
                service__business__in=businesses
            ).count(),
            "jobs": Job.all_objects.filter(service__business__in=businesses).count(),
            "invoices": Invoice.all_objects.filter(business__in=businesses).count(),
        }
        businesses.delete()

        fixture_users = User.objects.filter(email__in=emails).exclude(
            is_superuser=True
        ).exclude(is_staff=True).exclude(role="ADMIN")
        counts["users"] = fixture_users.count()
        fixture_users.delete()
        logo_storage = Business._meta.get_field("logo").storage
        for stored_logo in stored_logos:
            transaction.on_commit(
                lambda name=stored_logo: logo_storage.delete(name)
            )
        signature_storage = Quote._meta.get_field("signature").storage
        for stored_signature in stored_signatures:
            transaction.on_commit(
                lambda name=stored_signature: signature_storage.delete(name)
            )
        return counts

    def _seed(self, payload, fixture_directory, write_files=True):
        counts = {
            "businesses": 0,
            "questionnaires": 0,
            "terms_templates": 0,
            "team_members": 0,
            "clients": 0,
            "services": 0,
            "quotes": 0,
            "jobs": 0,
            "invoices": 0,
        }
        default_password = payload.get("default_password", "SamplePass123!")
        seen_slugs = set()
        seen_emails = set()

        for business_data in payload["businesses"]:
            slug = business_data["slug"]
            if slug in seen_slugs:
                raise ValueError(f"duplicate business slug '{slug}'")
            seen_slugs.add(slug)

            owner = self._create_user(
                business_data["owner"], "MANAGER", default_password, seen_emails
            )
            self._validate_phone(business_data["phone"])
            business = Business.objects.create(
                owner=owner,
                name=business_data["name"],
                slug=slug,
                phone=business_data["phone"],
                email=business_data["email"],
                business_description=business_data["business_description"],
                website=business_data.get("website"),
                street_address=business_data["street_address"],
                city=business_data["city"],
                country=business_data.get("country", "CA"),
                province_state=business_data["province_state"],
                postal_code=business_data["postal_code"],
                business_number=business_data["business_number"],
                tax_rate=business_data.get("tax_rate", "5.00"),
                timezone=business_data.get("timezone", "America/Edmonton"),
            )
            self._set_business_logo(
                business,
                business_data.get("logo"),
                fixture_directory,
                write_files,
            )
            business.services_offered.set(business_data["services_offered"])
            counts["businesses"] += 1

            offered_services = set(business_data["services_offered"])
            template_data = business_data.get("service_templates", [])
            template_names = [item["service_name"] for item in template_data]
            if len(template_names) != len(set(template_names)):
                raise ValueError(f"duplicate service template for '{slug}'")
            if set(template_names) != offered_services:
                raise ValueError(
                    f"service_templates must cover every offered service for '{slug}'"
                )

            # Questionnaire must be created before terms because current model
            # validation rejects a questionnaire when a terms template exists.
            for item in template_data:
                questions = item.get("questions", [])
                if not questions:
                    raise ValueError(
                        f"questionnaire has no questions for '{item['service_name']}'"
                    )
                ServiceQuestionnaire.objects.create(
                    business=business,
                    service_name=item["service_name"],
                    additional_questions_form=questions,
                )
                counts["questionnaires"] += 1

            terms_by_service = {}
            for item in template_data:
                terms = ServiceTermsTemplate.objects.create(
                    business=business,
                    service_name=item["service_name"],
                    content=item["terms_and_conditions"],
                )
                terms_by_service[item["service_name"]] = terms
                counts["terms_templates"] += 1

            team_by_email = {}
            for member_data in business_data.get("team_members", []):
                employee = self._create_user(
                    member_data,
                    member_data.get("role", "EMPLOYEE"),
                    default_password,
                    seen_emails,
                )
                member = TeamMember.objects.create(
                    business=business,
                    employee=employee,
                    job_duties=member_data.get("job_duties", ""),
                    expertise=member_data.get("expertise", ""),
                )
                team_by_email[employee.email] = member
                counts["team_members"] += 1

            client_by_email = {}
            for client_data in business_data.get("clients", []):
                client_user = self._create_user(
                    client_data, "CLIENT", default_password, seen_emails
                )
                client = Client.objects.create(business=business, user=client_user)
                client_by_email[client_user.email] = client
                counts["clients"] += 1

            for service_data in business_data.get("services", []):
                if service_data["service_name"] not in offered_services:
                    raise ValueError(
                        f"service '{service_data['service_name']}' is not offered by '{slug}'"
                    )
                client_email = service_data["client_email"].lower()
                if client_email not in client_by_email:
                    raise ValueError(f"unknown client '{client_email}' for '{slug}'")

                service = Service.objects.create(
                    client=client_by_email[client_email],
                    business=business,
                    service_name=service_data["service_name"],
                    description=service_data.get("description", ""),
                    start_date=timezone.localdate()
                    + timedelta(days=service_data.get("start_in_days", 0)),
                    end_date=timezone.localdate()
                    + timedelta(days=service_data["end_in_days"])
                    if service_data.get("end_in_days") is not None
                    else None,
                    service_type=service_data.get("service_type", "ONE_TIME"),
                    price=service_data["price"],
                    currency=service_data.get("currency", "CAD"),
                    billing_cycle=service_data.get("billing_cycle"),
                    status=service_data.get("status", "PENDING"),
                    street_address=service_data["street_address"],
                    city=service_data["city"],
                    country=service_data.get("country", "CA"),
                    province_state=service_data["province_state"],
                    postal_code=service_data["postal_code"],
                    filled_questionnaire=service_data.get("filled_questionnaire"),
                    auto_generate_quote=service_data.get("auto_generate_quote", False),
                    auto_generate_invoices=service_data.get(
                        "auto_generate_invoices", False
                    ),
                )
                counts["services"] += 1

                job_data_list = service_data.get("jobs", [])
                quote_data = service_data.get("quote")
                if job_data_list and not service.filled_questionnaire:
                    raise ValueError(
                        f"jobs require a completed questionnaire for '{service}'"
                    )
                if job_data_list and (
                    not quote_data or quote_data.get("status") != "SIGNED"
                ):
                    raise ValueError(f"jobs require a signed quote for '{service}'")

                if quote_data:
                    quote_status = quote_data.get("status", "DRAFT")
                    signed_at = None
                    if quote_status in {"SIGNED", "DECLINED"}:
                        signed_at = timezone.now() - timedelta(
                            days=quote_data.get("signed_days_ago", 0)
                        )
                    signature_name = None
                    if quote_status == "SIGNED":
                        if not quote_data.get("signature"):
                            raise ValueError(
                                f"signed quote requires a signature for '{service}'"
                            )
                        signature_name = self._store_fixture_file(
                            quote_data["signature"],
                            fixture_directory,
                            Quote._meta.get_field("signature").storage,
                            "signatures",
                            write_files,
                        )
                    Quote.objects.create(
                        service=service,
                        valid_until=timezone.localdate()
                        + timedelta(days=quote_data.get("valid_for_days", 30)),
                        status=quote_status,
                        signed_at=signed_at,
                        signature=signature_name,
                        general_terms_conditions=terms_by_service[
                            service.service_name
                        ].content,
                        terms_conditions=quote_data.get("additional_terms", ""),
                        notes=quote_data.get("notes", ""),
                    )
                    counts["quotes"] += 1

                for job_data in job_data_list:
                    assigned_email = job_data.get("assigned_to_email")
                    assigned_to = None
                    if assigned_email:
                        assigned_to = team_by_email.get(assigned_email.lower())
                        if not assigned_to:
                            raise ValueError(
                                f"unknown team member '{assigned_email}' for '{slug}'"
                            )
                    scheduled_date = timezone.now() + timedelta(
                        days=job_data.get("scheduled_in_days", 0),
                        hours=job_data.get("scheduled_hour_offset", 0),
                    )
                    completed_at = None
                    if job_data.get("completed_days_ago") is not None:
                        completed_at = timezone.now() - timedelta(
                            days=job_data["completed_days_ago"]
                        )
                    Job.objects.create(
                        service=service,
                        assigned_to=assigned_to,
                        title=job_data["title"],
                        description=job_data.get("description", ""),
                        scheduled_date=scheduled_date,
                        completed_at=completed_at,
                        status=job_data.get("status", "PENDING"),
                    )
                    counts["jobs"] += 1

                invoice_data = service_data.get("invoice")
                if invoice_data:
                    subtotal = Decimal(
                        str(invoice_data.get("subtotal", service_data["price"]))
                    )
                    tax_rate = Decimal(
                        str(invoice_data.get("tax_rate", business.tax_rate))
                    )
                    tax_amount = (subtotal * tax_rate / Decimal("100")).quantize(
                        Decimal("0.01")
                    )
                    paid_at = None
                    if invoice_data.get("status") == "PAID":
                        paid_at = timezone.now() - timedelta(
                            days=invoice_data["paid_days_ago"]
                        )
                    Invoice.objects.create(
                        business=business,
                        client=service.client,
                        service=service,
                        due_date=timezone.localdate()
                        + timedelta(days=invoice_data.get("due_in_days", 14)),
                        status=invoice_data.get("status", "DRAFT"),
                        currency=service.currency,
                        subtotal=subtotal,
                        tax_rate=tax_rate,
                        tax_amount=tax_amount,
                        total_amount=subtotal + tax_amount,
                        notes=invoice_data.get("notes", ""),
                        paid_at=paid_at,
                    )
                    counts["invoices"] += 1

        return counts

    def _update_logos(self, payload, fixture_directory, write_files=True):
        updated = 0
        for business_data in payload["businesses"]:
            try:
                business = Business.all_objects.get(slug=business_data["slug"])
            except Business.DoesNotExist as exc:
                raise ValueError(
                    f"business does not exist: '{business_data['slug']}'"
                ) from exc
            self._set_business_logo(
                business,
                business_data.get("logo"),
                fixture_directory,
                write_files,
            )
            updated += 1
        return {"businesses": updated}

    def _update_phones(self, payload):
        User = get_user_model()
        business_count = 0
        user_count = 0
        for business_data in payload["businesses"]:
            try:
                business = Business.all_objects.get(slug=business_data["slug"])
            except Business.DoesNotExist as exc:
                raise ValueError(
                    f"business does not exist: '{business_data['slug']}'"
                ) from exc

            self._validate_phone(business_data["phone"])
            business.phone = business_data["phone"]
            business.save(update_fields=["phone"])
            business_count += 1

            fixture_users = [
                business_data["owner"],
                *business_data.get("team_members", []),
                *business_data.get("clients", []),
            ]
            for user_data in fixture_users:
                self._validate_phone(user_data["phone"])
                try:
                    user = User.objects.get(email__iexact=user_data["email"])
                except User.DoesNotExist as exc:
                    raise ValueError(
                        f"user does not exist: '{user_data['email']}'"
                    ) from exc
                user.phone = user_data["phone"]
                user.save(update_fields=["phone"])
                user_count += 1

        return {"businesses": business_count, "users": user_count}

    def _set_business_logo(
        self,
        business,
        relative_logo_path,
        fixture_directory,
        write_file,
    ):
        if not relative_logo_path:
            return

        business.logo.name = self._store_fixture_file(
            relative_logo_path,
            fixture_directory,
            business.logo.storage,
            "business_logo",
            write_file,
        )
        business.save(update_fields=["logo"])

    def _store_fixture_file(
        self,
        relative_path,
        fixture_directory,
        storage,
        storage_directory,
        write_file,
    ):
        fixture_directory = fixture_directory.resolve()
        source = (fixture_directory / relative_path).resolve()
        try:
            source.relative_to(fixture_directory)
        except ValueError as exc:
            raise ValueError(
                f"file path must stay inside the fixture directory: '{relative_path}'"
            ) from exc
        if not source.is_file():
            raise ValueError(f"fixture file does not exist: '{relative_path}'")

        stored_name = f"{storage_directory}/{source.name}"
        if write_file and not storage.exists(stored_name):
            with source.open("rb") as fixture_file:
                stored_name = storage.save(stored_name, File(fixture_file))
        return stored_name

    def _create_user(self, data, role, default_password, seen_emails):
        User = get_user_model()
        email = data["email"].lower()
        if email in seen_emails or User.objects.filter(email__iexact=email).exists():
            raise ValueError(f"duplicate user email '{email}'")
        self._validate_phone(data["phone"])
        seen_emails.add(email)
        return User.objects.create_user(
            email=email,
            password=data.get("password", default_password),
            name=data["name"],
            phone=data["phone"],
            role=role,
        )

    def _validate_phone(self, phone):
        if not PHONE_PATTERN.fullmatch(phone):
            raise ValueError(
                f"phone must use '+1 902-555-0501' format: '{phone}'"
            )
