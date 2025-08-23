import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';
import { Icon } from './Icon';

const inputClasses = "mt-1 block w-full glass-card rounded-2xl px-4 py-3 border-0 focus:ring-2 focus:ring-accent-orange/50 transition-all placeholder-system-label-tertiary";

const AuthForm: React.FC<{ isRegister: boolean }> = ({ isRegister }) => {
    const { login, register, error } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isRegister) {
                await register({ name, email, password });
            } else {
                await login({ email, password });
            }
        } catch (err) {
            // Error is handled in the AuthContext, just need to stop loading
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
                <div>
                    <label htmlFor="name" className="text-sm font-medium text-system-label-secondary">Nome</label>
                    <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required className={inputClasses} />
                </div>
            )}
            <div>
                <label htmlFor="email" className="text-sm font-medium text-system-label-secondary">E-mail</label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClasses} />
            </div>
            <div>
                <label htmlFor="password" className="text-sm font-medium text-system-label-secondary">Senha</label>
                <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className={inputClasses} />
            </div>
            {error && (
                <div className="glass-panel rounded-2xl p-4 border border-apple-red/30">
                    <p className="text-apple-red text-sm text-center">{error}</p>
                </div>
            )}
            <div className="pt-2">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-accent-orange text-white rounded-2xl px-6 py-3 font-semibold hover:scale-105 disabled:opacity-50 disabled:scale-100 transition-all duration-300 shadow-lg shadow-accent-orange/25"
                >
                    {isLoading ? 'Carregando...' : (isRegister ? 'Registrar e Entrar' : 'Entrar')}
                </button>
            </div>
        </form>
    );
};

export const AuthScreen: React.FC = () => {
    const [isRegister, setIsRegister] = useState(false);

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="glass-overlay rounded-3xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-accent-orange/15 flex items-center justify-center">
                        <Icon name="arrow-up-right" className="w-10 h-10 text-accent-orange" />
                    </div>
                    <h1 className="text-3xl font-bold text-system-label-primary mb-2">
                        {isRegister ? 'Criar conta' : 'Bem-vindo de volta'}
                    </h1>
                    <p className="text-system-label-secondary">
                        {isRegister ? 'Crie sua conta para começar' : 'Entre na sua conta para continuar'}
                    </p>
                </div>

                <AuthForm isRegister={isRegister} />
                
                <div className="mt-6 text-center">
                    <button onClick={() => setIsRegister(!isRegister)} className="text-accent-orange hover:underline transition-all">
                        {isRegister ? 'Já tem conta? Entrar' : 'Não tem conta? Criar uma'}
                    </button>
                </div>
            </div>
        </div>
    );
};
