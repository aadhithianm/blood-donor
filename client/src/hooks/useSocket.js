import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { selectAccessToken } from '../modules/auth/authSlice';

let socketInstance = null;

export const useSocket = () => {
    const token = useSelector(selectAccessToken);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!token) return;

        if (!socketInstance) {
            socketInstance = io({
                auth: { token },
                autoConnect: true,
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
            });

            socketInstance.on('connect', () => {
                console.log('🔌 Socket connected');
            });

            socketInstance.on('disconnect', () => {
                console.log('🔌 Socket disconnected');
            });
        }

        socketRef.current = socketInstance;

        return () => {
            // Don't disconnect on unmount — keep alive for app lifetime
        };
    }, [token]);

    const emit = useCallback((event, data) => {
        socketRef.current?.emit(event, data);
    }, []);

    const on = useCallback((event, handler) => {
        socketRef.current?.on(event, handler);
        return () => socketRef.current?.off(event, handler);
    }, []);

    const off = useCallback((event, handler) => {
        socketRef.current?.off(event, handler);
    }, []);

    return { socket: socketRef.current, emit, on, off };
};
