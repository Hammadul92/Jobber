# Public Site SEO Rollout Plan

This roadmap turns the `GetContractorz_SEO_Strategy_and_Website_Copy.docx` recommendations into an iterative implementation sequence for the Django-rendered public pages.

## Phase 1: Foundation Cleanup

Goal: clean the existing public site before adding new SEO pages.

- Standardize the brand name as `GetContractorz` across public templates, metadata, footer copy, legal pages, structured data, and emails where public-facing.
- Replace outdated or unrelated copy, especially homepage HR/SaaS copy, FAQ placeholders, Team placeholders, footer AI/design copy, and old support/legal language.
- Remove unverifiable claims such as `100+ trusted partners`, fictional testimonials, and unrelated logos unless they represent real customers, partners, businesses, or integrations.
- Rename public `Services` navigation to `Features` because GetContractorz provides software, not physical services.
- Decide the canonical domain, preferably `https://getcontractorz.com`, and redirect the alternate `www`/non-`www` version permanently.

## Phase 2: Core Page SEO Rewrite

Goal: update the existing main Django public pages with approved SEO copy and metadata.

- Rewrite the homepage around the primary keyword `service business management software`.
- Improve the marketplace page as a public directory of registered businesses, including a clear marketplace disclaimer.
- Rewrite the About page around GetContractorz's product purpose, service-business workflow, and Calgary base.
- Replace Team placeholder content with credibility-focused team copy.
- Replace FAQ content with real product, workflow, payments, roles, marketplace, and support FAQs.
- Align the Contact page with product questions, account support, marketplace enquiries, payment questions, business partnerships, and privacy/data requests.
- Complete Privacy Policy and Terms and Conditions, or temporarily mark unfinished legal pages as `noindex`.

## Phase 3: URL Architecture Restructure

Goal: add the missing SEO landing pages and align navigation around the new architecture.

- Add `/features`.
- Add `/how-it-works`.
- Add `/features/client-management`.
- Add `/features/quotations`.
- Add `/features/job-management`.
- Add `/features/team-management`.
- Add `/features/invoicing-payments`.
- Add `/features/client-portal`.
- Update the main navigation, feature dropdown, footer links, internal CTAs, and sitemap entries to match the new page structure.
- Redirect or replace the old generic `/services` page with `/features`.

## Phase 4: Technical SEO Layer

Goal: make the public pages easier for search engines to understand and index correctly.

- Ensure every indexable page has exactly one H1.
- Add a unique SEO title and meta description for every public page.
- Add self-referencing canonical URLs.
- Add breadcrumbs to internal feature pages.
- Render main page copy in initial Django HTML, not only through JavaScript.
- Add descriptive alt text to meaningful product visuals.
- Link feature pages contextually from homepage, feature overview, how-it-works, and footer sections.
- Add structured data where appropriate:
  - `Organization` on homepage and About page.
  - `SoftwareApplication` on homepage.
  - `FAQPage` on FAQ page.
  - `BreadcrumbList` on internal feature pages.
  - `ItemList` on marketplace.
  - `ContactPage` on Contact page.
  - `AboutPage` on About page.
- Avoid review or aggregate-rating schema until real reviews exist.
- Add `noindex, follow` to auth/private pages such as sign-in, register, forgot password, and dashboard routes.

## Phase 5: Legal and Trust Pages

Goal: support launch credibility and reduce indexing risk from unfinished legal content.

- Add or complete `/cookie-policy`.
- Add or complete `/acceptable-use-policy`.
- Add or complete `/payment-and-refund-policy`.
- Add or complete `/data-processing-agreement`.
- Add or complete `/account-and-data-deletion`.
- Clearly explain Stripe's role in payment processing and avoid implying GetContractorz stores complete payment-card credentials unless that is technically accurate.
- Keep unfinished legal/support pages out of search results until they are complete.

## Phase 6: QA, Redirects, and Regression

Goal: verify the SEO migration does not break routing, indexing, layout, or dashboard separation.

- Test that all Django public routes render server-side HTML correctly.
- Confirm sitemap includes all intended public pages and excludes private/auth/dashboard/API/admin routes.
- Confirm `robots.txt` blocks `/admin/`, `/api/`, and `/user/` routes.
- Confirm removed or renamed URLs redirect correctly, especially `/services` to `/features`.
- Confirm the selected canonical domain redirects consistently.
- Check mobile header, desktop navigation, feature dropdown, account menu, footer, marketplace search, FAQ accordion, and contact form.
- Add or update public-site tests for route rendering, metadata, H1 count, canonical URLs, sitemap output, redirects, and structured data.
- Run backend and frontend test/build checks before deployment.

## Recommended Sequence

Ship the work in this order:

1. Foundation cleanup.
2. Core page rewrites.
3. New URL architecture and feature pages.
4. Technical SEO and structured data.
5. Legal/trust pages.
6. Redirects, QA, tests, and deployment validation.

This sequence prevents new SEO pages from being built on top of inconsistent messaging and keeps the public Django site stable throughout the rollout.
