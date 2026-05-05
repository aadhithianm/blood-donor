import { api } from '../../app/api';

export const userApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getProfile: builder.query({
            query: () => '/users/me',
            providesTags: ['User'],
        }),
        updateProfile: builder.mutation({
            query: (data) => ({
                url: '/users/me',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['User'],
        }),
        uploadAvatar: builder.mutation({
            query: (formData) => ({
                url: '/users/me/avatar',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['User'],
        }),
    }),
});

export const { useGetProfileQuery, useUpdateProfileMutation, useUploadAvatarMutation } = userApi;
