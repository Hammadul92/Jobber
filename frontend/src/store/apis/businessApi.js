import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const businessApi = createApi({
    reducerPath: 'businessApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'http://localhost:8000/api/business',
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
            query: () => '/businesses',
        }),

        fetchBusiness: builder.query({
            query: (data) => `/business/${data.id}`,
        }),

        createBusiness: builder.mutation({
            query: (data) => ({
                url: '/businesses/',
                method: 'POST',
                body: data,
            }),
        }),

        updateBusiness: builder.mutation({
            query: (data) => ({
                url: `/businesses/${data.id}/`,
                method: 'PATCH',
                body: data.data,
            }),
        }),

        deleteBusiness: builder.mutation({
            query: (id) => ({
                url: `/businesses/${id}/`,
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
