# Invoice Access and Payment Verification

Date: October 25, 2026. Changes are local and have not been deployed.

## Reproduced Problems

- Invoice lookup used only the customer's first business relationship.
- A business owner receiving an invoice from another business saw owner controls instead of customer payment controls.
- An incomplete banking record could hide a valid saved card or incorrectly enable payment.
- Payment errors returned under `error` were hidden behind a generic frontend message.
- Invoice emails had no automatic customer login, unlike quote/questionnaire emails.
- Sent invoices could not be resent from the invoice screen.
- Mobile invoice amount columns overlapped and clipped their contents.

## Verification Results

- Frontend lint, all 12 frontend unit tests, and the production frontend build: passed.
- All 30 browser scenarios below: passed using Chromium with mocked API and Stripe responses.
- PostgreSQL concurrency regression: passed; simultaneous requests produced one charge, payout, and paid notification.
- Full backend suite: all 206 tests passed, including the PostgreSQL concurrency regression.
- Backend lint passed; migration check reported no changes detected.
- Public production invoice route returned HTTP 200 with the React HTML entry point. This does not verify authenticated customer access or a live payment.

## Read-Only Production Checks

The exact legacy email URL, `https://getcontractorz.com/user/business/invoice/1`, opened successfully in an isolated, signed-out Chromium browser. It redirected to `/sign-in?next=%2Fuser%2Fbusiness%2Finvoice%2F1`, preserving the invoice destination. The sign-in page rendered with no browser console errors. A second check at a 390px mobile viewport also preserved this destination and found no horizontal page overflow.

An unauthenticated request to `/api/finance/invoice/1/` returned HTTP 401 with a JSON authentication error, rather than exposing the invoice or returning a server error. These checks confirm that the public route is reachable, not that the affected customer's authenticated session or live payment works. No production credentials, invoice records, or payment methods were accessed.

## Browser Matrix

| # | Scenario | Result |
|---|---|---|
| 1 | Existing email link while signed out; sign-in preserves invoice destination | Pass |
| 2 | Expired normal session; sign-in returns to the invoice | Pass |
| 3 | Secure invoice email with no existing session | Pass |
| 4 | Secure invoice email with the correct customer session | Pass |
| 5 | Secure invoice email while a business owner is signed in | Pass |
| 6 | Secure invoice email with an expired existing session | Pass |
| 7 | Expired email token rejected with a sign-in recovery link | Pass |
| 8 | Tampered email token rejected | Pass |
| 9 | Empty email token rejected | Pass |
| 10 | Missing card; banking link and return refresh payment eligibility | Pass |
| 11 | Missing/inaccessible invoice shows a persistent error and no payment action | Pass |
| 12 | Paid invoice has no Pay button | Pass |
| 13 | Cancelled invoice has no Pay button | Pass |
| 14 | Draft invoice has no customer payment action | Pass |
| 15 | Card-decline message remains visible; invoice stays unpaid | Pass |
| 16 | Missing business Stripe connection message is displayed | Pass |
| 17 | Pending payment is not incorrectly marked paid | Pass |
| 18 | Network failure leaves invoice unpaid and allows recovery | Pass |
| 19 | HTML server error does not cause false payment success | Pass |
| 20 | Successful payment and rapid double click produce one payment request | Pass |
| 21 | Business owner paying another business as a customer sees Pay, not Mark Paid | Pass |
| 22 | Session expiry during payment preserves the invoice sign-in destination | Pass |
| 23 | Owner resends a sent invoice without initiating payment | Pass |
| 24 | Owner sends a draft invoice | Pass |
| 25 | Email-provider failure displays an error without initiating payment | Pass |
| 26 | Quote magic link still reaches its signing screen | Pass |
| 27 | Questionnaire magic link preserves its authenticated destination | Pass |
| 28 | 390px mobile: invoice/button fit; amount columns scroll without overlapping | Pass |
| 29 | 834px tablet: invoice/button fit; amount columns fit | Pass |
| 30 | 1440px desktop: invoice/button fit; amount columns fit | Pass |

Browser automation is saved in `scripts/verify_invoice_browser.js`. It is local-only, replaces API/Stripe responses, and must not be treated as live payment-provider verification.

## Backend Coverage

Invoice tests exercise email token generation and exchange, actual authenticated invoice retrieval, and successful payment with Stripe mocked. Additional tests cover all customer business relationships, invoice-specific management permissions, inactive customers, hidden draft/deleted invoices, customer write/delete restrictions, valid versus incomplete cards, same-user card reuse, and exclusion of another customer's card.

Payment regressions cover missing cards, unready merchant accounts, non-positive amounts, cancelled/already-paid invoices, duplicate requests, card declines, authentication-required responses, processing payments, ambiguous network failures, changed invoice totals during payment, original-account refunds, and concurrent PostgreSQL payment requests.

Email tests cover sending drafts, resending sent invoices, refusing customer-initiated resends or paid/cancelled invoices, and preserving draft status when delivery fails. Test email backends/mocks prevent external delivery.

## Repeat Checks

```sh
docker compose exec -T app sh -c 'python manage.py test --noinput && flake8 && python manage.py makemigrations --check --dry-run'
npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix frontend run build
```

With React running locally on port 5173:

```sh
npx --yes --package @playwright/cli playwright-cli -s=invoice-check open http://localhost:5173/sign-in
npx --yes --package @playwright/cli playwright-cli -s=invoice-check run-code "$(cat scripts/verify_invoice_browser.js)"
npx --yes --package @playwright/cli playwright-cli -s=invoice-check close
```

## Release and Remaining Checks

Deploy frontend and backend together. Open the affected unpaid invoice as its business owner and use Resend to issue a fresh secure customer link. Previously sent links still support ordinary sign-in and invoice access.

No real customer card was charged, no customer email was sent, and no production records were changed during verification. Live Stripe account eligibility, actual provider delivery, and tapping the message in native iOS/Gmail clients have not been verified. Mobile checks used Chromium viewport emulation, not a physical device.

The existing payment flow does not implement interactive 3DS recovery or webhook reconciliation. Authentication-required payments are tested as failures and are never falsely marked paid. Uncertain pending charges without a recoverable intent require support review rather than risking a duplicate charge.
