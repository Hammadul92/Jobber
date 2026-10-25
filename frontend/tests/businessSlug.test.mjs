import test from "node:test";
import assert from "node:assert/strict";

import { generateBusinessSlug } from "../src/utils/businessSlug.js";

test("business suffix punctuation does not appear in generated slugs", () => {
  assert.equal(generateBusinessSlug("ZS Projects Inc."), "zs-projects-inc");
  assert.equal(generateBusinessSlug("Bob's Services, Ltd."), "bobs-services-ltd");
});

test("generated slugs use lowercase letters, numbers, and single hyphens", () => {
  assert.equal(generateBusinessSlug("  ACME -- 24/7 & Co.  "), "acme-247-co");
  assert.equal(generateBusinessSlug("---ZS Projects---"), "zs-projects");
  assert.equal(generateBusinessSlug("Cafe\u0301 R\u00e9novation"), "cafe-renovation");
});

test("generated slugs stay within the form's 50-character limit", () => {
  assert.equal(generateBusinessSlug("a".repeat(51)), "a".repeat(50));
  assert.equal(generateBusinessSlug(`${"a".repeat(49)} b`), "a".repeat(49));
});

test("empty or punctuation-only names do not generate stray hyphens", () => {
  for (const name of ["", "   ", "...", "---", " & "]) {
    assert.equal(generateBusinessSlug(name), "");
  }
});
