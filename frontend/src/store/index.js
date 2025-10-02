import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { userApi } from './apis/userApi';
import { businessApi } from './apis/businessApi';
import { clientApi } from './apis/clientApi';
import { teamMemberApi } from './apis/teamMemberApi';

const store = configureStore({
    reducer: {
        [userApi.reducerPath]: userApi.reducer,
        [businessApi.reducerPath]: businessApi.reducer,
        [clientApi.reducerPath]: clientApi.reducer,
        [teamMemberApi.reducerPath]: teamMemberApi.reducer,
    },
    middleware: (getDefaultMiddleware) => {
        return getDefaultMiddleware()
            .concat(userApi.middleware)
            .concat(businessApi.middleware)
            .concat(clientApi.middleware)
            .concat(teamMemberApi.middleware);
    },
});

setupListeners(store.dispatch);

export { store, userApi, businessApi, clientApi, teamMemberApi };
export {
    useSigninUserMutation,
    useFetchUserQuery,
    useVerifyEmailQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useLogoutUserMutation,
    useRequestPasswordResetMutation,
    useResetPasswordMutation,
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
