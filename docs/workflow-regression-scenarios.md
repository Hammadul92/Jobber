# Contractorz Workflow And Regression Scenario Map

This document maps the current project workflows and lists real-life regression scenarios that should be tested when changing backend APIs, frontend dashboard screens, automation, email, payments, or data models.

The goal is to protect the full business lifecycle: user signup, business setup, service templates, clients, services, questionnaires, quotes, invoices, jobs, payments, payouts, and dashboard reporting.

## Current Product Flow

### Main Actors

- `USER`: Newly registered account before business/client/team role assignment.
- `MANAGER`: Business owner or business manager. Can manage business setup, clients, service templates, quotes, invoices, jobs, payouts, and team members.
- `CLIENT`: Customer of a business. Can fill questionnaires, sign quotes, view services/jobs/invoices, add payment method, and pay invoices.
- `EMPLOYEE`: Team member assigned to jobs. Can view assigned jobs and upload before/after job photos.
- `ADMIN`: Django/admin-level user. Backend APIs often allow broader access, and Django admin can manage records directly.

### Core Entity Dependencies

- `User` can become a business owner, client user, team member, or staff/admin.
- `Business` belongs to one owner user.
- `Business.services_offered` controls allowed service names for questionnaires, terms templates, and services.
- `ServiceQuestionnaire` belongs to a business and a `service_name`.
- `ServiceTermsTemplate` belongs to a business and a `service_name`.
- `Client` connects a user to one business.
- `Service` belongs to a business and client, and uses a `service_name`.
- `Service.filled_questionnaire` stores the submitted questionnaire answers as a snapshot on the service.
- `Quote` belongs to a service.
- `Quote.general_terms_conditions` stores a copied snapshot of service general terms at quote creation.
- `Quote.terms_conditions` stores quote-specific additional terms.
- `Invoice` belongs to a business and client and may reference a service.
- `Payout` belongs to a business and invoice.
- `Job` belongs to a service and may be assigned to a team member.
- `JobPhoto` belongs to a job and is either `BEFORE` or `AFTER`.
- `BankingInformation` belongs to either a business or a client.

### Business Setup Flow

1. User registers.
2. Registration email is sent.
3. User verifies email and logs in.
4. User creates business profile.
5. Backend creates the owner as a `TeamMember` for that business.
6. User role becomes `MANAGER`.
7. Manager adds offered services to the business profile.
8. Manager creates one questionnaire per service.
9. Manager creates one general terms template per service.
10. Manager can now create client services for that service name.

### Client And Service Flow

1. Manager creates or selects a client user.
2. Manager creates a service for that client.
3. Service creation requires:
   - client belongs to business.
   - service name is in business offered services.
   - active questionnaire exists for that service name.
   - active terms template exists for that service name.
   - no duplicate active service exists for same client, service name, and address.
4. Backend sends questionnaire email to the client if active questionnaire exists.
5. Client opens magic link and fills questionnaire.
6. Service stores answers in `filled_questionnaire`.
7. If `auto_generate_quote` is enabled and no active non-declined quote exists, backend creates a draft quote.
8. If service status changes to `ACTIVE` and `auto_generate_invoices` is enabled, backend creates invoice only if a signed quote exists.

### Quote Flow

1. Manager creates quote manually, or system auto-creates quote after questionnaire completion.
2. Quote creation copies active general terms template content into `general_terms_conditions`.
3. Manager can add additional quote-specific terms in `terms_conditions`.
4. Manager sends quote by email.
5. Quote status changes to `SENT`.
6. Client opens magic link/sign page.
7. Client signs or declines.
8. Signed quote:
   - status becomes `SIGNED`.
   - signature is stored.
   - `signed_at` is set.
   - signed quote becomes immutable through normal quote update endpoint.
   - if service is active and `auto_generate_invoices` is enabled, invoice is created.
9. Declined quote:
   - status becomes `DECLINED`.
   - signature is cleared.
   - another quote can be created for that service because only active non-declined quotes are blocked.

