import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';
import { Icon } from './Icon';

const inputClasses = "mt-1 block w-full bg-system-bg-tertiary dark:bg-system-bg-secondary text-system-label-primary border border-system-separator rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent placeholder-system-label-tertiary";

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
            {error && <p className="text-sm text-apple-red text-center">{error}</p>}
            <div className="pt-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Carregando...' : (isRegister ? 'Registrar e Entrar' : 'Entrar')}
                </Button>
            </div>
        </form>
    );
};

export const AuthScreen: React.FC = () => {
    const [isRegister, setIsRegister] = useState(false);

    return (
        <div className="fixed inset-0 bg-system-bg-secondary flex justify-center items-center z-50 p-4">
            <div className="bg-system-bg-primary rounded-2xl shadow-soft dark:shadow-soft-dark w-full max-w-sm">
                <div className="p-6 sm:p-8">
                     <div className="text-center mb-6">
                        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-apple-orange/15 flex items-center justify-center">
                            <Icon name="arrow-up-right" className="w-8 h-8 text-apple-orange" />
                        </div>
                        <h1 className="text-2xl font-bold text-system-label-primary">
                            {isRegister ? 'Crie sua Conta' : 'Bem-vindo(a) de volta!'}
                        </h1>
                        <p className="text-system-label-secondary mt-1 text-sm">
                            {isRegister ? 'Preencha os dados para começar.' : 'Faça login para acessar seu painel.'}
                        </p>
                    </div>

                    <AuthForm isRegister={isRegister} />
                </div>
                <div className="p-4 bg-system-bg-secondary rounded-b-2xl text-center">
                    <button onClick={() => setIsRegister(!isRegister)} className="text-sm text-apple-blue font-semibold hover:underline">
                        {isRegister ? 'Já tem uma conta? Faça login.' : 'Não tem uma conta? Registre-se.'}
                    </button>
                </div>
            </div>
        </div>
    );
};