import { useState, useCallback } from 'react';

const useHttp = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState({});

    const request = useCallback(async (url, method = 'POST', body = null, headers = {}) => {
        setLoading(true);
        try {
            if (body) {
                body = JSON.stringify(body);
            }
            headers = {
                'Content-Type': 'application/json',
                credentials: 'include',
            };

            const response = await fetch(url, { method, body, headers });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            setLoading(false);
            return data;
        } catch (err) {
            setLoading(false);
            setError(err);
        }
    }, []);

    const clearError = () => setError(null);

    return { loading, request, error, clearError };
};

export default useHttp;
