import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getBaseUrl } from "./baseConfig";

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
    localStorage.removeItem("token");
    const currentPath = window.location.pathname + window.location.search;
    window.location.href = `/sign-in?next=${encodeURIComponent(currentPath)}`;
  }
  return result;
};

// Server-side aggregates for the dashboard; kept briefly so returning to the
// page shows fresh numbers after records change elsewhere.
const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: baseQueryWithReauth,
  keepUnusedDataFor: 30,
  endpoints: (builder) => ({
    // Stats, revenue chart ({ range: "monthly" | "weekly" | "yearly" }) and recent records.
    fetchDashboard: builder.query({
      query: (params) => ({ url: "/dashboard/", params }),
    }),
    // Owner to-dos: { count, items: [{ id, title, description, to, type, priority }] }.
    fetchDashboardTodos: builder.query({
      query: () => "/dashboard/todos/",
    }),
  }),
});

export const { useFetchDashboardQuery, useFetchDashboardTodosQuery } =
  dashboardApi;

export { dashboardApi };
