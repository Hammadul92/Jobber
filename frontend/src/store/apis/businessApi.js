import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getBaseUrl } from "./baseConfig";
import { userApi } from "./userApi";

const refreshUserAfterBusinessSave = async (_arg, { dispatch, queryFulfilled }) => {
  try {
    await queryFulfilled;
    dispatch(userApi.util.invalidateTags(["CurrentUser"]));
  } catch {
    // Failed saves must not change the cached user's permissions.
  }
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${getBaseUrl()}/ops`,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token");
    if (token) {
      headers.set("authorization", `Token ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result?.error?.status === 401) {
    // Token invalid or expired → clear and redirect
    localStorage.removeItem("token");
    const currentPath = window.location.pathname + window.location.search;
    window.location.href = `/sign-in?next=${encodeURIComponent(currentPath)}`;
  }
  return result;
};

// --- API definition ---
const businessApi = createApi({
  reducerPath: "businessApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Business"],
  endpoints: (builder) => ({
    fetchBusinesses: builder.query({
      query: () => "/business/",
      providesTags: ["Business"],
    }),

    fetchServiceOptions: builder.query({
      query: () => "/business/service-options/",
    }),

    fetchBusinessMarqueeLogos: builder.query({
      query: () => "/business/marquee-logos/",
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
      invalidatesTags: ["Business"],
      onQueryStarted: refreshUserAfterBusinessSave,
    }),

    updateBusiness: builder.mutation({
      query: (data) => ({
        url: `/business/${data.id}/`,
        method: "PATCH",
        body: data.data,
      }),
      invalidatesTags: (result, error, arg) => [
        "Business",
        { type: "Business", id: arg.id },
      ],
      onQueryStarted: refreshUserAfterBusinessSave,
    }),

    deleteBusiness: builder.mutation({
      query: (id) => ({
        url: `/business/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Business"],
    }),
  }),
});

export const {
  useFetchBusinessesQuery,
  useFetchServiceOptionsQuery,
  useFetchBusinessMarqueeLogosQuery,
  useFetchBusinessQuery,
  useCreateBusinessMutation,
  useUpdateBusinessMutation,
  useDeleteBusinessMutation,
} = businessApi;

export { businessApi };
