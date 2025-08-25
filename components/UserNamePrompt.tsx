import React, { useState } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';

interface UserNamePromptProps {
    onNameSet: (name: string) => void;
}

const inputClasses = "mt-2 block w-full glass-input text-system-label-primary rounded-lg px-3 py-2 text-base text-center focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent placeholder-system-label-tertiary";

export const UserNamePrompt: React.FC<UserNamePromptProps> = ({ onNameSet }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onNameSet(name.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex justify-center items-center z-50 p-4">
            <div className="w-full max-w-sm text-center glass p-6 rounded-2xl">
                 <Icon name="user" className="w-16 h-16 mx-auto text-system-label-tertiary mb-4" />
                <h1 className="text-2xl font-bold text-system-label-primary">Bem-vindo(a)!</h1>
                <p className="text-system-label-secondary mt-2">Para começar, por favor, insira seu nome. Ele será usado para identificar seus relatórios exportados.</p>
                <form onSubmit={handleSubmit} className="mt-8">
                    <label htmlFor="user-name" className="sr-only">Seu Nome</label>
                    <input
                        id="user-name"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        placeholder="Digite seu nome aqui"
                        className={inputClasses}
                    />
                    <Button type="submit" className="mt-4 w-full">Confirmar</Button>
                </form>
            </div>
        </div>
    );
};