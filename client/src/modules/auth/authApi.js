import { api } from '../../app/api';

export const authApi = api.injectEndpoints({
    endpoints: (builder) => ({
        register: builder.mutation({
            query: (data) => ({ url: '/auth/register', method: 'POST', body: data }),
        }),
        verifyOtp: builder.mutation({
            query: (data) => ({ url: '/auth/verify-otp', method: 'POST', body: data }),
        }),
        login: builder.mutation({
            query: (data) => ({ url: '/auth/login', method: 'POST', body: data }),
        }),
        refresh: builder.mutation({
            query: () => ({ url: '/auth/refresh', method: 'POST' }),
        }),
        logout: builder.mutation({
            query: () => ({ url: '/auth/logout', method: 'POST' }),
        }),
        forgotPassword: builder.mutation({
            query: (data) => ({ url: '/auth/forgot-password', method: 'POST', body: data }),
        }),
        resetPassword: builder.mutation({
            query: (data) => ({ url: '/auth/reset-password', method: 'POST', body: data }),
        }),
        skipVerify: builder.mutation({
            query: (data) => ({ url: '/auth/skip-verify', method: 'POST', body: data }),
        }),
    }),
});

export const {
    useRegisterMutation,
    useVerifyOtpMutation,
    useLoginMutation,
    useRefreshMutation,
    useLogoutMutation,
    useForgotPasswordMutation,
    useResetPasswordMutation,
    useSkipVerifyMutation,
} = authApi;
