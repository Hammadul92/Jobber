# Workflow Regression Test Run - 2026-07-10

This report tracks the automated checks run against the workflow scenarios in `docs/workflow-regression-scenarios.md`.

## Result Summary

All currently available automated checks pass after fixing frontend lint blockers.

| Area | Command | Result |
| --- | --- | --- |
| Backend tests | `docker compose run --rm app sh -c "python manage.py test"` | Passed, 39 tests |
| Backend lint | `docker compose run --rm app sh -c "flake8"` | Passed |
| Frontend lint | `npm run lint` from `frontend/` | Passed |
| Frontend production build | `npm run build` from `frontend/` | Passed |

Build warnings still present:

- `../fonts/Moderniz.otf` is left for runtime resolution by Vite.
- Frontend bundle is larger than Vite's default chunk warning threshold.

## Fixes Made During This Run

- Removed unused password visibility state/imports from `Register.jsx` and `SignIn.jsx`.
- Fixed `AlertDispatcher.jsx` hook dependencies and removed an unused style token.
- Removed the phone validation hook warning in `Input.jsx`.
- Removed a duplicated `disabled` prop in `CreateClientServiceForm.jsx`.

These were lint/build hygiene fixes only; no workflow behavior was intentionally changed.

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
- Core user/business model basics and Django admin pages.

## Scenarios Not Fully Automated Yet

The scenario map is broader than the current test suite. These should be added as explicit tests before we can honestly say every scenario has been tested end-to-end:

- Full happy path from business setup through questionnaire, quote, invoice, payment, payout, job, and dashboard revenue.
- Questionnaire deleted after a service/questionnaire link already exists.
- General terms deleted before quote generation.
- General terms edited after quote is sent and before quote is signed.
- Offered service name changed after historical services, quotes, invoices, and jobs exist.
- Quote signed while service is pending, then service activated later without duplicate invoice creation.
- Payment blocked when client has no payment method.
- Payment blocked when business has no connected Stripe/bank account.
- Successful payment creates exactly one payout.
- Re-paying an already-paid invoice is blocked.
- Payout refund succeeds once and rejects duplicate refunds.
- Dashboard revenue buckets paid invoices correctly across monthly, weekly, and yearly filters.
- Frontend role-specific behavior for employees, managers, and clients through browser/E2E tests.
- Soft-delete and restore behavior across clients, services, questionnaires, terms, quotes, invoices, payouts, and jobs.
- Email delivery behavior in local console backend versus SendGrid production settings.
- Concurrent double submissions for service creation, quote signing, invoice payment, and refund actions.

## Recommended Next Automation Batch

1. Add backend integration tests for Stories A-H in `workflow-regression-scenarios.md`.
2. Add focused API tests for dashboard revenue aggregation.
3. Add browser/E2E tests for role-specific UI behavior that backend tests cannot prove.
4. Add concurrency tests around quote signing, invoice payment, and refund actions.

Current status: the available automated suite is green, but the complete real-life scenario matrix is not fully automated yet.
