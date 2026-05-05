import { api } from '../../app/api';

export const hospitalApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getHospitalProfile: builder.query({ query: () => '/hospital/profile', providesTags: ['Hospital'] }),
        updateHospitalProfile: builder.mutation({
            query: (data) => ({ url: '/hospital/profile', method: 'PUT', body: data }),
            invalidatesTags: ['Hospital'],
        }),
        getPendingDonors: builder.query({ query: () => '/hospital/donors/pending', providesTags: ['Hospital'] }),
        verifyDonor: builder.mutation({
            query: ({ id, action }) => ({ url: `/hospital/donors/${id}/verify`, method: 'PUT', body: { action } }),
            invalidatesTags: ['Hospital'],
        }),
        getInventory: builder.query({ query: () => '/hospital/inventory', providesTags: ['Hospital'] }),
        updateInventory: builder.mutation({
            query: (data) => ({ url: '/hospital/inventory', method: 'PUT', body: data }),
            invalidatesTags: ['Hospital'],
        }),
        createBulkRequest: builder.mutation({
            query: (data) => ({ url: '/hospital/requests/bulk', method: 'POST', body: data }),
        }),
    }),
});

export const {
    useGetHospitalProfileQuery, useUpdateHospitalProfileMutation,
    useGetPendingDonorsQuery, useVerifyDonorMutation,
    useGetInventoryQuery, useUpdateInventoryMutation,
    useCreateBulkRequestMutation,
} = hospitalApi;
