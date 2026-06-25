from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0020_faq"),
    ]

    operations = [
        migrations.CreateModel(
            name="ServiceTermsTemplate",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("is_deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("service_name", models.CharField(help_text="Name of the service this terms template is for", max_length=100)),
                ("content", models.TextField(help_text="Reusable general terms and conditions for this service")),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("business", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="service_terms_templates", to="core.business")),
                ("deleted_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="deleted_servicetermstemplate_records", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["business", "service_name"],
            },
        ),
        migrations.AddField(
            model_name="quote",
            name="general_terms_conditions",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="quote",
            name="terms_conditions",
            field=models.TextField(blank=True, null=True),
        ),
    ]
