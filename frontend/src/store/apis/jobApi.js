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
    tagTypes: ['Job', 'JobPhoto'],
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
            providesTags: (result, error, id) => [{ type: 'Job', id }],
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
            invalidatesTags: (result, error, data) => ['Job', { type: 'Job', id: data.id }],
        }),

        replaceJob: builder.mutation({
            query: (data) => ({
                url: `/job/${data.id}/`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, data) => ['Job', { type: 'Job', id: data.id }],
        }),

        deleteJob: builder.mutation({
            query: (id) => ({
                url: `/job/${id}/`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Job'],
        }),

        /* ======================
         *   JOB PHOTO ENDPOINTS
         * ====================== */

        fetchJobPhotos: builder.query({
            query: (jobId) => {
                let url = '/job-photo/';
                if (jobId) {
                    url += `?job=${jobId}`;
                }
                return url;
            },
            providesTags: ['JobPhoto'],
        }),

        fetchJobPhoto: builder.query({
            query: (id) => `/job-photo/${id}/`,
            providesTags: (result, error, id) => [{ type: 'JobPhoto', id }],
        }),

        createJobPhoto: builder.mutation({
            query: (data) => ({
                url: '/job-photo/',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['JobPhoto'],
        }),

        updateJobPhoto: builder.mutation({
            query: (data) => ({
                url: `/job-photo/${data.id}/`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, data) => ['JobPhoto', { type: 'JobPhoto', id: data.id }],
        }),

        replaceJobPhoto: builder.mutation({
            query: (data) => ({
                url: `/job-photo/${data.id}/`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, data) => ['JobPhoto', { type: 'JobPhoto', id: data.id }],
        }),

        deleteJobPhoto: builder.mutation({
            query: (id) => ({
                url: `/job-photo/${id}/`,
                method: 'DELETE',
            }),
            invalidatesTags: ['JobPhoto'],
        }),
    }),
});

export const {
    // Job endpoints
    useFetchJobsQuery,
    useFetchJobQuery,
    useCreateJobMutation,
    useUpdateJobMutation,
    useReplaceJobMutation,
    useDeleteJobMutation,

    // Job Photo endpoints
    useFetchJobPhotosQuery,
    useFetchJobPhotoQuery,
    useCreateJobPhotoMutation,
    useUpdateJobPhotoMutation,
    useReplaceJobPhotoMutation,
    useDeleteJobPhotoMutation,
} = jobApi;

export { jobApi };
