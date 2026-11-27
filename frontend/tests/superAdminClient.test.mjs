import test from "node:test";
import assert from "node:assert/strict";
import { createDashboardClient } from "../src/super-admin/client.js";
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

test("super-admin requests retain session credentials and rotate CSRF tokens", async () => {
  const calls = [];
  const api = createDashboardClient(async (url, options) => {
    calls.push({ url, options });
    return json({
      csrf: calls.length === 1 ? "initial-token" : "rotated-token",
    });
  });
  await api("auth/");
  await api("auth/", { method: "POST", body: "{}" });
  await api("actions/faqs/", { method: "POST", body: "{}" });
  assert.equal(calls[0].url, "/api/super-admin/auth/");
  assert.equal(calls[0].options.credentials, "same-origin");
  assert.equal(calls[1].options.headers["X-CSRFToken"], "initial-token");
  assert.equal(calls[2].options.headers["X-CSRFToken"], "rotated-token");
});

test("multipart changes leave the content type boundary to the browser", async () => {
  let received;
  const api = createDashboardClient(async (_, options) => {
    received = options;
    return json({ id: 1 });
  });
  const body = new FormData();
  body.set("question", "Test");
  await api("actions/faqs/", { method: "POST", body });
  assert.equal(received.body, body);
  assert.equal(received.headers["Content-Type"], undefined);
});

test("validation errors preserve field errors and HTTP status", async () => {
  const api = createDashboardClient(async () =>
    json({ detail: "Correct fields", errors: { question: ["Required"] } }, 400),
  );
  await assert.rejects(
    api("actions/faqs/"),
    (error) =>
      error.message === "Correct fields" &&
      error.status === 400 &&
      error.errors.question[0] === "Required",
  );
});

test("expired confirmations remain distinguishable from permission failures", async () => {
  for (const status of [403, 409]) {
    const api = createDashboardClient(async () =>
      json({ detail: "Request rejected" }, status),
    );
    await assert.rejects(
      api("actions/faqs/1/"),
      (error) => error.status === status,
    );
  }
});

test("non-JSON outages produce a readable dashboard error", async () => {
  const api = createDashboardClient(
    async () => new Response("<html>Unavailable</html>", { status: 503 }),
  );
  await assert.rejects(api("overview/"), /Dashboard service is unavailable/);
});

test("separate clients cannot reuse another session CSRF token", async () => {
  const first = createDashboardClient(async () =>
    json({ csrf: "first-session" }),
  );
  await first("auth/");
  let headers;
  const second = createDashboardClient(async (_, options) => {
    headers = options.headers;
    return json({});
  });
  await second("auth/");
  assert.equal(headers["X-CSRFToken"], "");
});

test("network failures propagate without being converted to successful results", async () => {
  const api = createDashboardClient(async () => {
    throw new Error("Network failed");
  });
  await assert.rejects(api("overview/"), /Network failed/);
});
