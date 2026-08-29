from django.db import migrations


FAQ_COPY = [
    {
        "question": "What is GetContractorz used for?",
        "answer": (
            "GetContractorz helps service businesses manage client intake, "
            "service questionnaires, quotations, jobs, invoices, Stripe "
            "payments, and connected payment records in one workspace."
        ),
        "sort_order": 1,
    },
    {
        "question": "Can clients approve quotations online?",
        "answer": (
            "Yes. Businesses can send quotations from GetContractorz, and "
            "clients can review and sign them through a secure approval link."
        ),
        "sort_order": 2,
    },
    {
        "question": "Does GetContractorz support service questionnaires?",
        "answer": (
            "Yes. Businesses can create service-specific questionnaires so "
            "clients submit scope, property, address, and requirement details "
            "before work is quoted or scheduled."
        ),
        "sort_order": 3,
    },
    {
        "question": "Can managers and employees track jobs together?",
        "answer": (
            "Yes. GetContractorz keeps managers and employees aligned with "
            "shared job records, assigned work, status updates, service "
            "details, and before-and-after job photos."
        ),
        "sort_order": 4,
    },
    {
        "question": "How do invoices, payments, and payment records work?",
        "answer": (
            "Businesses can create invoices, accept online payments through "
            "Stripe, and review payment status, fees, refunds, and net payment "
            "records connected to the client service."
        ),
        "sort_order": 5,
    },
]


def refresh_public_faq_copy(apps, schema_editor):
    FAQ = apps.get_model("core", "FAQ")
    legacy_questions = {
        1: "What is this platform used for?",
        2: "Can clients approve quotes online?",
        3: "Do you support service questionnaires?",
        4: "Can my team track jobs and updates together?",
        5: "How do payments and payouts work?",
    }

    for faq in FAQ_COPY:
        existing = FAQ.objects.filter(sort_order=faq["sort_order"]).first()
        if existing and existing.question in {legacy_questions[faq["sort_order"]], faq["question"]}:
            existing.question = faq["question"]
            existing.answer = faq["answer"]
            existing.is_active = True
            existing.save(update_fields=["question", "answer", "is_active"])
        elif not existing:
            FAQ.objects.create(**faq)


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0022_serviceoption_catalog"),
    ]

    operations = [
        migrations.RunPython(refresh_public_faq_copy, migrations.RunPython.noop),
    ]
