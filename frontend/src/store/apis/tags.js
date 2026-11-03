// Cache tags shared by every API slice, plus the helpers slices use to
// declare them. Kept free of imports so it can be unit tested in node.

export const TAG_TYPES = [
  "CurrentUser",
  "Business",
  "Client",
  "Service",
  "Quote",
  "Job",
  "JobPhoto",
  "Invoice",
  "Payout",
  "BankingInformation",
  "TeamMember",
  "ServiceQuestionnaire",
  "ServiceTermsTemplate",
  "Dashboard",
  "Trash",
];

// What else a change to each record type can alter, either because the other
// screen displays its data or because the server updates it as a side effect.
const RELATED = {
  CurrentUser: ["Business", "TeamMember", "Job"],
  Business: ["CurrentUser", "Client", "Service", "Quote", "Job", "Invoice", "Payout", "Dashboard"],
  Client: ["Service", "Quote", "Job", "Invoice", "Payout", "BankingInformation", "Dashboard"],
  // Service saves rewrite draft quotes and can generate quotes and invoices.
  Service: ["Client", "Quote", "Job", "Invoice", "Dashboard"],
  // Signing or declining a quote moves the service along and can create invoices.
  Quote: ["Client", "Service", "Job", "Invoice", "Dashboard"],
  Job: ["Client", "Service", "Invoice", "TeamMember", "JobPhoto", "Dashboard"],
  // Before/after photos move the job's status.
  JobPhoto: ["Job", "Service", "Dashboard"],
  Invoice: ["Client", "Service", "Job", "Payout", "Dashboard"],
  Payout: ["Client", "Invoice", "Dashboard"],
  BankingInformation: ["Client", "Invoice", "Dashboard"],
  TeamMember: ["Job", "Dashboard"],
  ServiceQuestionnaire: ["Client", "Service", "Dashboard"],
  ServiceTermsTemplate: ["Service", "Quote"],
  Dashboard: [],
  Trash: [],
};

// Tags to invalidate after a record of `type` changes.
export const changed = (type) => [type, ...RELATED[type]];

// Deleting or restoring also changes what the trash shows.
export const movedToOrFromTrash = (type) => [...changed(type), "Trash"];

// Wrap an endpoint builder so each endpoint's url is relative to `prefix`
// ("/ops", "/finance", "/user"), as it was when every slice had its own API.
export const withPrefix = (prefix, builder) => {
  const relative = (definition) => {
    if (!definition.query) return definition;
    return {
      ...definition,
      query: (arg) => {
        const request = definition.query(arg);
        return typeof request === "string"
          ? `${prefix}${request}`
          : { ...request, url: `${prefix}${request.url}` };
      },
    };
  };
  return {
    query: (definition) => builder.query(relative(definition)),
    mutation: (definition) => builder.mutation(relative(definition)),
  };
};

// endpoints: prefixed("/ops", (builder) => ({ ... })) for injectEndpoints.
export const prefixed = (prefix, define) => (build) => define(withPrefix(prefix, build));
