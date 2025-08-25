import React, { useState } from 'react';
import type { Client } from '../types';
import { Button } from './Button';
import { Icon } from './Icon';

interface EditClientModalProps {
    client: Client;
    onClose: () => void;
    onSave: (updatedData: Partial<Client>) => void;
}

const inputClasses = "mt-1 block w-full glass-input text-system-label-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent placeholder-system-label-tertiary";

export const EditClientModal: React.FC<EditClientModalProps> = ({ client, onClose, onSave }) => {
    const [name, setName] = useState(client.name);
    const [email, setEmail] = useState(client.email);
    const [phone, setPhone] = useState(client.phone);
    const [origin, setOrigin] = useState(client.origin);
    const [saleValue, setSaleValue] = useState(client.saleValue?.toString() ?? '');
    const [customFields, setCustomFields] = useState(client.customFields ? JSON.parse(JSON.stringify(client.customFields)) : []);

    const handleCustomFieldChange = (index: number, field: 'name' | 'value', value: string) => {
        const newFields = [...customFields];
        newFields[index][field] = value;
        setCustomFields(newFields);
    };

    const addCustomFieldRow = () => {
        setCustomFields([...customFields, { name: '', value: '' }]);
    };

    const removeCustomFieldRow = (index: number) => {
        setCustomFields(customFields.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !origin.trim()) {
            alert('Por favor, preencha os campos obrigatórios (Nome e Origem).');
            return;
        }
        if (!email.trim() && !phone.trim()) {
            alert('É necessário fornecer um E-mail ou um Telefone para o cliente.');
            return;
        }
        const finalCustomFields = customFields.filter(f => f.name.trim() !== '' && f.value.trim() !== '');
        const saleValueNum = saleValue ? parseFloat(saleValue.replace(',', '.')) : undefined;
        
        onSave({
            name,
            email,
            phone,
            origin,
            saleValue: saleValueNum && !isNaN(saleValueNum) ? saleValueNum : undefined,
            customFields: finalCustomFields,
        });
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex justify-center items-center z-50 p-4">
            <div className="glass rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-system-separator flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-system-label-primary">Editar Cliente</h2>
                     <button onClick={onClose} className="text-system-label-secondary hover:text-system-label-primary">
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div>
                        <label htmlFor="edit-name" className="text-sm font-medium text-system-label-secondary">Nome</label>
                        <input id="edit-name" type="text" value={name} onChange={e => setName(e.target.value)} required className={inputClasses} />
                    </div>
                    <div>
                        <label htmlFor="edit-email" className="text-sm font-medium text-system-label-secondary">E-mail</label>
                        <input id="edit-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClasses} />
                    </div>
                    <div>
                        <label htmlFor="edit-phone" className="text-sm font-medium text-system-label-secondary">Telefone</label>
                        <input id="edit-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputClasses} />
                    </div>
                    <div>
                        <label htmlFor="edit-origin" className="text-sm font-medium text-system-label-secondary">Origem</label>
                        <input id="edit-origin" type="text" value={origin} onChange={e => setOrigin(e.target.value)} required className={inputClasses} />
                    </div>
                     <div>
                        <label htmlFor="edit-saleValue" className="text-sm font-medium text-system-label-secondary">Valor de Venda (Opcional)</label>
                        <input id="edit-saleValue" type="text" value={saleValue} onChange={e => setSaleValue(e.target.value)} className={inputClasses} placeholder="Ex: 550000,50"/>
                    </div>
                    
                    <div className="space-y-3 pt-2">
                        <h3 className="text-sm font-medium text-system-label-secondary">Campos Personalizados</h3>
                        {customFields.map((field, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <input type="text" placeholder="Nome do Campo" value={field.name} onChange={(e) => handleCustomFieldChange(index, 'name', e.target.value)} className={`flex-1 ${inputClasses}`}/>
                                <input type="text" placeholder="Valor" value={field.value} onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)} className={`flex-1 ${inputClasses}`}/>
                                <button type="button" onClick={() => removeCustomFieldRow(index)} className="text-system-label-tertiary hover:text-system-label-secondary">
                                    <Icon name="x" className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                        <Button type="button" variant="ghost" onClick={addCustomFieldRow} className="text-sm">
                            <Icon name="plus" className="w-4 h-4 mr-2"/>
                            Adicionar campo
                        </Button>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                        <Button type="submit">Salvar Alterações</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};