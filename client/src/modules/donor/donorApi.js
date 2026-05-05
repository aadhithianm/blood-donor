import { api } from '../../app/api';

export const donorApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getDonorProfile: builder.query({
            query: () => '/donor/profile',
            providesTags: ['Donor'],
        }),
        updateDonorProfile: builder.mutation({
            query: (data) => ({ url: '/donor/profile', method: 'PUT', body: data }),
            invalidatesTags: ['Donor'],
        }),
        uploadCertificate: builder.mutation({
            query: (formData) => ({ url: '/donor/upload-certificate', method: 'POST', body: formData }),
            invalidatesTags: ['Donor'],
        }),
        toggleAvailability: builder.mutation({
            query: (data) => ({ url: '/donor/availability', method: 'PUT', body: data }),
            invalidatesTags: ['Donor'],
        }),
        getDonorDashboard: builder.query({
            query: () => '/donor/dashboard',
            providesTags: ['Donor'],
        }),
    }),
});

export const {
    useGetDonorProfileQuery,
    useUpdateDonorProfileMutation,
    useUploadCertificateMutation,
    useToggleAvailabilityMutation,
    useGetDonorDashboardQuery,
} = donorApi;