### Invoice, Payment, And Payout Flow

1. Manager creates invoice manually or automation creates invoice.
2. Auto-generated invoice due date is 2 days after current date.
3. Manager can mark invoice as `SENT`; email is sent to client.
4. Client can view non-draft invoices.
5. Client payment requires:
   - client has active Stripe payment method.
   - business has connected Stripe bank account.
   - invoice is not already paid.
6. Successful payment:
   - charges client.
   - transfers to business connected account.
   - invoice status becomes `PAID`.
   - `paid_at` is set.
   - `Payout` is created with status `PAID`.
7. Manager can refund payout through Stripe if payout has payment intent and is not already refunded.

### Job Flow

1. Manager creates job for a service.
2. Job may be assigned to a team member from the same business.
3. Manager/client/employee visibility depends on role:
   - manager sees business jobs.
   - client sees jobs for their services.
   - employee sees assigned jobs only.
4. Employee uploads `BEFORE` photo:
   - duplicate before photo for same job is rejected.
   - job status changes to `IN_PROGRESS`.
   - `completed_at` is cleared.
5. Employee uploads `AFTER` photo:
   - duplicate after photo for same job is rejected.
   - job status changes to `COMPLETED`.
   - `completed_at` is set.

### Public/Marketing Flow

- FAQs are fetched from backend active FAQ records.
- Contact form validates public input and emails active staff users.
- Business logo marquee fetches up to 10 active business logos and falls back to hard-coded logos only when no business logos exist.
- `/admin` in frontend redirects to Django admin backend.

## High-Risk Observations From Current Code

- Product intent requires a completed questionnaire and signed quote before a
  job is scheduled, but `JobSerializer` currently validates only that the
  assignee and service belong to the same business. `JobViewSet` and the create
  form also allow any client-linked service. This gate must be enforced on the
  backend before the UI can safely rely on it.
- `ServiceQuestionnaire.clean()` appears to reject creating a questionnaire when a `ServiceTermsTemplate` already exists for the same business and service name. Since service creation requires both an active questionnaire and active terms template, setup order should be tested carefully. This may be an unintended conflict.
- `Payout.status` model choices are `PENDING`, `PAID`, and `FAILED`, but refund code sets status to `REFUNDED`. Test whether this is accepted, displayed correctly, and safe in admin/forms.
- `Quote.clean()` only excludes `DECLINED`; there is no `EXPIRED` status in model choices even though some frontend logic refers to expired quotes. Test expired quote behavior.
- General terms are snapshot-copied into quotes, while questionnaire responses are snapshot-stored on services. Edits/deletes of templates should not mutate existing snapshots unless product intentionally changes that.
- Many deletes are soft deletes and may cascade. Test visibility and restore implications.
- Several workflows depend on emails and magic tokens. Console email in local and SendGrid/SMTP in production should both be tested.
- File uploads can fail in CI/local if tests write to real media directories. Use temporary media root in tests.

## Regression Scenario Checklist

### 1. Authentication And Account Lifecycle

- New user registers with valid data.
- New user cannot sign in before email verification if active check is enforced.
- Verification link activates user.
- Expired/invalid verification token returns a useful error.
- Password reset request always returns generic success for unknown email.
- Password reset token updates password and invalidates old password.
- Magic login token logs user in and stores frontend token.
- Invalid/expired magic token does not authenticate.
- Updating profile name, email, phone, and photo works.
- Profile photo upload does not write to forbidden media path in tests/CI.
- Logout clears token and redirects protected routes to sign in.
- 401 API response clears frontend token and redirects to sign in with `next`.

### 2. Role And Permission Scenarios

