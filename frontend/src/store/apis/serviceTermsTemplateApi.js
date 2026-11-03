import { api, changed, movedToOrFromTrash, prefixed } from "./api";

const serviceTermsTemplateApi = api.injectEndpoints({
  endpoints: prefixed("/ops", (builder) => ({
    fetchServiceTermsTemplates: builder.query({
      query: () => "/service-terms-template/",
      providesTags: ["ServiceTermsTemplate"],
    }),
    createServiceTermsTemplate: builder.mutation({
      query: (data) => ({
        url: "/service-terms-template/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: changed("ServiceTermsTemplate"),
    }),
    updateServiceTermsTemplate: builder.mutation({
      query: (data) => ({
        url: `/service-terms-template/${data.id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: changed("ServiceTermsTemplate"),
    }),
    deleteServiceTermsTemplate: builder.mutation({
      query: (id) => ({
        url: `/service-terms-template/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: movedToOrFromTrash("ServiceTermsTemplate"),
    }),
  })),
});

export const {
  useFetchServiceTermsTemplatesQuery,
  useCreateServiceTermsTemplateMutation,
  useUpdateServiceTermsTemplateMutation,
  useDeleteServiceTermsTemplateMutation,
} = serviceTermsTemplateApi;

export { serviceTermsTemplateApi };
