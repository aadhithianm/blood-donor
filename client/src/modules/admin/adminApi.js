import { api } from '../../app/api';

export const adminApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // Users
        getAdminUsers: builder.query({
            query: (params = {}) => `/admin/users?${new URLSearchParams(params)}`,
            providesTags: ['AdminUsers'],
        }),
        updateAdminUser: builder.mutation({
            query: ({ id, ...data }) => ({ url: `/admin/users/${id}`, method: 'PUT', body: data }),
            invalidatesTags: ['AdminUsers'],
        }),
        updateUserVerification: builder.mutation({
            query: ({ id, isEmailVerified, isVerified }) => ({
                url: `/admin/users/${id}/verification`,
                method: 'PUT',
                body: { isEmailVerified, isVerified }
            }),
            invalidatesTags: ['AdminUsers'],
        }),
        deleteAdminUser: builder.mutation({
            query: (id) => ({ url: `/admin/users/${id}`, method: 'DELETE' }),
            invalidatesTags: ['AdminUsers'],
        }),
        suspendUser: builder.mutation({
            query: (id) => ({ url: `/admin/users/${id}/suspend`, method: 'PATCH' }),
            invalidatesTags: ['AdminUsers'],
        }),
        activateUser: builder.mutation({
            query: (id) => ({ url: `/admin/users/${id}/activate`, method: 'PATCH' }),
            invalidatesTags: ['AdminUsers'],
        }),
        getUserNotes: builder.query({
            query: (id) => `/admin/users/${id}/notes`,
            providesTags: (_, __, id) => [{ type: 'AdminUserNotes', id }],
        }),
        updateUserNotes: builder.mutation({
            query: ({ id, notes }) => ({ url: `/admin/users/${id}/notes`, method: 'PATCH', body: { notes } }),
            invalidatesTags: (_, __, { id }) => [{ type: 'AdminUserNotes', id }],
        }),
        getDuplicateAccounts: builder.query({
            query: () => '/admin/users/duplicates',
        }),

        // Donors
        getAdminDonors: builder.query({
            query: (params = {}) => `/admin/donors?${new URLSearchParams(params)}`,
            providesTags: ['AdminDonors'],
        }),
        getDonorLeaderboard: builder.query({
            query: () => '/admin/donors/leaderboard',
            providesTags: ['AdminDonors'],
        }),
        verifyAdminDonor: builder.mutation({
            query: (id) => ({ url: `/admin/donors/${id}/verify`, method: 'PATCH' }),
            invalidatesTags: ['AdminDonors'],
        }),
        rejectAdminDonor: builder.mutation({
            query: (id) => ({ url: `/admin/donors/${id}/reject`, method: 'PATCH' }),
            invalidatesTags: ['AdminDonors'],
        }),

        // Requests
        getAdminRequests: builder.query({
            query: (params = {}) => `/admin/requests?${new URLSearchParams(params)}`,
            providesTags: ['AdminRequests'],
        }),
        findMatchingDonors: builder.query({
            query: (id) => `/admin/requests/${id}/donors`,
        }),
        notifyMatchingDonors: builder.mutation({
            query: (id) => ({ url: `/admin/requests/${id}/notify`, method: 'POST' }),
        }),

        // Hospitals
        getPendingHospitals: builder.query({
            query: () => '/admin/hospitals/pending',
            providesTags: ['AdminHospitals'],
        }),
        getAllHospitals: builder.query({
            query: (params = {}) => `/admin/hospitals?${new URLSearchParams(params)}`,
            providesTags: ['AdminHospitals'],
        }),
        verifyHospital: builder.mutation({
            query: ({ id, action }) => ({ url: `/admin/hospitals/${id}/verify`, method: 'PUT', body: { action } }),
            invalidatesTags: ['AdminHospitals'],
        }),
        blockHospital: builder.mutation({
            query: (id) => ({ url: `/admin/hospitals/${id}/block`, method: 'PATCH' }),
            invalidatesTags: ['AdminHospitals'],
        }),
        unblockHospital: builder.mutation({
            query: (id) => ({ url: `/admin/hospitals/${id}/unblock`, method: 'PATCH' }),
            invalidatesTags: ['AdminHospitals'],
        }),

        // Broadcast
        sendBroadcast: builder.mutation({
            query: (data) => ({ url: '/admin/broadcast', method: 'POST', body: data }),
        }),

        // Analytics & Reports
        getAnalytics: builder.query({
            query: () => '/admin/analytics',
            providesTags: ['AdminAnalytics'],
        }),
        getBloodInventory: builder.query({
            query: () => '/admin/blood-inventory',
            providesTags: ['AdminInventory'],
        }),
        getReportStats: builder.query({
            query: (params = {}) => `/admin/reports/stats?${new URLSearchParams(params)}`,
        }),

        // Feedback / Complaints
        getAdminFeedback: builder.query({
            query: (params = {}) => `/admin/feedback?${new URLSearchParams(params)}`,
            providesTags: ['AdminFeedback'],
        }),
        getFeedbackStats: builder.query({
            query: () => '/admin/feedback/stats',
            providesTags: ['AdminFeedback'],
        }),

        // System Health
        getSystemHealth: builder.query({
            query: () => '/admin/health',
        }),

        // Audit Logs
        getAuditLogs: builder.query({
            query: (params = {}) => `/admin/audit-logs?${new URLSearchParams(params)}`,
            providesTags: ['AdminAuditLogs'],
        }),
    }),
});

export const {
    useGetAdminUsersQuery, useUpdateAdminUserMutation, useUpdateUserVerificationMutation, useDeleteAdminUserMutation,
    useSuspendUserMutation, useActivateUserMutation,
    useGetUserNotesQuery, useUpdateUserNotesMutation, useGetDuplicateAccountsQuery,
    useGetAdminDonorsQuery, useGetDonorLeaderboardQuery,
    useVerifyAdminDonorMutation, useRejectAdminDonorMutation,
    useGetAdminRequestsQuery, useFindMatchingDonorsQuery, useNotifyMatchingDonorsMutation,
    useGetPendingHospitalsQuery, useGetAllHospitalsQuery,
    useVerifyHospitalMutation, useBlockHospitalMutation, useUnblockHospitalMutation,
    useSendBroadcastMutation,
    useGetAnalyticsQuery, useGetBloodInventoryQuery, useGetReportStatsQuery,
    useGetAdminFeedbackQuery, useGetFeedbackStatsQuery,
    useGetSystemHealthQuery, useGetAuditLogsQuery,
} = adminApi;
