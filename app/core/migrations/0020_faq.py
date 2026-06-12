from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


def seed_initial_faqs(apps, schema_editor):
    FAQ = apps.get_model("core", "FAQ")

    faqs = [
        {
            "question": "What is this platform used for?",
            "answer": (
                "Contractorz helps service businesses manage intake, quotes, "
                "jobs, invoices, payouts, and client communication in one place."
            ),
            "sort_order": 1,
        },
        {
            "question": "Can clients approve quotes online?",
            "answer": (
                "Yes. You can send quotes from the platform and clients can "
                "review and sign them through a secure link."
            ),
            "sort_order": 2,
        },
        {
            "question": "Do you support service questionnaires?",
            "answer": (
                "Yes. Businesses can create service-specific questionnaires so "
                "clients submit the job details you need before work begins."
            ),
            "sort_order": 3,
        },
        {
            "question": "Can my team track jobs and updates together?",
            "answer": (
                "Yes. Contractorz keeps office staff and field teams aligned "
                "with shared job records, statuses, and service details."
            ),
            "sort_order": 4,
        },
        {
            "question": "How do payments and payouts work?",
            "answer": (
                "You can track invoices, save payment methods, and connect "
                "Stripe for payout workflows directly inside the platform."
            ),
            "sort_order": 5,
        },
    ]

    for faq in faqs:
        FAQ.objects.create(**faq)


def remove_seeded_faqs(apps, schema_editor):
    FAQ = apps.get_model("core", "FAQ")
    FAQ.objects.filter(sort_order__in=[1, 2, 3, 4, 5]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0019_user_photo"),
    ]

    operations = [
        migrations.CreateModel(
            name="FAQ",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("is_deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("question", models.CharField(max_length=255)),
                ("answer", models.TextField()),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "deleted_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="deleted_faq_records",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["sort_order", "id"],
            },
        ),
        migrations.RunPython(seed_initial_faqs, remove_seeded_faqs),
    ]
