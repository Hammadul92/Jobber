import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const quoteApi = createApi({
    reducerPath: 'quoteApi',
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
            query: (data) => ({
                url: `/quote/${data.id}/sign-quote/`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, id) => ['Quote', { type: 'Quote', id }],
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
