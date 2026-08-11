# GetContractorz Public Website Design System

**Document type:** Implementation specification  
**Scope:** New public pages only  
**Product dashboard:** Out of scope; do not redesign or restyle it from this document  
**Visual reference audited:** `https://getcontractorz.com/` public homepage, About, Contact, FAQ, and Services routes  
**Product/content source of truth:** `GetContractorz Public Website Foundation`  
**Design objective:** Preserve the current GetContractorz visual identity and design sense while allowing every public page to use new, product-accurate sections and content.

---

## 1. Core rule

The existing public website is a **visual reference, not a content reference**.

Reuse:

- The established brand colors.
- The existing GetContractorz logo.
- The current display and body typography.
- The spacious, centered hero composition.
- The geometric decorative language.
- The alternating light, white, and navy section rhythm.
- The rounded cards, restrained shadows, and orange calls to action.
- The current sense of scale, whitespace, and responsive stacking.

Do not automatically reuse:

- Existing copy.
- Testimonials or customer identities.
- Statistics.
- Partner/customer logos.
- Ratings or star counts.
- “Trusted,” “verified,” “screened,” or “approved” claims.
- “50+ industries,” “100+ partners,” “100,000 homeowners,” or similar counts.
- Services that are not among the currently supported categories.
- Pricing language for plans that do not yet exist.
- Guarantees, integrations, support promises, response times, or offline/mobile claims that have not been verified.

Every public claim must be supported by the current product, approved business information, or reliable platform data.

---

## 2. Desired brand impression

Every new public page should feel:

- Professional.
- Trustworthy without implying verification.
- Simple and easy to understand.
- Helpful and practical.
- Organized.
- Modern, but not trendy or experimental.
- Built for real service-business operations.

The site should not feel:

- Like a generic startup template.
- Like a construction company that performs services itself.
- Like a lead marketplace that guarantees work.
- Corporate, cold, or overly technical.
- Loud, crowded, or dominated by orange.
- Dependent on stock photos or decorative dashboards.

---

## 3. Visual identity summary

The current design combines four recognizable ideas:

1. **Strong operational confidence** through deep navy sections and bold uppercase display headings.
2. **Energy and direction** through orange highlights and CTAs.
3. **Clarity and breathing room** through the soft-gray canvas, white sections, and large spacing.
4. **A contractor-adjacent visual language** through simple geometric outlines, line icons, cards, and structured grids rather than literal job-site photography.

New sections may use different content and layouts, but they must continue these four ideas.

---

## 4. Design tokens

### 4.1 Color palette

These values are taken from the current rendered public website.

| Token | Value | Use |
|---|---:|---|
| `--gc-navy` | `#09355D` | Brand secondary, dark sections, footer, secondary buttons |
| `--gc-orange` | `#FF7A00` | Primary CTA, highlighted words, active accents, borders |
| `--gc-orange-hover` | `#FF8B00` | Hover state for orange actions |
| `--gc-page` | `#F5F7F9` | Default page and light-section background |
| `--gc-white` | `#FFFFFF` | White sections, cards, reverse text |
| `--gc-ink` | `#171717` | Primary body and heading color |
| `--gc-card-dark` | `#131317` | Dark card variant |
| `--gc-card-dark-soft` | `#22242F` | Alternate dark card variant |
| `--gc-muted-on-dark` | `#F2F2F2` | Supporting copy inside dark cards |
| `--gc-white-70` | `rgba(255,255,255,.70)` | Footer and secondary text on navy |
| `--gc-white-08` | `rgba(255,255,255,.08)` | Dividers on navy |
| `--gc-border` | `#E5E7EB` | Light borders for cards and form controls |
| `--gc-field` | `#F9FAFB` | Form-field background |
| `--gc-success-dot` | `#4DB886` | Optional small status dot in neutral eyebrow labels |

Recommended CSS variables:

```css
:root {
  --gc-navy: #09355d;
  --gc-orange: #ff7a00;
  --gc-orange-hover: #ff8b00;
  --gc-page: #f5f7f9;
  --gc-white: #ffffff;
  --gc-ink: #171717;
  --gc-card-dark: #131317;
  --gc-card-dark-soft: #22242f;
  --gc-muted: #5f6670;
  --gc-muted-on-dark: #f2f2f2;
  --gc-border: #e5e7eb;
  --gc-field: #f9fafb;
}
```

### 4.2 Color usage ratio

Use the palette approximately as follows across a page:

- 60–70% soft gray and white backgrounds.
- 20–30% navy sections, text, or controls.
- 5–10% orange accents and actions.

Orange must identify priority. Do not turn entire content sections orange and do not highlight several competing items in the same viewport.

### 4.3 Approved color combinations

| Background | Primary text | Secondary text | Accent/action |
|---|---|---|---|
| Soft gray | Ink | Muted gray | Orange or navy |
| White | Ink | Muted gray | Orange or navy |
| Navy | White | White at 70–80% | Orange |
| Dark card | White | `#F2F2F2` | Orange sparingly |

Do not place orange body copy on white at small sizes. Orange is appropriate for large display words, icons, borders, and controls.

---

## 5. Typography

