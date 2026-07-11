# Jobber

Jobber is a service-business operations platform for managing businesses,
clients, team members, service agreements, quotes, scheduled jobs, invoices,
payments, and payouts. It provides role-aware workflows for business managers,
employees, clients, and platform administrators.

## System architecture

```text
Browser
  |
  v
React + Vite + Redux Toolkit Query
  |
  | HTTP / Token authentication
  v
Django REST Framework
  |-- user domain: identity, login, profiles, email verification, magic links
  |-- operations domain: businesses, clients, services, quotes, jobs, teams
  |-- finance domain: banking information, invoices, payments, payouts
  |
  +--> PostgreSQL
  +--> Stripe
  +--> SendGrid
```

Development runs the frontend, backend, and PostgreSQL as separate Docker
Compose services. Production builds the React application into static assets,
serves them through Nginx, proxies `/api/` and `/admin/` to Gunicorn, and stores
uploaded media in a shared Docker volume.

The repository includes a Django public-site implementation for SEO migration
and parity testing. React remains authoritative for public routes until the
Django pages pass desktop and mobile visual comparisons. Authentication,
questionnaire links, and the authenticated `/user/*` workspace remain React.

## Technology

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, React Router, Redux Toolkit Query, Tailwind CSS |
| Backend | Python 3.9, Django 3.2, Django REST Framework |
| Database | PostgreSQL 13 |
| API schema | drf-spectacular and Swagger UI |
| Payments | Stripe |
| Email | SendGrid in production, console backend in development |
| Production | Gunicorn, Nginx, Docker Compose |
| Quality | Django test framework, Flake8, Ruff, ESLint, Prettier |

## Repository structure

```text
.
|-- app/
|   |-- app/                 # Django settings, root URLs, WSGI and ASGI
|   |-- core/                # Shared models, admin, migrations and commands
|   |-- user/                # Authentication and account APIs
|   |-- operations/          # Business operations APIs
|   |-- finance/             # Billing, banking and payout APIs
|   |-- public_site/         # Django SEO pages, marketplace, templates and assets
|   `-- manage.py
|-- frontend/
|   |-- src/
|   |   |-- Components/      # Shared and public-site components
|   |   |-- User/            # Authenticated account and business workspace
|   |   |-- pages/           # Route-level public pages
|   |   |-- forms/           # Authentication forms
|   |   `-- store/apis/      # RTK Query API clients by backend domain
|   |-- Dockerfile           # Vite development image
|   |-- Dockerfile.prod      # Static production build and Nginx image
|   `-- nginx.conf
|-- docs/                    # Engineering and regression documentation
|-- docker-compose.yml       # Local development stack
|-- docker-compose.prod.yml  # Production service definitions
|-- Dockerfile               # Django development image
`-- Dockerfile.prod          # Gunicorn production image
```

## Domain model

The principal operational relationship is:

```text
User (manager) -> Business -> Client -> Service -> Job
                       |                    |
                       |                    +-> Quote -> Invoice -> Payout
                       +-> TeamMember ------+-> assigned Job
```

- A business belongs to an owner account and advertises tagged service types.
- A client links a client-role user to a business.
- A team member links a manager or employee user to a business.
- A service joins a client and business and contains scope, address, pricing,
  questionnaire responses, and automation settings.
- A job belongs to a service and may be assigned to a team member from the same
  business.
- Most business records use soft deletion; managers expose active records while
  retaining deleted records for administrative recovery and audit workflows.

## API boundaries

| Prefix | Responsibility |
| --- | --- |
| `/api/user/` | Registration, tokens, profile, password reset, magic login, FAQs |
| `/api/ops/` | Businesses, clients, teams, services, questionnaires, quotes, jobs |
| `/api/finance/` | Banking information, invoices and payouts |
| `/api/schema/` | OpenAPI schema |
| `/api/docs/` | Swagger UI |
| `/admin/` | Django administration |

Authorization is enforced in the backend by user role and record ownership.
Frontend route guards and role-aware controls improve navigation but are not a
replacement for API authorization.

## Local development

