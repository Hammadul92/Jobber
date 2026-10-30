import test from "node:test";
import assert from "node:assert/strict";

import { alertReducer, showAlert, dismissAlert } from "../src/store/alertSlice.js";
import { pluralize } from "../src/utils/pluralize.js";

const show = (state, alert) => alertReducer(state, showAlert(alert));

test("alerts stack newest last and keep at most three", () => {
  let state = [];
  for (const message of ["a", "b", "c", "d"]) {
    state = show(state, { type: "success", message });
  }
  assert.deepEqual(state.map((alert) => alert.message), ["b", "c", "d"]);
});

test("showing the same alert again replaces it instead of adding a copy", () => {
  let state = show([], { type: "success", message: "3 quotes sent." });
  const firstId = state[0].id;
  state = show(state, { type: "danger", message: "Failed." });
  state = show(state, { type: "success", message: "3 quotes sent." });
  assert.deepEqual(state.map((alert) => alert.message), ["Failed.", "3 quotes sent."]);
  assert.notEqual(state[1].id, firstId);
});

test("dismissing removes only that alert", () => {
  let state = show([], { type: "info", message: "one" });
  state = show(state, { type: "info", message: "two" });
  state = alertReducer(state, dismissAlert(state[0].id));
  assert.deepEqual(state.map((alert) => alert.message), ["two"]);
});

test("pluralize", () => {
  assert.equal(pluralize(1, "quote"), "1 quote");
  assert.equal(pluralize(11, "team member"), "11 team members");
});
