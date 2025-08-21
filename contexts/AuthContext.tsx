// contexts/AuthContext.tsx

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
// Certifique-se de que o caminho para seu arquivo de serviços está correto
import { apiLogin, apiRegister, apiLoginWithGoogle } from '../services/api'; 

// Definição do tipo User (pode já existir no seu arquivo types.ts)
interface User {
    name: string;
    role: 'user' | 'admin';
}

// Interface atualizada para o contexto, incluindo loginWithGoogle
interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (credentials: any) => Promise<void>;
    loginWithGoogle: (googleToken: string) => Promise<void>; // <-- Adicionado
    register: (details: any) => Promise<void>;
    logout: () => void;
    error: string | null;
}

// Criação do contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Componente Provedor
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Efeito para carregar dados do localStorage na inicialização
    useEffect(() => {
        try {
            const storedToken = localStorage.getItem('authToken');
            const storedUser = localStorage.getItem('authUser');
            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        } catch (e) {
            console.error("Falha ao carregar dados de autenticação do storage", e);
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    // Função centralizada para lidar com o sucesso da autenticação
    const handleAuthSuccess = (data: { token: string; userName: string; role?: 'user' | 'admin' }) => {
        setToken(data.token);
        const newUser = { name: data.userName, role: data.role || 'user' };
        setUser(newUser);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('authUser', JSON.stringify(newUser));
        setError(null); // Limpa qualquer erro anterior
    };

    // Função de login tradicional (email/senha)
    const login = async (credentials: any) => {
        try {
            setError(null);
            const data = await apiLogin(credentials);
            handleAuthSuccess(data);
        } catch (err: any) {
            const errorMessage = err.message || 'Falha no login.';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };
    
    // Função NOVA para o login com Google
    const loginWithGoogle = async (googleToken: string) => {
        try {
            setError(null);
            const data = await apiLoginWithGoogle(googleToken);
            handleAuthSuccess(data); // Reutiliza a mesma lógica de sucesso!
        } catch (err: any) {
            const errorMessage = err.message || 'Falha no login com Google.';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    // Função de registro
    const register = async (details: any) => {
        try {
            setError(null);
            await apiRegister(details);
            // Após registro bem-sucedido, faz o login automaticamente
            await login({ email: details.email, password: details.password });
        } catch (err: any) {
             const errorMessage = err.message || 'Falha no registro.';
             setError(errorMessage);
             throw new Error(errorMessage);
        }
    };

    // Função de logout
    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        // Limpa dados específicos da aplicação para segurança
        localStorage.removeItem('crmClients_v6'); 
    };

    // Objeto de valor que será fornecido pelo contexto
    const value = {
        isAuthenticated: !!token,
        user,
        token,
        isLoading,
        login,
        loginWithGoogle, // <-- expõe a nova função
        register,
        logout,
        error,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </Auth-provider>
    );
};

// Hook customizado para consumir o contexto
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};