### Prerequisites

- Docker Engine
- Docker Compose v2

Create a local `.env` at the repository root with development values:

```dotenv
DEBUG=True
SECRET_KEY=replace-with-a-local-secret
DB_HOST=db
DB_NAME=devdb
DB_USER=devuser
DB_PASS=replace-with-a-local-password
STRIPE_TEST_SECRET_KEY=
STRIPE_TEST_PUBLIC_KEY=
SENDGRID_API_KEY=
DEFAULT_FROM_EMAIL=support@example.com
FRONTEND_URL=http://localhost:5173
```

Do not commit real Stripe, SendGrid, database, or Django secrets.

Build and start the stack:

```bash
docker compose up --build
```

The services are available at:

| Service | URL |
| --- | --- |
| React application | `http://localhost:5173` |
| Django API | `http://localhost:8000/api/` |
| Swagger UI | `http://localhost:8000/api/docs/` |
| Django admin | `http://localhost:8000/admin/` |

During the parity phase, use the Django server URL to inspect server-rendered
public pages and the Vite URL as the visual reference.

Useful service commands:

```bash
docker compose logs -f app
docker compose logs -f frontend
docker compose exec app python manage.py migrate
docker compose exec app python manage.py createsuperuser
docker compose stop
```

The development Compose file bind-mounts `app/` and `frontend/`, so backend and
frontend source changes are reflected without rebuilding in normal development.
Rebuild the relevant image after changing Python or npm dependencies.

## Sample data

A development fixture and management command can create a coherent multi-tenant
dataset without hard-coded database IDs:

```bash
# Seed the JSON dataset
docker compose exec app python manage.py seed_sample_data

# Remove only records identified by that JSON
docker compose exec app python manage.py seed_sample_data --remove

# Clear non-admin application data, then seed
docker compose exec app python manage.py seed_sample_data --reset

# Seed or update the application-specific public FAQs
docker compose exec app python manage.py seed_faqs

# Remove only FAQs managed by the FAQ seed command
docker compose exec app python manage.py seed_faqs --remove

# Validate FAQ seeding without saving changes
docker compose exec app python manage.py seed_faqs --dry-run
```

See [`app/core/fixtures/README.md`](app/core/fixtures/README.md) for fixture
format, sample credentials, dry-run behavior, and deletion safeguards.

## Testing and quality

Run backend tests in the application container:

```bash
docker compose exec app python manage.py test
```

Run a focused backend test module:

```bash
docker compose exec app python manage.py test core.tests.test_seed_sample_data
```

Run backend static checks:

```bash
docker compose exec app flake8
docker compose exec app ruff check .
```

Run frontend checks and a production build:

```bash
docker compose exec frontend npm run lint
docker compose exec frontend npm run build
```

Regression scenarios for cross-domain workflows are documented in
[`docs/workflow-regression-scenarios.md`](docs/workflow-regression-scenarios.md).

## Production topology

Production images are defined by `Dockerfile.prod` and
`frontend/Dockerfile.prod`. The deployment Compose file expects versioned
backend and frontend images and provides persistent volumes for PostgreSQL,
static files, and uploaded media.

Nginx terminates TLS, serves the React build, serves static and media files,
and proxies `/api/*` and `/admin/*` to Django. Public Django routing will be
enabled only after design-parity verification. Production hosts must provide:

- Database and Django environment variables
- Stripe and SendGrid credentials
- An `IMAGE_TAG` matching published container images
- TLS certificate and private-key files at the mounted host paths
- Persistent backups for PostgreSQL and uploaded media

Apply database migrations as a controlled deployment step before directing
traffic to a new backend image.

## Engineering conventions

- Keep business rules and authorization on the backend, even when the frontend
  implements the same visibility rules.
- Scope operational queries by authenticated role and business ownership.
- Preserve the `Business -> Client -> Service -> Job` ownership chain when
  adding features or imports.
- Use model managers consistently when deciding whether soft-deleted records
  should be visible.
- Never place live credentials, payment identifiers, or customer information in
  fixtures, tests, logs, or source control.
