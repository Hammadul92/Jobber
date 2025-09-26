import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const businessApi = createApi({
    reducerPath: 'businessApi',
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
    endpoints: (builder) => ({
        fetchBusinesses: builder.query({
            query: () => '/business',
        }),

        fetchBusiness: builder.query({
            query: (data) => `/business/${data.id}`,
        }),

        createBusiness: builder.mutation({
            query: (data) => ({
                url: '/business/',
                method: 'POST',
                body: data,
            }),
        }),

        updateBusiness: builder.mutation({
            query: (data) => ({
                url: `/business/${data.id}/`,
                method: 'PATCH',
                body: data.data,
            }),
        }),

        deleteBusiness: builder.mutation({
            query: (id) => ({
                url: `/business/${id}/`,
                method: 'DELETE',
            }),
        }),
    }),
});

export const {
    useFetchBusinessesQuery,
    useFetchBusinessQuery,
    useCreateBusinessMutation,
    useUpdateBusinessMutation,
    useDeleteBusinessMutation,
} = businessApi;

export { businessApi };
