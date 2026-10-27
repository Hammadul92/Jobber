from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("core", "0026_client_billing_address")]

    operations = [
        migrations.AddField(
            model_name="service", name="items",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="quote", name="line_items",
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="quote", name="currency",
            field=models.CharField(blank=True, choices=[("CAD", "CAD"), ("USD", "USD")], max_length=3, null=True),
        ),
        migrations.AddField(
            model_name="invoice", name="line_items",
            field=models.JSONField(blank=True, null=True),
        ),
    ]
