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
        /* ======================
         *       JOB ENDPOINTS
         * ====================== */

        // Fetch all jobs (optionally filtered by service)
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

        // Fetch a single job by ID
        fetchJob: builder.query({
            query: (id) => `/job/${id}/`,
            providesTags: (result, error, id) => [{ type: 'Job', id }],
        }),

        // Create a new job
        createJob: builder.mutation({
            query: (data) => ({
                url: '/job/',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Job'],
        }),

        // Update a job (partial update)
        updateJob: builder.mutation({
            query: (data) => ({
                url: `/job/${data.id}/`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, data) => ['Job', { type: 'Job', id: data.id }],
        }),

        // Replace a job (full update)
        replaceJob: builder.mutation({
            query: (data) => ({
                url: `/job/${data.id}/`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, data) => ['Job', { type: 'Job', id: data.id }],
        }),

        // Delete a job
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

        // Fetch all job photos (optionally filtered by job ID)
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

        // Fetch a single job photo
        fetchJobPhoto: builder.query({
            query: (id) => `/job-photo/${id}/`,
            providesTags: (result, error, id) => [{ type: 'JobPhoto', id }],
        }),

        // Create a job photo (base64 image upload)
        createJobPhoto: builder.mutation({
            query: (data) => ({
                url: '/job-photo/',
                method: 'POST',
                body: data, // expects { job, photo_type, photo: base64string }
            }),
            invalidatesTags: ['JobPhoto'],
        }),

        // Update (partial) a job photo (e.g., change type)
        updateJobPhoto: builder.mutation({
            query: (data) => ({
                url: `/job-photo/${data.id}/`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, data) => ['JobPhoto', { type: 'JobPhoto', id: data.id }],
        }),

        // Replace a job photo (full PUT)
        replaceJobPhoto: builder.mutation({
            query: (data) => ({
                url: `/job-photo/${data.id}/`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, data) => ['JobPhoto', { type: 'JobPhoto', id: data.id }],
        }),

        // Delete a job photo
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