- `USER` can access profile/business/banking/credentials but not business dashboard tabs until role changes.
- Creating a business changes user role to `MANAGER`.
- `MANAGER` can access business dashboard pages.
- `CLIENT` can access services, quotes, quote signing, jobs, invoices, and home where allowed.
- `CLIENT` cannot access clients, service templates, service questionnaires list, team management, or payouts.
- `EMPLOYEE` can access assigned jobs/team-member pages but cannot access quotes, invoices, clients, templates, or payouts.
- Employee should not see `Add Member` button.
- Employee cannot create/edit services or assign jobs through API.
- Team member from one business cannot access another business records by ID.
- Client from one business cannot view another client's quote/invoice/job by ID.
- Manager cannot create client/service/job/invoice for a business they do not own.
- Admin/staff access through Django admin is separate from app role access.

### 3. Business Setup Scenarios

- Manager creates business with required fields and logo.
- Business owner is automatically added as a team member.
- Business logo appears in public marquee.
- If at least one real logo exists, fallback marquee logos are hidden.
- Business without logo does not break marquee.
- Updating services offered adds new service names.
- Removing a service from `services_offered` should be tested against existing questionnaires, terms templates, services, quotes, and jobs.
- Existing services for a removed offered service should remain readable and should not disappear unexpectedly.
- Creating a new service for a removed offered service should be blocked.
- Renaming service in offered services should be tested because templates are matched by service name string, not foreign key.
- Business tax rate change should affect new invoices, but should not retroactively change old invoices unless intentionally edited.
- Business timezone should affect serialized date display consistently.
- Soft-deleting business should hide clients, services, templates, quotes, jobs, invoices, and payouts as expected.
- Restoring business should restore related records if cascade restore is used.

### 4. Service Questionnaire Template Scenarios

- Manager can create questionnaire for a service listed in business offered services.
- Manager cannot create questionnaire for a non-offered service.
- Questionnaire can store multiple dynamic question types.
- Empty questionnaire structure behavior is clear: blocked if required, or accepted if intentional.
- Questionnaire edit updates future forms.
- Questionnaire edit should not overwrite `filled_questionnaire` already stored on existing services.
- Questionnaire delete/soft-delete hides it from future service creation.
- Questionnaire delete/soft-delete should not delete existing services.
- Questionnaire delete/soft-delete should not erase existing service answers.
- Questionnaire delete after service creation but before client fills form:
  - magic link should either continue with snapshot if one exists, or fail with clear error if current active questionnaire is required.
  - resending questionnaire should fail with clear "No active questionnaire" message.
- Questionnaire edit after email was sent but before client fills:
  - client should see latest active questionnaire if current behavior is live lookup.
  - test whether changed questions produce valid `filled_questionnaire` shape.
- Questionnaire edit after quote was auto-generated should not regenerate quote or mutate existing quote.
- Duplicate questionnaire for same service should be clearly allowed or blocked according to product decision.
- Inactive questionnaire should not satisfy service creation requirement.
- Client should only see questionnaires for their business/client relationship.
- Service questionnaire form should reject submissions for services not belonging to client.
- Magic questionnaire link should expire after expected token lifetime.

### 5. General Terms And Conditions Template Scenarios

- Manager can create terms template for offered service.
- Manager cannot create terms template for non-offered service.
- Terms content cannot be blank, including blank rich text HTML like `<p><br></p>`.
- Terms content accepts formatted HTML from Quill.
- Terms content is sanitized/rendered safely on frontend.
- Terms content cannot exceed 10,000 visible words.
- Frontend prevents typing beyond 10,000 words.
- Backend rejects more than 10,000 words even if frontend is bypassed.
- Terms template edit affects future quotes only.
- Terms template edit should not mutate existing quote `general_terms_conditions` snapshots.
- Terms template delete/soft-delete should block future service creation for that service.
- Terms template delete/soft-delete should block manual quote creation for services with no active template.
- Terms template delete/soft-delete should not remove existing services.
- Terms template delete/soft-delete should not alter existing quotes already carrying copied general terms.
- Terms template delete after service was created but before quote generated:
  - auto quote generation should fail or create quote with empty general terms depending on current code path. This should be defined and tested.
- Terms template delete after quote sent but before signing:
  - client should still see the copied terms on the quote.