### 5.1 Font families

The current site uses three typography roles:

| Role | Family | Use |
|---|---|---|
| Display | `MODERNIZ, sans-serif` | Hero H1s, major H2s, strong uppercase statements |
| Intro/marketing | `Open Sans, sans-serif` | Large supporting copy and the CTA-panel heading |
| Interface/body | `Inter, Ubuntu, Arial, sans-serif` | Navigation, paragraphs, labels, cards, buttons, forms |

Continue using the existing `Moderniz.otf` asset. Define it once:

```css
@font-face {
  font-family: "MODERNIZ";
  src: url("/fonts/Moderniz.otf") format("opentype");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}
```

### 5.2 Type scale

Use responsive `clamp()` values so headings preserve the current scale without breaking on narrow screens.

```css
:root {
  --gc-text-xs: 0.75rem;
  --gc-text-sm: 0.875rem;
  --gc-text-base: 1rem;
  --gc-text-lg: 1.125rem;
  --gc-text-xl: 1.25rem;
  --gc-h3: clamp(1.25rem, 1.6vw, 1.5rem);
  --gc-h2: clamp(1.5rem, 2.4vw, 1.875rem);
  --gc-h1: clamp(1.7rem, 4.1vw, 3.5rem);
  --gc-cta-title: clamp(2rem, 3.5vw, 3rem);
}
```

Current desktop reference:

- Homepage H1: approximately `51.2px / 70.4px`.
- Inner-page H1: approximately `56px / 77px`.
- Major H2: approximately `30px / 36–56px`, depending on composition.
- Hero supporting text: up to `24px / 32px`.
- Standard body: `16px / 24px`.
- Navigation: `18px / 28px`, medium.
- Buttons: `16px / 24px`, semibold.

### 5.3 Heading rules

- Use MODERNIZ for H1 and visual H2 statements.
- Uppercase display headings are part of the current identity; title case is acceptable for warmer or utility pages.
- Keep most H1s to 6–12 words and no more than three desktop lines.
- Highlight one meaningful phrase or one to two words in orange.
- Do not color several unrelated fragments orange.
- Keep display headings at weight 400; the font itself carries visual weight.
- Use Inter for card titles and practical subheadings.
- Maintain one semantic H1 per page regardless of visual style.

### 5.4 Copy measure

- Long paragraph width: `60–72ch`.
- Centered hero paragraph width: `44–60rem`.
- Card copy: usually `28–42ch`.
- Avoid justified body text except where an existing footer treatment is intentionally preserved; left alignment is more readable.

---

## 6. Spacing and sizing

The existing site is built on a 4px spacing unit.

```css
:root {
  --gc-space-1: 0.25rem;  /* 4 */
  --gc-space-2: 0.5rem;   /* 8 */
  --gc-space-3: 0.75rem;  /* 12 */
  --gc-space-4: 1rem;     /* 16 */
  --gc-space-5: 1.25rem;  /* 20 */
  --gc-space-6: 1.5rem;   /* 24 */
  --gc-space-8: 2rem;     /* 32 */
  --gc-space-10: 2.5rem;  /* 40 */
  --gc-space-12: 3rem;    /* 48 */
  --gc-space-16: 4rem;    /* 64 */
  --gc-space-20: 5rem;    /* 80 */
  --gc-space-24: 6rem;    /* 96 */
  --gc-space-28: 7rem;    /* 112 */
  --gc-space-32: 8rem;    /* 128 */
}
```

### 6.1 Page gutters

| Viewport | Horizontal gutter |
|---|---:|
| Mobile, under 768px | 24px |
| Tablet, 768–1023px | 64px |
| Desktop, 1024px+ | 128px |

At very wide resolutions, cap the content container at `1152–1200px` and center it. The background and section color may continue edge to edge.

```css
.gc-container {
  width: min(100% - 48px, 1152px);
  margin-inline: auto;
}

@media (min-width: 768px) {
  .gc-container { width: min(100% - 128px, 1152px); }
}
```

### 6.2 Section spacing

Use one of three section densities:

| Density | Mobile | Desktop | Use |
|---|---:|---:|---|
| Compact | 48px | 64–80px | Small trust strip, supporting block |
| Standard | 64–80px | 96px | Most content sections |
| Feature | 80–96px | 112px | Major narrative, FAQ, CTA, category sections |

The existing homepage uses 112px vertical padding for major desktop sections. Preserve that spaciousness, but do not force a full viewport height when the content is short.

### 6.3 Gaps

- Heading to supporting copy: 12–20px.
- Copy to CTA: 24–32px.
- Section heading block to cards: 32–48px.
- Card grid gap: 16px for dense grids, 24px for feature/category grids.
- Two-column narrative gap: 40–80px.
- Footer-column gap: 32px mobile, up to 80px desktop.

---

## 7. Border radii and shadows

### 7.1 Radii

| Token | Value | Use |
|---|---:|---|
| `--gc-radius-sm` | 8px | Small icon holders, tags |
| `--gc-radius-md` | 12px | Buttons, inputs, utility cards |
| `--gc-radius-lg` | 16px | Marketplace and category cards, form panels |
| `--gc-radius-xl` | 24px | Testimonial-style dark cards, major CTA panel |
| `--gc-radius-pill` | 9999px | Eyebrow labels, circular avatars, pill CTAs |

