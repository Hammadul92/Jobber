// Local-only browser regressions. All APIs and Stripe calls are mocked.
// Run: playwright-cli -s=invoice-check open http://localhost:5173/sign-in
// Then: playwright-cli -s=invoice-check run-code "$(cat scripts/verify_invoice_browser.js)"
async (page) => {
  const base = "http://localhost:5173";
  const path = "/user/business/invoice/1";
  const results = [];
  let state;
  const initialInvoice = {
    id: 1, invoice_number: "INV-TEST-001", status: "SENT", due_date: "2026-10-29",
    subtotal: "185.00", tax_rate: "5.00", tax_amount: "9.25", total_amount: "194.25",
    currency: "CAD", business_name: "Test Business", client_name: "Invoice Customer",
    service_name: "Snow Removal", has_payment_method: true, has_paid_payout: false, can_manage: false,
  };
  const check = (value, message) => { if (!value) throw new Error(message); };
  const pay = () => page.getByRole("button", {name: "Pay $194.25 CAD", exact: true});
  const run = async (name, action) => {
    try { await action(); results.push({name, result: "PASS"}); }
    catch (error) { throw new Error(JSON.stringify({results, failed: name, error: error.message})); }
  };
  await page.unroute("**/api/**");
  await page.route("https://js.stripe.com/**", route => route.fulfill({status: 200, contentType: "application/javascript", body: "window.Stripe = function () { return {}; };"}));
  await page.route("https://m.stripe.com/**", route => route.fulfill({status: 204, body: ""}));
  await page.route("**/api/**", async route => {
    const request = route.request();
    const endpoint = new URL(request.url()).pathname.replace(/\/$/, "");
    const respond = (data, status = 200) => route.fulfill({status, contentType: "application/json", body: JSON.stringify(data)});
    if (endpoint === "/api/user/magic-login") {
      state.magicCalls++;
      if (JSON.parse(request.postData()).token !== "valid-email-token") return respond({detail: "Invalid or expired magic link."}, 400);
      return respond({token: "customer-token"});
    }
    if (endpoint === "/api/user/token") return respond({token: "customer-token"});
    if (endpoint === "/api/user/me") {
      const token = request.headers().authorization;
      if (token === "Token expired-token") return respond({detail: "Invalid token."}, 401);
      const manager = token === "Token manager-token";
      return respond({id: manager ? 12 : 11, name: manager ? "Business Owner" : "Invoice Customer", email: "customer@example.test", role: manager ? "MANAGER" : "CLIENT"});
    }
    if (endpoint === "/api/finance/invoice/1/send-invoice") {
      state.emailCalls++;
      if (state.outcome === "email-failure") return respond({detail: "Invoice email could not be sent. Please try again."}, 503);
      state.invoice.status = "SENT";
      return respond({detail: "Invoice email sent successfully."});
    }
    if (endpoint === "/api/ops/quote/42") return respond({id: 42, quote_number: "Q-TEST-42", status: "SENT", valid_until: "2026-12-31", service_data: {service_name: "Snow Removal", price: "185.00", currency: "CAD"}});
    if (endpoint === "/api/ops/service-questionnaire/42") return respond({id: 42, service_name: "Snow Removal", additional_questions_form: []});
    if (endpoint === "/api/ops/service/1") return respond({id: 1, service_name: "Snow Removal", filled_questionnaire: null});
    if (endpoint === "/api/finance/invoice/1/make-payment") {
      state.paymentCalls++;
      await new Promise(resolve => setTimeout(resolve, 200));
      if (state.outcome === "network") return route.abort("failed");
      if (state.outcome === "html") return route.fulfill({status: 500, contentType: "text/html", body: "<h1>Server Error</h1>"});
      if (state.outcome === "declined") return respond({error: "Your card was declined. Please use another card."}, 400);
      if (state.outcome === "merchant") return respond({error: "Business does not have a connected Stripe account."}, 400);
      if (state.outcome === "pending") return respond({error: "Payment has not completed. Retry to check its status before making another payment."}, 409);
      if (state.outcome === "unauthorized") return respond({detail: "Invalid token."}, 401);
      state.invoice.status = "PAID";
      state.invoice.has_paid_payout = true;
      state.invoice.paid_at = "2026-10-25T17:00:00Z";
      return respond({detail: "Payment successful and payout recorded."});
    }
    if (endpoint === "/api/finance/invoice/1") {
      state.invoiceLoads++;
      if (state.notFound) return respond({detail: "Not found."}, 404);
      return respond(state.invoice);
    }
    return respond([]);
  });
  const open = async ({token = "customer-token", url = path, invoice = {}, outcome = "success", notFound = false} = {}) => {
    state = {invoice: {...initialInvoice, ...invoice}, outcome, notFound, magicCalls: 0, paymentCalls: 0, invoiceLoads: 0, emailCalls: 0};
    await page.evaluate(value => {
      localStorage.clear();
      if (value) localStorage.setItem("token", value);
    }, token);
    await page.goto(base + url, {waitUntil: "domcontentloaded"});
  };
  const invoiceReady = async () => page.getByRole("heading", {name: "INV-TEST-001", exact: true}).first().waitFor();
  const signIn = async () => {
    await page.getByRole("textbox", {name: "Email *", exact: true}).fill("customer@example.test");
    await page.getByRole("textbox", {name: "Password *", exact: true}).fill("local-test-password");
    await page.getByRole("button", {name: "Sign In", exact: true}).click();
    await pay().waitFor();
    check(new URL(page.url()).pathname === path, "Sign-in lost the invoice destination");
  };

  await run("Existing email link: signed-out customer signs in and returns to invoice", async () => {
    await open({token: ""});
    await page.waitForURL("**/sign-in?next=**");
    check(new URL(page.url()).searchParams.get("next") === path, "Missing next destination");
    await signIn();
    check(state.paymentCalls === 0, "Viewing an invoice must not charge a card");
  });
  await run("Expired normal session preserves invoice through sign-in", async () => {
    await open({token: "expired-token"});
    await page.waitForURL("**/sign-in?next=**");
    await signIn();
  });
  for (const token of ["", "customer-token", "manager-token", "expired-token"]) {
    await run(`Secure invoice email login with ${token || "no existing session"}`, async () => {
      await open({token, url: path + "?token=valid-email-token"});
      await pay().waitFor();
      check(new URL(page.url()).search === "", "Email token remains in destination URL");
      check(await page.evaluate(() => localStorage.getItem("token")) === "customer-token", "Incorrect customer session");
      check(state.magicCalls > 0 && state.paymentCalls === 0, "Unexpected login or automatic payment");
    });
  }
  for (const token of ["expired-email-token", "tampered-token", ""]) {
    await run(`Invalid/expired invoice email token: ${token || "empty"}`, async () => {
      await open({token: "", url: path + "?token=" + token});
      await page.getByRole("heading", {name: "Link Expired", exact: true}).waitFor();
      const fallback = page.getByRole("link", {name: "Sign in to continue", exact: true});
      check(new URL(await fallback.getAttribute("href"), base).searchParams.get("next") === path, "Invalid sign-in recovery link");
      check(state.paymentCalls === 0 && state.invoiceLoads === 0, "Invalid email token exposed invoice or charged a card");
    });
  }
  await run("Missing payment method: add-card link and return refresh", async () => {
    await open({invoice: {has_payment_method: false}});
    await page.getByRole("link", {name: "add a payment method", exact: true}).waitFor();
    check(await pay().count() === 0, "Pay visible without a saved card");
    await page.getByRole("link", {name: "add a payment method", exact: true}).click();
    await page.waitForURL("**/user/banking");
    await page.getByRole("heading", {name: "Banking & Payments", exact: true}).waitFor();
    state.invoice.has_payment_method = true;
    await page.goBack();
    await pay().waitFor();
    check(state.invoiceLoads >= 2, "Returning from banking did not reload payment eligibility");
  });
  await run("Wrong account/missing invoice: persistent error and no payment button", async () => {
    await open({notFound: true});
    await page.getByRole("heading", {name: "Invoice unavailable", exact: true}).waitFor();
    check(await pay().count() === 0, "Unavailable invoice exposes payment button");
  });
  for (const status of ["PAID", "CANCELLED", "DRAFT"]) {
    await run(`${status} invoice has no payment action`, async () => {
      await open({invoice: {status}});
      await invoiceReady();
      await page.getByText(status, {exact: true}).first().waitFor();
      check(await pay().count() === 0, "Non-payable invoice still exposes Pay");
    });
  }
  for (const [outcome, message] of [
    ["declined", "Your card was declined. Please use another card."],
    ["merchant", "Business does not have a connected Stripe account."],
    ["pending", "Payment has not completed. Retry to check its status before making another payment."],
    ["network", "Payment failed. Please try again."],
    ["html", "Payment failed. Please try again."],
  ]) {
    await run(`Payment outcome: ${outcome}`, async () => {
      await open({outcome});
      await pay().click();
      await page.getByRole("alert").filter({hasText: message}).waitFor();
      await pay().waitFor({state: "visible"});
      check(state.paymentCalls === 1 && state.invoice.status === "SENT", "Failed/pending payment incorrectly marked paid");
    });
  }
  await run("Successful payment and rapid double click send one request", async () => {
    await open();
    await pay().dblclick();
    await page.getByRole("alert").filter({hasText: "Payment successful and payout recorded."}).waitFor();
    await page.getByText("PAID", {exact: true}).first().waitFor();
    check(state.paymentCalls === 1 && await pay().count() === 0, "Double-click caused multiple payments");
  });
  await run("Business owner can pay an invoice where they are the customer", async () => {
    await open({token: "manager-token"});
    await pay().waitFor();
    check(await page.getByRole("button", {name: "Mark Paid", exact: true}).count() === 0, "Customer sees owner controls");
  });
  await run("Session expiry during payment returns to invoice sign-in without marking paid", async () => {
    await open({outcome: "unauthorized"});
    await pay().click();
    await page.waitForURL("**/sign-in?next=**");
    check(new URL(page.url()).searchParams.get("next") === path, "Expired payment session lost invoice destination");
    check(state.invoice.status === "SENT", "Unauthorized payment marked invoice paid");
  });
  for (const status of ["SENT", "DRAFT"]) {
    await run(`Owner can ${status === "SENT" ? "resend" : "send"} invoice email`, async () => {
      await open({token: "manager-token", invoice: {status, can_manage: true}});
      await page.getByRole("button", {name: status === "SENT" ? "Resend" : "Send", exact: true}).click();
      await page.getByRole("alert").filter({hasText: "Invoice email sent successfully."}).waitFor();
      check(state.emailCalls === 1 && state.paymentCalls === 0, "Email resend attempted a payment or sent twice");
    });
  }
  await run("Owner sees invoice email delivery failure", async () => {
    await open({token: "manager-token", invoice: {can_manage: true}, outcome: "email-failure"});
    await page.getByRole("button", {name: "Resend", exact: true}).click();
    await page.getByRole("alert").filter({hasText: "Invoice email could not be sent. Please try again."}).waitFor();
    check(state.paymentCalls === 0, "Failed resend charged a card");
  });
  await run("Quote signing magic links still reach the signing screen", async () => {
    await open({token: "expired-token", url: "/user/business/quote/sign/42?token=valid-email-token"});
    await page.waitForURL("**/user/business/quote/sign/42");
    await page.getByText("Quote # Q-TEST-42", {exact: true}).first().waitFor();
    check(state.magicCalls > 0 && state.paymentCalls === 0, "Quote magic login was bypassed");
  });
  await run("Questionnaire magic links preserve their destination", async () => {
    await open({token: "expired-token", url: "/service-questionnaire/42/form/1?token=valid-email-token"});
    await page.waitForURL("**/user/business/service-questionnaire/42/form/1");
    check(state.magicCalls > 0 && state.paymentCalls === 0, "Questionnaire magic login was bypassed");
  });
  for (const width of [390, 834, 1440]) {
    await run(`Invoice and payment button render at ${width}px`, async () => {
      await page.setViewportSize({width, height: 900});
      await open();
      await pay().waitFor();
      const main = await page.getByRole("main").boundingBox();
      check(main && main.x >= -1 && main.x + main.width <= width + 1, "Invoice content extends outside the viewport");
      await pay().scrollIntoViewIfNeeded();
      const box = await pay().boundingBox();
      check(box && box.width > 40 && box.x >= 0 && box.x + box.width <= width + 1, "Payment button is clipped");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      check(!overflow, "Invoice has page-level horizontal overflow");
      const amounts = page.getByRole("region", {name: "Invoice amounts", exact: true});
      await amounts.evaluate(element => { element.scrollLeft = element.scrollWidth; });
      const columnsFit = await amounts.locator(".text-right").evaluateAll(elements => elements.every(element => element.scrollWidth <= element.clientWidth + 1));
      check(columnsFit, "Invoice amounts overlap or are truncated inside columns");
      if (width === 390) await page.screenshot({path: "/tmp/jobber-invoice-mobile.png", fullPage: true});
    });
  }
  return {passed: results.length, results};
}