- Terms template edit after quote sent but before signing:
  - client should still see copied quote terms, not the new template, unless quote is regenerated.
- Terms template edit/delete after quote signed:
  - signed quote should remain legally consistent with the terms the client saw.
- Additional quote terms should appear below general terms with divider and bold `Additional Terms:`.
- Additional terms should preserve line breaks.
- Rich text in general terms should preserve headings, paragraphs, lists, and links in preview/signing.
- Malicious HTML/script in terms should not execute in preview/signing.
- Existing templates should survive frontend rich text editor reload without losing formatting.
- Terms drawer create/edit should handle slow network and duplicate submissions.

### 6. Client Management Scenarios

- Manager can add existing user as client.
- Manager can create/select client only if user exists.
- Same user cannot be duplicate client for same business because `Client` unique together is business/user.
- Same user can be client of multiple businesses if allowed.
- Client active/inactive status should affect quote sending and visibility.
- Inactive client should block quote sending.
- Inactive client should still preserve historical services, quotes, invoices.
- Deleting client soft-deletes related services through cascade if intended.
- Deleting client should not delete underlying user account unless intentionally done.
- Client payment method display updates after card save.
- Client without payment method can view invoice but cannot pay.

### 7. Service Creation And Editing Scenarios

- Service creation succeeds when business, client, offered service, active questionnaire, and active terms template are valid.
- Service creation fails when no active questionnaire exists.
- Service creation fails when no active terms template exists.
- Service creation fails when client belongs to another business.
- Service creation fails when service name is not in business offered services.
- Service creation fails for duplicate active service with same client, service name, and address.
- Duplicate address check should be case-insensitive and trim whitespace.
- Same service name at different address should be allowed.
- Same address with different service name should be allowed if business offers it.
- Same service after previous service is soft-deleted should be allowed or blocked according to product decision.
- Service creation sends questionnaire email.
- Email failure during service creation should be tested: service may still be created or transaction may fail.
- Service creation with `auto_generate_quote=true` should not create quote until questionnaire is filled.
- Service creation with `auto_generate_invoices=true` should not create invoice until service active and quote signed.
- Service cannot become `ACTIVE` until `filled_questionnaire` exists.
- Service can become `ACTIVE` after questionnaire is filled.
- Changing service name on existing service should require active questionnaire and terms for new name.
- Changing service name after quote exists should be blocked or clearly update dependencies according to product decision.
- Changing service price/currency after quote exists should not silently change signed quote expectations unless intended.
- Changing service price/currency after invoice exists should not retroactively change invoice totals unless invoice is edited.
- Changing service status to `CANCELLED` should be tested against existing quotes, jobs, and invoices.
- Completed service should still show historical jobs/invoices.
- Cancelled service should block sending new quotes or creating jobs/invoices if desired.
- Resend questionnaire should fail if already filled.
- Resend questionnaire should fail if active questionnaire was deleted/inactivated.
- Resend questionnaire should succeed for pending unfilled service.
- Service form should not show success error mismatch when API succeeds.

### 8. Filled Questionnaire Scenarios

- Client opens questionnaire magic link without manual login.
- Client fills all required questions and submits successfully.
- Submitted answers are stored on `Service.filled_questionnaire`.
- Partial/invalid answer payload is rejected if frontend/API requires question validation.
- Filling questionnaire triggers draft quote generation when `auto_generate_quote=true`.
- Filling questionnaire does not generate quote when flag is false.
- Filling questionnaire does not generate duplicate quote if one active non-declined quote exists.
- Filling questionnaire generates quote with `valid_until = current date + 2 days`.
- Filling questionnaire captures active terms template into quote.
- If terms template missing at fill time, auto quote behavior should be defined and tested.
- If service is already active before questionnaire is filled through admin mistake, form submission should not create inconsistent records.
- Re-submitting questionnaire should update answers or be blocked according to product decision.
- Client should not submit questionnaire for another client's service.
- Deleted/inactive service should not accept questionnaire submission.

