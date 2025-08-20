import React, { useState } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';

interface LogCallModalProps {
    onClose: () => void;
    onLogCall: (result: 'CE' | 'CNE', observation: string) => void;
}

const inputClasses = "mt-1 block w-full bg-system-bg-tertiary dark:bg-system-bg-secondary text-system-label-primary border border-system-separator rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent placeholder-system-label-tertiary";

export const LogCallModal: React.FC<LogCallModalProps> = ({ onClose, onLogCall }) => {
    const [result, setResult] = useState<'CE' | 'CNE'>('CE');
    const [observation, setObservation] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogCall(result, observation.trim());
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex justify-center items-center z-50 p-4">
            <div className="bg-system-bg-secondary rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-system-separator flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-system-label-primary">Registrar Resultado da Ligação</h2>
                    <button onClick={onClose} className="text-system-label-secondary hover:text-system-label-primary">
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-system-label-secondary">Resultado</label>
                        <div className="mt-2 flex gap-4">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="radio" name="call-result" value="CE" checked={result === 'CE'} onChange={() => setResult('CE')} className="form-radio text-apple-blue focus:ring-apple-blue bg-system-bg-tertiary border-system-separator"/>
                                <span className="text-sm text-system-label-primary">CE (Contato Efetivo)</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="radio" name="call-result" value="CNE" checked={result === 'CNE'} onChange={() => setResult('CNE')} className="form-radio text-apple-blue focus:ring-apple-blue bg-system-bg-tertiary border-system-separator"/>
                                <span className="text-sm text-system-label-primary">CNE (Contato Não Efetivo)</span>
                            </label>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="observation" className="text-sm font-medium text-system-label-secondary">Observação (Opcional)</label>
                        <textarea id="observation" value={observation} onChange={e => setObservation(e.target.value)} rows={3} placeholder="Adicione um comentário..." className={inputClasses}></textarea>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                        <Button type="submit">Registrar Ligação</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};