from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0036_remove_usedlogintoken"),
    ]

    operations = [
        migrations.AddField(
            model_name="quote",
            name="revision",
            field=models.PositiveIntegerField(default=1),
        ),
        migrations.AddField(
            model_name="quote",
            name="revision_required",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="quote",
            name="signed_snapshot",
            field=models.JSONField(blank=True, null=True),
        ),
    ]
