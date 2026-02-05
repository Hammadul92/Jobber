import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getBaseUrl } from './baseConfig';

const rawBaseQuery = fetchBaseQuery({
    baseUrl: `${getBaseUrl()}/ops`,
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

const quoteApi = createApi({
    reducerPath: 'quoteApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Quote'],
    endpoints: (builder) => ({
        fetchQuotes: builder.query({
            query: () => '/quote/',
            providesTags: ['Quote'],
        }),
        fetchQuote: builder.query({
            query: (id) => `/quote/${id}/`,
            providesTags: (result, error, arg) => [{ type: 'Quote', id: arg }],
        }),
        createQuote: builder.mutation({
            query: (data) => ({
                url: '/quote/',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Quote'],
        }),
        updateQuote: builder.mutation({
            query: (data) => ({
                url: `/quote/${data.id}/`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, arg) => ['Quote', { type: 'Quote', id: arg.id }],
        }),
        deleteQuote: builder.mutation({
            query: (id) => ({
                url: `/quote/${id}/`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Quote'],
        }),
        sendQuote: builder.mutation({
            query: (id) => ({
                url: `/quote/${id}/send-quote/`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => ['Quote', { type: 'Quote', id }],
        }),
        signQuote: builder.mutation({
            query: ({ id, formData }) => ({
                url: `/quote/${id}/sign-quote/`,
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: (result, error, { id }) => ['Quote', { type: 'Quote', id }],
        }),
    }),
});

export const {
    useFetchQuotesQuery,
    useFetchQuoteQuery,
    useCreateQuoteMutation,
    useUpdateQuoteMutation,
    useDeleteQuoteMutation,
    useSendQuoteMutation,
    useSignQuoteMutation,
} = quoteApi;

export { quoteApi };
