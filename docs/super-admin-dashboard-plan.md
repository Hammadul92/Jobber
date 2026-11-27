# GetContractorz super-admin dashboard plan

Status: localhost monitoring implementation completed and verified; see `docs/super-admin-verification.md`. Dashboard code is in `frontend/src/super-admin/`; backend APIs and activity instrumentation are in `app/super_admin/`. Production hosting, business-data write actions, and a persisted support inbox remain deferred. See `frontend/src/super-admin/README.md` for local usage and instrumentation limits.

## Decisions confirmed

- Dashboard source belongs inside the existing React project at `frontend/src/super-admin/`, using its packages and shared design components. Do not create a root-level dashboard app or a new Next.js app.
- `docker compose up` starts the local dashboard as part of the existing frontend service. Its URL is `http://localhost:5173/super-admin/`.
- Only active Django superusers can log in: `is_active=True` and `is_superuser=True`. `is_staff=True` alone and `role="ADMIN"` alone are insufficient.
- Production domain/path, first-release write actions, and a persisted support inbox are deferred. Build and verify the localhost dashboard first.
- Every sensitive action requires a confirmation popup before the request is sent, so the administrator can review its impact and cancel.
- Every super-admin screen follows the current product dashboard's visual system, interaction rules, and responsive layouts. It should look and behave like part of the existing GetContractorz platform.
- Every screen and workflow must be fully usable on mobile phones, tablets, laptops, and desktop PCs.

## What exists today

- Docker Compose starts PostgreSQL, Django on port 8000, and the React/Vite frontend on port 5173. Production uses Gunicorn behind the frontend Nginx container.
- Django `/admin/` is the built-in admin. The new dashboard must never claim that path.
- The React app currently handles sign-in and `/user/*`; production Nginx sends those routes to the SPA and sends unmatched paths to Django. Django APIs live under `/api/user/`, `/api/ops/`, and `/api/finance/`.
- Authentication for the existing API is a DRF token stored by the current frontend in localStorage. The user model has independent `role`, `is_staff`, and `is_superuser` fields. `role="ADMIN"` alone does not establish Django admin access.
- Operational data is concentrated in `core.models`: User, Business, Client, TeamMember, Service, ServiceQuestionnaire, ServiceTermsTemplate, Job, JobAssignment, JobPhoto, Quote, Invoice, Payout, PayoutRefund, BankingInformation, FAQ, and ServiceOption. Taggit stores service tags. Most business records are soft-deleted.
- Stripe Connect, payment intents and refunds are integrated. Contact submissions are emailed to staff and are not stored as tickets. There is no general audit-event, notification, incident, subscription-plan, platform-fee, or Stripe-webhook-event model in the current code.

## Placement and local routing

1. Create `frontend/src/super-admin/` for dashboard routes, components, styles, API client, and tests. Reuse shared frontend components where appropriate. Add a Django `app/super_admin/` package for isolated API endpoints, serializers, permissions, and audit models. The URL uses `super-admin`; Python uses an underscore.
2. Mount the dashboard UI in the existing Vite application. `docker compose up` continues to start the existing PostgreSQL, backend, and frontend services with no second manual command. Local entry: `http://localhost:5173/super-admin/` (and `127.0.0.1:5173`). Deep links such as `/super-admin/businesses/42` must refresh successfully.
3. Preserve Django `/admin/` unchanged. Never claim `/admin` or `/admin/*` for the dashboard. Do not rely on frontend navigation guards for security.
4. For a later production phase, the same subfolder can have a distinct frontend entry/build served by a host-specific Nginx block. DNS, certificate, production route, and cross-origin/session details will be designed and verified at that phase; no production routing change is in this local milestone.

## Access and security

