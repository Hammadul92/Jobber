import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const nginx = readFileSync(new URL("../nginx.conf", import.meta.url), "utf8");

test("production serves the super-admin root and deep links through React", () => {
  for (const location of ["= /super-admin", "^~ /super-admin/"]) {
    const start = nginx.indexOf(`location ${location} {`);
    assert.notEqual(start, -1, `Missing production route: ${location}`);
    const block = nginx.slice(start, nginx.indexOf("}", start));
    assert.match(block, /try_files \$uri \/index\.html =404;/);
    assert.match(block, /Cache-Control "no-cache"/);
    assert.doesNotMatch(block, /proxy_pass/);
  }
});

test("super-admin API and Django admin remain backend routes", () => {
  for (const location of ["/api/", "/admin/"]) {
    const start = nginx.indexOf(`location ${location} {`);
    const block = nginx.slice(start, nginx.indexOf("}", start));
    assert.match(block, /proxy_pass http:\/\/app:8000;/);
  }
});
