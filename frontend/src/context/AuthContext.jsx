import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * AuthProvider
 * Wraps the app and provides: user, token, login(), logout(), loading
 * Token is persisted in localStorage so the user stays logged in on refresh.
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('agToken') || null);
    const [loading, setLoading] = useState(true);

    // Set Axios default Authorization header whenever token changes
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchCurrentUser();
        } else {
            delete axios.defaults.headers.common['Authorization'];
            setLoading(false);
        }
    }, [token]);

    const fetchCurrentUser = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/auth/me`);
            if (data.success) setUser(data.data);
        } catch {
            // Token is expired or invalid — clear it
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = (userData, authToken) => {
        localStorage.setItem('agToken', authToken);
        setToken(authToken);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('agToken');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * useAuth hook
 * Usage: const { user, login, logout } = useAuth();
 */
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
    return ctx;
};

export default AuthContext;
