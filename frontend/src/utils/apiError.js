// One readable line from an API error: the server's detail if given,
// otherwise "field: message" pairs (non-field errors shown on their own).
export function apiErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  const data = error?.data;

  if (typeof data === "string" && data) return data;
  if (Array.isArray(data) && data.length) return data.join(", ");
  if (data && typeof data === "object") {
    if (data.detail) return String(data.detail);
    const text = Object.entries(data)
      .map(([key, value]) => {
        const message = Array.isArray(value) ? value.join(", ") : value;
        return key === "non_field_errors" ? message : `${key}: ${message}`;
      })
      .join(" | ");
    if (text) return text;
  }

  return error?.error || error?.message || fallback;
}
