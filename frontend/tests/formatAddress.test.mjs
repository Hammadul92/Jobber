import test from "node:test";
import assert from "node:assert/strict";

import { formatAddress, getBillingAddressForService } from "../src/utils/formatAddress.js";

const client = {
  billing_street_address: "10 Billing Lane",
  billing_city: "Calgary",
  billing_province_state: "AB",
  billing_country: "CA",
  billing_postal_code: "T2P 1J9",
};

test("a complete billing address can populate the service address", () => {
  assert.deepEqual(getBillingAddressForService(client), {
    street_address: "10 Billing Lane", city: "Calgary", province_state: "AB",
    country: "CA", postal_code: "T2P 1J9",
  });
});

test("an incomplete legacy billing address cannot be copied", () => {
  assert.equal(getBillingAddressForService({ ...client, billing_city: "" }), null);
  assert.equal(getBillingAddressForService(null), null);
  assert.equal(formatAddress(null, "billing"), "Not provided");
});

test("billing and service addresses remain distinct in document display", () => {
  const invoice = {
    ...client,
    service_street_address: "25 Service Road",
    service_city: "Edmonton",
    service_province_state: "AB",
    service_country: "CA",
    service_postal_code: "T5J 2P2",
  };
  assert.equal(formatAddress(invoice, "billing"), "10 Billing Lane, Calgary, AB, CA, T2P 1J9");
  assert.equal(formatAddress(invoice, "service"), "25 Service Road, Edmonton, AB, CA, T5J 2P2");
});
