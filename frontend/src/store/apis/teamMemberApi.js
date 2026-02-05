import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getBaseUrl } from './baseConfig';

const rawBaseQuery = fetchBaseQuery({
    baseUrl: `${getBaseUrl()}/ops`,
    prepareHeaders: (headers) => {
        const token = localStorage.getItem('token');
        if (token) {
            headers.set('authorization', `Token ${token}`);
        }
        return headers;
    },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);
    if (result?.error?.status === 401) {
        localStorage.removeItem('token');
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/sign-in?next=${encodeURIComponent(currentPath)}`;
    }
    return result;
};

const teamMemberApi = createApi({
    reducerPath: 'teamMemberApi',
    baseQuery: baseQueryWithReauth,
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
            invalidatesTags: (result, error, arg) => ['TeamMember', { type: 'TeamMember', id: arg.id }],
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
