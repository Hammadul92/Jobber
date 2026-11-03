import { api, changed, movedToOrFromTrash, prefixed } from "./api";

const quoteApi = api.injectEndpoints({
  endpoints: prefixed("/ops", (builder) => ({
    // One server-filtered page for tables: { page, page_size, ordering, search, ...filters }.
    fetchQuotesPage: builder.query({
      query: (params) => ({ url: "/quote/", params }),
      providesTags: ["Quote"],
    }),
    bulkQuotes: builder.mutation({
      query: ({ action, ids }) => ({
        url: "/quote/bulk/",
        method: "POST",
        body: { action, ids },
      }),
      invalidatesTags: movedToOrFromTrash("Quote"),
    }),
    fetchQuotes: builder.query({
      query: () => "/quote/",
      providesTags: ["Quote"],
    }),
    fetchQuote: builder.query({
      query: (id) => `/quote/${id}/`,
      providesTags: (result, error, arg) => [{ type: "Quote", id: arg }],
    }),
    createQuote: builder.mutation({
      query: (data) => ({
        url: "/quote/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: changed("Quote"),
    }),
    updateQuote: builder.mutation({
      query: (data) => ({
        url: `/quote/${data.id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: changed("Quote"),
    }),
    deleteQuote: builder.mutation({
      query: (id) => ({
        url: `/quote/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: movedToOrFromTrash("Quote"),
    }),
    sendQuote: builder.mutation({
      query: (id) => ({
        url: `/quote/${id}/send-quote/`,
        method: "POST",
      }),
      invalidatesTags: changed("Quote"),
    }),
    signQuote: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/quote/${id}/sign-quote/`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: changed("Quote"),
    }),
  })),
});

export const {
  useFetchQuotesQuery,
  useFetchQuotesPageQuery,
  useBulkQuotesMutation,
  useFetchQuoteQuery,
  useCreateQuoteMutation,
  useUpdateQuoteMutation,
  useDeleteQuoteMutation,
  useSendQuoteMutation,
  useSignQuoteMutation,
} = quoteApi;

export { quoteApi };