- Dedicated dashboard sign-in at `/super-admin/sign-in` locally. Existing Django users authenticate with their current email/password; do not create a separate account table. Admission requires both `is_active=True` and `is_superuser=True`. Do not admit staff-only or `role="ADMIN"`-only users.
- Add a dedicated `/api/super-admin/auth/` flow and permission class applied to **every** super-admin endpoint, including exports and file access. Check the current user on each request so revocation takes effect immediately. Avoid sharing the current general-purpose localStorage token with the regular user workspace; prefer a server-managed, HttpOnly, Secure, SameSite session cookie with CSRF protection and logout/invalidation. Keep the current user API compatible.
- Default-deny sensitive data: show card/bank last four and Stripe IDs only where operationally necessary; never return raw payment credentials or secrets. Set `Cache-Control: no-store` on auth and sensitive responses. Rate-limit sign-in, password reset, search, exports, and high-impact actions. Add session timeout and reauthentication for critical mutations.
- Log dashboard login, denial, export, and every mutation in an append-only audit record: actor, time, action, entity/ID, safe before/after summary, reason, request ID and IP. Do not store passwords, tokens, or full payment data.
- Before every sensitive action, show a confirmation popup naming the action, affected entity and count, consequences, and whether it can be reversed. No action is sent until the administrator explicitly confirms; closing, pressing Escape, or choosing Cancel leaves data unchanged. For financial, access-control, deletion/restore, bulk, and outbound-message actions, require a reason and stronger confirmation when appropriate. The backend still validates authorization and business rules on submit.
- Start with read-only access to every entity. Add narrowly scoped mutations after each business rule and audit path is tested; do not expose a generic model editor or direct state flip for payments, signed quotes, or invoices.

## Shared behavior across screens

### Design and layout requirements

- Treat the existing authenticated workspace in `frontend/src/User/` and the shared components in `frontend/src/Components/ui/` as the primary design reference. The public-site `docs/design.md` explicitly excludes the product dashboard, so it is a brand reference only, not a mandate to copy marketing-page layouts.
- Reuse the current design tokens in `frontend/src/App.css`: navy `#09355d`, orange `#ff7a00`, ink `#171717`, light background `#f5f7f9`, existing fonts, border radii and breakpoints. Use the current logo and icon style. Keep spacing, typography hierarchy, card treatment, table density, form controls, status badges, and feedback consistent with the authenticated workspace.
- Follow the existing workspace structure: sidebar and topbar on desktop, compact mobile navigation, clear page title and actions, content cards, responsive tables and detail views. Adapt navigation to the larger super-admin information architecture while preserving recognizable placement and behavior.
- Reuse or extend `RecordsTable`, table toolbar/pagination, inputs/selects/date pickers, loading/empty states, alerts, and `ConfirmDialog` where suitable. Shared changes must not unexpectedly restyle existing `/user/*` screens. Any super-admin variant should be documented and use shared tokens.
- Review each implemented screen at desktop, tablet, and mobile widths against comparable existing product screens. Acceptance requires visual consistency, usable overflow/stacking, keyboard focus, readable contrast, and confirmation dialogs that match the platform's component language.
- Responsive behavior is required for **every** route and state, not only the overview: sign-in, lists, detail views, reports, charts, calendars, settings, empty/error/loading states, and confirmation popups. Navigation collapses appropriately; cards and forms reflow; dense tables retain readable labels and usable horizontal scrolling or a mobile row view; filters and actions remain discoverable without hover. No page-level horizontal overflow, clipped controls, or inaccessible modal content.

### Finding and working with information

- Put a persistent global search in the dashboard shell with keyboard shortcut, recent searches, grouped results, exact ID lookup, and clear no-results guidance. Search by the identifiers people actually know: names, emails, business names, invoice/quote numbers, and Stripe references where appropriate. Do not expose sensitive fields in result previews.
- Every entity list has a visible page search, relevant filter controls, status chips, date range, business/owner selector, sort, pagination, result count, and a one-click Clear filters action. Show active filters above results. Persist search/filter/sort/page state in the URL so views can be bookmarked and revisited.
- Offer column visibility, sensible default columns, saved views, row selection and bulk actions only where meaningful. Bulk selections show the exact count and scope, including whether selection covers just the current page or all filtered results. Export only the records matching the displayed filters and enforce authorization and size limits.
- Detail screens provide breadcrumbs, a back link that preserves list filters, quick links to related entities, in-page section navigation for long records, copyable IDs, and a plainly labeled activity/history area. Surface important status and exceptions near the top rather than requiring the user to inspect raw fields.
- Dashboard and report charts have accessible text summaries, data-table alternatives, clear units, date ranges, timezone/currency labels, and links to the underlying filtered records. Date and money formats follow existing platform conventions.
- Provide consistent loading skeletons, empty states, validation messages, retry controls, permission-denied screens, and clear success/error toasts. Keep user input and filters intact after recoverable errors. Offer an action history so administrators can see what was submitted and whether it succeeded.
- For accessibility, every control needs a visible label and keyboard operation; focus must move predictably through menus, dialogs and tables, return to the invoking control after a dialog closes, and remain visible. Announce async results and errors to assistive technology. Use semantic headings, table headers and landmarks; maintain readable contrast, zoom/reflow at 200%, adequate touch targets, and reduced-motion support.
- Search, filters, sort, pagination, downloads, and sensitive actions must work without hover-only affordances. Verify representative flows with keyboard-only and screen-reader testing as well as desktop, tablet and mobile layout checks.