### 9. Quote Scenarios

- Manager can create manual quote only if active terms template exists.
- Quote creation copies current general terms template.
- Quote creation fails if `valid_until` is in the past.
- Only one active non-declined quote can exist per service.
- Declined quote allows a new quote for same service.
- Signed quote blocks edits.
- Sent quote can be edited before signing if allowed, and client sees updated values.
- Sending quote sends email with magic signing link.
- Sending quote changes status to `SENT`.
- Sending quote for inactive client is blocked by frontend and should be enforced by backend if required.
- Sending quote for inactive/cancelled service is blocked by frontend and should be enforced by backend if required.
- Expired quote cannot be sent or signed.
- Expired quote behavior should be backend-enforced, not only frontend-enforced.
- Client can only sign their own quote.
- Signing requires signature.
- Signing a quote changes status to `SIGNED` and sets `signed_at`.
- Signing stores signature without writing to forbidden media root in tests.
- Signing signed/declined quote again is rejected.
- Declining quote changes status to `DECLINED`.
- Declining signed quote is rejected.
- Signed quote triggers invoice only if service is active and `auto_generate_invoices=true`.
- Signed quote should not trigger duplicate invoice if invoice already exists.
- Quote delete soft-deletes and hides from list.
- Soft-deleted quote should not block new quote if product expects that.
- Quote number generation is unique and sequential per year.
- Concurrent quote creation should not produce duplicate quote numbers.
- Client quote preview renders general terms, divider, additional terms, notes, signature controls.
- Rich text general terms render safely and formatted on client side.
- Additional terms plain text preserves new lines.

### 10. Invoice Scenarios

- Manager can create invoice with business/client/service that match.
- Invoice creation fails if client does not belong to business.
- Invoice creation fails if service does not belong to same business/client.
- Auto invoice is created when quote is signed and service is active with auto invoices enabled.
- Auto invoice is created when service becomes active after quote was already signed.
- Auto invoice is not created when service inactive.
- Auto invoice is not created when quote not signed.
- Auto invoice is not created when `auto_generate_invoices=false`.
- Auto invoice is not duplicated when service already has an active invoice.
- Auto invoice due date is current date + 2 days.
- Auto invoice subtotal equals service price.
- Auto invoice tax amount uses current business tax rate.
- Auto invoice total equals subtotal plus tax.
- Manager can edit draft/sent invoice fields.
- Sending invoice changes status to `SENT` and sends email once.
- Updating an already sent invoice should not resend email unless status transitions from non-SENT to SENT.
- Marking invoice paid manually sets `paid_at`.
- Re-marking already paid invoice should not reset `paid_at` unless expected.
- Client invoice list excludes draft invoices.
- Client cannot view another client's invoice.
- Client cannot pay draft/cancelled invoice if product expects blocked.
- Invoice delete soft-deletes and hides from manager/client lists.
- Deleted invoice should hide linked payout or preserve payout history according to product decision.
- Dashboard revenue should include paid invoice in monthly/yearly views.
- Dashboard should use `paid_at` or fallback consistently.
- Dashboard should not count cancelled invoices as revenue.

### 11. Payment Method And Stripe Scenarios

- Client creates setup intent successfully.
- Setup intent creates/reuses Stripe customer.
- Save payment method stores Stripe payment method id and card metadata.
- Save payment method fails if payment method id missing.
- Save payment method fails if Stripe attach fails.
- Client card update replaces displayed card info.
- Business Connect onboarding creates Stripe Express account.
- Returning from Stripe without completing onboarding should not show connected bank details.
- Check bank account fails cleanly if no connected account exists.
- Check bank account fails cleanly if connected account has no external account.
- Check bank account updates bank name, last4, country, currency, holder fields.
- Disconnect/delete banking info should revert UI to not connected.
- Local development should handle missing Stripe keys gracefully where possible.
- Production should use configured Stripe keys and frontend URLs.

### 12. Invoice Payment And Payout Scenarios

