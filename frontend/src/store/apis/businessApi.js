import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const businessApi = createApi({
    reducerPath: 'businessApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'http://localhost:8000/api/business',
        prepareHeaders: (headers, { getState }) => {
            const token = getState().user?.token;
            if (token) {
                headers.set('authorization', `Token ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Business'],
    endpoints: (builder) => ({
        fetchBusinesses: builder.query({
            query: () => '/businesses',
            providesTags: ['Business'],
        }),

        fetchBusiness: builder.query({
            query: (data) => `/business/${data.id}`,
            providesTags: (result, error, arg) => [{ type: 'Business', id: arg.id }],
        }),

        createBusiness: builder.mutation({
            query: (data) => ({
                url: '/businesses/',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Business'],
        }),

        updateBusiness: builder.mutation({
            query: (data) => ({
                url: `/businesses/${data.id}/`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Business'],
        }),

        deleteBusiness: builder.mutation({
            query: (id) => ({
                url: `/businesses/${id}/`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Business'],
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
