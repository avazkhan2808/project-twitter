import { useState, useCallback, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import useHttp from '../hooks/useHttp';

const useAuth = () => {
    const { request, loading } = useHttp();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const history = useHistory();

    const login = useCallback(() => {
        setIsAuthenticated(true);
    }, [setIsAuthenticated]);

    const logout = useCallback(() => {
        setIsAuthenticated(false);
    }, [setIsAuthenticated]);

    const verifyToken = useCallback(async () => {
        try {
            const response = await request('/me', 'GET');
            if (response && response.status !== 401 && response.status !== 500) {
                return setIsAuthenticated(true) && history.push('/home');
            }
            setIsAuthenticated(false);
        } catch (e) {}
    }, [request]);

    useEffect(() => {
        let isSubscribed = true;
        if (isSubscribed) {
            verifyToken();
        }
        return () => (isSubscribed = false);
    }, [verifyToken]);

    return { isAuthenticated, loading, login, logout };
};

export default useAuth;
