import React, { useState } from 'react';
import type { Prospect } from '../types';
import { Button } from './Button';
import { Icon } from './Icon';

interface AddProspectModalProps {
    onClose: () => void;
    onAddProspect: (prospectData: Omit<Prospect, 'id'>) => void;
}

const inputClasses = "mt-1 block w-full glass-input text-system-label-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent placeholder-system-label-tertiary";

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex justify-center items-center z-50 p-4">
            <div className="glass rounded-xl shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-white/20 dark:border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-system-label-primary">Novo Interessado</h2>
                    <button onClick={onClose} className="text-system-label-secondary hover:text-system-label-primary">
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="name" className="text-sm font-medium text-system-label-secondary">Nome</label>
                        <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required className={inputClasses} />
                    </div>
                    <div>
                        <label htmlFor="phone" className="text-sm font-medium text-system-label-secondary">Telefone</label>
                        <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputClasses} />
                    </div>
                    <div>
                        <label htmlFor="origin" className="text-sm font-medium text-system-label-secondary">Origem</label>
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