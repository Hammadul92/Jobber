import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getBaseUrl } from "./baseConfig";
import { quoteApi } from "./quoteApi";
import { invoiceApi } from "./invoiceApi";

const refreshGeneratedDocuments = async ({ dispatch, queryFulfilled }) => {
  try {
    await queryFulfilled;
    dispatch(quoteApi.util.invalidateTags(["Quote"]));
    dispatch(invoiceApi.util.invalidateTags(["Invoice"]));
  } catch {
    // A failed service mutation did not change generated documents.
  }
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${getBaseUrl()}/ops`,
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

const serviceApi = createApi({
  reducerPath: "serviceApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Service"],
  endpoints: (builder) => ({
    // One server-filtered page for tables: { page, page_size, ordering, search, ...filters }.
    fetchServicesPage: builder.query({
      query: (params) => ({ url: "/service/", params }),
      providesTags: ["Service"],
    }),
    bulkServices: builder.mutation({
      query: ({ action, ids }) => ({
        url: "/service/bulk/",
        method: "POST",
        body: { action, ids },
      }),
      invalidatesTags: ["Service"],
    }),
    fetchServices: builder.query({
      query: (client) => {
        let url = "/service/";
        if (client) {
          url += `?client=${client}`;
        }
        return url;
      },
      providesTags: ["Service"],
    }),
    fetchService: builder.query({
      query: (id) => `/service/${id}/`,
      providesTags: (result, error, arg) => [{ type: "Service", id: arg }],
    }),
    createService: builder.mutation({
      query: (data) => ({
        url: "/service/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Service"],
      onQueryStarted: (arg, api) => refreshGeneratedDocuments(api),
    }),
    updateService: builder.mutation({
      query: (data) => ({
        url: `/service/${data.id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        "Service",
        { type: "Service", id: arg.id },
      ],
      onQueryStarted: (arg, api) => refreshGeneratedDocuments(api),
    }),
    deleteService: builder.mutation({
      query: (id) => ({
        url: `/service/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Service"],
    }),
    resendQuestionnaire: builder.mutation({
      query: (id) => ({
        url: `/service/${id}/resend-questionnaire/`,
        method: "POST",
      }),
    }),
  }),
});

export const {
  useFetchServicesQuery,
  useFetchServicesPageQuery,
  useBulkServicesMutation,
  useFetchServiceQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useResendQuestionnaireMutation,
} = serviceApi;

export { serviceApi };
