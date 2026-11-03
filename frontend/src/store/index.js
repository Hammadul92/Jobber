import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { api } from "./apis/api";
import { userApi } from "./apis/userApi";
import { businessApi } from "./apis/businessApi";
import { clientApi } from "./apis/clientApi";
import { serviceQuestionnaireApi } from "./apis/serviceQuestionnaireApi";
import { serviceTermsTemplateApi } from "./apis/serviceTermsTemplateApi";
import { teamMemberApi } from "./apis/teamMemberApi";
import { serviceApi } from "./apis/serviceApi";
import { quoteApi } from "./apis/quoteApi";
import { jobApi } from "./apis/jobApi";
import { bankingInformationApi } from "./apis/bankingInformationApi";
import { invoiceApi } from "./apis/invoiceApi";
import { payoutApi } from "./apis/payoutApi";
import { dashboardApi } from "./apis/dashboardApi";
import { trashApi } from "./apis/trashApi";
import { topbarReducer } from "./topbarSlice";
import { alertReducer } from "./alertSlice";

const store = configureStore({
  reducer: {
    // One API for every slice, so related records refresh together.
    [api.reducerPath]: api.reducer,
    topbar: topbarReducer,
    alerts: alertReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        warnAfter: 128,
      },
      immutableCheck: {
        warnAfter: 128,
      },
    }).concat(api.middleware),
});

setupListeners(store.dispatch);

export {
  store,
  api,
  trashApi,
  userApi,
  businessApi,
  clientApi,
  serviceQuestionnaireApi,
  serviceTermsTemplateApi,
  teamMemberApi,
  serviceApi,
  quoteApi,
  jobApi,
  bankingInformationApi,
  invoiceApi,
  payoutApi,
  dashboardApi,
};

export {
  useSigninUserMutation,
  useFetchUserQuery,
  useVerifyEmailQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useLogoutUserMutation,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
  useCheckUserExistsMutation,
  useMagicLoginMutation,
} from "./apis/userApi";

export {
  useFetchBusinessesQuery,
  useFetchServiceOptionsQuery,
  useFetchBusinessQuery,
  useCreateBusinessMutation,
  useUpdateBusinessMutation,
} from "./apis/businessApi";

export {
  useFetchClientsQuery,
  useFetchClientsPageQuery,
  useBulkClientsMutation,
  useFetchClientQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} from "./apis/clientApi";

export {
  useFetchTeamMembersQuery,
  useFetchTeamMembersPageQuery,
  useBulkTeamMembersMutation,
  useFetchTeamMemberQuery,
  useCreateTeamMemberMutation,
  useUpdateTeamMemberMutation,
  useDeleteTeamMemberMutation,
} from "./apis/teamMemberApi";

export {
  useFetchServicesQuery,
  useFetchServicesPageQuery,
  useBulkServicesMutation,
  useFetchServiceQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
} from "./apis/serviceApi";

export {
  useFetchQuotesQuery,
  useFetchQuotesPageQuery,
  useBulkQuotesMutation,
  useFetchQuoteQuery,
  useCreateQuoteMutation,
  useUpdateQuoteMutation,
  useDeleteQuoteMutation,
  useSendQuoteMutation,
  useSignQuoteMutation,
} from "./apis/quoteApi";

export {
  useFetchServiceQuestionnairesQuery,
  useFetchServiceQuestionnaireQuery,
  useCreateServiceQuestionnaireMutation,
  useUpdateServiceQuestionnaireMutation,
  useDeleteServiceQuestionnaireMutation,
} from "./apis/serviceQuestionnaireApi";

export {
  useFetchServiceTermsTemplatesQuery,
  useCreateServiceTermsTemplateMutation,
  useUpdateServiceTermsTemplateMutation,
  useDeleteServiceTermsTemplateMutation,
} from "./apis/serviceTermsTemplateApi";

export {
  useFetchJobsPageQuery,
  useBulkJobsMutation,
  useFetchJobQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
  useFetchJobPhotosQuery,
  useCreateJobPhotoMutation,
} from "./apis/jobApi";

export {
  useFetchBankingInformationListQuery,
  useFetchStripeConfigQuery,
  useDeleteBankingInformationMutation,
  useCreateSetupIntentMutation,
  useSavePaymentMethodMutation,
  useAddBankAccountMutation,
  useCheckBankAccountMutation,
} from "./apis/bankingInformationApi";

export {
  useFetchInvoicesPageQuery,
  useBulkInvoicesMutation,
  useFetchInvoiceQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useMakePaymentMutation,
  useSendInvoiceMutation,
  useMarkInvoiceUnpaidMutation,
} from "./apis/invoiceApi";

export {
  useFetchPayoutsPageQuery,
  useFetchPayoutQuery,
  useRefundPayoutMutation,
} from "./apis/payoutApi";

export {
  useFetchDashboardQuery,
  useFetchDashboardTodosQuery,
} from "./apis/dashboardApi";

export {
  useFetchTrashQuery,
  useRestoreRecordMutation,
  useRestoreRecordsMutation,
  TRASH_RESOURCES,
} from "./apis/trashApi";

export { topbarReducer } from "./topbarSlice";
