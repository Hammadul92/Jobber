# Local super-admin verification

## Thorough dashboard test pass (2026-11-27)

See [the detailed test report](super-admin-testing-2026-11-27.md). The final run
passed 51 super-admin tests, 19 quote PDF tests, and 52 frontend tests. Browser
checks covered all 23 sidebar destinations and the record, cascade, filter,
notification, export, responsive, recovery, and logout workflows. Five defects
were fixed; temporary QA data was removed.

## All-table deletion filter audit (2026-11-27)

- Read-only checks traversed every page of all 18 deletion-capable tables. For
  each table, All equals the union of Yes and No; the subsets are disjoint and
  reported counts equal the number of returned records. Activity and Audit are
  immutable history tables without deletion filters.
- Regression fixtures now cover deleted records in all 16 soft-deletable tables,
  including resources with no deleted rows in the local database.
- Fixed assignment archives omitted when deletion was caused by a parent record.
  Snapshot lookup now finds child records inside deletion batches; All, Yes, and
  detail views expose them while restoration remains blocked by deleted parents.
  Restoring the parent removes restored assignments from the deleted list.
- Mixed assignment lists retain numeric sorting, creation/deletion date filtering,
  and labels for selected related-record filters. The 40-test super-admin suite,
  one additional sorting/date regression, and flake8 passed. User data was unchanged.

## Catalog deletion filter repair (2026-11-27)

- Catalog and Job Assignment lists now merge existing rows and archived deletion
  snapshots before sorting, pagination, counting, and CSV export when All is selected.
  Yes returns only archived records; No returns only existing records.
- Added regression coverage for mixed catalog pagination, numeric ID ordering,
  CSV export, restoration without duplicates, and assignment relationship filters.
- All 13 record-action tests and super-admin flake8 passed. Read-only local API
  checks confirmed the three deleted Refresh entries appear under All and Yes,
  and none appear under No. No user records were changed during verification.

## Notification verification and repair (2026-11-27)

- The super-admin bell previously received the shared component's empty default
  array: it had no connected notification source. It now receives recorded
  platform activity through a superuser-only endpoint, refreshing every 30
  seconds while visible, when opening the bell, and when the window regains focus.
- Individual reads and mark-all state are persisted per superuser in PostgreSQL,
  independent of other accounts and browser storage. Mark-all uses the loaded
  event boundary, so newer events remain unread. The response limits displayed
  entries to 50 while retaining the full unread count.
- Routine login-timestamp saves no longer create duplicate activity alerts;
  dashboard sign-ins retain their existing audit entries. Error responses show
  an error rather than a misleading empty inbox. Escape closes the popup and
  restores focus; popup bounds were checked at 390/768/1680px.
- Backend notification tests cover real record creation through the action API,
  linked detail navigation, persistence, cross-admin isolation, unread counts,
  mark-all boundaries, invalid references, authentication/CSRF, empty states,
  removed-target fallbacks, and constant query counts as notifications increase.
- Browser checked badge counts, individual read, mark-all, persistence after
  reload, View navigation, automatic refresh, disabled empty-inbox controls,
  simulated HTTP failure/recovery, and Escape focus restoration. Tests used a
  temporary superuser and marked activity fixtures; both were removed afterward.
  Existing admins' read state and business records were preserved.
- Full dashboard regression pass: 36 backend tests passed before the final
  additional notification integration check. Frontend: 45 tests passed, lint
  and production build passed (existing bundle-size warning remains). The new
  notification-state migration was applied locally; migration drift is clear.
- This verifies in-app notifications from captured platform activity. It does
  not verify outbound email delivery or browser push notifications.

## Global search panel correction (2026-11-25)

- Search renders in a body portal with an explicit viewport-clamped width and
  fixed positioning, avoiding the icon-sized containing block and global width
  constraints that compressed its input and results.
- Added loading feedback, trimmed queries, cleared stale results, arrow-key
  navigation, and Escape focus restoration. Ctrl/Command+K opens and focuses it.
- Verified 390/768/1680px bounds, real administrator results, keyboard focus,
  empty/no-result feedback, shortcut opening and Escape dismissal. ESLint and
  production build passed, retaining the existing bundle-size warning.

## Record management actions (2026-11-25)

Business writes are now authorized and implemented. This supersedes the earlier
read-only scope recorded below.

- All 18 managed entity screens have create/edit controls, plus delete, restore,
  and activation controls where applicable, using the shared design components.
  Audit and activity history remain immutable. Forms validate model constraints,
  relationship ownership consistency, amounts, and duplicate photo types. Files
  are uploaded through the same protected backend.
