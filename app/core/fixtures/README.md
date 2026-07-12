# Sample data

This directory contains human-readable development data for the Jobber backend.
The `seed_sample_data` management command reads `sample_data.json`, creates the
records in dependency order, and resolves relationships by email or business
slug instead of database IDs.

## Architecture

The seeded operational data follows the application's model relationships:

```text
User (MANAGER) -> owns -> Business
Business -> has -> TeamMember -> references -> User (MANAGER or EMPLOYEE)
Business -> has -> Client -> references -> User (CLIENT)
Business -> defines -> Questionnaire + Terms Template per offered service
Business + Client -> have -> Service -> stores completed questionnaire answers
Service -> has -> Signed Quote -> snapshots terms and stores signature
Signed Quote + completed questionnaire -> permit seeded Job
Job -> optionally assigned to -> TeamMember
Signed Quote + Service -> has -> Invoice -> records tax and payment status
```

The fixture contains two detailed businesses. Each has its own owner, four team
members, five clients, two offered service types with matching templates, six
client services and quotes, multiple completed and upcoming jobs, and three
invoices. Job assignments always reference a team member from the same business.
Dates in the JSON are offsets from the day the command runs, keeping the dataset
useful over time.

The JSON deliberately excludes generated IDs, password hashes, customer uploads,
complete payment credentials, Stripe identifiers, and payouts. The two sample
logos used from `logos/` and fictional signature under `signatures/` are copied
into Django media storage when seeded. Django hashes the configured password
when users are created. Seeded invoices model realistic finance records without
inventing external payment-provider identifiers.

## Reset and seed

From the repository root, run:

```bash
docker compose exec app python manage.py seed_sample_data --reset
```

`--reset` is destructive. It deletes all business and operational records,
soft-deleted records, FAQs, sessions, and every non-admin user. It preserves any
user who is a superuser, is staff, or has the `ADMIN` role. The command refuses
to reset the database if no such admin exists. Deletion and seeding run in one
database transaction, so an invalid seed rolls back the reset.

To validate the complete reset and seed without retaining any changes:

```bash
docker compose exec app python manage.py seed_sample_data --reset --dry-run
```

To add the sample dataset without clearing existing data:

```bash
docker compose exec app python manage.py seed_sample_data
```

This only works when the fixture emails and slugs do not already exist. To load
a different JSON file mounted under `/app`, pass its container path:

```bash
docker compose exec app python manage.py seed_sample_data --input /app/core/fixtures/sample_data.json
```

## Remove only the sample data

To remove the records identified by `sample_data.json` while leaving unrelated
businesses and users untouched:

```bash
docker compose exec app python manage.py seed_sample_data --remove
```

Removal matches businesses by `slug` and generated users by `email`. Deleting a
matched business cascades through its team-member links, clients, services,
jobs, quotes, invoices, payouts, and related operational records. Admin-class
users are always protected. Stored sample-logo copies are deleted after the
database transaction commits; the source fixture logos remain available for the
next seed. The command is idempotent, so running it again when the sample data is
absent is safe.

Preview and validate the removal without retaining changes:

```bash
docker compose exec app python manage.py seed_sample_data --remove --dry-run
```

`--reset` and `--remove` are mutually exclusive: reset clears all non-admin
application data before seeding, while remove deletes only fixture-identified
data and does not seed anything.

To apply fixture logo changes to an already-seeded database without replacing
any operational data:

```bash
docker compose exec app python manage.py seed_sample_data --update-logos
```

This action updates only the `logo` field on businesses matched by fixture slug
and fails if any fixture business is absent. It is mutually exclusive with
`--reset` and `--remove` and also supports `--dry-run`.

To normalize business and user phones on an existing sample dataset without
changing operational records:

```bash
docker compose exec app python manage.py seed_sample_data --update-phones
```

Seed phone numbers must use the display format `+1 902-555-0501`: a plus-prefixed
country code, one space, then the three-digit area code and hyphenated local
number. The parser rejects other fixture formats.

## Sample logins

All generated users use this development-only password:

```text
SamplePass123!
```

Business owner accounts:

| Business | Email |
| --- | --- |
| Aurora Home Services | `maya@aurorahome.example` |
| Prairie Peak Landscaping | `ethan@prairiepeak.example` |

Team member and client emails are listed directly in `sample_data.json` and use
the same password. The preserved admin keeps its existing password.

## Editing the dataset

Keep every user email unique across the entire JSON file. Within each business:

- `services_offered` must contain every service's `service_name`.
- `client_email` must match a client in that business.
- `assigned_to_email` must match a team member in that business.
- `logo` must be a path inside the fixture directory.
- `phone` must use the `+1 902-555-0501` format.
- `service_templates` must cover every entry in `services_offered` exactly once.
- A service with jobs must have completed questionnaire answers and a `SIGNED`
  quote with a fixture-relative signature image.
- A paid invoice must belong to a service with a signed quote and completed job,
  and must define `paid_days_ago`.
- Invoice business, client, currency, subtotal, tax, and total are derived from
  the validated service and owning business.
- Signed quotes snapshot their matching template's terms into
  `general_terms_conditions`.
- `start_in_days`, `end_in_days`, and `scheduled_in_days` are integer offsets.
- Model choice fields use backend values such as `ACTIVE`, `ONE_TIME`, and `CAD`.

Run the focused command tests after changing the command or fixture:

```bash
docker compose exec app python manage.py test core.tests.test_seed_sample_data
```
