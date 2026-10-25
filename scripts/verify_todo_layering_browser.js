// Local-only layering regression. All application APIs are mocked; no forms are submitted.
// Run with playwright-cli run-code "$(cat scripts/verify_todo_layering_browser.js)".
async (page) => {
  const base = "http://localhost:5173";
  const output = "output/playwright/todo-layering";
  const results = [];
  const errors = [];
  const mutations = [];
  const todo = () => page.getByRole("button", {name: "Open todos", exact: true});
  const check = (value, message) => { if (!value) throw new Error(message); };
  page.on("pageerror", error => errors.push(error.message));
  await page.route("https://js.stripe.com/**", route => route.fulfill({
    status: 200, contentType: "application/javascript", body: "window.Stripe = function () { return {}; };",
  }));
  await page.route("https://m.stripe.com/**", route => route.fulfill({status: 204, body: ""}));
  await page.unroute("**/api/**");
  await page.route("**/api/**", async route => {
    const request = route.request();
    const endpoint = new URL(request.url()).pathname.replace(/\/$/, "");
    const respond = data => route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify(data)});
    if (request.method() !== "GET") {
      mutations.push(`${request.method()} ${endpoint}`);
      return route.fulfill({status: 400, contentType: "application/json", body: "{}"});
    }
    if (endpoint === "/api/user/me") return respond({id: 91, name: "Alex Morgan", email: "alex@example.test", role: "MANAGER"});
    if (endpoint === "/api/ops/business") return respond([{id: 301, name: "Northstar Services", services_offered: ["Cleaning"]}]);
    if (endpoint === "/api/ops/client") return respond({count: 0, next: null, previous: null, results: []});
    if (endpoint === "/api/finance/banking-information/stripe-config") return respond({publishable_key: ""});
    return respond([]);
  });
  await page.addInitScript(() => localStorage.setItem("token", "todo-layering-test-token"));
  const openPage = async (path, width, height) => {
    await page.setViewportSize({width, height});
    await page.goto(`${base}/user/business/${path}`, {waitUntil: "domcontentloaded"});
    await todo().waitFor({state: "visible"});
  };
  const atTodo = async () => {
    const box = await todo().boundingBox();
    return page.evaluate(({x, y}) => {
      const target = document.elementFromPoint(x, y);
      return {
        todoOnTop: Boolean(target?.closest('button[aria-label="Open todos"]')),
        dialogOnTop: Boolean(target?.closest('[role="dialog"]')),
        target: target?.tagName,
      };
    }, {x: box.x + box.width / 2, y: box.y + box.height / 2});
  };
  const run = async (name, action) => {
    try { await action(); results.push({name, result: "PASS"}); }
    catch (error) {
      await page.screenshot({path: `${output}/failure.png`, animations: "disabled"});
      throw new Error(JSON.stringify({results, failed: name, error: error.message}));
    }
  };

  for (const [label, width, height] of [["desktop", 1440, 1000], ["tablet", 834, 1194], ["mobile", 390, 844]]) {
    await run(`Client drawer covers todo button at ${label} size`, async () => {
      await openPage("clients", width, height);
      check((await atTodo()).todoOnTop, "Todo button is not usable before opening a drawer");
      await todo().click();
      await page.getByRole("heading", {name: "Pending Tasks", exact: true}).waitFor();
      await page.getByRole("button", {name: "Add Client", exact: true}).first().click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("heading", {name: "Add Client Account", exact: true}).waitFor();
      if (label === "desktop") await page.screenshot({path: `${output}/desktop-client-drawer.png`, animations: "disabled"});
      const hit = await atTodo();
      check(!hit.todoOnTop && hit.dialogOnTop, `Todo button covers the client drawer: ${JSON.stringify(hit)}`);
      await dialog.getByRole("button", {name: "Add Client", exact: true}).click({trial: true});
      check(!await page.getByRole("heading", {name: "Pending Tasks", exact: true}).count(), "Todo panel remained open over the form");
      if (label !== "desktop") await page.screenshot({path: `${output}/${label}-client-drawer.png`, animations: "disabled"});
      await dialog.getByRole("button", {name: "Close", exact: true}).click();
      check((await atTodo()).todoOnTop, "Todo button did not become usable after closing the drawer");
      await todo().click();
      await page.getByRole("heading", {name: "Pending Tasks", exact: true}).waitFor();
      await page.getByRole("button", {name: "Close todos", exact: true}).click();
    });
  }

  for (const [path, trigger, heading] of [
    ["team-members", "Add Member", "Add Team Member"],
    ["jobs", "Add Job", "Create New Job"],
  ]) {
    await run(`${heading} drawer also covers the todo button`, async () => {
      await openPage(path, 1440, 1000);
      await page.getByRole("button", {name: trigger, exact: true}).first().click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("heading", {name: heading, exact: true}).waitFor();
      const hit = await atTodo();
      check(!hit.todoOnTop && hit.dialogOnTop, `Todo button covers ${heading}`);
      await dialog.getByRole("button", {name: "Close", exact: true}).click();
      check((await atTodo()).todoOnTop, "Todo button is not restored after closing drawer");
    });
  }

  await run("Mobile navigation backdrop also stays above the todo button", async () => {
    await openPage("clients", 390, 844);
    await page.locator("button[aria-controls=mobile-nav]").click();
    check(!(await atTodo()).todoOnTop, "Todo button covers the mobile navigation backdrop");
    await page.getByRole("button", {name: "Close navigation", exact: true}).click();
    await todo().click({trial: true});
  });
  check(errors.length === 0, `Browser runtime errors: ${errors.join("; ")}`);
  check(mutations.length === 0, `Unexpected form submissions: ${mutations.join("; ")}`);
  return {passed: results.length, results, runtimeErrors: errors, formSubmissions: mutations.length, screenshots: output};
}
