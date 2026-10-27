export function formatAddress(record, prefix = "") {
  const fields = prefix === "billing" ? [
    record?.billing_street_address,
    record?.billing_city,
    record?.billing_province_state,
    record?.billing_country,
    record?.billing_postal_code,
  ] : prefix === "service" ? [
    record?.service_street_address,
    record?.service_city,
    record?.service_province_state,
    record?.service_country,
    record?.service_postal_code,
  ] : [
    record?.street_address,
    record?.city,
    record?.province_state,
    record?.country,
    record?.postal_code,
  ];
  return fields.filter(Boolean).join(", ") || "Not provided";
}

export function getBillingAddressForService(client) {
  const address = {
    street_address: client?.billing_street_address || "",
    city: client?.billing_city || "",
    province_state: client?.billing_province_state || "",
    country: client?.billing_country || "",
    postal_code: client?.billing_postal_code || "",
  };
  return Object.values(address).every(Boolean) ? address : null;
}
