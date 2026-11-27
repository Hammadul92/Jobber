# Super-admin test report: November 27, 2026

## Result

Completed local automated tests and real-browser workflows. Five defects found
during this pass were repaired and retested. Existing user records were preserved;
temporary QA accounts, their related records, and their test activity were removed.

| Check | Result |
| --- | --- |
| Super-admin backend suite | 51 tests passed |
| Quote PDF regression suite | 19 tests passed |
| Frontend suite | 52 tests passed, including 7 new super-admin client tests |
| Backend flake8 and frontend ESLint | Passed |
| Production frontend build | Passed; existing shared-bundle size warning remains |
| Migration consistency | No changes detected |
| Browser navigation | All 23 sidebar destinations loaded successfully |

## Defects repaired

| Problem | Correction and verification |
| --- | --- |
| Overview counts omitted archived catalog entries and assignments | Include archived snapshots in totals; compare overview counts with record-list counts. |
| Global search skipped catalog, FAQs, memberships, and other entities | Search all 18 mutable record types, related names, text fields, and archived catalog/assignment labels. Verified FAQ search and keyboard result navigation in the browser. |
| Invalid filters and unusual numeric search input could be inconsistent or crash | Validate boolean, relation, date-range, and pagination inputs before selecting list implementations; safely handle oversized and Unicode numeric searches. |
| Business edit forms split multiword service names into separate tags | Use taggit's supported edit serialization. Round-trip tests preserve “Floor Cleaning” and submit valid edit forms across all 18 mutable record types. |
| Unsigned quote PDF action crashed the signed-document renderer | Offer signed PDF downloads only when a signature timestamp exists. Unsigned requests receive a readable 400 response. Signed quote and invoice PDFs are checked for valid PDF output. |

## Automated coverage

- Authentication, CSRF, staff-only rejection, inactive access, permission revocation,
  and an anonymous/staff access matrix over every record and action endpoint.
- All/Yes/No deletion partitions across all 18 deletion-capable tables; archive
  counts, pagination, numeric sorting, dates, related filters, and restoration
  without duplicate rows.
- Create/edit schemas, valid form submission round trips, required-field failures,
  negative amounts, cross-business relationships, and unchanged data after rejection.
- Exact child-only deletion previews and cascades; preservation of parents and
  separately deleted children; membership/account separation; parent restoration
  constraints; signed confirmation expiry, stale state, and actor binding.
- Notification persistence, per-admin read isolation, unread counts, new arrivals
  during mark-all, invalid references, linked navigation, and error handling.
- CSV formula escaping and password exclusion, protected media validation, PDF
  response validation, readable labels, and query-count regression checks.
- Frontend request session credentials, CSRF rotation and isolation, multipart
  boundaries, field errors, permission/confirmation status codes, malformed
  responses, and network failures.

## Real-browser verification

Used a dedicated temporary superuser and a temporary business/client/service graph.
Interaction assertions waited for the destination's content before acting.

| Workflow | Observed result |
| --- | --- |
| All sidebar tabs | Successful API responses and rendered screens without application alerts |
| FAQ lifecycle | Required fields, create review, create, edit, deactivate, activate, delete cancellation, confirmed delete, restore |
| Service deletion | Preview listed service, quote, invoice, job, assignment; all five deleted; client and business preserved; all five restored |
| Catalog filters | Deleted Refresh entries visible under All/Yes and absent under No |
| Tables | Saved-view restore, page sizes, next page, sorting resets page, filter-aware CSV download |
| Search | FAQ found, ArrowDown/Enter result navigation, Escape, popup bounds at 390/768/1440px |
| Notifications | Mark-all persisted after reload; FAQ edit produced a notification; individual read cleared it |
| Downloads | Actual CSV and invoice PDF files downloaded through confirmation dialogs |
| Mobile | Navigation opens/closes, closes after selection and Escape; System page fits 390px without document overflow |
| Error recovery | Simulated 503 displayed an error; Retry recovered after removing the simulated failure |
| Navigation scroll | 1,667.5px before switching tabs; 0px afterward |
| Logout | Login screen persisted after reload |

Evidence is saved under `output/playwright/`, including cascade-preview,
notification, and mobile-System screenshots plus the temporary invoice PDF and
catalog CSV.

## Limits and existing observations

- This verifies the local stack, not a deployed production environment.
- One pre-existing photo record references an unavailable image file. The gallery
  renders its “Photo unavailable” fallback; the missing original cannot be
  recovered from application code.
- Recharts emits initial measurement warnings in development; charts render after
  layout. The shared application bundle still produces Vite's size warning.
- Live email delivery, real charges/refunds, and production Stripe responses were
  not exercised. Provider comparison is covered with mocks and remains read-only.
- The quote-PDF suite emits an existing telemetry diagnostic when a SimpleTestCase
  intentionally reaches a database-backed telemetry path; all 19 PDF tests pass.

## Commands

```sh
docker compose exec -T app python manage.py test super_admin operations.tests.test_quote_pdf --noinput
docker compose exec -T app flake8 super_admin
docker compose exec -T app python manage.py makemigrations --check --dry-run
cd frontend
npm test
npm run lint
npm run build
```
