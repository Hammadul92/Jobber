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

const serviceApi = createApi({
    reducerPath: 'serviceApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Service'],
    endpoints: (builder) => ({
        fetchServices: builder.query({
            query: (client) => {
                let url = '/service/';
                if (client) {
                    url += `?client=${client}`;
                }
                return url;
            },
            providesTags: ['Service'],
        }),
        fetchService: builder.query({
            query: (id) => `/service/${id}/`,
            providesTags: (result, error, arg) => [{ type: 'Service', id: arg }],
        }),
        createService: builder.mutation({
            query: (data) => ({
                url: '/service/',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Service'],
        }),
        updateService: builder.mutation({
            query: (data) => ({
                url: `/service/${data.id}/`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, arg) => ['Service', { type: 'Service', id: arg.id }],
        }),
        deleteService: builder.mutation({
            query: (id) => ({
                url: `/service/${id}/`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Service'],
        }),
    }),
});

export const {
    useFetchServicesQuery,
    useFetchServiceQuery,
    useCreateServiceMutation,
    useUpdateServiceMutation,
    useDeleteServiceMutation,
} = serviceApi;

export { serviceApi };