- Save actions have a review step. Destructive/status actions have a confirmation
  dialog. Deletion previews enumerate each affected entity and record by name.
  Signed confirmations expire after ten minutes and reject changed record or
  dependency lists. Mutations run atomically under superuser/session/CSRF checks.
- Cascades follow child ownership links, never parents. Services explicitly own
  their invoices despite the legacy nullable FK. Assignments are removed without
  deleting jobs or employee accounts. Catalog removal unlinks business offerings
  without deleting those businesses. Previously deleted descendants stay deleted
  on restoration; deletion batches retain the precise restore membership.
- Accounts and refunds now support soft deletion. Deleted accounts are inactive;
  restored accounts require explicit activation. Assignments/catalog entries use
  archived snapshots so their links can also be restored from Trash. You cannot
  delete or deactivate your own signed-in account. Paid provider transactions are
  not reversed by local record changes; forms explicitly explain this.
- Each tab/detail route resets document and main-content scrolling to the top.
- Record actions, create, export, PDF download and provider comparison use icon
  buttons with accessible names and native hover labels. Final confirmation
  buttons retain explicit action text.
- Full Django regression pass: 423 tests passed during implementation. Final
  focused account/model/dashboard pass: 52 tests passed. Frontend: 45 tests
  passed; lint/build passed with the existing bundle-size warning. Local migrations
  were applied and migration drift checked.
- Browser verified actual create/edit/activate/deactivate/delete/restore using a
  temporary FAQ, Escape cancellation, and tab scroll reset. All 18 create forms
  and available edit forms opened, with no overflow at 390/768/1680px. A real
  service cascade confirmation was inspected and cancelled. The temporary FAQ
  was removed after testing; business data was not deleted in browser checks.

## Administrator separation (2026-11-25)

- Users excludes Django superusers; Administrators includes active and inactive
  superusers. Counts, search results and exports follow those boundaries.
- Superusers display the effective Role as Super Admin. Django's is_superuser
  flag controls this presentation and access; the separate application role is
  retained in storage without changing permissions.
- Relationships, activity record links, and protected profile images resolve
  superusers through Administrators rather than the Users endpoint.
- 18 backend regression tests and Python lint passed, covering separation,
  labels, exports, counts, search, relationships and protected media.

## Compact table columns (2026-11-25)

- Job Duties, Expertise, text and JSON columns have at least 320px of reading
  width. Other columns have bounded widths; wide tables scroll within the card.
- Text previews are limited to three lines with View full for overflow. Full
  text opens in a keyboard-accessible native dialog without expanding the row.
  Record and relationship links retain navigation with bounded previews.
- Browser checked all 19 entity tables with every available column enabled at
  390, 768 and 1680px: no page overflow and no populated row above 160px.
  Verified full Job Duties preview and Escape dismissal. ESLint and production
  build passed, retaining the existing bundle-size warning.

## Membership status and photo gallery (2026-11-25)

- Removed the repeated Employee column from Team Members. The member name still
  opens membership details, where the linked user account remains accessible.
- Deleted records display inactive regardless of their retained database flag.
  Active/inactive filters and CSV exports use the same rule. Team status is
  labelled Active Membership to distinguish it from account login status.
  Stored flags are retained so restoration preserves the previous setting;
  removing a membership does not disable an account shared by other businesses.
- Job Photos now uses a responsive gallery following the existing job photo
  cards, with protected thumbnails, metadata, job/detail links, and a native
  modal preview. Preview supports previous/next, arrow keys, Escape, focus
  containment and restoration, plus an unavailable-file fallback.
- 17 targeted backend tests and 45 frontend tests passed. ESLint, Python lint,
  and production build passed (existing bundle-size warning remains).
- Browser verified actual preview images, next-photo keyboard navigation,
  Escape, and gallery/dialog bounds at 390, 768 and 1280px. Verified no duplicate
  employee column and inactive deleted memberships. One existing local photo
  file is missing; its record displays Photo unavailable. A development-server
  reload interrupted the team check once; retry succeeded.

## Readable records and filter correction (2026-11-25)

- The filter badge now counts actual predicates and date bounds. Selecting a
  date field alone does not count; it never restricted results without bounds.
- Removed ID columns from lists, column selection, detail fields, and CSVs.
  Record names (or descriptive labels for payments, photos, and assignments)
  carry the detail links. IDs remain internal for routing and API lookup.
- Relationships show names, including deleted related records. Relationship
  filters accept names; linked numeric filters resolve to named labels.
