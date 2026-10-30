"""
Aggregated numbers for the business dashboard and its to-do list.

Every figure is computed in the database over the full set of records the
user can see, scoped by the same get_queryset the list endpoints use, so the
dashboard never disagrees with the tables. Each endpoint runs a fixed number
of queries regardless of how many rows exist.
"""

from datetime import datetime, timedelta

import pytz
from django.db.models import Count, Exists, F, OuterRef, Q, Sum, Window
from django.db.models.functions import Coalesce, TruncMonth, TruncWeek, TruncYear
from django.utils import timezone
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import (
    BankingInformation,
    Business,
    Invoice,
    Quote,
    ServiceQuestionnaire,
    ServiceTermsTemplate,
)
from core.payment_terms import business_local_date
from finance.views import InvoiceViewSet
from operations.views import (
    ClientViewSet,
    JobViewSet,
    QuoteViewSet,
    ServiceViewSet,
    TeamMemberViewSet,
)

MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
CHART_RANGES = ("monthly", "weekly", "yearly")
WEEKS_IN_CHART = 8
YEARS_IN_CHART = 6
UPCOMING_JOBS_LIMIT = 3
RECENT_RECORDS_LIMIT = 5
RECENT_ACTIVITY_LIMIT = 10
TODO_LIMIT = 100

EMPTY_ANSWERS = Q(filled_questionnaire__isnull=True) | Q(filled_questionnaire={}) | Q(filled_questionnaire=[])
CLOSED_STATUSES = ("COMPLETED", "CANCELLED")


def scoped(viewset_class, request):
    """Return the list queryset a viewset would serve this user, unordered."""
    view = viewset_class(request=request, action="list", args=(), kwargs={}, format_kwarg=None)
    return view.get_queryset().order_by()


def dashboard_timezone(user):
    """The timezone of the business the user works with (UTC for admins)."""
    lookup = {
        "MANAGER": {"owner": user},
        "CLIENT": {"clients__user": user},
        "EMPLOYEE": {"team_members__employee": user, "team_members__is_active": True},
    }.get(user.role)
    name = None
    if lookup:
        name = Business.objects.filter(**lookup).order_by("-id").values_list("timezone", flat=True).first()
    try:
        return pytz.timezone(name or "UTC")
    except pytz.UnknownTimeZoneError:
        return pytz.UTC


def local_start(tz, year, month=1, day=1):
    return tz.localize(datetime(year, month, day))


def shift_month(year, month, delta):
    index = year * 12 + month - 1 + delta
    return index // 12, index % 12 + 1


def local_week_start(now_local, tz, weeks_back=0):
    """Monday 00:00 local time, `weeks_back` weeks before the current week."""
    monday = now_local.date() - timedelta(days=now_local.weekday(), weeks=weeks_back)
    return local_start(tz, monday.year, monday.month, monday.day)


def money(value):
    return float(value or 0)


def window_counts(field, current_start, current_end, previous_start, previous_end, extra=None):
    """Count rows whose `field` falls in this month so far and in last month."""
    base = extra or Q()
    return {
        "current": Count("id", filter=base & Q(**{f"{field}__gte": current_start, f"{field}__lte": current_end})),
        "previous": Count("id", filter=base & Q(**{f"{field}__gte": previous_start, f"{field}__lt": previous_end})),
    }


def revenue_buckets(chart_range, now_local, tz):
    """Return (truncate function, first bucket start, [(key, label)])."""
    if chart_range == "weekly":
        starts = [local_week_start(now_local, tz, weeks_back) for weeks_back in range(WEEKS_IN_CHART - 1, -1, -1)]
        return TruncWeek, starts[0], [
            (start.date(), f"{MONTH_LABELS[start.month - 1]} {start.day}") for start in starts
        ]
    if chart_range == "yearly":
        years = range(now_local.year - YEARS_IN_CHART + 1, now_local.year + 1)
        return TruncYear, local_start(tz, years[0]), [(local_start(tz, year).date(), str(year)) for year in years]
    return TruncMonth, local_start(tz, now_local.year), [
        (local_start(tz, now_local.year, month).date(), MONTH_LABELS[month - 1]) for month in range(1, 13)
    ]


