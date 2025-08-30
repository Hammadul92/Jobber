import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { userReducer, addUser } from './slices/UserSlices';
import { userApi } from './apis/userApi';
import { logout } from './actions';

const store = configureStore({
  reducer: {
    user: userReducer,
    [userApi.reducerPath]: userApi.reducer,
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware().concat(userApi.middleware);
  },
});

setupListeners(store.dispatch);

export { store, logout, addUser };
export {
  useSigninUserMutation,
  useLazyFetchUserQuery,
  useCreateUserMutation,
} from './apis/userApi';
