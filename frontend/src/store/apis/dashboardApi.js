import { api, prefixed } from "./api";

// Server-side aggregates for the dashboard; kept briefly so returning to the
// page shows fresh numbers after records change elsewhere.
const dashboardApi = api.injectEndpoints({
  endpoints: prefixed("/ops", (builder) => ({
    // Stats, revenue chart ({ range: "monthly" | "weekly" | "yearly" }) and recent records.
    fetchDashboard: builder.query({
      query: (params) => ({ url: "/dashboard/", params }),
      providesTags: ["Dashboard"],
      keepUnusedDataFor: 30,
    }),
    // Owner to-dos: { count, items: [{ id, title, description, to, type, priority }] }.
    fetchDashboardTodos: builder.query({
      query: () => "/dashboard/todos/",
      providesTags: ["Dashboard"],
      keepUnusedDataFor: 30,
    }),
  })),
});

export const { useFetchDashboardQuery, useFetchDashboardTodosQuery } =
  dashboardApi;

export { dashboardApi };
