import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { apiLogin, apiRegister } from '../services/api';

interface User {
    name: string;
    role: 'user' | 'manager' | 'admin';
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (credentials: any) => Promise<void>;
    register: (details: any) => Promise<void>;
    logout: () => void;
    error: string | null;
    handleAuthSuccess: (data: { token: string; userName: string; role?: 'user' | 'manager' | 'admin' }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const storedToken = localStorage.getItem('authToken');
            const storedUserStr = localStorage.getItem('authUser');
            if (storedToken && storedUserStr) {
                let storedUser = JSON.parse(storedUserStr);
                let decodedRole: 'user' | 'manager' | 'admin' | undefined;
                try {
                    const [, payloadB64] = storedToken.split('.');
                    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
                    decodedRole = payload.role;
                } catch {}
                if (decodedRole && decodedRole !== storedUser.role) {
                    storedUser = { ...storedUser, role: decodedRole };
                    localStorage.setItem('authUser', JSON.stringify(storedUser));
                }
                setToken(storedToken);
                setUser(storedUser);
            }
        } catch (e) {
            console.error("Failed to load auth data from storage", e);
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    const handleAuthSuccess = (data: { token: string; userName: string; role?: 'user' | 'manager' | 'admin' }) => {
        setToken(data.token);
        let decodedRole: 'user' | 'manager' | 'admin' | undefined;
        try {
            const [, payloadB64] = data.token.split('.');
            const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
            decodedRole = payload.role;
        } catch {}
        const newUser = { name: data.userName, role: (decodedRole || data.role || 'user') };
        setUser(newUser);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('authUser', JSON.stringify(newUser));
        setError(null);
    };

    const login = async (credentials: any) => {
        try {
            setError(null);
            const data = await apiLogin(credentials);
            handleAuthSuccess(data);
        } catch (err: any) {
            setError(err.message || 'Falha no login.');
            throw err;
        }
    };
    
    const register = async (details: any) => {
        try {
            setError(null);
            await apiRegister(details);
            // After successful registration, log the user in automatically
            await login({ email: details.email, password: details.password });
        } catch (err: any) {
             setError(err.message || 'Falha no registro.');
             throw err;
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        // This clears all app data on logout to prevent data leakage between accounts
        localStorage.removeItem('crmClients_v6'); 
    };

    const value = {
        isAuthenticated: !!token,
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        error,
        handleAuthSuccess,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
