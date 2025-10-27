import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const rawBaseQuery = fetchBaseQuery({
    baseUrl: 'http://localhost:8000/api/ops',
    prepareHeaders: (headers) => {
        const token = localStorage.getItem('token');
        if (token) {
            headers.set('authorization', `Token ${token}`);
        }
        return headers;
    },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);
    if (result?.error?.status === 401) {
        localStorage.removeItem('token');
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/sign-in?next=${encodeURIComponent(currentPath)}`;
    }
    return result;
};

const serviceQuestionnaireApi = createApi({
    reducerPath: 'serviceQuestionnaireApi',
    baseQuery: baseQueryWithReauth,
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
