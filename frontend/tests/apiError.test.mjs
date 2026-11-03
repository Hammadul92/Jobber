import test from "node:test";
import assert from "node:assert/strict";
import { apiErrorMessage } from "../src/utils/apiError.js";

test("prefers the server detail", () => {
  assert.equal(apiErrorMessage({ data: { detail: "Not allowed." } }), "Not allowed.");
});

test("joins field errors and shows non-field errors on their own", () => {
  assert.equal(
    apiErrorMessage({ data: { email: ["Taken."], non_field_errors: ["Check the form."] } }),
    "email: Taken. | Check the form.",
  );
});

test("falls back when there is nothing readable", () => {
  assert.equal(apiErrorMessage({ status: 500 }, "Failed."), "Failed.");
  assert.equal(apiErrorMessage({ data: ["One", "Two"] }), "One, Two");
});
