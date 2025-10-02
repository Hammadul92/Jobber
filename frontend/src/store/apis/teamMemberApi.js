import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const teamMemberApi = createApi({
    reducerPath: 'teamMemberApi',
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
    tagTypes: ['TeamMember'],
    endpoints: (builder) => ({
        fetchTeamMembers: builder.query({
            query: () => '/team-member',
            providesTags: ['TeamMember'],
        }),

        fetchTeamMember: builder.query({
            query: (id) => `/team-member/${id}/`,
            providesTags: (result, error, arg) => [{ type: 'TeamMember', id: arg }],
        }),

        createTeamMember: builder.mutation({
            query: (data) => ({
                url: '/team-member/',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['TeamMember'],
        }),

        updateTeamMember: builder.mutation({
            query: (data) => ({
                url: `/team-member/${data.id}/`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'TeamMember', id: arg.id }],
        }),

        deleteTeamMember: builder.mutation({
            query: (id) => ({
                url: `/team-member/${id}/`,
                method: 'DELETE',
            }),
            invalidatesTags: ['TeamMember'],
        }),
    }),
});

export const {
    useFetchTeamMembersQuery,
    useFetchTeamMemberQuery,
    useCreateTeamMemberMutation,
    useUpdateTeamMemberMutation,
    useDeleteTeamMemberMutation,
} = teamMemberApi;

export { teamMemberApi };
