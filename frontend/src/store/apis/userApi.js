import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const rawBaseQuery = fetchBaseQuery({
    baseUrl: 'http://localhost:8000/api/user',
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

const userApi = createApi({
    reducerPath: 'userApi',
    baseQuery: baseQueryWithReauth,
    endpoints: (builder) => ({
        createUser: builder.mutation({
            query: (data) => ({
                url: '/create/',
                method: 'POST',
                body: data,
            }),
        }),
        verifyEmail: builder.query({
            query: (token) => ({
                url: `/verify-email?token=${token}`,
                method: 'GET',
            }),
        }),
        signinUser: builder.mutation({
            query: (data) => ({
                url: '/token/',
                method: 'POST',
                body: data,
            }),
            async onQueryStarted(arg, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    localStorage.setItem('token', data.token);
                } catch (err) {}
            },
        }),
        updateUser: builder.mutation({
            query: (data) => ({
                url: '/me/',
                method: 'PATCH',
                body: data,
            }),
        }),
        fetchUser: builder.query({
            query: () => ({
                url: '/me',
                method: 'GET',
            }),
        }),
        logoutUser: builder.mutation({
            queryFn: async () => {
                localStorage.removeItem('token');
                return { data: null };
            },
        }),
        requestPasswordReset: builder.mutation({
            query: (data) => ({
                url: '/password-reset/request/',
                method: 'POST',
                body: data,
            }),
        }),
        resetPassword: builder.mutation({
            query: (data) => ({
                url: '/password-reset/reset/',
                method: 'POST',
                body: data,
            }),
        }),
        checkUserExists: builder.mutation({
            query: (data) => ({
                url: '/check-user-exists/',
                method: 'POST',
                body: data,
            }),
        }),
    }),
});

export const {
    useSigninUserMutation,
    useVerifyEmailQuery,
    useFetchUserQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useLogoutUserMutation,
    useRequestPasswordResetMutation,
    useResetPasswordMutation,
    useCheckUserExistsMutation,
} = userApi;

export { userApi };
