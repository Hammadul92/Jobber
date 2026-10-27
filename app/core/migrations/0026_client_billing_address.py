from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("core", "0025_service_bypass_questionnaire")]

    operations = [
        migrations.AddField(
            model_name="client", name="company_name",
            field=models.CharField(max_length=255, blank=True, default=""),
        ),
        migrations.AddField(
            model_name="client", name="billing_street_address",
            field=models.CharField(max_length=255, blank=True, default=""),
        ),
        migrations.AddField(
            model_name="client", name="billing_city",
            field=models.CharField(max_length=100, blank=True, default=""),
        ),
        migrations.AddField(
            model_name="client", name="billing_province_state",
            field=models.CharField(max_length=100, blank=True, default=""),
        ),
        migrations.AddField(
            model_name="client", name="billing_country",
            field=models.CharField(max_length=2, blank=True, default=""),
        ),
        migrations.AddField(
            model_name="client", name="billing_postal_code",
            field=models.CharField(max_length=20, blank=True, default=""),
        ),
    ]
