import { api, changed, movedToOrFromTrash, prefixed } from "./api";

const clientApi = api.injectEndpoints({
  endpoints: prefixed("/ops", (builder) => ({
    // One server-filtered page for tables: { page, page_size, ordering, search, ...filters }.
    fetchClientsPage: builder.query({
      query: (params) => ({ url: "/client/", params }),
      providesTags: ["Client"],
    }),
    bulkClients: builder.mutation({
      query: ({ action, ids }) => ({
        url: "/client/bulk/",
        method: "POST",
        body: { action, ids },
      }),
      invalidatesTags: movedToOrFromTrash("Client"),
    }),
    fetchClients: builder.query({
      query: () => "/client/",
      providesTags: ["Client"],
    }),

    fetchClient: builder.query({
      query: (id) => `/client/${id}/`,
      providesTags: (result, error, id) => [{ type: "Client", id }],
    }),

    createClient: builder.mutation({
      query: (data) => ({
        url: "/client/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: changed("Client"),
    }),

    updateClient: builder.mutation({
      query: (data) => ({
        url: `/client/${data.id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: changed("Client"),
    }),

    deleteClient: builder.mutation({
      query: (id) => ({
        url: `/client/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: movedToOrFromTrash("Client"),
    }),
  })),
});

export const {
  useFetchClientsQuery,
  useFetchClientsPageQuery,
  useBulkClientsMutation,
  useFetchClientQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} = clientApi;

export { clientApi };
