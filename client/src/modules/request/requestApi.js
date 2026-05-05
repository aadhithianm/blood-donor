import { api } from '../../app/api';

export const requestApi = api.injectEndpoints({
    endpoints: (builder) => ({
        createRequest: builder.mutation({
            query: (data) => ({
                url: '/requests',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Request'],
        }),
        getMyRequests: builder.query({
            query: () => '/requests/my',
            providesTags: ['Request'],
        }),
        getDonorFeed: builder.query({
            query: () => '/requests/feed',
            providesTags: ['Request'],
        }),
        getDonorHistory: builder.query({
            query: () => '/requests/donor/history',
            providesTags: ['Request'],
        }),
        acceptRequest: builder.mutation({
            query: (id) => ({
                url: `/requests/${id}/accept`,
                method: 'POST',
            }),
            invalidatesTags: ['Request', 'Donor'],
        }),
        completeRequest: builder.mutation({
            query: (id) => ({
                url: `/requests/${id}/complete`,
                method: 'POST',
            }),
            invalidatesTags: ['Request', 'Donor', 'Hospital'],
        }),
    }),
});

export const {
    useCreateRequestMutation,
    useGetMyRequestsQuery,
    useGetDonorFeedQuery,
    useGetDonorHistoryQuery,
    useAcceptRequestMutation,
    useCompleteRequestMutation
} = requestApi;
