from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("core", "0024_stripe_direct_charges")]

    operations = [
        migrations.AddField(
            model_name="service",
            name="bypass_questionnaire",
            field=models.BooleanField(default=False),
        ),
    ]
