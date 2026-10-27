from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("core", "0027_service_line_items")]

    operations = [
        migrations.AddField(
            model_name="business",
            name="tax_label",
            field=models.CharField(blank=True, default="", max_length=30),
        ),
        migrations.AddField(
            model_name="quote",
            name="tax_rate",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=4, null=True),
        ),
        migrations.AddField(
            model_name="quote",
            name="tax_label",
            field=models.CharField(blank=True, default="", max_length=30),
        ),
    ]
