// Turns a free-text note ("John Smith, john@x.com, 403-555-0100, 12 Elm St
// NW, Calgary AB T2T 2T2. Snow removal every month, $120, starting Dec 1")
// into client, service and quote fields. Rule-based and offline: labelled
// lines ("Email: ...") win, otherwise patterns and the business's own
// service list are used. Every field reports whether it was found so the
// form can flag what still needs a look. Imports only data helpers, so it
// still runs under node tests.

import { findCity, provinceFromPostal, stateFromZip } from "./placeData.js";

const PROVINCES = {
  CA: {
    AB: "Alberta", BC: "British Columbia", MB: "Manitoba", NB: "New Brunswick",
    NL: "Newfoundland and Labrador", NS: "Nova Scotia", NT: "Northwest Territories",
    NU: "Nunavut", ON: "Ontario", PE: "Prince Edward Island", QC: "Quebec",
    SK: "Saskatchewan", YT: "Yukon",
  },
  US: {
    AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
    CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
    HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas",
    KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts",
    MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
    NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico",
    NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
    OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
    SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
    VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
    DC: "District of Columbia",
  },
};

// "Calgary, AB" / "Red Deer Alberta" / "Calgary T2T 2T2": words just before
// the province or postal code.
function cityBefore(text, index) {
  if (index == null || index <= 0) return "";
  const before = text.slice(0, index).replace(/[\s,]+$/, "");
  const segment = before.split(/[,;\n]|\.\s|\d/).pop().trim();
  const words = segment.split(/\s+/).filter(Boolean).slice(-3);
  if (!words.length || !words.every((word) => /^[A-Z][A-Za-z.'-]*$/.test(word))) return "";
  return words.join(" ");
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const STREET_TYPES =
  "street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|way|crescent|cres|court|ct|lane|ln|place|pl|" +
  "trail|trl|close|gate|highway|hwy|parkway|pkwy|terrace|ter|circle|cir|square|sq|heights|hts|green|grove|" +
  "landing|point|pt|bay|row|mews|park|link|view|manor|common|commons|rise|hill";

const LABELS = {
  name: ["name", "client", "client name", "customer", "contact"],
  email: ["email", "e-mail"],
  phone: ["phone", "cell", "mobile", "tel", "telephone"],
  company: ["company", "business", "company name"],
  address: ["address", "service address", "street", "location"],
  city: ["city", "town"],
  province: ["province", "state", "prov"],
  postal: ["postal", "postal code", "zip", "zip code", "postcode"],
  service: ["service", "service name", "job", "work"],
  price: ["price", "cost", "rate", "amount", "total", "quote"],
  start: ["start", "start date", "starting", "from"],
  end: ["end", "end date", "until"],
  notes: ["notes", "note", "description", "details"],
};

const pad = (value) => String(value).padStart(2, "0");
const isoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const titleCase = (text) =>
  text.toLowerCase().replace(/(^|[\s'-])([a-z])/g, (match, sep, ch) => sep + ch.toUpperCase());

function readLabels(text) {
  const found = {};
  for (const line of text.split(/\n/)) {
    const match = line.match(/^\s*[-*•]?\s*([A-Za-z][A-Za-z -]{0,20}?)\s*[:=]\s*(.+?)\s*$/);
    if (!match) continue;
    const label = match[1].toLowerCase().trim();
    for (const [field, names] of Object.entries(LABELS)) {
      if (names.includes(label) && !(field in found)) found[field] = match[2];
    }
  }
  return found;
}

// "Dec 1", "December 1, 2027", "1 Dec", "2026-12-01", "12/01/2026", "today",
// "tomorrow", "next monday", "monday". Dates without a year roll forward.
export function parseDate(text, today = new Date()) {
  if (!text) return null;
  const value = text.toLowerCase().trim();
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (/\btoday\b|\basap\b|\bnow\b/.test(value)) return isoDate(base);
  if (/\btomorrow\b/.test(value)) return isoDate(new Date(base.getTime() + 86400000));

  let match = value.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (match) return isoDate(new Date(+match[1], +match[2] - 1, +match[3]));

  match = value.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  if (match) {
    const year = match[3].length === 2 ? 2000 + +match[3] : +match[3];
    return isoDate(new Date(year, +match[1] - 1, +match[2]));
  }

  const rollForward = (month, day, year) => {
    let date = new Date(year ?? base.getFullYear(), month, day);
    if (year == null && date < base) date = new Date(base.getFullYear() + 1, month, day);
    return isoDate(date);
  };
  const monthPattern = "(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
  match = value.match(new RegExp(`\\b${monthPattern}\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?`));
  if (match) return rollForward(MONTHS.indexOf(match[1].slice(0, 3)), +match[2], match[3] ? +match[3] : null);
  match = value.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${monthPattern}(?:,?\\s+(\\d{4}))?`));
  if (match) return rollForward(MONTHS.indexOf(match[2].slice(0, 3)), +match[1], match[3] ? +match[3] : null);

  match = value.match(/\b(next\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (match) {
    let days = (WEEKDAYS.indexOf(match[2]) - base.getDay() + 7) % 7;
    if (days === 0 || match[1]) days = days || 7;
    return isoDate(new Date(base.getTime() + days * 86400000));
  }
  return null;
}

function findEmail(text) {
  return text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)?.[0] || "";
}

function findPhone(text) {
  const match = text.match(/(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/);
  if (!match) return "";
  const digits = match[0].replace(/\D/g, "");
  return digits.length === 10 ? `+1${digits}` : `+${digits}`;
}

function findPostal(text) {
  const ca = text.match(/\b([ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z])\s?(\d[ABCEGHJ-NPRSTV-Z]\d)\b/i);
  if (ca) return { postal: `${ca[1]} ${ca[2]}`.toUpperCase(), country: "CA", index: ca.index };
  const us = text.match(/\b(\d{5})(?:-\d{4})?\b(?!\s*(?:dollars|\$))/);
  if (us && !/\$\s*$/.test(text.slice(0, us.index))) return { postal: us[0], country: "US", index: us.index };
  return null;
}

function findProvince(text, country) {
  const countries = country ? [country] : ["CA", "US"];
  for (const code of countries) {
    for (const [abbr, name] of Object.entries(PROVINCES[code])) {
      const match = text.match(new RegExp(`\\b${name}\\b`, "i"));
      if (match) return { province: abbr, country: code, index: match.index };
    }
  }
  for (const code of countries) {
    for (const abbr of Object.keys(PROVINCES[code])) {
      // Uppercase codes only, so "in", "or", "me" in prose don't match.
      const match = text.match(new RegExp(`(?:^|,|\\s)${abbr}(?=[\\s,.]|$)`));
      if (match) return { province: abbr, country: code, index: match.index };
    }
  }
  return null;
}

function findStreet(text) {
  const pattern = new RegExp(
    `\\b(?:(?:unit|suite|apt|#)\\s*[\\w-]+[,\\s]+)?\\d+[A-Za-z]?(?:-\\d+)?\\s+(?:[A-Za-z0-9.'-]+\\s+){0,4}?(?:${STREET_TYPES})\\b\\.?(?:\\s+(?:NW|NE|SW|SE|N|S|E|W)\\b)?`,
    "i",
  );
  const match = text.match(pattern);
  return match ? { street: match[0].replace(/\s+/g, " ").trim(), index: match.index, end: match.index + match[0].length } : null;
}

const AMOUNT = "(\\d[\\d,]*(?:\\.\\d{1,2})?)";

function findMoney(text, { bare = false } = {}) {
  const match =
    text.match(new RegExp(`(?:US|CA|C)?\\$\\s?${AMOUNT}`, "i")) ||
    text.match(new RegExp(`\\b${AMOUNT}\\s?(?:\\$|dollars|bucks|cad|usd)`, "i")) ||
    // "Price: 185", "cost 185", "rate = 185.50" without a currency sign.
    text.match(new RegExp(`\\b(?:price|cost|rate|amount|fee|charge|budget)\\b\\s*(?:is|of)?\\s*[:=-]?\\s*${AMOUNT}\\b`, "i")) ||
    // A labelled price value that is just a number.
    (bare ? text.match(new RegExp(`^\\s*${AMOUNT}\\s*$`)) : null);
  return match ? Number(match[1].replace(/,/g, "")).toFixed(2) : "";
}

// "- Driveway clearing $80" / "Salting: $25" lines become line items.
function findItems(text) {
  const items = [];
  for (const line of text.split(/\n/)) {
    const match = line.match(/^\s*(?:[-*•]|\d+[.)])\s*(.+?)\s*(?:[-–:@]\s*)?(?:(?:US|CA|C)?\$\s?)(\d[\d,]*(?:\.\d{1,2})?)\s*$/i);
    if (match) {
      items.push({
        title: match[1].replace(/[\s:–-]+$/, "").slice(0, 100),
        description: "",
        price: Number(match[2].replace(/,/g, "")).toFixed(2),
      });
    }
  }
  return items;
}

const stem = (word) => word.toLowerCase().replace(/(ing|ers|er|es|s)$/, "");

// Best match from the business's own services ("Snow Removal" for "plow snow").
export function matchService(text, options = []) {
  const words = new Set((text.toLowerCase().match(/[a-z]+/g) || []).filter((w) => w.length > 2).map(stem));
  let best = null;
  for (const option of options) {
    const lower = option.toLowerCase();
    if (text.toLowerCase().includes(lower)) return { name: option, exact: true };
    const tokens = (lower.match(/[a-z]+/g) || []).filter((w) => w.length > 2).map(stem);
    const hits = tokens.filter((token) => words.has(token)).length;
    if (hits && (!best || hits / tokens.length > best.score)) best = { name: option, score: hits / tokens.length };
  }
  return best ? { name: best.name, exact: false } : null;
}

function findName(text, labels, email) {
  if (labels.name) return titleCase(labels.name.trim());
  const firstLine = text.split(/\n/)[0];
  const segments = firstLine.split(/[,;|]|\s[-–]\s/).map((segment) => segment.trim());
  for (const segment of segments) {
    if (/[@\d$]/.test(segment)) continue;
    const words = segment.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && words.every((word) => /^[A-Za-z][A-Za-z.'-]*$/.test(word))) {
      return titleCase(segment);
    }
  }
  if (email) {
    const local = email.split("@")[0].split(/[._-]/).filter((part) => /^[a-z]+$/i.test(part));
    if (local.length >= 2) return titleCase(local.join(" "));
  }
  return "";
}

// Street, city, province/state, postal code and country from address text.
// `labels` holds labelled values ("City: Calgary") that take priority.
function parseAddress(addressText, labels = {}, clientName = "") {
  const postal = findPostal(labels.postal || addressText);
  let province = findProvince(labels.province || addressText, postal?.country);
  // No province/state written: the postal or ZIP code says where it is.
  if (!province && postal) {
    const fromCode = postal.country === "CA" ? provinceFromPostal(postal.postal) : stateFromZip(postal.postal);
    if (fromCode) province = { province: fromCode, country: postal.country, fromCode: true };
  }
  const street = findStreet(labels.address || addressText);
  // The client's own name ("Jackson Lee") must not be read as a city.
  const nameFree = clientName
    ? addressText.replace(new RegExp(clientName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), " ")
    : addressText;

  let city = labels.city ? titleCase(labels.city.trim()) : "";
  if (!city && street) {
    const after = addressText.slice(street.end);
    const stop = after.search(/\b[A-Z]{2}\b|\b[ABCEGHJ-NPRSTVXY]\d[A-Z]\s?\d|[.;\n]|\d/);
    const candidate = (stop >= 0 ? after.slice(0, stop) : after).replace(/^[\s,]+|[\s,]+$/g, "");
    const words = candidate.split(/\s+/).filter(Boolean);
    if (words.length && words.length <= 3 && words.every((word) => /^[A-Za-z.'-]+$/.test(word))) {
      city = titleCase(candidate.replace(/,.*/, ""));
    }
  }
  if (!city) {
    const isProvince = (words) =>
      Object.values(PROVINCES).some((list) =>
        Object.entries(list).some(([abbr, name]) => [abbr, name.toLowerCase()].includes(words.toLowerCase())),
      );
    const candidates = [
      !labels.province && cityBefore(nameFree, province?.fromCode ? null : province?.index),
      cityBefore(nameFree, postal ? nameFree.indexOf(postal.postal.split(" ")[0]) : null),
    ].filter((words) => words && !isProvince(words));
    const candidate = candidates[0] || "";
    // A known city inside the words wins ("Jane Doe Calgary" -> "Calgary");
    // otherwise keep a short guess, else look for a known city anywhere.
    const where = { province: province?.province, country: postal?.country || province?.country };
    const known = findCity(candidate, where) || (!candidate ? findCity(nameFree, where) : null);
    if (known) {
      city = known.city;
      if (!province) province = { province: known.province, country: known.country };
    } else if (candidate && candidate.split(/\s+/).length <= 2) {
      city = candidate;
    }
  }
  return { street, city, province, postal, country: postal?.country || province?.country || "CA" };
}

function setAddress(set, prefix, { street, city, province, postal, country }) {
  set(`${prefix}street_address`, street?.street || "", street);
  set(`${prefix}city`, city, city);
  set(`${prefix}province_state`, province?.province || "", province);
  set(`${prefix}postal_code`, postal?.postal || "", postal);
  set(`${prefix}country`, country, postal || province);
}

const BILLING_LABEL = /^\s*[-*•]?\s*(?:billing(?:\s+address)?|bill\s+to|mailing(?:\s+address)?)\s*[:=]\s*(.*?)\s*$/i;

// "Billing: 50 Oak Ave, Edmonton AB T5K 1A1", or "Billing address:" with the
// address on the next line (or next two, when the postal code is on the
// second). A value with no number ("Billing: monthly") is not an address.
export function splitBilling(text) {
  const lines = text.split(/\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(BILLING_LABEL);
    if (!match) continue;
    const used = [i];
    let value = match[1];
    if (!value && lines[i + 1]?.trim()) {
      value = lines[i + 1].trim();
      used.push(i + 1);
      if (!findPostal(value) && lines[i + 2] && findPostal(lines[i + 2])) {
        value += `, ${lines[i + 2].trim()}`;
        used.push(i + 2);
      }
    }
    if (!/\d/.test(value)) continue;
    return { billing: value, rest: lines.filter((_, index) => !used.includes(index)).join("\n") };
  }
  return { billing: "", rest: text };
}

/**
 * parseQuickAdd(text, { serviceOptions, today }) -> { fields, found }
 * fields: client_*, company_name, address, service, quote values (strings);
 * found: field -> true when it came from the text (false = default/guess).
 */
export function parseQuickAdd(text, { serviceOptions = [], today = new Date() } = {}) {
  // A billing line is taken out first so its address, postal code and so on
  // don't get mixed into the service address or the description.
  const { billing: billingText, rest: raw } = splitBilling(String(text || ""));
  const labels = readLabels(raw);
  const flat = raw.replace(/\s+/g, " ");
  const found = {};
  const fields = {};
  const set = (key, value, wasFound) => {
    fields[key] = value;
    found[key] = Boolean(wasFound && value);
  };

  const email = (labels.email && findEmail(labels.email)) || findEmail(flat);
  set("client_email", email, email);
  const phone = findPhone(labels.phone || "") || findPhone(flat.replace(email, ""));
  set("client_phone", phone, phone);
  set("client_name", findName(raw, labels, email), true);

  const company =
    labels.company ||
    flat.match(/\b[A-Z][\w&'. -]{1,40}?\s(?:Inc|Ltd|LLC|Corp|Co|Corporation|Limited)\b\.?/)?.[0] ||
    "";
  set("company_name", company.trim(), company);

  // Service address: labelled parts first, then patterns over the whole note.
  const contactFree = flat
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, " ")
    .replace(/(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g, " ");
  const addressText =
    [labels.address, labels.city, labels.province, labels.postal].filter(Boolean).join(", ") || contactFree;
  const address = parseAddress(addressText, labels, fields.client_name);
  const country = address.country;
  setAddress(set, "", address);

  // Billing address: only from a "Billing: ..." / "Bill to: ..." line.
  if (billingText) {
    setAddress(set, "billing_", parseAddress(billingText.replace(/\s+/g, " "), {}, fields.client_name));
  }

  // Service: the business's catalogue first, then a labelled value.
  const serviceMatch = matchService(labels.service || raw, serviceOptions);
  const serviceName = serviceMatch?.name || (labels.service ? titleCase(labels.service.trim()) : "");
  set("service_name", serviceName, serviceMatch || labels.service);

  const items = findItems(raw);
  fields.items = items;
  found.items = items.length > 0;
  const price = items.length
    ? items.reduce((sum, item) => sum + Number(item.price), 0).toFixed(2)
    : (labels.price && findMoney(labels.price, { bare: true })) || findMoney(flat);
  set("price", price, price);
  set("currency", /\busd\b|\bus\$/i.test(flat) || country === "US" ? "USD" : "CAD", /\b(usd|cad|us\$)\b/i.test(flat));

  const recurring = flat.match(
    /\b(monthly|yearly|annual(?:ly)?|weekly|bi-?weekly|subscription|recurring|seasonal|every\s+(?:week|month|year)|(?:per|a|each)\s+(?:week|month|year))\b/i,
  );
  const yearly = recurring && /year|annual|seasonal/i.test(recurring[0]);
  set("service_type", recurring ? "SUBSCRIPTION" : "ONE_TIME", recurring);
  set("billing_cycle", recurring ? (yearly ? "YEARLY" : "MONTHLY") : "", recurring);

  const startText =
    labels.start ||
    flat.match(/\b(?:start(?:ing|s)?|begin(?:ning|s)?|from|on)\b\s+([^.;,]{2,30})/i)?.[1] ||
    "";
  const start = parseDate(startText, today);
  set("start_date", start || isoDate(today), start);
  const endText = labels.end || flat.match(/\b(?:until|till|through|ending|ends)\b\s+([^.;,]{2,30})/i)?.[1] || "";
  const end = parseDate(endText, today);
  set("end_date", end || "", end);

  // Description: the note minus lines that only carried contact details.
  const description =
    labels.notes ||
    raw
      .split(/\n|(?<=\.)\s+/)
      .map((part) => part.trim())
      .filter((part) => part && !part.includes("@") && !findPhone(part) && !findPostal(part) && !readLabels(part).name)
      .filter((part) => !/^[A-Za-z]+\s*[:=]/.test(part))
      .join(" ")
      .slice(0, 1000);
  set("description", description, description);

  return { fields, found };
}

export const REQUIRED_FIELDS = [
  "client_name", "client_email", "client_phone", "service_name", "price", "start_date",
  "street_address", "city", "province_state", "postal_code",
];

export function missingFields(fields) {
  return REQUIRED_FIELDS.filter((key) => !String(fields[key] ?? "").trim());
}

export { PROVINCES };
