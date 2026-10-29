"""Data migrations that carry existing records into new fields."""
from decimal import Decimal

from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase


class MigrationTestCase(TransactionTestCase):
    migrate_from = None
    migrate_to = None

    def setUp(self):
        executor = MigrationExecutor(connection)
        executor.migrate([("core", self.migrate_from)])
        self.apps = executor.loader.project_state([("core", self.migrate_from)]).apps

    def migrate(self):
        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate([("core", self.migrate_to)])
        return executor.loader.project_state([("core", self.migrate_to)]).apps

    def tearDown(self):
        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate(executor.loader.graph.leaf_nodes())


class ClientDetailsMigrationTests(MigrationTestCase):
    migrate_from = "0033_usedlogintoken"
    migrate_to = "0034_client_name_phone"

    def test_clients_start_with_account_name_and_phone(self):
        User = self.apps.get_model("core", "User")
        Business = self.apps.get_model("core", "Business")
        Client = self.apps.get_model("core", "Client")
        owner = User.objects.create(email="owner@example.com", name="Owner", phone="1")
        person = User.objects.create(email="client@example.com", name="Alan", phone="555")
        business = Business.objects.create(owner=owner, name="Biz", slug="biz", phone="1")
        client = Client.objects.create(business=business, user=person)

        apps = self.migrate()
        client = apps.get_model("core", "Client").objects.get(pk=client.pk)
        self.assertEqual((client.name, client.phone), ("Alan", "555"))


class PayoutRefundMigrationTests(MigrationTestCase):
    migrate_from = "0034_client_name_phone"
    migrate_to = "0035_payout_refunds"

    def test_past_refunds_are_recorded_and_partial_ones_reopened(self):
        User = self.apps.get_model("core", "User")
        Business = self.apps.get_model("core", "Business")
        Client = self.apps.get_model("core", "Client")
        Invoice = self.apps.get_model("core", "Invoice")
        Payout = self.apps.get_model("core", "Payout")
        owner = User.objects.create(email="owner@example.com", name="Owner", phone="1")
        person = User.objects.create(email="client@example.com", name="Alan", phone="555")
        business = Business.objects.create(owner=owner, name="Biz", slug="biz", phone="1")
        client = Client.objects.create(business=business, user=person, name="Alan")
        invoice = Invoice.objects.create(
            business=business, client=client, invoice_number="INV-1", status="PAID",
            subtotal=100, tax_rate=0, tax_amount=0, total_amount=100,
        )
        common = dict(business=business, invoice=invoice, amount=Decimal("100.00"), is_refunded=True,
                      status="REFUNDED")
        partial = Payout.objects.create(stripe_refund_id="re_partial", refunded_amount=Decimal("40.00"), **common)
        full = Payout.objects.create(stripe_refund_id="re_full", refunded_amount=Decimal("100.00"), **common)

        apps = self.migrate()
        Payout = apps.get_model("core", "Payout")
        PayoutRefund = apps.get_model("core", "PayoutRefund")
        partial = Payout.objects.get(pk=partial.pk)
        full = Payout.objects.get(pk=full.pk)
        self.assertEqual((partial.status, partial.is_refunded), ("PARTIALLY_REFUNDED", False))
        self.assertEqual((full.status, full.is_refunded), ("REFUNDED", True))
        self.assertEqual(PayoutRefund.objects.get(stripe_refund_id="re_partial").amount, Decimal("40.00"))
        self.assertEqual(PayoutRefund.objects.filter(status="SUCCEEDED").count(), 2)
