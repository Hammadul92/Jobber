import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const userApi = createApi({
    reducerPath: 'user',
    baseQuery: fetchBaseQuery({
        baseUrl: 'http://localhost:8000'
    }),
    endpoints(builder) {
        signinUser: builder.query({
            query: (data) => {
                return {
                    url: '/api/user/token',
                    params: {
                        email: data.email,
                        password: data.password
                    },
                    method: 'POST',
                }
            }
        })
    }
})

userApi.useSigninUserQuery()
