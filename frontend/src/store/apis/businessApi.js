import { api, changed, prefixed } from "./api";

const businessApi = api.injectEndpoints({
  endpoints: prefixed("/ops", (builder) => ({
    fetchBusinesses: builder.query({
      query: () => "/business/",
      providesTags: ["Business"],
    }),

    fetchServiceOptions: builder.query({
      query: () => "/business/service-options/",
    }),

    fetchBusiness: builder.query({
      query: (id) => `/business/${id}/`,
      providesTags: (result, error, id) => [{ type: "Business", id }],
    }),

    createBusiness: builder.mutation({
      query: (data) => ({
        url: "/business/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: changed("Business"),
    }),

    updateBusiness: builder.mutation({
      query: (data) => ({
        url: `/business/${data.id}/`,
        method: "PATCH",
        body: data.data,
      }),
      invalidatesTags: changed("Business"),
    }),

  })),
});

export const {
  useFetchBusinessesQuery,
  useFetchServiceOptionsQuery,
  useFetchBusinessQuery,
  useCreateBusinessMutation,
  useUpdateBusinessMutation,
} = businessApi;

export { businessApi };
