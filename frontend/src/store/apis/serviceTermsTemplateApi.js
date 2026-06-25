import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getBaseUrl } from "./baseConfig";

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

const serviceTermsTemplateApi = createApi({
  reducerPath: "serviceTermsTemplateApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["ServiceTermsTemplate"],
  endpoints: (builder) => ({
    fetchServiceTermsTemplates: builder.query({
      query: () => "/service-terms-template/",
      providesTags: ["ServiceTermsTemplate"],
    }),
    fetchServiceTermsTemplate: builder.query({
      query: (id) => `/service-terms-template/${id}/`,
      providesTags: (result, error, id) => [
        { type: "ServiceTermsTemplate", id },
      ],
    }),
    createServiceTermsTemplate: builder.mutation({
      query: (data) => ({
        url: "/service-terms-template/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ServiceTermsTemplate"],
    }),
    updateServiceTermsTemplate: builder.mutation({
      query: (data) => ({
        url: `/service-terms-template/${data.id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        "ServiceTermsTemplate",
        { type: "ServiceTermsTemplate", id: arg.id },
      ],
    }),
    deleteServiceTermsTemplate: builder.mutation({
      query: (id) => ({
        url: `/service-terms-template/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["ServiceTermsTemplate"],
    }),
  }),
});

export const {
  useFetchServiceTermsTemplatesQuery,
  useFetchServiceTermsTemplateQuery,
  useCreateServiceTermsTemplateMutation,
  useUpdateServiceTermsTemplateMutation,
  useDeleteServiceTermsTemplateMutation,
} = serviceTermsTemplateApi;

export { serviceTermsTemplateApi };
