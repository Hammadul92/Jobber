# Signature Popup Verification

Date: October 26, 2026. Local changes only; not deployed.

## Fix

The previous centered panel was 937.5px tall at a 320x568 viewport and began above the visible screen. Its fixed 450px canvas and lack of scrolling made the title and footer inaccessible.

The popup now has a viewport-relative maximum height, vertical scrolling, a bounded 560px width, and a canvas height that adapts to screen height. Narrow-screen controls and the saved preview wrap rather than overflowing. Background scrolling is locked only while the popup is open and restored on close. The existing signature-pad library preserves the drawing on window resize.

Quote eligibility, questionnaire bypass rules, quote status requirements, and backend signing behavior were not changed.

## Results

- Reproduced the clipping failure before implementation.
- All 23 browser scenarios passed with no runtime errors.
- All 12 frontend unit tests passed.
- All 8 focused backend quote-signing, signature-validation, and signed-PDF regressions passed.
- Frontend lint, production build, regression-script syntax check, and `git diff --check` passed.
- The production build retains the existing non-blocking large-JavaScript-chunk warning.

## Browser Coverage

Layout and control accessibility were checked at these 15 viewports:

`320x568`, `360x640`, `375x667`, `390x844`, `393x852`, `414x896`, `430x932`, `360x480`, `568x320`, `667x375`, `844x390`, `768x1024`, `834x1194`, `1024x768`, `1440x900`.

Additional scenarios verified:

1. An extreme 320x240 screen can scroll to the header and footer.
2. Increased root text size keeps controls reachable without horizontal overflow.
3. Drawing, saving, clearing, redrawing, and submitting a PNG signature work.
4. The drawn signature survives portrait-to-landscape resizing.
5. Closing restores background scrolling; reopening starts with an empty canvas.
6. Saving an empty signature is rejected and Submit remains disabled.
7. Emulated touch input draws and saves a signature at 3x device pixel ratio.
8. Swipe scrolling moves the popup rather than the background page.

Canvas pixel checks confirmed that signatures actually rendered. The submission check inspected the multipart PNG upload and confirmed one request. Application API responses and Stripe scripts were mocked in browser testing; no real quote was signed and no customer email was sent. Backend tests used the isolated test database and test email backend. Browser checks used Chromium emulation, not physical iOS/Android devices or native Safari.

## Repeat Browser Checks

With the existing local app running at `http://localhost:5173`:

```sh
mkdir -p output/playwright/signature-popup
npx --yes --package @playwright/cli playwright-cli -s=signature-check open about:blank
npx --yes --package @playwright/cli playwright-cli -s=signature-check run-code "$(cat scripts/verify_signature_popup_browser.js)"
npx --yes --package @playwright/cli playwright-cli -s=signature-check close
```

Screenshots are in `output/playwright/signature-popup/`, including normal mobile, short-screen top/bottom scroll positions, landscape top/bottom positions, a saved signature, and high-density touch input.
