import { api, changed, prefixed } from "./api";

const payoutApi = api.injectEndpoints({
  endpoints: prefixed("/finance", (builder) => ({
    // One server-filtered page for tables: { page, page_size, ordering, search, ...filters }.
    fetchPayoutsPage: builder.query({
      query: (params) => ({ url: "/payout/", params }),
      providesTags: ["Payout"],
    }),

    fetchPayout: builder.query({
      query: (id) => `/payout/${id}/`,
      providesTags: (result, error, id) => [{ type: "Payout", id }],
    }),

    refundPayout: builder.mutation({
      query: ({ id, amount, reason }) => ({
        url: `/payout/${id}/refund/`,
        method: "POST",
        body: { amount, reason },
      }),
      invalidatesTags: changed("Payout"),
    }),
  })),
});

export const {
  useFetchPayoutsPageQuery,
  useFetchPayoutQuery,
  useRefundPayoutMutation,
} = payoutApi;

export { payoutApi };
