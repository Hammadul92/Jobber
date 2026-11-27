from django.test import TestCase
from rest_framework.test import APIClient
from core.models import User
from .models import PlatformEvent, NotificationRead, NotificationState


class NotificationTests(TestCase):
    path = "/api/super-admin/notifications/"

    def test_real_record_action_creates_a_linked_notification(self):
        response = self.client.post(
            "/api/super-admin/actions/faqs/",
            {
                "question": "Notification integration check",
                "answer": "Test answer",
                "sort_order": 0,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        notification = next(
            item
            for item in self.client.get(self.path).data["results"]
            if item["description"] == "Notification integration check"
        )
        self.assertEqual(notification["to"], "/super-admin/faqs/%s" % response.data["id"])
        self.assertEqual(
            self.client.get("/api/super-admin/records/faqs/%s/" % response.data["id"]).status_code,
            200,
        )

    def test_actor_labels_do_not_add_queries_per_notification(self):
        from django.db import connection
        from django.test.utils import CaptureQueriesContext

        with CaptureQueriesContext(connection) as small:
            self.client.get(self.path)
        PlatformEvent.objects.bulk_create(
            [
                PlatformEvent(entity="email", entity_id=0, operation="accepted", actor=self.admin)
                for _ in range(20)
            ]
        )
        with CaptureQueriesContext(connection) as large:
            self.client.get(self.path)
        self.assertEqual(len(small), len(large))

    def setUp(self):
        self.admin = User.objects.create_user(
            "notify-admin@example.test", "password", is_superuser=True
        )
        self.other = User.objects.create_user(
            "notify-other@example.test", "password", is_superuser=True
        )
        self.regular = User.objects.create_user(
            "notify-user@example.test", "password", name="Notification User", is_staff=True
        )
        PlatformEvent.objects.all().delete()
        self.first = PlatformEvent.objects.create(
            entity="user", entity_id=self.regular.pk, operation="created"
        )
        self.second = PlatformEvent.objects.create(entity="email", entity_id=0, operation="failed")
        self.client = APIClient()
        self.client.force_login(self.admin)

    def test_feed_and_individual_read_are_persistent_and_private(self):
        initial = self.client.get(self.path).data
        self.assertEqual(initial["unread_count"], 2)
        self.assertEqual(initial["through"], self.second.pk)
        user_event = next(item for item in initial["results"] if item["id"] == self.first.pk)
        self.assertEqual(user_event["to"], "/super-admin/users/%s" % self.regular.pk)
        self.assertEqual(user_event["description"], "Notification User")
        self.assertEqual(NotificationState.objects.count(), 0)
        response = self.client.post(
            self.path, {"operation": "read", "id": self.first.pk}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["unread_count"], 1)
        self.assertEqual(self.client.get(self.path).data["unread_count"], 1)
        self.client.post(self.path, {"operation": "read", "id": self.first.pk}, format="json")
        self.assertEqual(NotificationRead.objects.count(), 1)
        self.client.force_login(self.other)
        self.assertEqual(self.client.get(self.path).data["unread_count"], 2)
        self.client.force_login(self.admin)
        self.assertEqual(self.client.get(self.path).data["unread_count"], 1)

    def test_mark_all_does_not_swallow_new_notifications(self):
        through = self.client.get(self.path).data["through"]
        new = PlatformEvent.objects.create(entity="email", entity_id=0, operation="failed")
        response = self.client.post(
            self.path, {"operation": "read_all", "through": through}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["unread_count"], 1)
        self.assertEqual(response.data["results"][0]["id"], new.pk)
        response = self.client.post(
            self.path, {"operation": "read_all", "through": new.pk}, format="json"
        )
        self.assertEqual(response.data["unread_count"], 0)
        self.client.post(self.path, {"operation": "read_all", "through": through}, format="json")
        self.assertEqual(self.client.get(self.path).data["unread_count"], 0)
        PlatformEvent.objects.create(entity="email", entity_id=0, operation="accepted")
        self.assertEqual(self.client.get(self.path).data["unread_count"], 1)

    def test_feed_cap_does_not_undercount_unread(self):
        PlatformEvent.objects.bulk_create(
            [PlatformEvent(entity="email", entity_id=0, operation="accepted") for _ in range(55)]
        )
        data = self.client.get(self.path).data
        self.assertEqual(len(data["results"]), 50)
        self.assertEqual(data["unread_count"], 57)

    def test_invalid_actions_and_references(self):
        for payload in (
            {"operation": "delete"},
            {"operation": "read"},
            {"operation": "read", "id": -1},
            {"operation": "read_all", "through": self.second.pk + 1000},
        ):
            self.assertEqual(self.client.post(self.path, payload, format="json").status_code, 400)
        self.assertEqual(
            self.client.post(
                self.path, {"operation": "read", "id": self.second.pk + 1000}, format="json"
            ).status_code,
            404,
        )

    def test_access_and_csrf(self):
        self.client.logout()
        self.assertEqual(self.client.get(self.path).status_code, 403)
        self.client.force_login(self.regular)
        self.assertEqual(self.client.get(self.path).status_code, 403)
        self.client.force_login(self.admin)
        self.admin.is_active = False
        self.admin.save()
        self.assertEqual(self.client.get(self.path).status_code, 403)
        client = APIClient(enforce_csrf_checks=True)
        client.force_login(self.other)
        self.assertEqual(
            client.post(
                self.path, {"operation": "read", "id": self.first.pk}, format="json"
            ).status_code,
            403,
        )
        self.assertFalse(NotificationRead.objects.exists())

    def test_empty_state_and_removed_target_fallback(self):
        PlatformEvent.objects.all().delete()
        self.assertEqual(self.client.get(self.path).data["unread_count"], 0)
        event = PlatformEvent.objects.create(
            entity="service", entity_id=999999, operation="updated", summary={"is_deleted": True}
        )
        item = self.client.get(self.path).data["results"][0]
        self.assertEqual(item["title"], "Deleted service")
        self.assertEqual(item["to"], "/super-admin/activity/%s" % event.pk)
