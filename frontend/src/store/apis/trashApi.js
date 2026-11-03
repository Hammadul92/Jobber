import { api, movedToOrFromTrash } from "./api";

// Soft-deleted records per table. Rows can be restored but never purged:
// deleted records are kept as proof of past work and payments.
export const TRASH_RESOURCES = {
  clients: { path: "/ops/client", tag: "Client", label: "Clients", singular: "client" },
  services: { path: "/ops/service", tag: "Service", label: "Services", singular: "service" },
  quotes: { path: "/ops/quote", tag: "Quote", label: "Quotes", singular: "quote" },
  jobs: { path: "/ops/job", tag: "Job", label: "Jobs", singular: "job" },
  invoices: { path: "/finance/invoice", tag: "Invoice", label: "Invoices", singular: "invoice" },
  "team-members": { path: "/ops/team-member", tag: "TeamMember", label: "Team members", singular: "team member" },
  questionnaires: {
    path: "/ops/service-questionnaire",
    tag: "ServiceQuestionnaire",
    label: "Questionnaires",
    singular: "questionnaire",
  },
  terms: {
    path: "/ops/service-terms-template",
    tag: "ServiceTermsTemplate",
    label: "Terms & conditions",
    singular: "terms template",
  },
};

const trashApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // { resource, page, page_size, search } -> { count, total_pages, current_page, page_size, results }
    // Each row: { id, label, detail, deleted_at, deleted_by, blocked_reason }.
    fetchTrash: builder.query({
      query: ({ resource, ...params }) => ({
        url: `${TRASH_RESOURCES[resource].path}/trash/`,
        params,
      }),
      providesTags: ["Trash"],
    }),
    restoreRecord: builder.mutation({
      query: ({ resource, id }) => ({
        url: `${TRASH_RESOURCES[resource].path}/${id}/restore/`,
        method: "POST",
      }),
      // A restore can bring back dependents too (a client's services, quotes, invoices...).
      invalidatesTags: (result, error, { resource }) =>
        error ? [] : movedToOrFromTrash(TRASH_RESOURCES[resource].tag),
    }),
    // { resource, ids } -> { succeeded, failed, results: [{ id, ok, detail }] }
    restoreRecords: builder.mutation({
      query: ({ resource, ids }) => ({
        url: `${TRASH_RESOURCES[resource].path}/restore/`,
        method: "POST",
        body: { ids },
      }),
      invalidatesTags: (result, error, { resource }) =>
        error ? [] : movedToOrFromTrash(TRASH_RESOURCES[resource].tag),
    }),
  }),
});

export const {
  useFetchTrashQuery,
  useRestoreRecordMutation,
  useRestoreRecordsMutation,
} = trashApi;

export { trashApi };
