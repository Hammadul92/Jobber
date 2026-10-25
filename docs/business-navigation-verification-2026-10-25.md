# Business Registration Navigation Verification

Date: October 25, 2026. Changes are local, not deployed.

## Cause and Fix

Business registration promotes the account to `MANAGER` on the backend. The React business mutation invalidated only the business cache, leaving `/api/user/me/` cached with the previous role. Desktop/mobile navigation and route permissions therefore required a manual refresh.

Successful business creation and updates now invalidate the shared current-user query. Navigation, route permissions, and the public-header session cookie receive the authoritative server response. Failed saves do not refresh user permissions. The app's loading screen is limited to the initial user load so background refreshes do not unmount the wizard or discard the success alert. The redundant manual business-list refetch was removed because mutation invalidation already refreshes it.

The Manager mobile menu also now includes Services, matching the desktop workspace menu. Existing layout and styling are unchanged.

## Results

- Reproduced the original missing-tabs failure before implementation.
- All 11 mocked browser scenarios passed, with no browser runtime errors.
- Two browser flows against the actual local Django API passed: registration and editing an existing business.
- All 30 existing invoice/authentication browser scenarios passed again after the shared loading-state change, including quote and questionnaire magic links. These regressions use mocked APIs/Stripe responses.
- Full backend suite: 209 tests passed, including three new business-role regression tests.
- Frontend unit suite: 12 tests passed.
- Frontend/backend lint, frontend production build, JavaScript syntax check, migration check, and `git diff --check` passed.
- The build retains its existing non-blocking warning about a JavaScript chunk exceeding 500 kB.

## Browser Coverage

| Scenario | Result |
|---|---|
| Existing-business save refreshes a stale role, reveals all tabs, and opens Questionnaires | Pass |
| New registration without a logo | Pass |
| New registration with an uploaded logo | Pass |
| Existing Manager edits business details and sees the new workspace name | Pass |
| Invalid form does not save or expose Manager tabs | Pass |
| Failed registration keeps permissions unchanged; retry succeeds | Pass |
| Delayed user refresh preserves the final step and success alert | Pass |
| Failed Manager edit preserves existing navigation | Pass |
| Tablet registration at 834px reveals all workspace links and opens Invoices | Pass |
| Mobile registration at 390px reveals all workspace links and opens Invoices | Pass |
| Server response remains authoritative; no hard-coded Manager promotion | Pass |

Successful-save checks verify exactly one additional current-user request, an unchanged document marker (no page reload), the final wizard step remaining open, and the updated public-header session role.

## Actual Backend Verification

A temporary fictitious account completed all four wizard steps against the local Django API, without mocking application API responses. Business creation returned HTTP 201; the automatic current-user refresh returned `MANAGER`; every workspace link appeared; Questionnaires opened successfully. The final step remained mounted and the document marker did not change.

The same account then edited its business name. PATCH returned HTTP 200; the workspace name updated; the final step and document were preserved. No application API response failed in these flows. The temporary account, business, team membership, and authentication token were deleted after testing. No production records, customer emails, or payments were touched. External Stripe scripts were stubbed; payment-provider integration is outside this task.

## Screenshots and Repeat Checks

Screenshots are in `output/playwright/business-navigation/`:

- `real-backend-before-save.png`: final registration step before saving.
- `real-backend-after-save.png`: successful registration with all business tabs visible.
- `real-backend-after-update.png`: successful edit with the updated workspace name.
- `desktop-before-save.png` / `desktop-after-save.png`: mocked stale-role regression.
- `tablet-after-save.png`: all workspace links in the tablet navigation.
- `mobile-after-save.png` / `mobile-business-tabs.png`: mobile navigation and its scrolled workspace links.
- `reproduced-before-fix.png`: the original failing state.

The repeatable mocked browser matrix is `scripts/verify_business_navigation_browser.js`. Create the screenshot directory, open the local app, then run it with Playwright CLI:

```sh
mkdir -p output/playwright/business-navigation
npx --yes --package @playwright/cli playwright-cli -s=business-check open http://localhost:5173/sign-in
npx --yes --package @playwright/cli playwright-cli -s=business-check run-code "$(cat scripts/verify_business_navigation_browser.js)"
npx --yes --package @playwright/cli playwright-cli -s=business-check close
```

These checks use Chromium, including mobile/tablet viewport emulation, not physical devices. Production deployment was not performed.
