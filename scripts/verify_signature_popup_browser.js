// Local-only signature-popup regressions. Application APIs and Stripe scripts are mocked.
// Create output/playwright/signature-popup, open the local app, then run with playwright-cli run-code.
async (page) => {
  const output = "output/playwright/signature-popup";
  const results = [];
  const errors = [];
  let submitted = [];
  let quote;
  const makeQuote = () => ({
    id: 42, quote_number: "Q-SIGNATURE-TEST", business_name: "Northstar Services", client_name: "Alex Morgan",
    status: "SENT", valid_until: new Date(Date.now() + 86400000 * 3).toISOString(),
    general_terms_conditions: "Agreed service terms.",
    client: {client_name: "Alex Morgan", client_email: "alex@example.test", is_active: true},
    service_data: {id: 8, service_name: "Cleaning", price: "2300.00", currency: "CAD", service_type: "ONE_TIME"},
  });
  const dialog = () => page.getByRole("dialog");
  const panel = () => dialog().locator(":scope > div");
  const canvas = () => dialog().locator("canvas");
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
    if (endpoint === "/api/user/me") return respond({id: 11, name: "Alex Morgan", email: "alex@example.test", role: "CLIENT"});
    if (endpoint === "/api/ops/quote/42") return respond(quote);
    if (endpoint === "/api/ops/quote/42/sign-quote" && request.method() === "POST") {
      submitted.push({body: request.postDataBuffer().toString("latin1"), type: request.headers()["content-type"]});
      quote = {...quote, status: "SIGNED", signed_at: new Date().toISOString()};
      return respond({detail: "Quote successfully signed."});
    }
    check(request.method() === "GET", `Unexpected mutation: ${request.method()} ${endpoint}`);
    return respond([]);
  });
  await page.addInitScript(() => localStorage.setItem("token", "signature-popup-test-token"));
  const open = async (width, height) => {
    quote = makeQuote();
    submitted = [];
    await page.setViewportSize({width, height});
    await page.goto("http://localhost:5173/user/business/quote/sign/42", {waitUntil: "domcontentloaded"});
    await page.getByRole("button", {name: "Accept & Sign", exact: true}).click();
    await dialog().getByRole("heading", {name: "Accept & Sign Quote", exact: true}).waitFor();
  };
  const assertFits = async () => {
    const size = page.viewportSize();
    const box = await panel().boundingBox();
    check(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= size.width + 1 && box.y + box.height <= size.height + 1,
      `Panel is outside viewport: ${JSON.stringify({box, size})}`);
    check(box.width <= 561, "Popup exceeded its intended desktop maximum width");
    check(await panel().evaluate(element => element.scrollWidth <= element.clientWidth + 1), "Popup has horizontal overflow");
    for (const control of [
      dialog().getByRole("button", {name: "Close", exact: true}),
      dialog().getByRole("button", {name: "Save Signature", exact: true}),
      dialog().getByRole("button", {name: "Cancel", exact: true}),
      dialog().getByRole("button", {name: "Submit", exact: true}),
    ]) {
      await control.scrollIntoViewIfNeeded();
      const bounds = await control.boundingBox();
      check(bounds && bounds.y >= -1 && bounds.y + bounds.height <= size.height + 1, "A popup control cannot be scrolled into view");
    }
  };
  const inkCount = () => canvas().evaluate(element => {
    const data = element.getContext("2d").getImageData(0, 0, element.width, element.height).data;
    let count = 0;
    for (let index = 0; index < data.length; index += 4) {
      if (data[index + 3] > 0 && data[index] < 100 && data[index + 1] < 100 && data[index + 2] < 100) count++;
    }
    return count;
  });
  const draw = async () => {
    await canvas().scrollIntoViewIfNeeded();
    const box = await canvas().boundingBox();
    const viewport = page.viewportSize();
    const y = Math.max(20, box.y + Math.min(box.height * 0.35, 70));
    check(y + 20 < viewport.height, "Drawing area is outside viewport");
    await page.mouse.move(box.x + 20, y);
    await page.mouse.down();
    for (let index = 1; index <= 12; index++) await page.mouse.move(box.x + 20 + index * 7, y + (index % 2 ? 18 : 0), {steps: 2});
    await page.mouse.up();
    check(await inkCount() > 20, "Canvas did not record the signature");
  };
  const run = async (name, action) => {
    try { await action(); results.push({name, result: "PASS"}); }
    catch (error) {
      await page.screenshot({path: `${output}/failure.png`});
      throw new Error(JSON.stringify({results, failed: name, error: error.message}));
    }
  };

  for (const [width, height] of [
    [320, 568], [360, 640], [375, 667], [390, 844], [393, 852], [414, 896], [430, 932],
    [360, 480], [568, 320], [667, 375], [844, 390], [768, 1024], [834, 1194], [1024, 768], [1440, 900],
  ]) {
    await run(`Popup and all controls fit or scroll at ${width}x${height}`, async () => {
      await open(width, height);
      await assertFits();
      check(await dialog().getByRole("button", {name: "Submit", exact: true}).isDisabled(), "Blank signature can be submitted");
      await panel().evaluate(element => { element.scrollTop = 0; });
      if (["320x568", "390x844", "844x390", "1440x900"].includes(`${width}x${height}`)) {
        await page.screenshot({path: `${output}/${width}x${height}.png`});
        if (await panel().evaluate(element => element.scrollHeight > element.clientHeight)) {
          await panel().evaluate(element => { element.scrollTop = element.scrollHeight; });
          await page.screenshot({path: `${output}/${width}x${height}-scrolled.png`});
        }
      }
    });
  }

  await run("Very short viewport scrolls to both header and footer", async () => {
    await open(320, 240);
    await assertFits();
    check(await panel().evaluate(element => element.scrollHeight > element.clientHeight), "Extreme viewport has no scroll fallback");
    await dialog().getByRole("button", {name: "Cancel", exact: true}).click();
    check(await dialog().count() === 0, "Cancel does not close popup");
  });

  await run("Increased text size still allows scrolling to all controls", async () => {
    await open(320, 568);
    await page.evaluate(() => { document.documentElement.style.fontSize = "32px"; });
    await assertFits();
    await page.screenshot({path: `${output}/large-text-scrolled.png`});
    await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
  });

  await run("Draw, save, clear, redraw and submit a PNG signature", async () => {
    await open(390, 844);
    await draw();
    await dialog().getByRole("button", {name: "Save Signature", exact: true}).click();
    await dialog().getByText("Signature saved", {exact: true}).waitFor();
    check(await dialog().getByRole("button", {name: "Submit", exact: true}).isEnabled(), "Saved signature cannot be submitted");
    await assertFits();
    await dialog().getByRole("button", {name: "Clear", exact: true}).click();
    check(await inkCount() === 0, "Clear did not erase canvas");
    check(await dialog().getByRole("button", {name: "Submit", exact: true}).isDisabled(), "Clear did not reset saved signature");
    await draw();
    await dialog().getByRole("button", {name: "Save Signature", exact: true}).click();
    await page.screenshot({path: `${output}/signature-saved-mobile.png`});
    await dialog().getByRole("button", {name: "Submit", exact: true}).click();
    await page.getByText("Quote signed successfully!", {exact: true}).waitFor();
    check(submitted.length === 1, "Expected exactly one signing request");
    check(submitted[0].type.includes("multipart/form-data") && submitted[0].body.includes('filename="signature.png"') && submitted[0].body.includes("image/png"), "Signature request is not a PNG multipart upload");
    check(await dialog().count() === 0, "Successful signing did not close popup");
  });

  await run("Signature survives portrait-to-landscape resize", async () => {
    await open(390, 844);
    await draw();
    await page.setViewportSize({width: 844, height: 390});
    await page.waitForFunction(() => {
      const canvas = document.querySelector('[role="dialog"] canvas');
      return canvas && canvas.width === Math.round(canvas.offsetWidth * devicePixelRatio) && canvas.height === Math.round(canvas.offsetHeight * devicePixelRatio);
    });
    check(await inkCount() > 20, "Rotating the viewport erased the signature");
    await assertFits();
    await dialog().getByRole("button", {name: "Save Signature", exact: true}).click();
    check(await dialog().getByRole("button", {name: "Submit", exact: true}).isEnabled(), "Resized signature could not be saved");
  });

  await run("Closing restores background scrolling and reopening resets the canvas", async () => {
    await open(390, 844);
    check(await page.evaluate(() => document.body.style.overflow === "hidden"), "Background scrolling is not locked");
    await draw();
    await dialog().getByRole("button", {name: "Close", exact: true}).click();
    check(await page.evaluate(() => document.body.style.overflow !== "hidden"), "Closing left background scrolling locked");
    await page.getByRole("button", {name: "Accept & Sign", exact: true}).click();
    check(await inkCount() === 0, "Reopened popup retained the previous signature");
  });

  await run("Saving a blank signature remains blocked", async () => {
    await open(390, 844);
    await page.evaluate(() => {
      window.__signatureAlerts = [];
      window.alert = message => window.__signatureAlerts.push(message);
    });
    await dialog().getByRole("button", {name: "Save Signature", exact: true}).click();
    check(await page.evaluate(() => window.__signatureAlerts[0]) === "Please draw your signature before saving.", "Blank signature was not rejected");
    check(await dialog().getByRole("button", {name: "Submit", exact: true}).isDisabled(), "Blank signature enabled submission");
    check(submitted.length === 0, "Blank signature produced a signing request");
  });

  await run("Touch input records a signature on a high-density mobile screen", async () => {
    await open(390, 844);
    const cdp = await page.context().newCDPSession(page);
    try {
      await cdp.send("Emulation.setTouchEmulationEnabled", {enabled: true, maxTouchPoints: 1});
      await cdp.send("Emulation.setDeviceMetricsOverride", {width: 390, height: 844, deviceScaleFactor: 3, mobile: true});
      await page.waitForFunction(() => {
        const canvas = document.querySelector('[role="dialog"] canvas');
        return canvas && canvas.width === canvas.offsetWidth * 3;
      });
      await canvas().scrollIntoViewIfNeeded();
      const box = await canvas().boundingBox();
      await cdp.send("Input.dispatchTouchEvent", {type: "touchStart", touchPoints: [{x: box.x + 20, y: box.y + 40}]});
      for (let index = 1; index <= 15; index++) {
        await cdp.send("Input.dispatchTouchEvent", {type: "touchMove", touchPoints: [{x: box.x + 20 + index * 6, y: box.y + 40 + (index % 2 ? 15 : 0)}]});
      }
      await cdp.send("Input.dispatchTouchEvent", {type: "touchEnd", touchPoints: []});
      check(await inkCount() > 20, "Touch input did not draw on canvas");
      await dialog().getByRole("button", {name: "Save Signature", exact: true}).click();
      check(await dialog().getByRole("button", {name: "Submit", exact: true}).isEnabled(), "Touch-drawn signature could not be saved");
      await assertFits();
      await page.screenshot({path: `${output}/touch-signature-dpr3.png`});
    } finally {
      await cdp.send("Emulation.clearDeviceMetricsOverride");
      await cdp.send("Emulation.setTouchEmulationEnabled", {enabled: false});
      await cdp.detach();
    }
  });

  await run("Touch scrolling reaches the footer without moving the background page", async () => {
    await open(320, 568);
    const cdp = await page.context().newCDPSession(page);
    try {
      await cdp.send("Emulation.setTouchEmulationEnabled", {enabled: true, maxTouchPoints: 1});
      await panel().evaluate(element => { element.scrollTop = 0; });
      const bodyScroll = await page.evaluate(() => window.scrollY);
      const box = await panel().boundingBox();
      const x = box.x + 6;
      await cdp.send("Input.dispatchTouchEvent", {type: "touchStart", touchPoints: [{x, y: 470}]});
      for (const y of [420, 370, 320, 270, 220, 170]) {
        await cdp.send("Input.dispatchTouchEvent", {type: "touchMove", touchPoints: [{x, y}]});
      }
      await cdp.send("Input.dispatchTouchEvent", {type: "touchEnd", touchPoints: []});
      await page.waitForFunction(() => document.querySelector('[role="dialog"] > div').scrollTop > 0);
      check(await page.evaluate(() => window.scrollY) === bodyScroll, "Touch scrolling moved the background page");
      await dialog().getByRole("button", {name: "Cancel", exact: true}).click();
      check(await dialog().count() === 0, "Touch-scrolled popup could not be closed");
    } finally {
      await cdp.send("Emulation.setTouchEmulationEnabled", {enabled: false});
      await cdp.detach();
    }
  });
  check(errors.length === 0, `Browser runtime errors: ${errors.join("; ")}`);
  return {passed: results.length, results, runtimeErrors: errors, screenshots: output};
}
