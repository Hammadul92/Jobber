import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { userApi } from './apis/userApi';
import { businessApi } from './apis/businessApi';

const store = configureStore({
    reducer: {
        [userApi.reducerPath]: userApi.reducer,
        [businessApi.reducerPath]: businessApi.reducer,
    },
    middleware: (getDefaultMiddleware) => {
        return getDefaultMiddleware().concat(userApi.middleware).concat(businessApi.middleware);
    },
});

setupListeners(store.dispatch);

export { store, userApi, businessApi };
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
