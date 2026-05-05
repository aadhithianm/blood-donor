import { useState, useEffect, useCallback } from 'react';

export const useGeolocation = (options = {}) => {
    const [position, setPosition] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const getPosition = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported');
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setPosition({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                });
                setLoading(false);
            },
            (err) => {
                setError(err.message);
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000, ...options }
        );
    }, []);

    const watchPosition = useCallback(() => {
        if (!navigator.geolocation) return null;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                setPosition({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                });
            },
            (err) => setError(err.message),
            { enableHighAccuracy: true, ...options }
        );

        return watchId;
    }, []);

    return { position, error, loading, getPosition, watchPosition };
};