### 7.2 Shadows

The design uses shadows sparingly. Use them to lift interactive cards, not every container.

```css
:root {
  --gc-shadow-sm: 0 1px 3px rgb(0 0 0 / 0.10),
                  0 1px 2px -1px rgb(0 0 0 / 0.10);
  --gc-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.10),
                  0 2px 4px -2px rgb(0 0 0 / 0.10);
  --gc-shadow-xl: 0 20px 25px -5px rgb(15 23 42 / 0.10),
                  0 8px 10px -6px rgb(15 23 42 / 0.10);
  --gc-shadow-orange: 0 10px 15px -3px rgb(255 122 0 / 0.30),
                      0 4px 6px -4px rgb(255 122 0 / 0.30);
}
```

- Utility/form card: border + `shadow-sm`.
- Dark quote/story card: `shadow-md`.
- Category/Marketplace card: `shadow-xl` only when it sits over a visually rich or dark background; otherwise use `shadow-sm`.
- Primary pill CTA may use the orange shadow.

---

## 8. Responsive layout system

Use the same practical breakpoint behavior as the current Tailwind-based implementation:

| Name | Minimum width | Primary changes |
|---|---:|---|
| Base/mobile | 0 | Single column, 24px gutters, compact headings, mobile navigation |
| `md` | 768px | 64px gutters, two-column grids, larger type and spacing |
| `lg` | 1024px | 128px gutters, desktop navigation, 3–4 column grids, large hero |
| `xl` | 1280px | Container remains capped; do not keep stretching text/cards |

### 8.1 Grid behavior

- Feature cards: 1 column → 2 columns → 3 columns.
- Category cards: 1 column → 2 columns → 4 columns.
- Testimonial or story cards: 1 column → 2 columns.
- Marketplace results: 1 column → 2 columns → 3 columns.
- Footer: stacked → 2 columns → 4 columns.
- Split sections: stacked with copy first → two columns at `md` or `lg`.

### 8.2 Mobile requirements

- Minimum horizontal gutter: 24px.
- Minimum tap target: 44 × 44px.
- Full-width primary CTAs are acceptable below 480px.
- Cards must never rely on hover to reveal essential information.
- Decorative artwork must crop safely and never create horizontal scroll.
- Do not use a viewport-height hero on small screens if it pushes the CTA below the fold.
- Use `font-size: clamp(...)`; never solve overflow by shrinking text below 24px for the H1.

---

## 9. Global page shell

### 9.1 Announcement bar

The current site begins with a 36px navy strip:

- Background: navy.
- Text: white.
- Size: 14px, medium.
- Padding: 8px 16px.
- Alignment: centered.

Use it only for a useful, accurate message such as current free access or a product announcement. If there is no meaningful message, remove the bar and move the header to the top. Do not keep filler copy.

### 9.2 Header

Desktop reference:

- Fixed below the 36px announcement bar.
- Soft-gray background.
- 128px side padding at desktop.
- Approximately 56px rendered height.
- Logo width: approximately 176px at desktop and 152px on smaller screens.
- Navigation: 18px/28px, medium, 40px horizontal gap.
- Login action: orange, 12px radius, 8px × 24px padding.
- Active link: navy and bold.
- Hover link: orange.
- Z-index: 30.
- Top transition: 150ms ease-in-out if the header hides/reappears on scroll.

Header behavior:

- Reserve the combined announcement/header height in page flow so content is not hidden.
- On mobile, show logo plus one menu trigger.
- The mobile menu should open as an accessible panel below the header, not a tiny dropdown.
- Include the main CTA in the mobile menu.
- Use `aria-current="page"` for the active link.
- The primary public navigation should reflect the new information architecture; it does not need to preserve inaccurate labels or dead links.

Recommended public navigation:

- Home
- Features or How It Works
- Industries
- Marketplace
- About
- FAQ
- Contact
- Login
- Get Started Free

If space is limited, place About, FAQ, and Contact in a Resources dropdown.

### 9.3 Footer

Current desktop reference:

- Background: navy.
- Text: white.
- Padding: 72px 128px.
- Four columns.
- Section heading: 24–30px.
- Links/body: 16px, white at 70%.
- Column gap: up to 80px.
- Copyright row separated by a 2px white/20% divider.

Required footer groups:

- Short, accurate GetContractorz description.
- Product links.
- Marketplace and industry links.
- Help/legal links.
- Verified public contact details.

Only include social icons when real profiles exist. Remove placeholder networks.

---

## 10. Core components

### 10.1 Eyebrow/status label

The current inner-page hero uses a small outlined pill above the H1.

Specification:

- Inline-flex.
- 12–14px uppercase or medium label.
- Border: 1px solid light gray; use orange only when the label is itself a CTA.
- Radius: pill.
- Padding: 6–8px vertical, 12–20px horizontal.
- Optional 8–10px green or orange dot.
- Gap: 8px.
- Keep labels short.

