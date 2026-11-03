import test from "node:test";
import assert from "node:assert/strict";
import { toCsv } from "../src/utils/csv.js";

test("quotes every cell and escapes embedded quotes", () => {
  assert.equal(
    toCsv([["Name", "Note"], ['Acme, Inc', 'Said "hi"'], [null, 5]]),
    '"Name","Note"\n"Acme, Inc","Said ""hi"""\n"","5"',
  );
});
