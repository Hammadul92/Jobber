from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("core", "0023_refresh_public_faq_copy")]

    operations = [
        migrations.AddField(
            model_name="bankinginformation",
            name="stripe_connect_v2",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="bankinginformation",
            name="stripe_charges_enabled",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="bankinginformation",
            name="stripe_payouts_enabled",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="payout",
            name="stripe_account_id",
            field=models.CharField(
                max_length=255, blank=True, default="",
                help_text="Account owning the direct charge; blank for legacy platform charges.",
            ),
        ),
    ]
