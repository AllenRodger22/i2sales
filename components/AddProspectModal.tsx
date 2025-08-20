import React, { useState } from 'react';
import type { Prospect } from '../types';
import { Button } from './Button';
import { Icon } from './Icon';

interface AddProspectModalProps {
    onClose: () => void;
    onAddProspect: (prospectData: Omit<Prospect, 'id'>) => void;
}

const inputClasses = "mt-1 block w-full bg-white dark:bg-apple-gray-700 text-apple-gray-900 dark:text-apple-gray-100 border border-apple-gray-300 dark:border-apple-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue placeholder-apple-gray-500 dark:placeholder-apple-gray-400";

export const AddProspectModal: React.FC<AddProspectModalProps> = ({ onClose, onAddProspect }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [origin, setOrigin] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            alert('Por favor, preencha o nome.');
            return;
        }
        onAddProspect({ name, phone, origin });
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-apple-gray-100 dark:bg-apple-gray-800 rounded-xl shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-apple-gray-200 dark:border-apple-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-apple-gray-800 dark:text-apple-gray-100">Novo Interessado</h2>
                     <button onClick={onClose} className="text-apple-gray-500 hover:text-apple-gray-800 dark:hover:text-apple-gray-200">
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="name" className="text-sm font-medium text-apple-gray-600 dark:text-apple-gray-400">Nome</label>
                        <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required className={inputClasses} />
                    </div>
                    <div>
                        <label htmlFor="phone" className="text-sm font-medium text-apple-gray-600 dark:text-apple-gray-400">Telefone</label>
                        <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputClasses} />
                    </div>
                    <div>
                        <label htmlFor="origin" className="text-sm font-medium text-apple-gray-600 dark:text-apple-gray-400">Origem</label>
                        <input id="origin" type="text" value={origin} onChange={e => setOrigin(e.target.value)} className={inputClasses} />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                        <Button type="submit">Adicionar Interessado</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};