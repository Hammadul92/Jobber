import { api, changed, prefixed } from "./api";

const bankingInformationApi = api.injectEndpoints({
  endpoints: prefixed("/finance", (builder) => ({
    fetchStripeConfig: builder.query({
      query: () => "/banking-information/stripe-config/",
      keepUnusedDataFor: 0,
    }),
    fetchBankingInformationList: builder.query({
      query: () => "/banking-information/",
      providesTags: ["BankingInformation"],
    }),

    deleteBankingInformation: builder.mutation({
      query: (id) => ({
        url: `/banking-information/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: changed("BankingInformation"),
    }),

    createSetupIntent: builder.mutation({
      query: () => ({
        url: "/banking-information/create-setup-intent/",
        method: "POST",
      }),
    }),

    savePaymentMethod: builder.mutation({
      query: (payment_method_id) => ({
        url: "/banking-information/save-payment-method/",
        method: "POST",
        body: { payment_method_id },
      }),
      invalidatesTags: changed("BankingInformation"),
    }),
    addBankAccount: builder.mutation({
      query: (data) => ({
        url: "/banking-information/add-bank-account/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: changed("BankingInformation"),
    }),
    checkBankAccount: builder.mutation({
      query: () => ({
        url: "/banking-information/check-bank-account/",
        method: "POST",
      }),
      invalidatesTags: changed("BankingInformation"),
    }),
  })),
});

export const {
  useFetchStripeConfigQuery,
  useFetchBankingInformationListQuery,
  useDeleteBankingInformationMutation,
  useCreateSetupIntentMutation,
  useSavePaymentMethodMutation,
  useAddBankAccountMutation,
  useCheckBankAccountMutation,
} = bankingInformationApi;

export { bankingInformationApi };
