from django.db import migrations


def copy_deactivations(apps, schema_editor):
    """Client deactivation used to disable the shared login account."""
    Client = apps.get_model("core", "Client")
    Client.objects.filter(user__is_active=False, user__role="CLIENT").update(is_active=False)


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0031_remove_businessemail'),
    ]

    operations = [
        migrations.RunPython(copy_deactivations, migrations.RunPython.noop),
    ]
