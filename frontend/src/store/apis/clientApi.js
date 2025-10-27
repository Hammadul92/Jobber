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

const clientApi = createApi({
    reducerPath: 'clientApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Client'],
    endpoints: (builder) => ({
        fetchClients: builder.query({
            query: () => '/client/',
            providesTags: ['Client'],
        }),

        fetchClient: builder.query({
            query: (id) => `/client/${id}/`,
            providesTags: (result, error, id) => [{ type: 'Client', id }],
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
