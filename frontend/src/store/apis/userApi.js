// userApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const userApi = createApi({
    reducerPath: 'userApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'http://localhost:8000/api',
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('token');
            if (token) {
                headers.set('authorization', `Token ${token}`);
            }
            return headers;
        },
    }),
    endpoints: (builder) => ({
        createUser: builder.mutation({
            query: (data) => ({
                url: '/user/create/',
                method: 'POST',
                body: data,
            }),
        }),
        verifyEmail: builder.query({
            query: (token) => ({
                url: `/user/verify-email?token=${token}`,
                method: 'GET',
            }),
        }),
        signinUser: builder.mutation({
            query: (data) => ({
                url: '/user/token/',
                method: 'POST',
                body: data,
            }),
            async onQueryStarted(arg, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    localStorage.setItem('token', data.token);
                } catch (err) {
                    console.error('Login failed:', err);
                }
            },
        }),
        updateUser: builder.mutation({
            query: (data) => ({
                url: '/user/me/',
                method: 'PATCH',
                body: data,
            }),
        }),
        fetchUser: builder.query({
            query: () => ({
                url: '/user/me',
                method: 'GET',
            }),
        }),
        logoutUser: builder.mutation({
            queryFn: async () => {
                localStorage.removeItem('token');
                return { data: null };
            },
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
} = userApi;

export { userApi };
