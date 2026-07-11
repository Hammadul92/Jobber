from django.core.management.base import BaseCommand
from django.db import transaction

from core.models import FAQ


SEEDED_FAQS = [
    (
        "What is Contractorz?",
        "Contractorz is an operations platform for service businesses. It keeps clients, service questionnaires, terms, quotes, jobs, invoices, payments, and team activity in one connected workflow.",
    ),
    (
        "How does a new client request become a job?",
        "A client is added to a business and completes the relevant service questionnaire. The business then prepares a quote with its terms and conditions. Once the quote is accepted and signed, the approved work can move into job scheduling and assignment.",
    ),
    (
        "Why are service questionnaires required?",
        "Service questionnaires collect the scope, property details, address, and other information a business needs before quoting. This reduces follow-up calls and helps the quote and job reflect the client's actual request.",
    ),
    (
        "How are terms and conditions used?",
        "A business maintains service terms that explain expectations, payment requirements, and other conditions. Applicable terms are included with the quote so the client can review them before signing.",
    ),
    (
        "Can clients review and sign quotes online?",
        "Yes. Clients receive a secure link where they can review the service scope, pricing, and terms and conditions before signing the quote electronically.",
    ),
    (
        "Can I assign jobs to team members?",
        "Yes. Business managers can add team members, assign jobs, and track work status so the office and field team share the same job information.",
    ),
    (
        "How do invoices and online payments work?",
        "Businesses can create invoices for completed client services and share them with clients. When online payment is configured, payment and payout information stays connected to the invoice and underlying service.",
    ),
    (
        "Where can I track payouts?",
        "Authorized business users can review payout status from their dashboard. Each payout remains associated with the related invoice, client, and service for a clearer financial history.",
    ),
    (
        "Can one account manage multiple clients and services?",
        "Yes. A business can manage multiple clients, and each client can have one or more services with separate questionnaires, quotes, jobs, and billing records.",
    ),
    (
        "How do I get help with my Contractorz account?",
        "Use the Contact Us page to send the support team your account or workflow question. Include enough detail about the business and issue so the team can route the request quickly.",
    ),
]


class Command(BaseCommand):
    help = "Seed application-specific public FAQs."

    def add_arguments(self, parser):
        actions = parser.add_mutually_exclusive_group()
        actions.add_argument(
            "--remove",
            action="store_true",
            help="Remove only FAQs managed by this command.",
        )
        actions.add_argument(
            "--dry-run",
            action="store_true",
            help="Validate the operation and roll back database changes.",
        )

    def handle(self, *args, **options):
        with transaction.atomic():
            if options["remove"]:
                count, _ = FAQ.all_objects.filter(
                    question__in=[question for question, _ in SEEDED_FAQS]
                ).delete()
                action = "Removed"
            else:
                count = 0
                for sort_order, (question, answer) in enumerate(SEEDED_FAQS, start=10):
                    faq = FAQ.all_objects.filter(question=question).order_by("id").first()
                    if faq is None:
                        FAQ.objects.create(
                            question=question,
                            answer=answer,
                            sort_order=sort_order,
                            is_active=True,
                        )
                    else:
                        faq.answer = answer
                        faq.sort_order = sort_order
                        faq.is_active = True
                        faq.is_deleted = False
                        faq.deleted_at = None
                        faq.deleted_by = None
                        faq.save()
                    count += 1
                action = "Seeded"

            if options["dry_run"]:
                transaction.set_rollback(True)
                action = "Validated"

        self.stdout.write(self.style.SUCCESS(f"{action} FAQs: {count}"))
