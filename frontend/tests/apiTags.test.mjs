import test from "node:test";
import assert from "node:assert/strict";
import {
  TAG_TYPES,
  changed,
  movedToOrFromTrash,
  withPrefix,
} from "../src/store/apis/tags.js";

test("editing a service refreshes the quotes and invoices built from it", () => {
  const tags = changed("Service");
  for (const tag of ["Service", "Quote", "Invoice", "Client", "Dashboard"]) {
    assert.ok(tags.includes(tag), `${tag} should refresh after a service change`);
  }
});

test("every related tag is a declared tag type", () => {
  for (const type of TAG_TYPES) {
    for (const tag of changed(type)) {
      assert.ok(TAG_TYPES.includes(tag), `${type} relates to unknown tag ${tag}`);
    }
  }
});

test("deletes and restores also refresh the trash", () => {
  assert.ok(movedToOrFromTrash("Client").includes("Trash"));
  assert.ok(!changed("Client").includes("Trash"));
});

test("withPrefix makes string and object urls relative to the slice", () => {
  const builder = { query: (definition) => definition, mutation: (definition) => definition };
  const ops = withPrefix("/ops", builder);

  assert.equal(ops.query({ query: (id) => `/quote/${id}/` }).query(7), "/ops/quote/7/");
  assert.deepEqual(
    ops.mutation({ query: (body) => ({ url: "/quote/", method: "POST", body }) }).query({ a: 1 }),
    { url: "/ops/quote/", method: "POST", body: { a: 1 } },
  );
  const queryFn = async () => ({ data: null });
  assert.equal(ops.mutation({ queryFn }).queryFn, queryFn);
});
