import test from "node:test";
import assert from "node:assert/strict";

import {
  getPublicRedirectUrl,
  isDashboardPath,
  isMagicQuoteLink,
} from "../src/utils/routePolicy.js";

test("only account and dashboard paths require React authentication", () => {
  assert.equal(isDashboardPath("/user"), true);
  assert.equal(isDashboardPath("/user/business/home"), true);
  assert.equal(isDashboardPath("/about"), false);
  assert.equal(isDashboardPath("/sign-in"), false);
});

test("tokenized quote links remain available for magic login", () => {
  const path = "/user/business/quote/sign/42";

  assert.equal(isMagicQuoteLink(path, "?token=magic-token"), true);
  assert.equal(isMagicQuoteLink(path, ""), false);
  assert.equal(
    isMagicQuoteLink("/user/business/quote/42", "?token=magic-token"),
    false,
  );
});

test("local React public paths retain their path when handed to Django", () => {
  assert.equal(
    getPublicRedirectUrl(
      "http://localhost:8000",
      "http://localhost:5173/about?source=legacy#details",
    ),
    "http://localhost:8000/about?source=legacy#details",
  );
});

test("same-origin fallback returns home instead of causing a redirect loop", () => {
  assert.equal(
    getPublicRedirectUrl(
      "https://getcontractorz.com",
      "https://getcontractorz.com/unknown",
    ),
    "https://getcontractorz.com/",
  );
});
