# Customer Workflow Release Verification

Date: October 26, 2026 (Asia/Karachi).
Branch: `codex/customer-workflow-fixes`, based on `main` at `949cac2`.
This work has not been merged or deployed.

## Review Scope

- Preserve saved/custom business slugs and normalize punctuation in newly generated slugs.
- Refresh authoritative user permissions after successful business saves without reloading the page or unmounting the wizard.
- Stop customer service-status-change emails; retain other notification events.
- Validate uploaded signatures and email the customer a signed quotation PDF with business contact details and structured terms.
- Restore invoice access across customer relationships, invoice-specific owner/customer controls, usable saved-card selection, secure email login, and owner send/resend actions.
- Preserve owner-only invoice lists for business revenue and follow-up views, while allowing direct access to invoices addressed to that owner as another business's customer.
- Keep the floating to-do control below sidebar forms and mobile navigation.
- Fit the signature dialog to mobile/landscape viewports with an internal scrolling fallback.

No schema migrations, dependency updates, Nginx routing changes, or deployment workflow edits are included. Quote acceptance eligibility and questionnaire-bypass behavior are not changed. Existing invoice URLs retain ordinary sign-in recovery; new invoice emails additionally carry the existing one-hour magic-login token.

## Local Verification

| Check | Result |
|---|---|
| Full Django test suite against PostgreSQL | 223 passed |
| Backend flake8 | Passed |
| Migration drift check | No changes detected |
| Frontend unit tests | 12 passed |
| Frontend ESLint | Passed |
| Vite production build | Passed |
| Deployment recovery tests | 8 passed |
| Deployment script syntax | Passed |
| Invoice/login/payment browser matrix | 30 passed |
| Business registration/navigation browser matrix | 11 passed |
| Responsive signature dialog browser matrix | 23 passed |
| To-do/drawer/mobile-navigation layering matrix | 6 passed |
| Production frontend image build | Passed |
| Nginx configuration in production frontend image | Passed with temporary test TLS files and isolated upstream resolution |
| Production backend image build | Passed with the final invoice-list safeguard |
| Production backend runtime smoke | Django checks, 200 static files collected, Gunicorn configuration, and 15 PDF/email tests passed offline |

Browser checks use Chromium with mocked application APIs and Stripe responses, not live customer cards or real email delivery. The PostgreSQL concurrency test uses two simultaneous requests and verifies a single charge invocation, payout, and paid notification with Stripe mocked. PDF tests cover contact details, escaped content, paragraph/list formatting, long documents, signature framing, and MIME/SendGrid attachment serialization. Single-page and multi-page sample layouts were visually inspected during the PDF redesign.

Pre-commit review additionally reproduced and fixed a dual-role invoice-list regression: an owner's customer bills must not appear as their business's receivables or revenue. The new regression failed before the safeguard and passed in the full rerun; ordinary customers still list invoices across all their active business relationships.

The backend runtime smoke used the actual production image with `DEBUG=False`, dummy configuration, and networking disabled. No database or provider connection was used. The invoice view's SHA-256 matched the final working-tree source. Nginx validation used one-day self-signed local certificates because production TLS files are deployment-time mounts, not baked into the image.

The previous task-specific reports retain their original dates and test counts. This document records the combined pre-commit rerun. Generated screenshots, PDFs, browser logs, credentials, and runtime media are not part of the commits; browser scripts reproduce local screenshots under `output/`.

## Existing Warnings and Review Limits

- Dependency installation reported 18 audit findings: 2 low, 2 moderate, 13 high, and 1 critical. A separate `npm audit --omit=dev` reported 10 flagged packages, including DOMPurify (critical), React Router, and tooling dependencies. Package manifests and lockfiles are unchanged by this branch. These findings require security review; passing tests or CI is not a security clearance. No automatic or forced dependency upgrade was applied.
- Vite retains its non-blocking warning about a JavaScript chunk exceeding 500 kB. The Docker build also reports an existing React/react-popper peer-dependency mismatch.
- `manage.py check --deploy` with local development settings reported DEBUG/secret-key and application HSTS/HTTPS/secure-cookie warnings. Production settings were not read or changed. Nginx's existing HTTP-to-HTTPS redirect remains intact; reviewers should confirm the deployed environment and cookie policy separately.
- Live Stripe account eligibility, interactive 3DS recovery, native mobile email clients, and real provider delivery were not verified. Existing pending-payment safeguards are preserved; uncertain charges are not retried blindly.
- No production database, customer payment method, customer email, or deployment was modified by this verification.

## CI and Deployment

The existing `Checks` workflow runs on branch pushes and executes deployment recovery validation, Django tests, and backend lint. Its remote result must be checked on the PR's final commit. Frontend checks and both image builds are verified locally because the current branch workflow does not run them.

Image publishing runs only on pushes to `main`. Deployment runs only after a successful main-branch image build. This review branch must not be merged or deployed until a senior has reviewed it, including the existing security warnings above.

Deploy frontend and backend together through the existing pipeline. No manual data migration or backfill is required. After an approved deployment, verify business-save navigation, a customer invoice link and unpaid invoice, a signed quotation download/attachment, and the mobile signature dialog. Use test-mode payment data for any payment smoke test, never an unapproved real customer charge.

## Repeat Commands

```sh
docker compose exec -T app sh -c 'python manage.py wait_for_db && python manage.py test --noinput && flake8 && python manage.py makemigrations --check --dry-run'
docker compose exec -T frontend sh -c 'npm test && npm run lint && npm run build'
bash -n scripts/deploy.sh
python3 scripts/test_deploy.py
docker build -f Dockerfile.prod -t jobber-backend:review .
docker build -f frontend/Dockerfile.prod -t jobber-frontend:review .
git diff --check
```

The four `scripts/verify_*_browser.js` files describe their local-only Playwright invocation. Create their screenshot directories before running them.
