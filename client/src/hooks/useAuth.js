import { useSelector, useDispatch } from 'react-redux';
import { selectUser, selectIsAuthenticated, setCredentials, logout as logoutAction } from '../modules/auth/authSlice';
import { useLogoutMutation } from '../modules/auth/authApi';

export const useAuth = () => {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const [logoutMutation] = useLogoutMutation();

    const login = (data) => {
        dispatch(setCredentials(data));
    };

    const logout = async () => {
        try {
            await logoutMutation().unwrap();
        } catch (err) {
            // Continue with local logout even if API fails
        }
        dispatch(logoutAction());
    };

    return { user, isAuthenticated, login, logout };
};
