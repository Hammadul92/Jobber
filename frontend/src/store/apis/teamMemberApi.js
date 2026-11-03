import { api, changed, movedToOrFromTrash, prefixed } from "./api";

const teamMemberApi = api.injectEndpoints({
  endpoints: prefixed("/ops", (builder) => ({
    // One server-filtered page for tables: { page, page_size, ordering, search, ...filters }.
    fetchTeamMembersPage: builder.query({
      query: (params) => ({ url: "/team-member/", params }),
      providesTags: ["TeamMember"],
    }),
    bulkTeamMembers: builder.mutation({
      query: ({ action, ids }) => ({
        url: "/team-member/bulk/",
        method: "POST",
        body: { action, ids },
      }),
      invalidatesTags: movedToOrFromTrash("TeamMember"),
    }),
    fetchTeamMembers: builder.query({
      query: () => "/team-member",
      providesTags: ["TeamMember"],
    }),
    fetchTeamMember: builder.query({
      query: (id) => `/team-member/${id}/`,
      providesTags: (result, error, arg) => [{ type: "TeamMember", id: arg }],
    }),
    createTeamMember: builder.mutation({
      query: (data) => ({
        url: "/team-member/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: changed("TeamMember"),
    }),
    updateTeamMember: builder.mutation({
      query: (data) => ({
        url: `/team-member/${data.id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: changed("TeamMember"),
    }),
    deleteTeamMember: builder.mutation({
      query: (id) => ({
        url: `/team-member/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: movedToOrFromTrash("TeamMember"),
    }),
  })),
});

export const {
  useFetchTeamMembersQuery,
  useFetchTeamMembersPageQuery,
  useBulkTeamMembersMutation,
  useFetchTeamMemberQuery,
  useCreateTeamMemberMutation,
  useUpdateTeamMemberMutation,
  useDeleteTeamMemberMutation,
} = teamMemberApi;

export { teamMemberApi };
