import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getBaseUrl } from "./baseConfig";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${getBaseUrl()}/finance`,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token");
    if (token) {
      headers.set("authorization", `Token ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result?.error?.status === 401) {
    localStorage.removeItem("token");
    const currentPath = window.location.pathname + window.location.search;
    window.location.href = `/sign-in?next=${encodeURIComponent(currentPath)}`;
  }
  return result;
};

const invoiceApi = createApi({
  reducerPath: "invoiceApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Invoice"],
  endpoints: (builder) => ({
    fetchInvoices: builder.query({
      query: (params) => {
        let url = "/invoice/";

        if (params) {
          const searchParams = new URLSearchParams();

          if (typeof params === "string" || typeof params === "number") {
            searchParams.set("service", params);
          } else {
            Object.entries(params).forEach(([key, value]) => {
              if (value !== undefined && value !== null && value !== "") {
                searchParams.set(key, value);
              }
            });
          }

          const queryString = searchParams.toString();
          if (queryString) {
            url += `?${queryString}`;
          }
        }

        return url;
      },
      providesTags: ["Invoice"],
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
      invalidatesTags: ["Invoice"],
    }),

    updateInvoice: builder.mutation({
      query: (data) => ({
        url: `/invoice/${data.id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, data) => [
        "Invoice",
        { type: "Invoice", id: data.id },
      ],
    }),

    replaceInvoice: builder.mutation({
      query: (data) => ({
        url: `/invoice/${data.id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, data) => [
        "Invoice",
        { type: "Invoice", id: data.id },
      ],
    }),

    deleteInvoice: builder.mutation({
      query: (id) => ({
        url: `/invoice/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Invoice"],
    }),

    makePayment: builder.mutation({
      query: (id) => ({
        url: `/invoice/${id}/make-payment/`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        "Invoice",
        { type: "Invoice", id },
      ],
    }),
  }),
});

export const {
  useFetchInvoicesQuery,
  useFetchInvoiceQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useReplaceInvoiceMutation,
  useDeleteInvoiceMutation,
  useMakePaymentMutation,
} = invoiceApi;

export { invoiceApi };