Use for context such as “FOR SERVICE BUSINESSES,” “HOW IT WORKS,” or a supported category. Never use a green dot to imply verification or live support unless that state is real.

### 10.2 Display heading with accent text

- Font: MODERNIZ.
- Color: ink or white according to background.
- One accent fragment in orange.
- Centered in hero/FAQ; left-aligned in narrative sections.
- Preserve normal document text in the DOM; do not render heading words as images.

### 10.3 Primary button

Current core style:

- Background: orange.
- Hover: `#FF8B00`.
- Text: white, 16px semibold.
- Radius: 12px.
- Padding: 8px 24px; use 12px 32px for larger pill CTA.
- Transition: 300ms.
- Hover scale: maximum `1.02`.
- Optional right arrow; arrow should move 2–4px on hover.

Primary labels should be action-specific:

- Get Started Free
- Create Your Free Account
- Explore the Marketplace
- View Business
- Contact This Business

### 10.4 Secondary button

- Background: navy.
- Hover: navy at 90% opacity.
- Text: white.
- Radius: 12px.
- Padding: 8px 24px.
- Use when the orange action already exists in the same section.

### 10.5 Tertiary link

- Ink or navy text.
- Semibold.
- Optional arrow.
- Underline on hover or use a 2px orange underline.
- Must have a visible keyboard focus state.

### 10.6 Utility card

Matches the current Contact-page cards:

- Background: soft gray or white.
- Border: 1px solid `--gc-border`.
- Radius: 12px.
- Padding: 24px mobile, 32px desktop.
- Shadow: small.
- Icon holder: 40–48px square, white or soft gray, 8px radius.
- Title: 18–20px medium/semibold.
- Body: 14–16px muted.
- Internal gap: 16px.

### 10.7 Feature card

- White surface on soft-gray section.
- Radius: 16–24px.
- Padding: 24–32px.
- Optional line icon.
- Title: 20px medium.
- Description: 16–18px with 1.5–1.7 line height.
- Equal heights within the same row.
- Avoid decorative badges unless they communicate a real state.

### 10.8 Dark emphasis card

The current homepage uses alternating `#131317` and `#22242F` cards.

- Radius: 24px.
- Padding: 24px.
- Title: white, 22–24px.
- Body: `#F2F2F2`, 14–16px.
- Shadow: medium.
- Use for concise workflow outcomes, role summaries, or real customer stories in the future.
- Do not populate this component with invented testimonials.

### 10.9 Category card

Current visual reference:

- White background.
- 16px radius.
- 24px padding.
- Small neutral icon tile.
- Category title: 16–18px semibold.
- Description: 14px muted.
- Up to four columns on desktop.

For the new website, render only the current 16 categories:

1. Construction
2. Cleaning
3. Landscaping
4. Plumbing
5. Electrical
6. Snow Removal
7. HVAC
8. Roofing
9. Siding
10. Handyman Services
11. Flooring
12. Windows & Doors
13. Appliance Repair
14. Moving Services
15. Carpet Cleaning
16. Pest Control

The category list must come from data/configuration so additional categories can be added without redesigning the page. Do not hard-code “16” in marketing copy unless the count is generated dynamically.

### 10.10 Marketplace business card

This is a new component that must still use the existing visual language.

Structure:

1. Logo or initials tile.
2. Business name.
3. One primary category and optional additional category chips.
4. City/region and country, only when supplied by the business.
5. Short description or service summary, if available.
6. “View Business” action.

Style:

- White background.
- 1px light border.
- 16px radius.
- 24px padding.
- Small shadow; slightly stronger on hover.
- 2px orange top border or orange icon is allowed, but not both when the card already has a primary orange CTA.
- Hover: translate up no more than 2px.
- Business name: 20px semibold.
- Chips: soft-gray background, navy text, pill radius, 12–14px.

Do not show:

- Verified badges.
- Ratings without real review data.
- “Best” or “recommended” labels.
- Guaranteed response times.
- Fake project counts.

### 10.11 Business profile header

For a Marketplace detail page:

- Use a standard inner-page hero, not the oversized marketing homepage hero.
- Place business logo/initials, business name, categories, and location in a white 16–24px-radius panel.
- Place direct contact actions prominently: email and phone only when the business supplied them for public display.
- Use navy for the primary contact button and orange for one priority action if two actions exist.
- Include a calm, visible disclaimer that listing information is supplied by the business and is not independently verified by GetContractorz.

### 10.12 Form controls

Current reference:

- Height: approximately 42px for fields and 48px for the submit action.
- Background: `#F9FAFB` or white.
- Border: 1px solid `#E5E7EB`.
- Radius: 12px.
- Padding: 8px 12px for inputs; 12px 16px for textareas.
- Font: Inter 16px/24px.
- Form panel: white, 16px radius, 32px padding, light border, small shadow.

Required states:

- Hover border: slightly darker gray.
- Focus border: orange.
- Focus ring: 2–3px orange at 25–35% opacity.
- Error border: accessible red with an inline error message.
- Success message: never rely on green alone; include text/icon.
- Disabled state: reduced opacity and `not-allowed` cursor.

Use persistent labels. Placeholder text is an example, not a label.

### 10.13 Step list