def revenue_series(invoices, chart_range, now_local, tz):
    """Billed (all invoices by creation) and collected (paid) totals per period."""
    trunc, start, buckets = revenue_buckets(chart_range, now_local, tz)
    billed = (
        invoices.filter(created_at__gte=start)
        .annotate(period=trunc("created_at", tzinfo=tz))
        .values("period")
        .annotate(total=Sum("total_amount"))
    )
    collected = (
        invoices.filter(status="PAID")
        .annotate(collected_at=Coalesce("paid_at", "updated_at"))
        .filter(collected_at__gte=start)
        .annotate(period=trunc("collected_at", tzinfo=tz))
        .values("period")
        .annotate(total=Sum("total_amount"))
    )

    def by_period(rows):
        return {row["period"].astimezone(tz).date(): row["total"] for row in rows}

    billed_totals = by_period(billed)
    collected_totals = by_period(collected)
    return [
        {"label": label, "revenue": money(billed_totals.get(key)), "collected": money(collected_totals.get(key))}
        for key, label in buckets
    ]


def local_text(value, tz):
    """Format a datetime the way BusinessTimezoneMixin serializers do."""
    if not value:
        return None
    return value.astimezone(tz).strftime("%Y-%m-%d %H:%M:%S")


def zone(name, fallback):
    try:
        return pytz.timezone(name) if name else fallback
    except pytz.UnknownTimeZoneError:
        return fallback


