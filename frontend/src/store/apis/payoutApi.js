import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getBaseUrl } from './baseConfig';

const rawBaseQuery = fetchBaseQuery({
    baseUrl: `${getBaseUrl()}/finance`,
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

const payoutApi = createApi({
    reducerPath: 'payoutApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Payout'],
    endpoints: (builder) => ({
        fetchPayouts: builder.query({
            query: () => '/payout/',
            providesTags: ['Payout'],
        }),

        fetchPayout: builder.query({
            query: (id) => `/payout/${id}/`,
            providesTags: (result, error, id) => [{ type: 'Payout', id }],
        }),

        createPayout: builder.mutation({
            query: (data) => ({
                url: '/payout/',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Payout'],
        }),

        updatePayout: builder.mutation({
            query: (data) => ({
                url: `/payout/${data.id}/`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, data) => ['Payout', { type: 'Payout', id: data.id }],
        }),

        replacePayout: builder.mutation({
            query: (data) => ({
                url: `/payout/${data.id}/`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, data) => ['Payout', { type: 'Payout', id: data.id }],
        }),

        deletePayout: builder.mutation({
            query: (id) => ({
                url: `/payout/${id}/`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Payout'],
        }),

        refundPayout: builder.mutation({
            query: ({ id, amount, reason }) => ({
                url: `/payout/${id}/refund/`,
                method: 'POST',
                body: { amount, reason },
            }),
            invalidatesTags: (result, error, { id }) => ['Payout', { type: 'Payout', id }],
        }),
    }),
});

export const {
    useFetchPayoutsQuery,
    useFetchPayoutQuery,
    useCreatePayoutMutation,
    useUpdatePayoutMutation,
    useReplacePayoutMutation,
    useDeletePayoutMutation,
    useRefundPayoutMutation,
} = payoutApi;

export { payoutApi };