Use the Contact-page pattern for processes:

- Number in a 32–40px outlined circle.
- Title: 18–20px semibold.
- Supporting text: 14–16px muted.
- 24–32px vertical gap.
- On desktop, use a vertical sequence beside a related form, image, or product panel.
- On mobile, keep steps in one column and do not draw a complicated connector line.

### 10.14 FAQ accordion

The current FAQ design sits on navy and uses clean dividers.

- Section background: navy.
- Heading: centered, white with “Questions” or another meaningful fragment in orange.
- Accordion max width: approximately 850px.
- Each row: 24px vertical padding.
- Divider: 1px white at 8% opacity.
- Question: white, 17–20px semibold.
- Answer: white at 75–85% opacity, 15–17px.
- Plus/chevron: orange or white.
- The entire question row must be clickable.

Do not reserve a full viewport of empty navy while FAQ data loads. Render a compact skeleton or server-render the FAQs.

### 10.15 Final CTA panel

This is a signature reusable section.

Current desktop reference:

- Outer section: soft gray with 112px vertical padding.
- Inner panel: max width about 1152px.
- Border: 2px orange.
- Radius: 24px.
- Padding: 112px vertical, 40px horizontal on desktop.
- Center aligned.
- Heading: Open Sans, 48px, bold.
- Supporting copy: max width about 512px.
- Orange primary action.
- Existing `CTA-Gradient.svg` provides a soft orange/navy wash.

The background wash is allowed only as a subtle brand atmosphere. It must not reduce text contrast or become a general-purpose gradient style across all sections.

### 10.16 Statistics strip

Visual pattern:

- Full-width navy background.
- White values and labels.
- Four columns desktop, stacked/two-column mobile.
- 64–72px value size on wide screens.
- 80px desktop vertical padding.

Use this component only after real figures are approved. Until then, omit the section entirely; do not replace statistics with placeholders.

### 10.17 Trust/partner strip

The current site uses a white marquee strip with partner logos. Preserve the visual pattern only if authentic partner or customer logos are approved.

If no approved logos exist:

- Omit the strip.
- Do not show “LogoIpsum,” anonymous marks, fake names, or generic trust counts.
- Do not substitute unsupported testimonials.

---

## 11. Section patterns

New pages should be assembled from these patterns rather than duplicating one page verbatim.

### 11.1 Signature centered hero

Use for Homepage, About, Contact, and major product pages.

Composition:

1. Optional eyebrow pill.
2. Display H1 with one orange phrase.
3. One clear supporting paragraph.
4. One primary CTA and optionally one secondary action.
5. Sparse decorative shapes behind the content.

Style:

- Background: soft gray.
- Text centered.
- Content max width: 1090–1152px.
- Desktop min-height: approximately `min(900px, calc(100svh - header))`; allow content height to win.
- Mobile: auto height with 120–160px top padding depending on fixed-header height.
- Decorations must use `pointer-events: none` and `aria-hidden="true"`.

### 11.2 Compact inner-page hero

Use for Marketplace, FAQ, legal pages, and category details.

- Soft-gray or navy background.
- 160–240px vertical space after the header.
- H1 maximum 48px desktop.
- Left-aligned for listing/detail pages; centered for informational pages.
- Optional breadcrumb above the eyebrow label.
- CTA optional.

### 11.3 Split narrative section

Use when a page must explain a problem and the product response.

- Background: white.
- Two columns desktop; stack mobile.
- Heading column: 40–45%.
- Body/visual column: 55–60%.
- Gap: 56–80px.
- 96px desktop vertical padding.
- A product screenshot may occupy the second column only when it is real and current.

### 11.4 Feature-grid section

- Background: soft gray.
- Left-aligned heading and short intro.
- 3-column desktop grid.
- Use line icons and white/soft-gray cards.
- All cards in a row should have equal height.
- Do not place more than six cards in one uninterrupted grid; split into groups if needed.

### 11.5 Process section

- Background: white or soft gray.
- Heading on one side; numbered steps on the other.
- Use 3–5 steps per process.
- For the platform, business, client, employee, and Marketplace journeys may each use separate tabs or sections; do not compress every role into one dense diagram.

### 11.6 Navy emphasis section

- Background: navy.
- White heading and supporting text.
- Orange accent word, icons, or divider.
- Suitable for FAQs, a real statistic strip, role comparison, or a short product principle.
- Avoid placing multiple large navy sections back-to-back without a light section between them.

### 11.7 Category-grid section

- Background may use the existing `industries-section-bg.png` only if it stays visually subtle and maintains contrast.
- White category cards in a responsive 1/2/4-column grid.
- Heading should refer to “supported service categories,” not an unsupported industry count.
- Provide an “Explore Categories” action only if a real category index exists.

### 11.8 Marketplace preview

- Light background.
- 3–6 real business cards.
- Heading, one-sentence explanation, and “Explore the Marketplace” action.
- If no listings are available, show a purposeful empty state rather than fake listings.

### 11.9 Objection/reassurance section

Use utility cards or an accordion to answer:

- Is the platform currently free?
- Which service categories are supported?
- Does GetContractorz verify listed businesses?
- Does Marketplace contact create an obligation?
- Is GetContractorz part of the service agreement?
- How are client and business details used?