- Apply filters relevant to each entity, including region, currency, active/deleted status and ownership where applicable. Use server-side pagination/sorting and asynchronous jobs for large exports; record export scope in history.
- Every detail page has a summary, linked-entity graph, lifecycle timeline, audit trail, notes where permitted, and context actions. Deleted rows remain visible with deletion actor/time and restoration constraints.
- All sensitive actions, including those started from lists, detail pages, bulk controls, and settings, use the same accessible confirmation dialog pattern with clear action-specific wording. Never use a generic “Are you sure?” message.
- Dashboard cards and reports state their time range, timezone, currency, and metric definition. Never sum CAD and USD as one unlabeled amount. Time displays use the viewer timezone, with business timezone available for operational dates.
- Responsive layout, keyboard access, loading/empty/error states, permission-denied state, retriable requests, and clear action feedback.

## Screen inventory

| Area / route (relative to dashboard root) | Content and actions |
| --- | --- |
| `/` Overview | Platform KPIs: users by role, active businesses, clients, services, quotes, jobs, invoices, collected payments, refunds, failed/pending payments, overdue invoices. Trends, signup funnel, work volume, latest activity, anomalies and action queue. Drill down from each card. |
| `/activity` | Cross-platform timeline of sign-ins, registrations, business changes, record transitions, invoice/payment/refund events and admin actions; source and correlation IDs. Clearly distinguish newly instrumented events from older records. |
| `/users` and `/users/:id` | Search and inspect all user roles, verification/activity, last login, businesses and client/team relationships. Activate/deactivate, password-reset invitation, and session revoke only through audited actions. Admin flag changes are a separate guarded workflow. |
| `/admins` and `/admins/:id` | Django superusers, group/permission overview, dashboard access history, denied attempts, session revocation, and audit history. Staff-only users can be inspected in `/users` but cannot enter the dashboard. No self-demotion or removal of the last full administrator. |
| `/businesses` and `/businesses/:id` | Owner, profile, location, status, marketplace visibility, service tags, clients, team, service/job/quote/invoice counts, payment-readiness, activity. Review/activate/deactivate and restore where business rules allow. |
| `/clients` and `/clients/:id` | Client per-business relationship, linked user, billing identity, services, invoices, payment-method summary, activity; resolve duplicates carefully because a user may relate to multiple businesses. |
| `/team` and `/team/:id` | Memberships, role, assignments, work hours, active state, linked business/user, job history. |
| `/catalog` | ServiceOption and tag management, public category visibility, usage counts; preview before publishing. |
| `/services` and `/services/:id` | Subscription/one-time type, scope, price, currency, schedule, status, address, client/business, questionnaire answers, quote/invoice automation, linked records. |
| `/questionnaires` and `/questionnaires/:id` | Business templates, questions and submitted responses, active/deleted state, utilization, and version/change history when added. Treat customer answers as sensitive. |
| `/terms-templates` and `/terms-templates/:id` | Business agreement templates, active/deleted state, linked services, safe preview, change history. |
| `/jobs` and `/jobs/:id` | Schedule/calendar and table, status, assigned staff, hours, before/after photos, linked service and client, overdue/unassigned exceptions. |
| `/quotes` and `/quotes/:id` | Draft/sent/signed/declined/void lifecycle, revisions and replacements, expiry, signed snapshot, signature/PDF access, linked service/invoices, delivery history where instrumented. Signed content is immutable. |
| `/invoices` and `/invoices/:id` | Draft/sent/paid/cancelled, due/overdue, amounts/tax/currency, line items, payment option, billing periods, linked quote/service, payment timeline, PDF and delivery diagnostics. |
| `/payments` and `/payments/:id` | Existing `Payout` records as the platform's payment ledger: pending/paid/failed/partially refunded/refunded, Stripe intent/account IDs, invoice/business links, reconciliation status and failure reason. Label carefully so `Payout` is not mistaken for a Stripe bank transfer. |
| `/refunds` and `/refunds/:id` | `PayoutRefund` records, amount/status/reason, parent payment, Stripe reference, remaining refundable amount. Refund initiation only after a separate reviewed workflow. |
| `/payment-methods` and `/payment-methods/:id` | Masked banking/card methods, Stripe Connect readiness, charges/payouts enabled, auto-pay setting, related business/client; no raw credentials. |
| `/trash` | All soft-deleted entity types, actor/time/parent, dependency graph, restore eligibility and audited restore. Never hard-delete finance records. |
| `/support` | Deferred product decision. The current contact workflow emails staff and does not store tickets. A real inbox requires a new persisted contact/ticket model or an email integration; do not imply it exists today. |
| `/content/faqs` | FAQ order, active status, preview, publish/edit history. Public pages and legal copy remain code-managed until a content model/editor is designed. |
| `/reports` | Adoption, activity, operations, receivables, collections, refunds and failure reports with date range, group-by, currency separation and export. Document formulas and snapshot timing. |
| `/system` | App/database health, deployment version, scheduled recurring-invoice job heartbeat and outcomes, email delivery diagnostics, Stripe connectivity/reconciliation and API errors. Requires new instrumentation; avoid displaying secrets. |
| `/audit` | Searchable admin-action and data-event log, export history and denied access; immutable entries with retention policy. |
| `/settings` | Dashboard profile, timezone, session/security settings, platform configuration that has explicit safe APIs; changes require audit and confirmation. No environment-secret editor. |