- Client cannot pay invoice without active payment method.
- Client cannot pay invoice if business has no connected Stripe account.
- Client cannot pay invoice already marked `PAID`.
- Successful payment creates Stripe PaymentIntent.
- Successful payment marks invoice `PAID`.
- Successful payment sets `paid_at`.
- Successful payment creates payout with status `PAID`.
- Payout amount equals invoice total.
- Payout net display subtracts Stripe fee consistently.
- Payment failure does not mark invoice paid.
- Payment failure does not create payout.
- Duplicate double-click on pay should not create duplicate charges or payouts.
- Manager can view payout list.
- Client should not see payout actions.
- Client paid invoice should not show view payout button.
- Payout refund requires Stripe payment intent id.
- Payout refund cannot happen twice.
- Partial refund stores refunded amount.
- Full refund stores payout amount as refunded amount.
- Refund failure stores failure reason.
- Refund status `REFUNDED` should be supported by model choices/UI if product uses it.
- Deleted payout should not appear in active payout list.
- Payout list actions match invoice list button design.
- Payout detail title and summary reflect service/client/invoice clearly.

### 13. Job And Employee Scenarios

- Manager can create job for service.
- Job assigned team member must belong to same business.
- Job cannot be assigned to team member from another business.
- Employee sees only assigned jobs.
- Client sees jobs for their own services.
- Manager sees all business jobs.
- Employee job details show service/client/address and assigned name.
- Employee job information is read-only.
- Employee can upload before image.
- Before image changes job status to `IN_PROGRESS`.
- Before image clears `completed_at`.
- Employee can upload after image.
- After image changes job status to `COMPLETED`.
- After image sets `completed_at`.
- Duplicate before image is rejected.
- Duplicate after image is rejected.
- After image upload before before image should be allowed or blocked according to product decision.
- Uploading before image after after image should be blocked if completed job should remain completed.
- Deleting before/after image should or should not revert job status according to product decision.
- Employee is redirected back to jobs page after successful upload without page reload.
- Employee cannot upload photo for job not assigned to them.
- Client cannot upload job photos.
- Manager photo upload behavior should be defined.
- Job delete soft-deletes photos.
- Job cancelled should block photo uploads if product expects that.
- Completed job should still show before/after photos.
- Photo upload uses temp media root in tests.

### 14. Team Member Scenarios

- Manager can add team member by existing user.
- Manager cannot add a user who owns a business as team member.
- Duplicate team member in same business is rejected.
- Same employee can belong to multiple businesses if product allows.
- Team member role displays correctly from user role.
- Employee role cannot add team members.
- Employee role cannot see `Add Member`.
- Deleting team member hides them from list.
- Deleting team member with assigned future jobs should be tested:
  - assigned jobs become unassigned because job FK uses `SET_NULL`, or remain if soft delete only hides team member.
  - employee should lose access to jobs if no active team membership.
- Deactivating employee user should affect login and team list.
- Team stats update after add/delete.

### 15. Dashboard And Reporting Scenarios

- Dashboard loads for manager, client, and employee according to access.
- Manager dashboard counts clients, active jobs, pending quotes, unpaid invoices, team members, monthly revenue.
- Revenue chart appears on hard reload and tab navigation.
- Revenue chart has data when paid invoice exists.
- Monthly filter buckets paid invoice in correct month.
- Weekly filter buckets paid invoice in correct week.
- Yearly filter buckets paid invoice in correct year.
- Revenue chart handles one data point without appearing blank.
- Revenue chart handles no data with empty state.
- Revenue chart excludes unpaid/cancelled invoices.
- Recent quotes and invoices display correct statuses.
- Recent activity orders by most recent event.
- Upcoming jobs exclude completed/cancelled jobs.
- Jobs status progress bars match counts.
- Questionnaire summary counts templates, pending review, completed responses.
- Dashboard should not leak another business's data.
- Dashboard should handle paginated invoice responses.
- Dashboard should handle API errors gracefully.

### 16. Public Pages, Marketing Content, And Contact Scenarios

