# Local super-admin workspace

Start the existing stack with `docker compose up` and open
`http://localhost:5173/super-admin/`.

Access requires an active Django superuser. Staff-only accounts and the
application's ADMIN role do not grant access. The dashboard uses a Django
session with CSRF protection, independently of the user workspace's DRF token.
Sessions expire after 30 minutes. Django `/admin/` remains available separately.

The workspace monitors every current core entity with paginated lists, search,
filters, date ranges, sorting, configurable columns, saved views and CSV exports.
Detail screens expose related records and protected images/PDF documents.
Reports keep currencies separate. CSV and document downloads require a popup.

Business data is read-only while the scope of write actions remains deferred.
Production hosting and a persisted support inbox remain deferred as agreed.

Activity logging starts with this migration and records model saves, not
historical events or writes performed through bulk SQL updates. System monitoring
shows recurring-invoice run outcomes and primary email-backend acceptance; email
acceptance is not proof of delivery. Payment and refund details support confirmed, on-demand Stripe comparisons without changing local financial records. Provider failures are shown explicitly.
The local Compose command does not run the recurring-invoice production loop;
the system screen shows no runs until the command is executed.

Backend checks:

```sh
docker compose exec app python manage.py test super_admin --noinput
docker compose exec app python manage.py makemigrations --check --dry-run
docker compose exec app flake8 super_admin
```

Frontend checks:

```sh
npm --prefix frontend test
npm --prefix frontend run lint -- --quiet
npm --prefix frontend run build
```
