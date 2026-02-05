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

const bankingInformationApi = createApi({
    reducerPath: 'bankingInformationApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['BankingInformation'],
    endpoints: (builder) => ({
        fetchBankingInformationList: builder.query({
            query: () => '/banking-information/',
            providesTags: ['BankingInformation'],
        }),

        fetchBankingInformation: builder.query({
            query: (id) => `/banking-information/${id}/`,
            providesTags: (result, error, id) => [{ type: 'BankingInformation', id }],
        }),

        createBankingInformation: builder.mutation({
            query: (data) => ({
                url: '/banking-information/',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['BankingInformation'],
        }),

        updateBankingInformation: builder.mutation({
            query: (data) => ({
                url: `/banking-information/${data.id}/`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, arg) => ['BankingInformation', { type: 'BankingInformation', id: arg.id }],
        }),

        deleteBankingInformation: builder.mutation({
            query: (id) => ({
                url: `/banking-information/${id}/`,
                method: 'DELETE',
            }),
            invalidatesTags: ['BankingInformation'],
        }),

        createSetupIntent: builder.mutation({
            query: () => ({
                url: '/banking-information/create-setup-intent/',
                method: 'POST',
            }),
        }),

        savePaymentMethod: builder.mutation({
            query: (payment_method_id) => ({
                url: '/banking-information/save-payment-method/',
                method: 'POST',
                body: { payment_method_id },
            }),
            invalidatesTags: ['BankingInformation'],
        }),
        addBankAccount: builder.mutation({
            query: (data) => ({
                url: '/banking-information/add-bank-account/',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['BankingInformation'],
        }),
        checkBankAccount: builder.mutation({
            query: () => ({
                url: '/banking-information/check-bank-account/',
                method: 'POST',
            }),
            invalidatesTags: ['BankingInformation'],
        }),
    }),
});

export const {
    useFetchBankingInformationListQuery,
    useFetchBankingInformationQuery,
    useCreateBankingInformationMutation,
    useUpdateBankingInformationMutation,
    useDeleteBankingInformationMutation,
    useCreateSetupIntentMutation,
    useSavePaymentMethodMutation,
    useAddBankAccountMutation,
    useCheckBankAccountMutation,
} = bankingInformationApi;

export { bankingInformationApi };
