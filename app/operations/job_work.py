"""Job lifecycle and hours worked.

A job is started (status IN_PROGRESS, ``started_at`` stamped) and later
completed (``completed_at`` stamped). On completion every assignee is credited
with the elapsed time unless hours were given for them explicitly. Hours are
attributed to the day the job was completed, in the business's timezone.
"""
from datetime import timedelta
from decimal import ROUND_HALF_UP, Decimal

import pytz
from django.db import transaction
from django.db.models import Sum
from django.db.models.functions import TruncDate, TruncMonth, TruncYear
from django.utils import timezone

from core.models import JobAssignment

TWO_PLACES = Decimal("0.01")


def elapsed_hours(job):
    """Hours between start and completion, or None if either is missing."""
    if not job.started_at or not job.completed_at or job.completed_at < job.started_at:
        return None
    seconds = Decimal((job.completed_at - job.started_at).total_seconds())
    return (seconds / Decimal(3600)).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def start_job(job, when=None):
    job.status = "IN_PROGRESS"
    job.started_at = job.started_at or when or timezone.now()
    job.completed_at = None
    job.save(update_fields=["status", "started_at", "completed_at", "updated_at"])
    return job


@transaction.atomic
def complete_job(job, member_hours=None, when=None):
    """Mark the job completed and record each assignee's hours.

    ``member_hours`` maps team member id -> hours, overriding the elapsed
    time for those members.
    """
    member_hours = {int(key): value for key, value in (member_hours or {}).items()}
    job.status = "COMPLETED"
    job.completed_at = job.completed_at or when or timezone.now()
    job.save(update_fields=["status", "completed_at", "updated_at"])

    default_hours = elapsed_hours(job)
    for assignment in job.assignments.all():
        hours = member_hours.get(assignment.team_member_id)
        if hours is None:
            hours = assignment.hours_worked if assignment.hours_worked is not None else default_hours
        if hours != assignment.hours_worked:
            assignment.hours_worked = Decimal(str(hours)).quantize(TWO_PLACES) if hours is not None else None
            assignment.save(update_fields=["hours_worked"])
    return job


def job_hours(job):
    """How long the job took: the most any assignee logged, else start to finish."""
    logged = [a.hours_worked for a in job.assignments.all() if a.hours_worked is not None]
    return max(logged) if logged else elapsed_hours(job)


def job_person_hours(job):
    """Total hours logged across everyone on the job."""
    logged = [a.hours_worked for a in job.assignments.all() if a.hours_worked is not None]
    return sum(logged, Decimal("0")) if logged else None


def _zone(team_member):
    try:
        return pytz.timezone(team_member.business.timezone)
    except (pytz.UnknownTimeZoneError, AttributeError):
        return pytz.utc


def _totals(queryset, trunc, tz):
    rows = (
        queryset.annotate(period=trunc("job__completed_at", tzinfo=tz))
        .values("period")
        .annotate(hours=Sum("hours_worked"))
        .order_by("period")
    )
    return {row["period"]: row["hours"] or Decimal("0") for row in rows}


def _as_date(value):
    return value.date() if hasattr(value, "date") else value


def team_member_hours(team_member, today=None, days=30, months=12):
    """Daily, monthly and yearly hours for a team member's completed jobs."""
    tz = _zone(team_member)
    today = today or timezone.now().astimezone(tz).date()
    worked = JobAssignment.objects.filter(
        team_member=team_member,
        hours_worked__isnull=False,
        job__status="COMPLETED",
        job__completed_at__isnull=False,
        job__is_deleted=False,
    )

    by_day = {_as_date(k): v for k, v in _totals(worked, TruncDate, tz).items()}
    by_month = {_as_date(k).replace(day=1): v for k, v in _totals(worked, TruncMonth, tz).items()}
    by_year = {_as_date(k).year: v for k, v in _totals(worked, TruncYear, tz).items()}

    daily = []
    for offset in range(days - 1, -1, -1):
        day = today - timedelta(days=offset)
        daily.append({"date": day.isoformat(), "hours": str(by_day.get(day, Decimal("0")))})

    monthly = []
    month = today.replace(day=1)
    for _ in range(months):
        monthly.append({"month": month.strftime("%Y-%m"), "hours": str(by_month.get(month, Decimal("0")))})
        month = (month - timedelta(days=1)).replace(day=1)
    monthly.reverse()

    yearly = [{"year": year, "hours": str(hours)} for year, hours in sorted(by_year.items())]

    return {
        "today": str(by_day.get(today, Decimal("0"))),
        "this_month": str(by_month.get(today.replace(day=1), Decimal("0"))),
        "this_year": str(by_year.get(today.year, Decimal("0"))),
        "total": str(sum(by_year.values(), Decimal("0"))),
        "daily": daily,
        "monthly": monthly,
        "yearly": yearly,
    }
