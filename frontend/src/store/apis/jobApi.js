import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const jobApi = createApi({
    reducerPath: 'jobApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'http://localhost:8000/api/ops',
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('token');
            if (token) {
                headers.set('authorization', `Token ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Job'],
    endpoints: (builder) => ({
        fetchJobs: builder.query({
            query: (serviceId) => {
                let url = '/job/';
                if (serviceId) {
                    url += `?service=${serviceId}`;
                }
                return url;
            },
            providesTags: ['Job'],
        }),

        fetchJob: builder.query({
            query: (id) => `/job/${id}/`,
            providesTags: (result, error, arg) => [{ type: 'Job', id: arg }],
        }),

        createJob: builder.mutation({
            query: (data) => ({
                url: '/job/',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Job'],
        }),

        updateJob: builder.mutation({
            query: (data) => ({
                url: `/job/${data.id}/`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, arg) => ['Job', { type: 'Job', id: arg.id }],
        }),

        deleteJob: builder.mutation({
            query: (id) => ({
                url: `/job/${id}/`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Job'],
        }),
    }),
});

export const { useFetchJobsQuery, useFetchJobQuery, useCreateJobMutation, useUpdateJobMutation, useDeleteJobMutation } =
    jobApi;

export { jobApi };