This section must use direct, factual language. It should not visually mimic seals, guarantees, or certification badges.

---

## 12. Recommended page recipes

These are layout recipes, not approved final copy.

### 12.1 Homepage

1. Announcement bar, only if useful.
2. Header.
3. Signature centered hero focused on the service-business workspace.
4. Short product value section.
5. Workflow/features grid.
6. How it works for a business manager.
7. Role-aware view: manager, employee, client.
8. Supported service categories.
9. Marketplace introduction.
10. Reassurance/accuracy section.
11. FAQ.
12. Final “Get Started Free” CTA panel.
13. Footer.

### 12.2 Features page

1. Compact or signature hero.
2. Feature navigation/anchor bar.
3. Client and service management.
4. Questionnaires and terms.
5. Quotes and invoices.
6. Team assignment and jobs.
7. Before-and-after job images.
8. Banking and payouts.
9. Dashboard/analytics.
10. FAQ.
11. Final CTA.

Each feature section may alternate white and soft-gray backgrounds. Use a real product screenshot or a simplified UI crop only when it accurately represents the product.

### 12.3 How It Works page

1. Compact hero.
2. Role selector or clear role overview.
3. Business registration workflow.
4. Client invitation and questionnaire workflow.
5. Employee job workflow.
6. Quote/invoice/payout workflow.
7. Marketplace visitor workflow.
8. FAQ.
9. Final CTA.

### 12.4 Marketplace listing page

1. Compact left-aligned hero.
2. Search input.
3. Category filter populated from current data.
4. Country/region filter only when listing data supports it.
5. Result count generated from data.
6. Responsive business-card grid.
7. Pagination or “Load More.”
8. Accurate empty/no-results state.
9. Marketplace disclaimer.
10. Footer.

On mobile, filters should open in a clear sheet/dialog. The search action and current filters must remain visible.

### 12.5 Marketplace business detail

1. Breadcrumb.
2. Business profile header.
3. About/business description.
4. Service categories.
5. Public contact details.
6. Location/service area, if supplied.
7. “Information supplied by the business” disclaimer.
8. Related businesses, only when based on real category/location data.

### 12.6 Industries/categories index

1. Compact hero.
2. Intro describing supported service-business types.
3. Data-driven 16-category grid.
4. “Don’t see your category?” explanatory note only if there is a real next action.
5. Marketplace or registration CTA based on user intent.

### 12.7 Category detail page

Create these only when there is enough unique, useful content and/or Marketplace data.

1. Breadcrumb and compact hero.
2. How GetContractorz supports this business category.
3. Relevant platform workflows, not generic trade advice.
4. Marketplace businesses in the category, if any.
5. Category-specific FAQ only when truthful and unique.
6. Registration and Marketplace CTAs.

Do not mass-produce thin, near-identical category/location pages.

### 12.8 About page

1. Signature hero.
2. Product origin/problem narrative.
3. What the platform centralizes.
4. Product principles or commitments.
5. Real company/team information, if approved.
6. Final CTA.

Do not include unsupported company history, team claims, or performance statistics.

### 12.9 Contact page

1. Signature or compact hero.
2. Contact-purpose utility cards only for real contact paths.
3. Two-column contact section: expectations + form.
4. Accurate response expectations only if approved.
5. FAQ subset.
6. Final CTA.

Do not show fake partner logos, testimonials, response times, or demo promises.

### 12.10 FAQ page

1. Compact navy or soft-gray hero.
2. Search or category tabs if the FAQ set is large.
3. Accessible accordions grouped by business, client, Marketplace, pricing, and trust.
4. Contact prompt.
5. Footer.

### 12.11 Legal pages

1. Standard header.
2. Compact hero with document title and last-updated date.
3. White reading surface, maximum width 760–820px.
4. Optional sticky table of contents on desktop.
5. Clear H2/H3 hierarchy.
6. Standard footer.

Do not add decorative hero artwork that distracts from legal text.

---

## 13. Imagery and iconography

### 13.1 Existing decorative language

The current hero uses:

- `rounded-horizontal-rectangle.svg`
- `rounded-vertical-rectangle.svg`
- `hexagon.svg`
- `dots-bg.svg`
- `message-bubble.svg`
- `linesflower.svg`
- `industries-section-bg.png`
- `CTA-Gradient.svg`

These assets establish a geometric, technical, modular identity. Reuse them selectively instead of placing all of them on every page.

### 13.2 Decoration rules

- One large edge shape plus one smaller geometric accent is usually enough.
- Dots may create atmosphere in a hero but should remain behind text.
- Decorations should crop at section edges.
- Use the orange and navy assets in balance.
- Do not place decorative shapes inside reading-heavy legal or Marketplace result areas.
- Mark decorative images with empty alt text and `aria-hidden="true"`.
- Use `pointer-events: none`.
- Test at 320px width for horizontal overflow.

### 13.3 Icons

- Use one consistent outline icon family.
- Stroke width should feel uniform, approximately 1.75–2px.
- Default icon color: navy or slate.
- Orange may identify a selected/priority icon.
- Do not mix filled emoji, 3D icons, detailed illustrations, and line icons.
- Keep card icons 20–28px inside 40–48px holders.

