from django.db import migrations
from django.utils.text import slugify


INITIAL_SERVICE_OPTIONS = [
    "Appliance Repair",
    "Carpet Cleaning",
    "Cleaning",
    "Construction",
    "Electrical",
    "Electrical Repair",
    "EV Charger Installation",
    "Flooring",
    "Handyman Services",
    "Heat Pump Installation",
    "Home Cleaning",
    "HVAC",
    "HVAC Maintenance",
    "Janitorial Cleaning",
    "Landscape Design",
    "Landscaping",
    "Lawn Care",
    "Moving Services",
    "Painting",
    "Pest Control",
    "Plumbing",
    "Plumbing Repair",
    "Pool Service",
    "Pressure Washing",
    "Renovations",
    "Residential Cleaning",
    "Roofing",
    "Siding",
    "Snow Removal",
    "Tree Care",
    "Water Heater Service",
    "Window Cleaning",
    "Windows & Doors",
]


def seed_service_options(apps, schema_editor):
    Tag = apps.get_model("taggit", "Tag")
    for name in INITIAL_SERVICE_OPTIONS:
        Tag.objects.get_or_create(name=name, defaults={"slug": slugify(name)})


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0021_servicetermstemplate_quote_general_terms"),
        ("taggit", "0005_auto_20220424_2025"),
    ]

    operations = [
        migrations.CreateModel(
            name="ServiceOption",
            fields=[],
            options={
                "verbose_name": "Service option",
                "verbose_name_plural": "Service options",
                "proxy": True,
                "indexes": [],
                "constraints": [],
            },
            bases=("taggit.tag",),
        ),
        migrations.RunPython(seed_service_options, migrations.RunPython.noop),
    ]
