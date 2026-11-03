import { api, changed, prefixed } from "./api";
import { clearPublicSession } from "../../utils/publicSession";

const userApi = api.injectEndpoints({
  endpoints: prefixed("/user", (builder) => ({
    createUser: builder.mutation({
      query: (data) => ({
        url: "/create/",
        method: "POST",
        body: data,
      }),
    }),
    verifyEmail: builder.query({
      query: (token) => ({
        url: `/verify-email?token=${token}`,
        method: "GET",
      }),
    }),
    signinUser: builder.mutation({
      query: (data) => ({
        url: "/token/",
        method: "POST",
        body: data,
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          localStorage.setItem("token", data.token);
        } catch {
          return;
        }
      },
    }),
    updateUser: builder.mutation({
      query: (data) => ({
        url: "/me/",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: changed("CurrentUser"),
    }),
    fetchUser: builder.query({
      query: () => ({
        url: "/me",
        method: "GET",
      }),
      providesTags: ["CurrentUser"],
    }),
    logoutUser: builder.mutation({
      queryFn: async () => {
        localStorage.removeItem("token");
        clearPublicSession();
        return { data: null };
      },
    }),
    requestPasswordReset: builder.mutation({
      query: (data) => ({
        url: "/password-reset/request/",
        method: "POST",
        body: data,
      }),
    }),
    resetPassword: builder.mutation({
      query: (data) => ({
        url: "/password-reset/reset/",
        method: "POST",
        body: data,
      }),
    }),
    checkUserExists: builder.mutation({
      query: (data) => ({
        url: "/check-user-exists/",
        method: "POST",
        body: data,
      }),
    }),
    magicLogin: builder.mutation({
      query: (data) => ({
        url: "/magic-login/",
        method: "POST",
        body: data,
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          localStorage.setItem("token", data.token);
        } catch {
          return;
        }
      },
    }),
  })),
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
  useMagicLoginMutation,
} = userApi;

export { userApi };
