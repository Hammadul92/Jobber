import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const serviceQuestionnaireApi = createApi({
    reducerPath: 'serviceQuestionnaireApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'http://localhost:8000/api/ops',
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('token');
            if (token) {
                headers.set('authorization', `Token ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['ServiceQuestionnaire'],
    endpoints: (builder) => ({
        fetchServiceQuestionnaires: builder.query({
            query: () => '/service-questionnaire/',
            providesTags: ['ServiceQuestionnaire'],
        }),
        fetchServiceQuestionnaire: builder.query({
            query: (id) => `/service-questionnaire/${id}/`,
            providesTags: (result, error, id) => [{ type: 'ServiceQuestionnaire', id }],
        }),
        createServiceQuestionnaire: builder.mutation({
            query: (data) => ({
                url: '/service-questionnaire/',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['ServiceQuestionnaire'],
        }),
        updateServiceQuestionnaire: builder.mutation({
            query: (data) => ({
                url: `/service-questionnaire/${data.id}/`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, arg) => [
                'ServiceQuestionnaire',
                { type: 'ServiceQuestionnaire', id: arg.id },
            ],
        }),
        deleteServiceQuestionnaire: builder.mutation({
            query: (id) => ({
                url: `/service-questionnaire/${id}/`,
                method: 'DELETE',
            }),
            invalidatesTags: ['ServiceQuestionnaire'],
        }),
    }),
});

export const {
    useFetchServiceQuestionnairesQuery,
    useFetchServiceQuestionnaireQuery,
    useCreateServiceQuestionnaireMutation,
    useUpdateServiceQuestionnaireMutation,
    useDeleteServiceQuestionnaireMutation,
} = serviceQuestionnaireApi;

export { serviceQuestionnaireApi };