## API and data work

1. Create `api/super-admin/` with domain-specific read endpoints and projection serializers rather than reusing owner-scoped `/api/ops/` and `/api/finance/` viewsets. That avoids accidentally bypassing or weakening business ownership checks. Use query optimization and bounded pagination.
2. Add aggregate endpoints for overview and reports. Define each metric precisely, handle soft deletion consistently, compare periods, and separate CAD/USD. Consider cached summaries/materialized aggregates only after measuring query cost.
3. Add audit-event and operational-event models, plus explicit event emitters at critical transitions. Historical rows cannot reconstruct every action, email delivery or login failure; show coverage start date.
4. Add monitoring data sources for job runs, API failures and email delivery. Stripe reconciliation should compare stored records with Stripe using controlled background jobs and rate limits; do not run one Stripe API request per table row.
5. Add explicit action endpoints with domain validation, transactions, idempotency where financial, reason capture, and audit. Reuse domain services where possible. Reconcile the current recurring-invoice loop, which is started from the production backend container, before claiming job health or retry controls.

## Delivery sequence and acceptance

1. Local foundation: `frontend/src/super-admin/` integration, localhost routing, dashboard auth and denial tests, product-matched shell/navigation, audit log. Verify `docker compose up`, deep-link refresh, `/admin/` isolation, active-superuser admission, and rejection of staff-only, ordinary and inactive users.
2. Read-only control center: overview, global search, all entity lists/details, soft-deleted views, timelines and masked financial data. Verify ownership-independent admin reads do not leak through ordinary APIs.
3. Reports and operations: defined metrics, exports, system instrumentation, payment reconciliation and exception queues. Validate totals against database fixtures and Stripe test mode.
4. Controlled actions (scope deferred): business/user controls, FAQ/catalog management, restore, then finance actions if selected. Verify action-specific confirmation popups, cancellation without side effects, audit, duplicate-submit protection, dependency rules and recovery procedures for each action.
5. Production release (later): decide domain/path and support inbox scope, then perform route/host regression, CSRF/session/security tests, certificate/DNS check, performance on realistic data, accessibility, backup and rollback smoke test. Before release, verify every dashboard route and major state at representative phone (390px), tablet (768px), laptop (1280px), and desktop (1536px) widths.

## Deferred decisions

1. Which actions beyond monitoring should be enabled in the first release? This does not block local read-only screens or API groundwork.
2. Should the future dashboard include a persisted support inbox and outbound messaging? Current contact submissions are email-only.
3. What exact production URL and path should serve the dashboard? `admin.getcontractorz.com` is the intended subdomain, but its root/path behavior will be chosen during production planning.
4. Who should receive operational alerts, and where (email, dashboard only, or another channel)? Alerting needs thresholds and delivery ownership.
