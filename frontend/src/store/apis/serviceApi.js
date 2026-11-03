import { api, changed, movedToOrFromTrash, prefixed } from "./api";

const serviceApi = api.injectEndpoints({
  endpoints: prefixed("/ops", (builder) => ({
    // One server-filtered page for tables: { page, page_size, ordering, search, ...filters }.
    fetchServicesPage: builder.query({
      query: (params) => ({ url: "/service/", params }),
      providesTags: ["Service"],
    }),
    bulkServices: builder.mutation({
      query: ({ action, ids }) => ({
        url: "/service/bulk/",
        method: "POST",
        body: { action, ids },
      }),
      invalidatesTags: movedToOrFromTrash("Service"),
    }),
    fetchServices: builder.query({
      query: (client) => {
        let url = "/service/";
        if (client) {
          url += `?client=${client}`;
        }
        return url;
      },
      providesTags: ["Service"],
    }),
    fetchService: builder.query({
      query: (id) => `/service/${id}/`,
      providesTags: (result, error, arg) => [{ type: "Service", id: arg }],
    }),
    createService: builder.mutation({
      query: (data) => ({
        url: "/service/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: changed("Service"),
    }),
    updateService: builder.mutation({
      query: (data) => ({
        url: `/service/${data.id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: changed("Service"),
    }),
    deleteService: builder.mutation({
      query: (id) => ({
        url: `/service/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: movedToOrFromTrash("Service"),
    }),
  })),
});

export const {
  useFetchServicesQuery,
  useFetchServicesPageQuery,
  useBulkServicesMutation,
  useFetchServiceQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
} = serviceApi;

export { serviceApi };
