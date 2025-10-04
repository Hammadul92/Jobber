import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const clientApi = createApi({
    reducerPath: 'clientApi',
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
    tagTypes: ['Client'],
    endpoints: (builder) => ({
        fetchClients: builder.query({
            query: () => '/client',
            providesTags: ['Client'],
        }),

        fetchClient: builder.query({
            query: (data) => `/client/${data.id}`,
            providesTags: (result, error, arg) => [{ type: 'Client', id: arg.id }],
        }),

        createClient: builder.mutation({
            query: (data) => ({
                url: '/client/',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Client'],
        }),

        updateClient: builder.mutation({
            query: (data) => ({
                url: `/client/${data.id}/`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, arg) => ['Client', { type: 'Client', id: arg.id }],
        }),

        deleteClient: builder.mutation({
            query: (id) => ({
                url: `/client/${id}/`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Client'],
        }),
    }),
});

export const {
    useFetchClientsQuery,
    useFetchClientQuery,
    useCreateClientMutation,
    useUpdateClientMutation,
    useDeleteClientMutation,
} = clientApi;

export { clientApi };
