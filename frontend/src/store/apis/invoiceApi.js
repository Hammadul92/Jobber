import { api, changed, movedToOrFromTrash, prefixed } from "./api";

const invoiceApi = api.injectEndpoints({
  endpoints: prefixed("/finance", (builder) => ({
    // One server-filtered page for tables: { page, page_size, ordering, search, ...filters }.
    fetchInvoicesPage: builder.query({
      query: (params) => ({ url: "/invoice/", params }),
      providesTags: ["Invoice"],
    }),
    bulkInvoices: builder.mutation({
      query: ({ action, ids }) => ({
        url: "/invoice/bulk/",
        method: "POST",
        body: { action, ids },
      }),
      invalidatesTags: movedToOrFromTrash("Invoice"),
    }),

    fetchInvoice: builder.query({
      query: (id) => `/invoice/${id}/`,
      providesTags: (result, error, id) => [{ type: "Invoice", id }],
    }),

    createInvoice: builder.mutation({
      query: (data) => ({
        url: "/invoice/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: changed("Invoice"),
    }),

    updateInvoice: builder.mutation({
      query: (data) => ({
        url: `/invoice/${data.id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: changed("Invoice"),
    }),

    deleteInvoice: builder.mutation({
      query: (id) => ({
        url: `/invoice/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: movedToOrFromTrash("Invoice"),
    }),

    // paymentOption: "PAYMENT_LINK" | "ETRANSFER"; omit to keep the last one.
    sendInvoice: builder.mutation({
      query: ({ id, paymentOption }) => ({
        url: `/invoice/${id}/send-invoice/`,
        method: "POST",
        body: paymentOption ? { payment_option: paymentOption } : {},
      }),
      invalidatesTags: changed("Invoice"),
    }),

    sendPaymentConfirmation: builder.mutation({
      query: (id) => ({
        url: `/invoice/${id}/send-payment-confirmation/`,
        method: "POST",
      }),
      invalidatesTags: changed("Invoice"),
    }),

    markInvoiceUnpaid: builder.mutation({
      query: (id) => ({
        url: `/invoice/${id}/mark-unpaid/`,
        method: "POST",
      }),
      invalidatesTags: changed("Invoice"),
    }),

    makePayment: builder.mutation({
      query: (id) => ({
        url: `/invoice/${id}/make-payment/`,
        method: "POST",
      }),
      invalidatesTags: changed("Invoice"),
    }),
  })),
});

export const {
  useFetchInvoicesPageQuery,
  useBulkInvoicesMutation,
  useFetchInvoiceQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useMakePaymentMutation,
  useSendInvoiceMutation,
  useSendPaymentConfirmationMutation,
  useMarkInvoiceUnpaidMutation,
} = invoiceApi;

export { invoiceApi };