- Search and sorting support readable relationship names. Labels load with
  related data rather than adding a query for each row.
- Route-bound data prevents a previous record's fields or image requests from
  appearing during navigation.
- Targeted Django suite: 16 tests passed, including names, every resource's CSV
  export, filters, and constant list query counts. Frontend suite: 45 passed.
  ESLint and production build passed (existing bundle-size warning remains).
- Browser checks passed all 20 entity lists with no ID headers or bare numeric
  relationship labels, plus a 390px mobile overflow check. Verified name links,
  owner-name filtering, clearing filters, and removal of the default badge.

The local monitoring workspace is available at `http://localhost:5173/super-admin/`
with the existing `docker compose up` stack. Login requires an active Django
superuser; `is_staff` and the application ADMIN role do not independently grant
access. The test browser used a temporary superuser with `is_staff=False`.

## Automated verification

- Full existing and new PostgreSQL/Django suite: 409 tests passed before the
  additional Stripe comparison test was added.
- Final targeted super-admin PostgreSQL suite: 12 tests passed, including the
  mocked Stripe comparison, CSRF, revocation, inactive/staff-only denial,
  protected endpoints and password exclusion.
- Existing frontend suite: 45 tests passed.
- Frontend ESLint and Vite production build passed. Vite retains the existing
  warning about the main application bundle size; dashboard code is lazy-loaded.
- Python lint for the new backend and changed email/scheduler files passed.
- Migration drift check: no changes detected. New activity migration applied
  successfully to the local PostgreSQL database.

## Browser verification

- Checked all 25 routes at widths 390, 768, 1280 and 1536 pixels: no page overflow
  or runtime exceptions.
- Verified real sign-in, page search, saved views, CSV download, confirmation
  cancellation with Escape, initial Cancel focus, and record navigation.
- Verified global search and a protected invoice PDF response against the local
  backend. A development-server reload interrupted one pass; Retry recovered it.
- Mobile/tablet detail checks passed across all entity lists with existing rows.
- Mobile navigation, cancellation of Stripe comparison, and sign-out passed;
  the overview API returned 403 after sign-out.
- The temporary browser test account was removed after verification.

## Scope and limits

Business data is read-only because write-action scope was explicitly deferred.
Production routing and a persisted support inbox are also deferred. Activity
coverage starts with this implementation and captures model saves, not bulk SQL
updates or historical events. Email telemetry records backend acceptance, not
provider delivery. Recurring-invoice monitoring requires a command run; the local
Compose stack does not start the production recurring-invoice loop. Stripe
comparisons are on-demand and do not update financial records. External Stripe
responses were mocked in the automated test, with no real charges or refunds.

## Design-system correction

The original super-admin presentation was replaced with the authenticated
workspace's actual shared components and layouts:

- `WorkspaceNavigation` is now shared by the existing user sidebar and the
  super-admin sidebar, retaining the profile header, account menu, workspace
  label, navigation states, icon sizing, spacing, and logout treatment.
- The super-admin uses `DashboardTopbar` and `Topbar`; the original user routes
  retain their default behavior. The business dashboard and super-admin now
  share `DashboardStatCard`.
- Lists use `TableToolbar`, `ToolbarSelect`, `ToolbarDate`, `RecordsTable`,
  `RecordLink`, and `TablePagination`. Detail and monitoring cards follow the
  existing dashboard and client-detail layouts.
- Sign-in and preferences use `Input`, `Select`, and `SubmitButton`. Sign-in
  follows the existing public authentication layout, typography, and logo.
- Compared against the supplied business dashboard/sign-in screenshots and live
  user profile/credentials screens, opened through normal local-account login.
  No existing manager authentication token was retrieved.
- Updated backend checks: 14 tests passed, including variable page sizes,
  DateField/DateTimeField filtering, and actual protected image previews. Frontend tests: 45 passed.

- The corrected presentation passed all 25 route checks at 390, 768, 1280,
  and 1680 pixels with no page overflow or visible API errors.
- Rapid search clearing followed by a page-size change exposed a stale router
  parameter race; filter updates now merge against the latest browser URL.
- Final mobile checks passed opening the drawer, navigating to Users, closing
  the drawer on selection, and searching the local account's record. The mobile
  drawer follows the original mobile navigation's padding and control sizing.
- The final build and lint passed, with all 45 frontend tests passing. An
  additional CSV download rerun was not executed because automatic permission
  review timed out twice; CSV delivery had passed the earlier implementation
  verification, and the existing confirmation component remains in use.
