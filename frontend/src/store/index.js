import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { userApi } from './apis/userApi';
import { businessApi } from './apis/businessApi';
import { clientApi } from './apis/clientApi';
import { serviceQuestionnaireApi } from './apis/serviceQuestionnaireApi';
import { teamMemberApi } from './apis/teamMemberApi';
import { serviceApi } from './apis/serviceApi';
import { quoteApi } from './apis/quoteApi';
import { jobApi } from './apis/jobApi';

const store = configureStore({
    reducer: {
        [userApi.reducerPath]: userApi.reducer,
        [businessApi.reducerPath]: businessApi.reducer,
        [clientApi.reducerPath]: clientApi.reducer,
        [teamMemberApi.reducerPath]: teamMemberApi.reducer,
        [serviceApi.reducerPath]: serviceApi.reducer,
        [quoteApi.reducerPath]: quoteApi.reducer,
        [serviceQuestionnaireApi.reducerPath]: serviceQuestionnaireApi.reducer,
        [jobApi.reducerPath]: jobApi.reducer,
    },
    middleware: (getDefaultMiddleware) => {
        return getDefaultMiddleware()
            .concat(userApi.middleware)
            .concat(businessApi.middleware)
            .concat(clientApi.middleware)
            .concat(serviceQuestionnaireApi.middleware)
            .concat(teamMemberApi.middleware)
            .concat(serviceApi.middleware)
            .concat(quoteApi.middleware)
            .concat(jobApi.middleware);
    },
});

setupListeners(store.dispatch);

export { store, userApi, businessApi, clientApi, serviceQuestionnaireApi, teamMemberApi, serviceApi, quoteApi, jobApi };
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
} from './apis/userApi';

export {
    useFetchBusinessesQuery,
    useFetchBusinessQuery,
    useCreateBusinessMutation,
    useUpdateBusinessMutation,
    useDeleteBusinessMutation,
} from './apis/businessApi';

export {
    useFetchClientsQuery,
    useFetchClientQuery,
    useCreateClientMutation,
    useUpdateClientMutation,
    useDeleteClientMutation,
} from './apis/clientApi';

export {
    useFetchTeamMembersQuery,
    useFetchTeamMemberQuery,
    useCreateTeamMemberMutation,
    useUpdateTeamMemberMutation,
    useDeleteTeamMemberMutation,
} from './apis/teamMemberApi';

export {
    useFetchServicesQuery,
    useFetchServiceQuery,
    useCreateServiceMutation,
    useUpdateServiceMutation,
    useDeleteServiceMutation,
} from './apis/serviceApi';

export {
    useFetchQuotesQuery,
    useFetchQuoteQuery,
    useCreateQuoteMutation,
    useUpdateQuoteMutation,
    useDeleteQuoteMutation,
    useSendQuoteMutation,
    useSignQuoteMutation,
} from './apis/quoteApi';

export {
    useFetchServiceQuestionnairesQuery,
    useFetchServiceQuestionnaireQuery,
    useCreateServiceQuestionnaireMutation,
    useUpdateServiceQuestionnaireMutation,
    useDeleteServiceQuestionnaireMutation,
} from './apis/serviceQuestionnaireApi';

export {
    useFetchJobsQuery,
    useFetchJobQuery,
    useCreateJobMutation,
    useUpdateJobMutation,
    useDeleteJobMutation,
} from './apis/jobApi';
