from io import StringIO

from django.core.management import call_command
from django.test import TestCase

from core.management.commands.seed_faqs import SEEDED_FAQS
from core.models import FAQ


class SeedFaqsCommandTests(TestCase):
    def test_seed_is_idempotent_and_updates_seeded_content(self):
        call_command("seed_faqs", stdout=StringIO())
        call_command("seed_faqs", stdout=StringIO())

        self.assertEqual(
            FAQ.objects.filter(
                question__in=[question for question, _ in SEEDED_FAQS]
            ).count(),
            len(SEEDED_FAQS),
        )
        self.assertEqual(
            FAQ.objects.get(question=SEEDED_FAQS[0][0]).answer,
            SEEDED_FAQS[0][1],
        )

    def test_remove_preserves_unrelated_faqs(self):
        unrelated = FAQ.objects.create(question="Unrelated question?", answer="Keep me.")
        call_command("seed_faqs", stdout=StringIO())

        call_command("seed_faqs", "--remove", stdout=StringIO())

        self.assertTrue(FAQ.objects.filter(pk=unrelated.pk).exists())
        self.assertFalse(
            FAQ.all_objects.filter(
                question__in=[question for question, _ in SEEDED_FAQS]
            ).exists()
        )

    def test_dry_run_does_not_persist_faqs(self):
        initial_count = FAQ.objects.count()
        call_command("seed_faqs", "--dry-run", stdout=StringIO())

        self.assertEqual(FAQ.objects.count(), initial_count)
        self.assertFalse(
            FAQ.objects.filter(
                question__in=[question for question, _ in SEEDED_FAQS]
            ).exists()
        )
