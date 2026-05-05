import { api } from '../../app/api';

export const notificationApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getNotifications: builder.query({
            query: ({ page = 1, limit = 20 } = {}) => `/notifications?page=${page}&limit=${limit}`,
            providesTags: ['Notification'],
        }),
        markAsRead: builder.mutation({
            query: (id) => ({
                url: `/notifications/${id}/read`,
                method: 'PUT',
            }),
            invalidatesTags: ['Notification'],
        }),
        markAllAsRead: builder.mutation({
            query: () => ({
                url: '/notifications/read-all',
                method: 'PUT',
            }),
            invalidatesTags: ['Notification'],
        }),
        deleteNotification: builder.mutation({
            query: (id) => ({
                url: `/notifications/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Notification'],
        }),
    }),
});

export const {
    useGetNotificationsQuery,
    useMarkAsReadMutation,
    useMarkAllAsReadMutation,
    useDeleteNotificationMutation
} = notificationApi;
