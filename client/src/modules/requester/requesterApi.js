import { api } from '../../app/api';

export const requesterApi = api.injectEndpoints({
    endpoints: (builder) => ({
        createRequest: builder.mutation({
            query: (data) => ({ url: '/requests', method: 'POST', body: data }),
            invalidatesTags: ['Request'],
        }),
        getMyRequests: builder.query({
            query: ({ page = 1, limit = 10 } = {}) => `/requests/my?page=${page}&limit=${limit}`,
            providesTags: ['Request'],
        }),
        getRequest: builder.query({
            query: (id) => `/requests/${id}`,
            providesTags: ['Request'],
        }),
        acceptRequest: builder.mutation({
            query: (id) => ({ url: `/requests/${id}/accept`, method: 'POST' }),
            invalidatesTags: ['Request'],
        }),
        completeRequest: builder.mutation({
            query: (id) => ({ url: `/requests/${id}/complete`, method: 'POST' }),
            invalidatesTags: ['Request'],
        }),
    }),
});

export const {
    useCreateRequestMutation,
    useGetMyRequestsQuery,
    useGetRequestQuery,
    useAcceptRequestMutation,
    useCompleteRequestMutation,
} = requesterApi;