### 13.4 Product imagery

- Prefer real product screenshots or accurate cropped UI panels.
- Remove private client/business data.
- Do not invent dashboard screens for visual effect.
- Screenshots should use 16–24px radii, a 1px neutral border, and a subtle shadow.
- If the current UI is not ready to show, use icons and structured diagrams instead of fake interfaces.

### 13.5 Photography

Photography is not necessary to maintain the current design sense. If introduced later:

- Use authentic service-business environments.
- Avoid generic hard-hat handshake imagery.
- Keep treatment neutral and documentary.
- Do not apply heavy orange overlays.

---

## 14. Motion and interaction

Motion must reinforce clarity, not decorate every element.

### 14.1 Timing

- Button/color transition: 200–300ms.
- Header top transition: 150ms ease-in-out.
- Card lift: 180–220ms.
- Accordion open/close: 200–250ms.
- Page-section entrance: 300–500ms maximum.

### 14.2 Allowed effects

- Button scale up to 1.02.
- Card translateY up to -2px.
- Arrow shift 2–4px.
- Subtle fade/slide entrance once.
- Marquee only for real logos and only if it pauses on hover/focus.

### 14.3 Avoid

- Large parallax movement.
- Continuous bouncing CTAs.
- Auto-rotating content that cannot be paused.
- Heading animations that make the H1 temporarily invisible.
- Motion that delays reading or layout stability.

Respect `prefers-reduced-motion: reduce` and render all essential content visibly without animation.

---

## 15. Accessibility requirements

- Target WCAG 2.2 AA.
- Use semantic landmarks: header, nav, main, sections, footer.
- Provide a skip-to-content link.
- Maintain one H1 and a logical heading hierarchy.
- All controls need visible focus states.
- Do not remove outlines without a replacement.
- Text contrast must meet AA; especially test orange accents, muted gray, and white-on-navy content.
- Do not use color as the only state indicator.
- Accordion buttons must expose `aria-expanded` and `aria-controls`.
- Mobile navigation must trap focus when modal and close with Escape.
- Form errors must be announced and linked to fields.
- Decorative images use empty alt text; meaningful images use accurate alt text.
- Marketplace contact links must have descriptive labels, not only icons.
- Minimum pointer target: 44 × 44px.
- Do not auto-focus fields on page load.

---

## 16. Content-to-design rules

### 16.1 Two-audience hierarchy

The public site serves:

1. Service businesses, the primary audience.
2. Marketplace visitors, the secondary audience.

The homepage hero should prioritize the service-business product. Marketplace discovery should receive its own navigation item, section, and page rather than competing equally inside the hero.

### 16.2 CTA hierarchy

- Primary site CTA: **Get Started Free**.
- Primary Marketplace CTA: **Explore the Marketplace**.
- Business-card CTA: **View Business**.
- Contact-detail CTA: **Contact This Business** or the exact email/phone action.
- Never show more than one orange button in a small component group.

### 16.3 Claims and proof

The design must make it easy to omit proof blocks until proof exists. No page should look unfinished because testimonials, logo strips, star ratings, or statistics are absent.

When proof becomes available:

- Add it through a clearly defined component.
- Store source/approval information with the content record.
- Never allow editors to publish a statistic without context and an approval state.

### 16.4 Marketplace trust language

Use neutral visual cues. A clean card, complete information, and direct contact action can create confidence without a seal or badge.

Required disclaimer style:

- 14–16px.
- Neutral soft-gray or navy-tint panel.
- 1px border.
- Information icon.
- Plain language.
- Visible without being alarmist.

---

## 17. Implementation structure

The design system should be implemented as reusable templates/components. Do not duplicate full section markup across pages.

Suggested Django structure:

```text
templates/
  public/
    base.html
    components/
      announcement_bar.html
      header.html
      footer.html
      breadcrumb.html
      eyebrow.html
      button.html
      icon_card.html
      category_card.html
      marketplace_card.html
      faq_item.html
      form_field.html
    sections/
      hero_centered.html
      hero_compact.html
      split_narrative.html
      feature_grid.html
      process_steps.html
      category_grid.html
      marketplace_preview.html
      faq_section.html
      final_cta.html
    pages/
      home.html
      features.html
      how_it_works.html
      marketplace_list.html
      marketplace_detail.html
      categories.html
      category_detail.html
      about.html
      contact.html
      faq.html
      legal.html
```

Suggested CSS layers:

```text
static/public/css/
  tokens.css
  base.css
  layout.css
  components.css
  sections.css
  pages.css
  utilities.css
```

If Tailwind remains in use, map the tokens into the Tailwind theme rather than scattering arbitrary hex values and pixel sizes through templates.

### 17.1 Data-driven elements

The following must come from data/configuration:

- Supported service categories.
- Category count.
- Marketplace listings.
- Marketplace result count.
- Business contact details.
- FAQs.
- Any future statistics.
- Any future testimonials or logos.
- Footer contact/social information.

### 17.2 Component API principles

Every section component should accept:

