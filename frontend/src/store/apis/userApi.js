import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:8000/api',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().user?.token;
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
        body: {
          name: data.name,
          email: data.email,
          password: data.password,
        },
      }),
    }),
    signinUser: builder.mutation({
      query: (data) => ({
        url: '/user/token/',
        method: 'POST',
        body: {
          email: data.email,
          password: data.password,
        },
      }),
    }),
    updateUser: builder.mutation({
      invalidatesTags: ['User'],
      query: (data) => ({
        url: '/user/me/',
        method: 'PATCH',
        body: data,
      }),
    }),
    fetchUser: builder.query({
      providesTags: ['User'],
      query: () => ({
        url: '/user/me',
        method: 'GET',
      }),
    }),
  }),
});

export const { useSigninUserMutation, useLazyFetchUserQuery, useCreateUserMutation } = userApi;
export { userApi };
