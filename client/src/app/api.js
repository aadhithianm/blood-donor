import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
    baseUrl: '/api',
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
        const token = getState().auth.accessToken;
        if (token) {
            headers.set('authorization', `Bearer ${token}`);
        }
        return headers;
    },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    if (result?.error?.status === 401) {
        // Try to refresh token
        const refreshResult = await baseQuery(
            { url: '/auth/refresh', method: 'POST' },
            api,
            extraOptions
        );

        if (refreshResult?.data?.success) {
            const newToken = refreshResult.data.data.accessToken;
            api.dispatch({ type: 'auth/setAccessToken', payload: newToken });
            // Retry original request
            result = await baseQuery(args, api, extraOptions);
        } else {
            api.dispatch({ type: 'auth/logout' });
        }
    }

    return result;
};

export const api = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['User', 'Donor', 'Request', 'Hospital', 'Notification', 'Feedback', 'Admin'],
    endpoints: () => ({}),
});
