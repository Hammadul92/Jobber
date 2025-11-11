import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const rawBaseQuery = fetchBaseQuery({
    baseUrl: 'http://localhost:8000/api/finance',
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

const invoiceApi = createApi({
    reducerPath: 'invoiceApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Invoice'],
    endpoints: (builder) => ({
        fetchInvoices: builder.query({
            query: (serviceId) => {
                let url = '/invoice/';
                if (serviceId) {
                    url += `?service=${serviceId}`;
                }
                return url;
            },
            providesTags: ['Invoice'],
        }),

        fetchInvoice: builder.query({
            query: (id) => `/invoice/${id}/`,
            providesTags: (result, error, id) => [{ type: 'Invoice', id }],
        }),

        createInvoice: builder.mutation({
            query: (data) => ({
                url: '/invoice/',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Invoice'],
        }),

        updateInvoice: builder.mutation({
            query: (data) => ({
                url: `/invoice/${data.id}/`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, data) => ['Invoice', { type: 'Invoice', id: data.id }],
        }),

        replaceInvoice: builder.mutation({
            query: (data) => ({
                url: `/invoice/${data.id}/`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, data) => ['Invoice', { type: 'Invoice', id: data.id }],
        }),

        deleteInvoice: builder.mutation({
            query: (id) => ({
                url: `/invoice/${id}/`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Invoice'],
        }),

        makePayment: builder.mutation({
            query: (id) => ({
                url: `/invoice/${id}/make-payment/`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => ['Invoice', { type: 'Invoice', id }],
        }),
    }),
});

export const {
    useFetchInvoicesQuery,
    useFetchInvoiceQuery,
    useCreateInvoiceMutation,
    useUpdateInvoiceMutation,
    useReplaceInvoiceMutation,
    useDeleteInvoiceMutation,
    useMakePaymentMutation,
} = invoiceApi;

export { invoiceApi };
