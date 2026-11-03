import { api, changed, movedToOrFromTrash, prefixed } from "./api";

const serviceQuestionnaireApi = api.injectEndpoints({
  endpoints: prefixed("/ops", (builder) => ({
    fetchServiceQuestionnaires: builder.query({
      query: () => "/service-questionnaire/",
      providesTags: ["ServiceQuestionnaire"],
    }),
    fetchServiceQuestionnaire: builder.query({
      query: (id) => `/service-questionnaire/${id}/`,
      providesTags: (result, error, id) => [
        { type: "ServiceQuestionnaire", id },
      ],
    }),
    createServiceQuestionnaire: builder.mutation({
      query: (data) => ({
        url: "/service-questionnaire/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: changed("ServiceQuestionnaire"),
    }),
    updateServiceQuestionnaire: builder.mutation({
      query: (data) => ({
        url: `/service-questionnaire/${data.id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: changed("ServiceQuestionnaire"),
    }),
    deleteServiceQuestionnaire: builder.mutation({
      query: (id) => ({
        url: `/service-questionnaire/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: movedToOrFromTrash("ServiceQuestionnaire"),
    }),
  })),
});

export const {
  useFetchServiceQuestionnairesQuery,
  useFetchServiceQuestionnaireQuery,
  useCreateServiceQuestionnaireMutation,
  useUpdateServiceQuestionnaireMutation,
  useDeleteServiceQuestionnaireMutation,
} = serviceQuestionnaireApi;

export { serviceQuestionnaireApi };