- FAQ page fetches active FAQs from backend.
- Inactive FAQs do not show.
- FAQ seed data is inserted only once or is idempotent.
- FAQ order respects `sort_order`.
- Contact form validates first name, last name, email, company name, message, and privacy consent.
- Contact form sends email to all active staff users.
- Contact form returns clear 503 when no active staff recipients exist.
- Local email backend outputs to console if configured.
- Production email uses configured provider/API key.
- Public business logo marquee fetches max 10 active logos.
- Marquee hides fallback logos when at least one real logo exists.
- Marquee uses fallbacks when no logos exist.
- Broken logo image should not break marquee layout.
- `/admin` route redirects to backend Django admin.
- Auth redirects preserve intended `next` route.

### 17. Soft Delete, Restore, And Data Integrity Scenarios

- Soft-deleting questionnaire hides it from service creation.
- Soft-deleting terms template hides it from service creation and quote creation.
- Soft-deleting service hides related quotes/jobs from default lists if cascade applies.
- Soft-deleting quote hides it but preserves quote number history.
- Soft-deleting invoice hides it from manager/client lists.
- Soft-deleting payout hides it from payout list.
- Soft-deleting job hides job photos.
- Restoring parent records restores children when cascade restore is intended.
- Soft-deleted records should not count in dashboard metrics.
- Soft-deleted records should not block duplicate creation unless product intends.
- Admin hard delete behavior should be tested separately from soft delete.

### 18. Email And Magic Link Scenarios

- Registration email link points to correct frontend URL.
- Password reset email link points to correct frontend URL.
- Questionnaire email link includes questionnaire id, service id, and magic token.
- Quote email link includes quote id and magic token.
- Invoice email link points to invoice portal.
- Magic login should not log the wrong user into another client's resource.
- Expired magic token should show clear failure.
- Email failure surfaces useful frontend/backend message.
- Emails should not expose sensitive internal IDs beyond required portal links.
- Links should work in local Docker and production VPS environments.

### 19. API Format And Frontend Cache Scenarios

- List endpoints returning arrays and paginated objects are both handled where currently supported.
- RTK Query invalidates correct tags after create/update/delete.
- After creating service, service list refreshes.
- After filling questionnaire, service detail refreshes and quote list refreshes.
- After signing quote, quote detail/list and invoice list refresh.
- After paying invoice, invoice detail/list and payout list refresh.
- After job photo upload, job detail/list and photos refresh.
- Date strings with timezone serialize correctly for business timezone.
- Decimal money values parse correctly as numbers and strings.
- Currency labels remain correct for CAD/USD.
- Rich text HTML persists through create/edit/read/render cycles.
- File/image URLs are absolute where frontend needs absolute URLs.

### 20. Concurrency And Double Submission Scenarios

- Double-click creating service should not create duplicate service.
- Double-click filling questionnaire should not create duplicate quote.
- Double-click sending quote should not send duplicate emails or should be idempotent.
- Two managers creating quote for same service at same time should only create one active non-declined quote.
- Concurrent quote number generation should stay unique.
- Concurrent invoice number generation should stay unique.
- Double-click invoice payment should not create duplicate Stripe charges or duplicate payouts.
- Double upload of before/after photo should reject second upload.
- Rapid template edit/delete while service creation is in progress should not create invalid service.

## Specific Regression Stories To Automate First

These are the highest-value end-to-end stories to automate because they touch multiple dependencies.

### Story A: Full Happy Path

1. Register manager and create business.
2. Add offered service.
3. Create questionnaire for that service.
4. Create general terms template for that service.
5. Create client.
6. Create service with auto quote and auto invoice enabled.
7. Client fills questionnaire.
8. Draft quote is auto-created with general terms snapshot.
9. Manager sends quote.
10. Client signs quote.
11. Manager activates service, or service was already activated after questionnaire.
12. Invoice is auto-created with due date +2 days.
13. Client pays invoice.
14. Payout is created.
15. Dashboard revenue updates.

