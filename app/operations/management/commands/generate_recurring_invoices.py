"""Create the current period's draft invoice for subscription services.

Run once (for cron) or with --loop to keep running; production starts it with
--loop next to gunicorn. Safe to run repeatedly or in parallel: each service
gets at most one invoice per billing period.
"""
import time

from django.core.management.base import BaseCommand
from django.db import close_old_connections

from operations.recurring_invoices import generate_due_subscription_invoices


class Command(BaseCommand):
    help = "Create draft invoices for subscription services entering a new billing period."

    def add_arguments(self, parser):
        parser.add_argument(
            "--loop",
            action="store_true",
            help="Keep running, checking every --interval seconds.",
        )
        parser.add_argument("--interval", type=int, default=3600)

    def handle(self, *args, loop=False, interval=3600, **options):
        while True:
            if loop:
                # Drop connections that went stale while sleeping.
                close_old_connections()
            try:
                created = generate_due_subscription_invoices()
                if created or not loop:
                    self.stdout.write(f"Created {len(created)} recurring invoice(s).")
            except Exception as exc:  # keep the loop alive through DB hiccups
                if not loop:
                    raise
                self.stderr.write(f"Recurring invoice run failed: {exc}")
            if not loop:
                return
            time.sleep(interval)
