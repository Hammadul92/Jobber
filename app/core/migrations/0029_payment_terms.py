from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("core", "0028_quote_tax_terms")]

    operations = [
        migrations.AddField(
            model_name="business", name="default_payment_terms",
            field=models.CharField(choices=[
                ("UPFRONT", "Due on Receipt"),
                ("NET_15", "Net 15 days"),
                ("NET_30", "Net 30 days"),
            ], default="NET_15", max_length=10),
        ),
        migrations.AddField(
            model_name="quote", name="payment_terms",
            field=models.CharField(blank=True, choices=[
                ("UPFRONT", "Due on Receipt"),
                ("NET_15", "Net 15 days"),
                ("NET_30", "Net 30 days"),
            ], max_length=10, null=True),
        ),
        migrations.AddField(
            model_name="invoice", name="payment_terms",
            field=models.CharField(blank=True, choices=[
                ("UPFRONT", "Due on Receipt"),
                ("NET_15", "Net 15 days"),
                ("NET_30", "Net 30 days"),
            ], max_length=10, null=True),
        ),
        migrations.AddField(
            model_name="invoice", name="sent_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="invoice", name="due_date",
            field=models.DateField(blank=True, null=True),
        ),
    ]