### Story B: Questionnaire Deleted Mid-Workflow

1. Manager creates questionnaire and terms.
2. Manager creates service and questionnaire email is sent.
3. Manager deletes questionnaire before client submits.
4. Client opens existing link.
5. Verify whether client can submit or gets clear error.
6. Manager tries resend questionnaire and receives clear no-active-questionnaire error.
7. Existing service remains intact.
8. Future service creation for that service is blocked until questionnaire is recreated.

### Story C: Terms Deleted Mid-Workflow

1. Manager creates questionnaire and terms.
2. Manager creates service.
3. Manager deletes terms before quote is generated.
4. Client fills questionnaire.
5. Verify auto quote behavior is clear and safe.
6. Future manual quote creation is blocked until terms template is recreated.
7. Existing service remains intact.

### Story D: Terms Edited After Quote Sent

1. Manager creates terms v1.
2. Manager creates quote and sends it.
3. Manager edits general terms template to v2.
4. Client opens quote signing page.
5. Client still sees v1 copied into quote.
6. Client signs quote.
7. Signed quote keeps v1 and remains immutable.

### Story E: Service Offered Name Changed

1. Business offers `Flooring`.
2. Questionnaire and terms exist for `Flooring`.
3. Active service, quote, job, and invoice exist for `Flooring`.
4. Manager changes offered service name to `Floor Installation`.
5. Existing records remain visible.
6. New `Flooring` service creation is blocked.
7. New `Floor Installation` service requires new questionnaire and terms.
8. Old quote/invoice/job labels remain historically correct or migration behavior is explicitly defined.

### Story F: Signed Quote And Invoice Automation Order

1. Service has auto invoices enabled.
2. Client signs quote while service is still pending.
3. No invoice is created.
4. Manager changes service status to active.
5. Invoice is created once.
6. Manager toggles service status away and back to active.
7. Duplicate invoice is not created.

### Story G: Employee Job Completion

1. Manager creates service and job assigned to employee.
2. Employee logs in.
3. Employee sees only assigned job.
4. Employee uploads before photo.
5. Job becomes in progress.
6. Employee cannot upload another before photo.
7. Employee uploads after photo.
8. Job becomes completed.
9. Employee cannot upload another after photo.
10. Client/manager can see photos and completed status.

### Story H: Payment And Payout Failure Handling

1. Invoice is sent to client.
2. Client has no payment method.
3. Payment is blocked with clear message.
4. Client adds card.
5. Business has no connected bank account.
6. Payment is blocked with clear message.
7. Business connects bank account.
8. Payment succeeds and payout is created.
9. Re-paying same invoice is blocked.
10. Payout refund succeeds once and second refund is rejected.

## Recommended Test Layers

- Unit/model tests: validation, soft delete, quote/invoice number generation, status transitions.
- Serializer tests: service prerequisites, quote terms snapshot, 10,000-word cap, duplicate job photos.
- API tests: role permissions, list scoping, workflow actions, payment failure paths.
- Frontend component tests: buttons hidden by role, empty states, form validation, rich text behavior.
- E2E tests: full happy path, deleted templates mid-workflow, quote signing, invoice payment, job photo completion.
- CI safeguards: temp media roots for upload tests, mocked Stripe calls, console email backend for local tests.

## Open Product Decisions To Clarify

- Should questionnaires be snapshotted onto services at creation, or should services always use the latest active questionnaire?
- Should terms templates be snapshotted only onto quotes, or also onto services when services are created?
- Should editing a service after quote/invoice/job creation be limited?
- Should quote expiration be a real backend status or computed only from `valid_until`?
- Should payout status include `REFUNDED` in model choices?
- Should service cancellation automatically cancel future jobs, quotes, or invoices?
- Should deleting team members unassign their jobs immediately?
- Should employees be allowed to upload after photo before before photo?
- Should deleting job photos revert job status?
- Should invoice payment be idempotent with a server-side lock/payment intent reuse?