- Background variant: `page`, `white`, `navy`, or approved background asset.
- Eyebrow text, optional.
- Heading and optional accent fragment.
- Supporting copy.
- Primary and optional secondary actions.
- Alignment: centered or left.
- Content width variant.
- Decoration variant: none, dots, edge-shape, geometry.

Do not pass raw HTML for ordinary copy. Use structured fields so templates remain accessible and consistent.

---

## 18. SEO and performance constraints that affect design

- H1 and essential copy must be server-rendered and visible without JavaScript.
- Do not use images for headings.
- Keep DOM order aligned with reading order; CSS should not visually rearrange content into a confusing sequence.
- Lazy-load below-the-fold images, not the hero logo or essential above-the-fold visual.
- Inline only critical CSS needed for the shell/hero where appropriate.
- Preload MODERNIZ only if it is used above the fold; use `font-display: swap`.
- Reserve image dimensions to prevent layout shift.
- Avoid large full-screen loading placeholders.
- Decorative assets should be optimized SVG/WebP/AVIF where appropriate.
- Do not allow a logo marquee or animation to become the Largest Contentful Paint element.
- Keep each page's section count purposeful; whitespace should feel intentional, not like missing content.

---

## 19. Known current-site patterns to correct during rebuilding

Preserving the design sense does not require preserving implementation problems.

Correct the following:

- Replace all dummy or unverified copy.
- Remove placeholder partner logos and names.
- Remove invented testimonials and people.
- Remove unsupported statistics and trust counts.
- Replace the unsupported “50+ industries” presentation with the data-driven supported category set.
- Do not advertise unsupported categories such as Painting or Smart Home unless they are later added to the platform.
- Remove dead or misleading navigation destinations.
- Ensure every visible CTA navigates or submits correctly.
- Avoid hero animations that temporarily hide the H1.
- Avoid full-height empty FAQ/loading sections.
- Replace generic design-agency CTA/footer copy with GetContractorz-specific content.
- Ensure footer descriptions, phone numbers, email addresses, and social links are verified.
- Do not show pricing navigation until a real pricing model/page exists; current access can be described as free where appropriate.

---

## 20. Quality-assurance checklist

### Visual consistency

- [ ] Logo uses the approved horizontal GetContractorz asset.
- [ ] Core palette matches the token values.
- [ ] MODERNIZ is used consistently for display headings.
- [ ] Orange appears as an accent, not the dominant page color.
- [ ] Section rhythm alternates soft gray, white, and navy intentionally.
- [ ] Cards use the approved radii, borders, and shadow levels.
- [ ] Decorative geometry is sparse and crops safely.
- [ ] Final CTA panel matches the orange-border, soft-wash signature style.

### Responsive behavior

- [ ] 320px, 375px, 768px, 1024px, 1280px, and 1440px widths are tested.
- [ ] No horizontal scrolling.
- [ ] Mobile CTAs and navigation have 44px targets.
- [ ] Multi-column content stacks in a sensible reading order.
- [ ] H1s do not overflow or become excessively small.
- [ ] Decorations do not cover text or controls.
- [ ] Marketplace filters and results remain usable on mobile.

### Content accuracy

- [ ] No unverified claims.
- [ ] No fake testimonials, ratings, partners, or statistics.
- [ ] No verification/approval language for Marketplace businesses.
- [ ] Only supported categories are shown.
- [ ] Category and result counts are generated from data.
- [ ] Current-free-access language is accurate and not framed as a permanent guarantee.
- [ ] GetContractorz is not described as the service provider or contracting party.

### Accessibility

- [ ] Semantic headings and landmarks.
- [ ] Keyboard-visible focus.
- [ ] AA contrast.
- [ ] Accessible mobile menu.
- [ ] Accessible accordion behavior.
- [ ] Form labels, errors, and status messages.
- [ ] Meaningful alt text; decorations hidden from assistive technology.
- [ ] Reduced-motion behavior.

### Performance and SEO

- [ ] Above-the-fold content server-rendered.
- [ ] Image dimensions reserved.
- [ ] No blocking decorative animation.
- [ ] Metadata and canonical URL set per page.
- [ ] One H1 per page.
- [ ] Internal links use real destinations.
- [ ] Structured data only represents visible, factual content.

---

## 21. Definition of done

A new public page is complete when it:

1. Looks unmistakably part of the current GetContractorz brand without copying old dummy content.
2. Uses the shared shell, tokens, and reusable components.
3. Has a clear visual hierarchy and one primary action.
4. Works at all required breakpoints without overflow or hidden content.
5. Meets accessibility requirements.
6. Uses only verified product facts and approved business information.
7. Avoids unsupported proof, trust, category, pricing, and verification claims.
8. Is server-rendered, crawlable, and performant.
9. Has been checked against both this document and the product/messaging foundation.

---

## Final implementation principle

> Preserve the visual grammar, not the old page composition.

The GetContractorz design grammar is: **soft-gray space, navy structure, orange priority, MODERNIZ confidence, rounded practical components, restrained geometric decoration, and clear responsive grids**. New pages may contain entirely different sections as long as they consistently use that grammar and remain grounded in the verified product.
