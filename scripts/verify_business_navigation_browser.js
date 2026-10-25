// Local-only browser regressions. APIs and third-party Stripe scripts are mocked.
// Run with playwright-cli run-code "$(cat scripts/verify_business_navigation_browser.js)".
// Screenshots are written to output/playwright/business-navigation/.
async (page) => {
  const base = "http://localhost:5173";
  const output = "output/playwright/business-navigation";
  const results = [];
  const runtimeErrors = [];
  let state;
  const fixture = {
    id: 301, owner: 91, name: "Northstar Services Inc.", slug: "northstar-services",
    email: "business@example.test", phone: "+14035550100", website: "https://example.test",
    business_description: "Property maintenance and cleaning services.",
    country: "CA", province_state: "AB", street_address: "123 Test Street",
    city: "Calgary", postal_code: "T2P 1J9", business_number: "123456789",
    tax_rate: "5.00", timezone: "America/Edmonton", services_offered: ["Cleaning"], logo: null,
  };
  const managerLinks = [
    "Dashboard", "Questionnaires", "Terms & Conditions", "Clients", "Services",
    "Quotes", "Team Members", "Jobs", "Payouts", "Invoices",
  ];
  const check = (value, message) => { if (!value) throw new Error(message); };
  const desktopNav = () => page.locator("aside");
  const mobileNav = () => page.locator("#mobile-nav");
  const save = () => page.getByRole("button", {name: "Save Changes", exact: true});
  const logoHeading = () => page.getByRole("heading", {name: "Final Step: Brand Identity"});
  const run = async (name, action) => {
    try { await action(); results.push({name, result: "PASS"}); }
    catch (error) {
      await page.screenshot({path: `${output}/failure.png`, fullPage: true});
      throw new Error(JSON.stringify({results, failed: name, error: error.message}));
    }
  };
  page.on("pageerror", error => runtimeErrors.push(error.message));
  await page.route("https://js.stripe.com/**", route => route.fulfill({
    status: 200, contentType: "application/javascript", body: "window.Stripe = function () { return {}; };",
  }));
  await page.route("https://m.stripe.com/**", route => route.fulfill({status: 204, body: ""}));
  await page.route("**/api/**", async route => {
    const request = route.request();
    const endpoint = new URL(request.url()).pathname.replace(/\/$/, "");
    const respond = (data, status = 200) => route.fulfill({status, contentType: "application/json", body: JSON.stringify(data)});
    if (endpoint === "/api/user/me") {
      state.userReads++;
      if (state.userReads > 1 && state.holdUser) {
        await new Promise(resolve => { state.releaseUser = resolve; });
      }
      return respond({id: 91, name: "Alex Morgan", email: "alex@example.test", role: state.role});
    }
    if (endpoint === "/api/ops/business/service-options") {
      return respond([{id: 1, name: "Cleaning", slug: "cleaning"}]);
    }
    if (endpoint === "/api/ops/business" && request.method() === "GET") {
      state.businessReads++;
      return respond(state.business ? [state.business] : []);
    }
    if (endpoint.match(/^\/api\/ops\/business(?:\/301)?$/) && ["POST", "PATCH"].includes(request.method())) {
      state.saves++;
      state.saveMethod = request.method();
      state.saveBody = request.postData() || "";
      if (state.failSave) return respond({detail: "Business could not be saved."}, 500);
      state.role = state.savedRole || "MANAGER";
      state.business = {...fixture, name: state.savedName || fixture.name};
      return respond(state.business, request.method() === "POST" ? 201 : 200);
    }
    if (endpoint === "/api/finance/banking-information/stripe-config") return respond({publishable_key: ""});
    if (request.method() !== "GET") throw new Error(`Unexpected mutation: ${request.method()} ${endpoint}`);
    return respond([]);
  });
  const start = async (options = {}) => {
    state = {
      role: "USER", business: {...fixture}, userReads: 0, businessReads: 0, saves: 0,
      failSave: false, holdUser: false, ...options,
    };
    await page.setViewportSize({width: options.width || 1440, height: options.height || 1100});
    await page.addInitScript(() => { localStorage.setItem("token", "business-navigation-test-token"); });
    await page.goto(`${base}/user/business`, {waitUntil: "domcontentloaded"});
    await page.getByRole("heading", {name: "Core Business Information"}).waitFor();
    await page.evaluate(() => { window.__businessNavigationDocument = "no-reload"; });
  };
  const fillNewBusiness = async () => {
    await page.locator("#business_name").fill(fixture.name);
    await page.locator("#email").fill(fixture.email);
    await page.locator("#phone").fill(fixture.phone);
    await page.locator("#business_number").fill(fixture.business_number);
    await page.locator("#tax_rate").fill(fixture.tax_rate);
    await page.locator("#business_description").fill(fixture.business_description);
    await page.getByRole("button", {name: "Next", exact: true}).click();
    await page.locator("#province").click();
    await page.getByRole("option", {name: "Alberta", exact: true}).click();
    await page.locator("#street_address").fill(fixture.street_address);
    await page.locator("#city").fill(fixture.city);
    await page.locator("#postal_code").fill(fixture.postal_code);
    await page.getByRole("button", {name: "Next", exact: true}).click();
    await page.getByRole("button", {name: "Cleaning", exact: true}).click();
    await page.getByRole("button", {name: "Next", exact: true}).click();
    await logoHeading().waitFor();
  };
  const goToLogo = async () => {
    await page.locator("#business_name").waitFor();
    await page.waitForFunction(name => document.querySelector("#business_name")?.value === name, fixture.name);
    await page.getByRole("button", {name: "4 Logo", exact: true}).click();
    await logoHeading().waitFor();
  };
  const assertManagerTabs = async (mobile = false) => {
    const nav = mobile ? mobileNav() : desktopNav();
    if (mobile) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.locator("button[aria-controls=mobile-nav]").click();
    }
    for (const label of managerLinks) {
      await nav.getByRole("link", {name: label, exact: true}).waitFor({state: "visible", timeout: 7000});
    }
    check(await page.evaluate(() => window.__businessNavigationDocument === "no-reload"), "Document reloaded after save");
    check(state.userReads === 2, `Expected one user refresh, saw ${state.userReads} total reads`);
    check(await logoHeading().isVisible(), "Final step was reset after the background user refresh");
    const session = await page.evaluate(() => {
      const value = document.cookie.split("; ").find(cookie => cookie.startsWith("contractorz_public_session="));
      return value ? JSON.parse(decodeURIComponent(value.slice(value.indexOf("=") + 1))) : null;
    });
    check(session?.role === "MANAGER", "Public header session retained the old role");
  };

  await run("Existing business save refreshes stale user role without reload", async () => {
    await start();
    await goToLogo();
    check(await desktopNav().getByRole("link", {name: "Questionnaires", exact: true}).count() === 0, "Business tabs visible before registration");
    await page.screenshot({path: `${output}/desktop-before-save.png`, fullPage: true});
    await save().click();
    await assertManagerTabs();
    check(state.saveMethod === "PATCH" && state.saves === 1, "Existing business was not patched once");
    await page.screenshot({path: `${output}/desktop-after-save.png`, fullPage: true});
    await desktopNav().getByRole("link", {name: "Questionnaires", exact: true}).click();
    await page.waitForURL("**/user/business/service-questionnaires");
    await page.getByRole("heading", {name: "Service Questionnaires", exact: true}).first().waitFor();
    check(!page.url().endsWith("/home"), "Manager route rejected the refreshed role");
  });

  await run("New registration without a logo reveals all business tabs", async () => {
    await start({business: null});
    await fillNewBusiness();
    await save().click();
    await assertManagerTabs();
    check(state.saveMethod === "POST" && state.saves === 1, "Registration was not posted once");
    check(!state.saveBody.includes('name="logo"'), "Empty logo was submitted as an upload");
    check(state.saveBody.includes('name="slug"\r\n\r\nnorthstar-services-inc'), "Generated slug was not preserved");
  });

  await run("New registration with an uploaded logo updates navigation", async () => {
    await start({business: null});
    await fillNewBusiness();
    await page.locator('input[type="file"]').setInputFiles({
      name: "test-logo.png", mimeType: "image/png",
      buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5GkAAAAASUVORK5CYII=", "base64"),
    });
    await save().click();
    await assertManagerTabs();
    check(state.saveBody.includes('filename="test-logo.png"'), "Uploaded logo missing from request");
  });

  await run("Existing manager keeps tabs and final step after editing", async () => {
    await start({role: "MANAGER", savedName: "Northstar Property Care"});
    await page.locator("#business_name").fill("Northstar Property Care");
    await page.getByRole("button", {name: "4 Logo", exact: true}).click();
    await save().click();
    await assertManagerTabs();
    await desktopNav().getByText("Northstar Property Care", {exact: true}).waitFor();
  });

  await run("Client-side validation prevents a save and leaves permissions unchanged", async () => {
    await start({business: null});
    await page.getByRole("button", {name: "4 Logo", exact: true}).click();
    await page.getByText("Business name is required.", {exact: true}).first().waitFor();
    check(state.saves === 0 && state.userReads === 1, "Invalid form triggered a save or role refresh");
    check(await desktopNav().getByRole("link", {name: "Questionnaires", exact: true}).count() === 0, "Invalid form gained manager tabs");
  });

  await run("Failed registration does not reveal tabs; retry succeeds without reload", async () => {
    await start({business: null, failSave: true});
    await fillNewBusiness();
    await save().click();
    await page.getByText("Failed to save business. Please try again.", {exact: true}).waitFor();
    check(state.userReads === 1, "Failed save refreshed the user");
    check(await desktopNav().getByRole("link", {name: "Questionnaires", exact: true}).count() === 0, "Failed save gained manager tabs");
    check(await logoHeading().isVisible(), "Failed save discarded the final step");
    state.failSave = false;
    await save().click();
    await assertManagerTabs();
    check(state.saves === 2, "Retry did not perform exactly one additional save");
  });

  await run("Delayed user refresh preserves the form and success alert", async () => {
    await start({holdUser: true});
    await goToLogo();
    const refreshing = page.waitForRequest(request => new URL(request.url()).pathname.replace(/\/$/, "") === "/api/user/me");
    await save().click();
    await refreshing;
    check(await logoHeading().isVisible(), "Background refresh unmounted the form");
    await page.getByText("Business updated successfully!", {exact: true}).waitFor();
    state.releaseUser();
    await assertManagerTabs();
  });

  await run("Failed manager update preserves existing tabs and permissions", async () => {
    await start({role: "MANAGER", failSave: true});
    await goToLogo();
    await save().click();
    await page.getByText("Failed to save business. Please try again.", {exact: true}).waitFor();
    check(state.userReads === 1, "Failed manager update refreshed user unnecessarily");
    check(await desktopNav().getByRole("link", {name: "Questionnaires", exact: true}).isVisible(), "Failed edit hid manager tabs");
  });

  for (const [label, width, height] of [["tablet", 834, 1194], ["mobile", 390, 844]]) {
    await run(`${label} registration reveals business menu without reload`, async () => {
      await start({business: null, width, height});
      await fillNewBusiness();
      await save().click();
      await assertManagerTabs(true);
      await page.getByRole("alert").getByRole("button", {name: "Close", exact: true}).click();
      await page.screenshot({path: `${output}/${label}-after-save.png`, animations: "disabled"});
      if (label === "mobile") {
        await mobileNav().locator("div.overflow-y-auto").evaluate(element => { element.scrollTop = element.scrollHeight; });
        await page.screenshot({path: `${output}/mobile-business-tabs.png`, animations: "disabled"});
      }
      await mobileNav().getByRole("link", {name: "Invoices", exact: true}).click();
      await page.waitForURL("**/user/business/invoices");
      await page.getByRole("heading", {name: "Invoices", exact: true}).first().waitFor();
      check(!page.url().endsWith("/home"), "New manager could not open invoices");
    });
  }

  await run("Permissions use the server response rather than assuming Manager", async () => {
    await start({savedRole: "USER"});
    await goToLogo();
    await save().click();
    await page.getByText("Business updated successfully!", {exact: true}).waitFor();
    check(state.userReads === 2, "Successful save did not fetch authoritative user data");
    check(await desktopNav().getByRole("link", {name: "Questionnaires", exact: true}).count() === 0, "Frontend invented manager permissions");
    check(await logoHeading().isVisible(), "Final step was reset for unchanged user role");
  });
  check(runtimeErrors.length === 0, `Browser runtime errors: ${runtimeErrors.join("; ")}`);
  return {results, total: results.length, runtimeErrors, screenshots: output};
}