class DashboardView(APIView):
    """Stats, revenue chart and recent records for the dashboard home page."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        chart_range = str(request.query_params.get("range", "monthly")).lower()
        if chart_range not in CHART_RANGES:
            chart_range = "monthly"

        tz = dashboard_timezone(request.user)
        now = timezone.now()
        now_local = now.astimezone(tz)
        month_start = local_start(tz, now_local.year, now_local.month)
        previous_month_start = local_start(tz, *shift_month(now_local.year, now_local.month, -1))
        previous_week_start = local_week_start(now_local, tz, weeks_back=1)
        month = (month_start, now, previous_month_start, month_start)

        clients = scoped(ClientViewSet, request)
        team_members = scoped(TeamMemberViewSet, request)
        services = scoped(ServiceViewSet, request)
        quotes = scoped(QuoteViewSet, request)
        jobs = scoped(JobViewSet, request)
        invoices = scoped(InvoiceViewSet, request)

        client_stats = clients.aggregate(total=Count("id"), **window_counts("created_at", *month))
        team_stats = team_members.aggregate(total=Count("id"), **window_counts("joined_at", *month))
        open_quotes = Q(status__in=("DRAFT", "SENT"))
        quote_stats = quotes.aggregate(
            total=Count("id", filter=open_quotes),
            **window_counts("created_at", *month, extra=open_quotes),
        )
        in_progress = Q(status="IN_PROGRESS")
        job_stats = jobs.aggregate(
            **{status.lower(): Count("id", filter=Q(status=status)) for status in (
                "IN_PROGRESS", "PENDING", "COMPLETED", "CANCELLED"
            )},
            **window_counts("scheduled_date", *month, extra=in_progress),
        )
        # Unpaid invoices are compared by due date, revenue by the day it was paid.
        unpaid = Q(status__in=("DRAFT", "SENT"))
        paid = Q(status="PAID")
        today = now_local.date()
        invoice_stats = invoices.annotate(collected_at=Coalesce("paid_at", "updated_at")).aggregate(
            unpaid=Count("id", filter=~Q(status__in=("PAID", "CANCELLED"))),
            unpaid_current=Count("id", filter=unpaid & Q(due_date__gte=month_start.date(), due_date__lte=today)),
            unpaid_previous=Count(
                "id", filter=unpaid & Q(due_date__gte=previous_month_start.date(), due_date__lt=month_start.date())
            ),
            revenue_current=Sum("total_amount", filter=paid & Q(collected_at__gte=month_start)),
            revenue_previous=Sum(
                "total_amount", filter=paid & Q(collected_at__gte=previous_month_start, collected_at__lt=month_start)
            ),
        )
        answered = services.exclude(EMPTY_ANSWERS)
        questionnaire_stats = answered.aggregate(
            new=Count("id", filter=Q(updated_at__gte=previous_week_start)),
            pending=Count("id", filter=Q(status="PENDING")),
            done=Count("id", filter=Q(status__in=("ACTIVE", "COMPLETED"))),
        )

        return Response({
            "timezone": tz.zone,
            "stats": {
                "clients": self._stat(client_stats["total"], client_stats),
                "active_jobs": self._stat(job_stats["in_progress"], job_stats),
                "pending_quotes": self._stat(quote_stats["total"], quote_stats),
                "unpaid_invoices": self._stat(invoice_stats["unpaid"], {
                    "current": invoice_stats["unpaid_current"], "previous": invoice_stats["unpaid_previous"],
                }),
                "team_members": self._stat(team_stats["total"], team_stats),
                "monthly_revenue": {
                    "value": money(invoice_stats["revenue_current"]),
                    "current": money(invoice_stats["revenue_current"]),
                    "previous": money(invoice_stats["revenue_previous"]),
                },
            },
            "revenue": {"range": chart_range, "series": revenue_series(invoices, chart_range, now_local, tz)},
            "job_status": {
                status: job_stats[status.lower()] for status in ("IN_PROGRESS", "PENDING", "COMPLETED", "CANCELLED")
            },
            "questionnaires": questionnaire_stats,
            "upcoming_jobs": self._upcoming_jobs(jobs, tz),
            "recent_quotes": self._recent_quotes(quotes),
            "recent_invoices": self._recent_invoices(invoices),
            "recent_activity": self._recent_activity(clients, quotes, invoices),
        })

    @staticmethod
    def _stat(value, windows):
        return {"value": value, "current": windows["current"], "previous": windows["previous"]}

    @staticmethod
    def _upcoming_jobs(jobs, tz):
        rows = (
            jobs.exclude(status__in=CLOSED_STATUSES)
            .order_by("scheduled_date", "id")
            .values(
                "id", "title", "status", "scheduled_date",
                service_name=F("service__service_name"),
                assigned_to_name=F("assigned_to__employee__name"),
                business_timezone=F("service__business__timezone"),
            )[:UPCOMING_JOBS_LIMIT]
        )
        return [
            {
                **{key: value for key, value in row.items() if key != "business_timezone"},
                "scheduled_date": local_text(row["scheduled_date"], zone(row["business_timezone"], tz)),
            }
            for row in rows
        ]

    @staticmethod
    def _recent_quotes(quotes):
        return list(
            quotes.order_by("-updated_at", "-id")
            .values(
                "id", "quote_number", "status", "created_at", "service_id",
                client_id=F("service__client_id"),
                client_name=F("service__client__name"),
                service_name=F("service__service_name"),
                amount=F("service__price"),
                amount_currency=Coalesce("currency", "service__currency"),
            )[:RECENT_RECORDS_LIMIT]
        )

    @staticmethod
    def _recent_invoices(invoices):
        return list(
            invoices.order_by("-updated_at", "-id")
            .values(
                "id", "invoice_number", "status", "due_date", "total_amount", "currency",
                "client_id", "service_id",
                client_name=F("client__name"),
                service_name=F("service__service_name"),
            )[:RECENT_RECORDS_LIMIT]
        )

    @staticmethod
    def _recent_activity(clients, quotes, invoices):
        """The newest client sign-ups, sent/approved quotes and sent/paid invoices."""
        items = [
            {
                "id": f"client-{row['id']}",
                "title": "New client added",
                "description": f"{row['name']} registered",
                "to": f"/user/business/client/{row['id']}",
                "date": row["created_at"],
            }
            for row in clients.order_by("-created_at", "-id").values("id", "name", "created_at")[
                :RECENT_ACTIVITY_LIMIT
            ]
        ]
        items += [
            {
                "id": f"quote-{row['id']}",
                "title": "Quote approved" if row["status"] == "SIGNED" else "Quote sent",
                "description": f"{row['quote_number']} for {row['client_name']}",
                "to": f"/user/business/quote/{row['id']}",
                "date": row["updated_at"],
            }
            for row in quotes.filter(status__in=("SIGNED", "SENT"))
            .order_by("-updated_at", "-id")
            .values("id", "status", "quote_number", "updated_at", client_name=F("service__client__name"))[
                :RECENT_ACTIVITY_LIMIT
            ]
        ]
        items += [
            {
                "id": f"invoice-{row['id']}",
                "title": "Invoice paid" if row["status"] == "PAID" else "Invoice sent",
                "description": f"{row['invoice_number']} for {row['client_name']}",
                "to": f"/user/business/invoice/{row['id']}",
                "date": row["activity_at"],
            }
            for row in invoices.filter(status__in=("PAID", "SENT"))
            .annotate(activity_at=Coalesce("paid_at", "updated_at"))
            .order_by("-activity_at", "-id")
            .values("id", "status", "invoice_number", "activity_at", client_name=F("client__name"))[
                :RECENT_ACTIVITY_LIMIT
            ]
        ]
        items.sort(key=lambda item: item["date"], reverse=True)
        return items[:RECENT_ACTIVITY_LIMIT]


def todo(todo_id, title, description, to, kind, priority="normal"):
    return {"id": todo_id, "title": title, "description": description, "to": to, "type": kind, "priority": priority}


def limited(qs, *fields, **expressions):
    """Up to TODO_LIMIT rows plus the full match count, in one query."""
    rows = list(
        qs.annotate(match_count=Window(Count("id"))).order_by("-id")
        .values(*fields, "match_count", **expressions)[:TODO_LIMIT]
    )
    return rows, (rows[0]["match_count"] if rows else 0)


class DashboardTodosView(APIView):
    """Pending setup and follow-up tasks for a business owner."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        business = Business.objects.filter(owner=user).order_by("-id").first() if user.role == "MANAGER" else None
        if business is None:
            return Response({"count": 0, "items": []})

        items, total = self._setup_todos(business)

        services = scoped(ServiceViewSet, request).exclude(status__in=CLOSED_STATUSES)
        quotes = scoped(QuoteViewSet, request)
        invoices = scoped(InvoiceViewSet, request)
        jobs = scoped(JobViewSet, request)
        service_fields = ("id", "service_name", "client_id")
        service_expressions = {"client_name": F("client__name")}

        def add(rows_and_count, build):
            nonlocal total
            rows, count = rows_and_count
            items.extend(build(row) for row in rows)
            total += count

        add(
            limited(services.filter(EMPTY_ANSWERS, bypass_questionnaire=False), *service_fields, **service_expressions),
            lambda row: todo(
                f"service-questionnaire-response:{row['id']}",
                f"Collect questionnaire for {row['service_name'] or 'Service'}",
                f"{row['client_name'] or 'client'} still needs to complete the service questionnaire.",
                self._client_link(row), "Client",
            ),
        )

        live_quotes = Quote.objects.filter(service=OuterRef("pk"), is_active=True)
        add(
            limited(
                services.filter(Q(bypass_questionnaire=True) | ~EMPTY_ANSWERS, auto_generate_quote=True)
                .exclude(Exists(live_quotes.exclude(status="DECLINED"))),
                *service_fields, **service_expressions,
            ),
            lambda row: todo(
                f"quote-missing:{row['id']}",
                f"Create quote for {row['service_name'] or 'Service'}",
                f"{row['client_name'] or 'client'} is ready for a quote, but no active quote exists yet.",
                self._client_link(row), "Quote", "high",
            ),
        )

        add(
            limited(
                services.filter(
                    Exists(live_quotes.filter(status="SIGNED")),
                    status__in=("PENDING", "ACTIVE", "IN_PROGRESS"),
                    auto_generate_invoices=True,
                ).exclude(Exists(
                    Invoice.objects.filter(service=OuterRef("pk"), is_active=True).exclude(status="CANCELLED")
                )),
                *service_fields, **service_expressions,
            ),
            lambda row: todo(
                f"invoice-missing:{row['id']}",
                f"Create invoice for {row['service_name'] or 'Service'}",
                f"{row['client_name'] or 'client'}'s quote is signed and the service is active.",
                "/user/business/invoices", "Invoice", "high",
            ),
        )

        add(
            limited(
                quotes.filter(status__in=("DRAFT", "SENT")), "id", "status", "quote_number",
                service_name=F("service__service_name"), client_name=F("service__client__name"),
            ),
            self._quote_todo,
        )

        add(
            limited(
                invoices.exclude(status__in=("PAID", "CANCELLED")).filter(
                    due_date__lt=business_local_date(business)
                ),
                "id", "invoice_number", client_name=F("client__name"), service_name=F("service__service_name"),
            ),
            lambda row: todo(
                f"invoice-overdue:{row['id']}",
                f"Follow up on {row['invoice_number'] or 'invoice'}",
                f"{row['client_name'] or 'Client'} has an overdue invoice for {row['service_name'] or 'a service'}.",
                f"/user/business/invoice/{row['id']}", "Payment", "high",
            ),
        )

        add(
            limited(
                jobs.exclude(status__in=CLOSED_STATUSES).filter(assigned_to__isnull=True),
                "id", "title", service_name=F("service__service_name"),
            ),
            lambda row: todo(
                f"job-unassigned:{row['id']}",
                f"Assign {row['title'] or row['service_name'] or 'job'}",
                "This job needs a team member before work can be tracked.",
                f"/user/business/job/{row['id']}", "Job",
            ),
        )

        items.sort(key=lambda item: (item["priority"] != "high", item["title"].lower()))
        return Response({"count": total, "items": items[:TODO_LIMIT]})

    @staticmethod
    def _setup_todos(business):
        """Offered services, their questionnaires and terms, and payout banking."""
        offered = [name.strip() for name in business.services_offered.names() if name and name.strip()]
        with_questionnaire = {
            name.strip().lower() for name in ServiceQuestionnaire.objects.filter(
                business__owner=business.owner, is_active=True,
            ).values_list("service_name", flat=True)
        }
        with_terms = {
            name.strip().lower() for name in ServiceTermsTemplate.objects.filter(
                business__owner=business.owner, is_active=True,
            ).values_list("service_name", flat=True)
        }
        has_banking = BankingInformation.objects.filter(
            business=business, client__isnull=True, is_active=True,
        ).exists()

        items = []
        if not offered:
            items.append(todo(
                "business:offered-services", "Add offered services",
                "Choose the services this business provides so client services can be created.",
                "/user/business", "Setup", "high",
            ))
        for name in dict.fromkeys(offered):
            key = name.lower()
            if key not in with_questionnaire:
                items.append(todo(
                    f"questionnaire:{key}", f"Create questionnaire for {name}",
                    "Clients must complete a questionnaire before this service can become active.",
                    "/user/business/service-questionnaires", "Setup", "high",
                ))
            if key not in with_terms:
                items.append(todo(
                    f"terms:{key}", f"Create terms for {name}",
                    "General terms are required and will be included with every quote for this service.",
                    "/user/business/terms-and-conditions", "Setup", "high",
                ))
        if not has_banking:
            items.append(todo(
                "banking:business-payout", "Connect business banking",
                "Payments and payout flow need an active business Stripe/bank connection.",
                "/user/banking", "Payment",
            ))
        return items, len(items)

    @staticmethod
    def _client_link(row):
        if row["client_id"]:
            return f"/user/business/client/{row['client_id']}/services"
        return "/user/business/services"

    @staticmethod
    def _quote_todo(row):
        number = row["quote_number"] or "quote"
        if row["status"] == "DRAFT":
            return todo(
                f"quote-draft:{row['id']}", f"Send {number}",
                f"{row['service_name'] or 'Service'} quote for {row['client_name'] or 'client'} is still a draft.",
                f"/user/business/quote/{row['id']}", "Quote",
            )
        return todo(
            f"quote-sent:{row['id']}", f"Await signature for {number}",
            f"{row['client_name'] or 'Client'} has not signed this quote yet.",
            f"/user/business/quote/{row['id']}", "Quote",
        )
