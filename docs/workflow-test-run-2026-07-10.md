# Workflow Regression Test Run - 2026-07-10

This report tracks the automated checks run against the workflow scenarios in `docs/workflow-regression-scenarios.md`.

Latest update: 2026-07-11.

## Result Summary

All currently available automated checks pass after fixing frontend lint blockers.

| Area | Command | Result |
| --- | --- | --- |
| Backend tests | `docker compose run --rm app sh -c "python manage.py test"` | Passed, 55 tests |
| Backend lint | `docker compose run --rm app sh -c "flake8"` | Passed |
| Frontend dashboard unit tests | `npm test` from `frontend/` | Passed, 3 tests |
| Frontend lint | `npm run lint` from `frontend/` | Passed |
| Frontend production build | `npm run build` from `frontend/` | Passed |

Build warnings still present:

- `../fonts/Moderniz.otf` is left for runtime resolution by Vite.
- Frontend bundle is larger than Vite's default chunk warning threshold.

## Fixes Made During The Initial Run

- Removed unused password visibility state/imports from `Register.jsx` and `SignIn.jsx`.
- Fixed `AlertDispatcher.jsx` hook dependencies and removed an unused style token.
- Removed the phone validation hook warning in `Input.jsx`.
- Removed a duplicated `disabled` prop in `CreateClientServiceForm.jsx`.

These were lint/build hygiene fixes only; no workflow behavior was intentionally changed.

## Workflow Automation Added On 2026-07-11

- Added backend integration coverage for the full happy path from service setup through questionnaire, quote, invoice, payment, payout, and job creation.
- Added regression coverage for deleted questionnaires invalidating pending questionnaire submissions and resend attempts.
- Added validation so deleted terms block questionnaire-driven auto quote generation when a quote still needs to be created.
- Added regression coverage that sent quotes keep their original general terms snapshot after the service terms template is edited.
- Added regression coverage that signed quotes on pending services create no invoice until service activation, and activation creates only one invoice.
- Added finance workflow coverage for no client payment method, no connected business Stripe account, successful payout creation, blocked repeat payment, successful refund, and blocked duplicate refund.
- Added API role-scope coverage for manager, client, and employee job visibility.
- Added soft-delete/restore cascade coverage for client, service, quote, invoice, payout, and job records.
- Added duplicate-submission coverage for service creation, quote creation, and quote signing.
- Added email backend selection coverage for local console email and production SendGrid selection.
- Added frontend unit coverage for dashboard revenue bucketing by monthly and yearly ranges.

Behavioral fixes made to support the approved workflow:

- Questionnaire submissions now require the active questionnaire to still exist.
- Auto quote generation from questionnaire submission now requires active general terms when no quote exists yet.
- Soft-delete metadata saves for questionnaires no longer re-run unrelated questionnaire/terms validation.
- Restore cascades now include already-soft-deleted child records by using `all_objects` where available.
- Quote `is_active` is now backend-owned/read-only in the API so omitted multipart form fields cannot create invisible inactive quotes.
- Quote creation has an API-level duplicate guard for active non-declined quotes.

## Existing Automated Coverage

Current tests already cover these important scenarios:

- User creation, login token behavior, profile retrieval/update, and profile photo upload.
- Contact form validation, privacy agreement requirement, and missing staff-recipient behavior.
- FAQ endpoint returns active items in order.
- Business list isolation by user.
- Public marquee logo endpoint returns active business logos.
- Creating a service requires an active terms template.
- Rich-text terms templates accept formatted HTML and reject empty HTML.
- Quotes copy the current general terms snapshot.
- Signing an eligible quote auto-creates an invoice.
- Job photo uploads automatically move jobs to `IN_PROGRESS` and `COMPLETED`.
- Duplicate job photo type uploads are rejected.
- Payment and payout success/failure behavior is covered with mocked Stripe calls.
- Dashboard revenue bucketing logic is covered by frontend unit tests.
- Core user/business model basics and Django admin pages.

## Scenarios Not Fully Automated Yet

The backend and pure frontend logic coverage is now much stronger. The remaining gap is browser-level E2E coverage for visual/interactive role-specific behavior that API tests cannot prove:

- Employee should not see manager-only buttons such as Add Member.
- Employee job detail fields should render read-only while photo upload controls remain usable.
- Manager/client/employee navigation should show the correct tabs and actions in desktop, tablet, and mobile sidebars.
- Client quote/invoice signing/payment screens should show the correct action states from the user interface, not just API permissions.

## Recommended Next Automation Batch

1. Add Playwright or Cypress for browser/E2E role-specific UI tests.
2. Add true concurrency tests with parallel requests for quote signing, invoice payment, and refund actions if race conditions become a concern.
3. Expand frontend dashboard tests to cover weekly buckets and empty-state rendering.

Current status: backend/API workflow coverage and dashboard bucketing tests are green. Browser-level role UI automation is the main remaining layer.
