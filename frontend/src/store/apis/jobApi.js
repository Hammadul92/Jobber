import { api, changed, movedToOrFromTrash, prefixed } from "./api";

const jobApi = api.injectEndpoints({
  endpoints: prefixed("/ops", (builder) => ({
    // One server-filtered page for tables: { page, page_size, ordering, search, ...filters }.
    fetchJobsPage: builder.query({
      query: (params) => ({ url: "/job/", params }),
      providesTags: ["Job"],
    }),
    bulkJobs: builder.mutation({
      query: ({ action, ids }) => ({
        url: "/job/bulk/",
        method: "POST",
        body: { action, ids },
      }),
      invalidatesTags: movedToOrFromTrash("Job"),
    }),

    fetchJob: builder.query({
      query: (id) => `/job/${id}/`,
      providesTags: (result, error, id) => [{ type: "Job", id }],
    }),

    createJob: builder.mutation({
      query: (data) => ({
        url: "/job/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: changed("Job"),
    }),

    updateJob: builder.mutation({
      query: (data) => ({
        url: `/job/${data.id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: changed("Job"),
    }),

    deleteJob: builder.mutation({
      query: (id) => ({
        url: `/job/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: movedToOrFromTrash("Job"),
    }),

    fetchJobPhotos: builder.query({
      query: (jobId) => {
        let url = "/job-photo/";
        if (jobId) {
          url += `?job=${jobId}`;
        }
        return url;
      },
      providesTags: ["JobPhoto"],
    }),

    createJobPhoto: builder.mutation({
      query: (data) => ({
        url: "/job-photo/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: changed("JobPhoto"),
    }),

  })),
});

export const {
  useFetchJobsPageQuery,
  useBulkJobsMutation,
  useFetchJobQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
  useFetchJobPhotosQuery,
  useCreateJobPhotoMutation,
} = jobApi;

export { jobApi };
