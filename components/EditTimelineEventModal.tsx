import React, { useState, useEffect } from 'react';
import type { TimelineEvent } from '../types';
import { TimelineEventType } from '../types';
import { Button } from './Button';
import { Icon } from './Icon';

interface EditTimelineEventModalProps {
    event: TimelineEvent;
    onClose: () => void;
    onSave: (eventId: string, updatedData: Partial<Omit<TimelineEvent, 'id' | 'date'>>) => void;
}

const inputClasses = "mt-1 block w-full bg-system-bg-tertiary dark:bg-system-bg-secondary text-system-label-primary border border-system-separator rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent placeholder-system-label-tertiary";

const parseCallContent = (content: string): { result: 'CE' | 'CNE', observation: string } => {
    if (content.startsWith('Ligação realizada: CE')) {
        return { result: 'CE', observation: content.substring('Ligação realizada: CE'.length).replace(/^-/, '').trim() };
    }
    if (content.startsWith('Ligação realizada: CNE')) {
        return { result: 'CNE', observation: content.substring('Ligação realizada: CNE'.length).replace(/^-/, '').trim() };
    }
    return { result: 'CE', observation: content };
};

export const EditTimelineEventModal: React.FC<EditTimelineEventModalProps> = ({ event, onClose, onSave }) => {
    const isCallEvent = event.type === TimelineEventType.Ligacao;
    const isNoteEvent = [TimelineEventType.Observacao, TimelineEventType.CNE, TimelineEventType.Anotacao].includes(event.type);

    const [callResult, setCallResult] = useState<'CE' | 'CNE'>('CE');
    const [callObservation, setCallObservation] = useState('');
    const [noteType, setNoteType] = useState<TimelineEventType>(event.type);
    const [noteContent, setNoteContent] = useState('');
    
    useEffect(() => {
        if (isCallEvent) {
            const { result, observation } = parseCallContent(event.content);
            setCallResult(result);
            setCallObservation(observation);
        }
        if (isNoteEvent) {
            setNoteType(event.type);
            setNoteContent(event.content);
        }
    }, [event, isCallEvent, isNoteEvent]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let updatedData: Partial<Omit<TimelineEvent, 'id' | 'date'>> = {};

        if (isCallEvent) {
            let newContent = `Ligação realizada: ${callResult}`;
            if (callObservation) {
                newContent += ` - ${callObservation}`;
            }
            updatedData = { content: newContent };
        } else if (isNoteEvent) {
            if (!noteContent.trim()) {
                alert("O conteúdo não pode ficar vazio.");
                return;
            }
            updatedData = { type: noteType, content: noteContent };
        }
        
        onSave(event.id, updatedData);
        onClose();
    };

    const renderFormContent = () => {
        if (isCallEvent) {
            return (
                <>
                    <div>
                        <label className="text-sm font-medium text-system-label-secondary">Resultado</label>
                        <div className="mt-2 flex gap-4">
                             <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="radio" name="call-result" value="CE" checked={callResult === 'CE'} onChange={() => setCallResult('CE')} className="form-radio text-apple-blue focus:ring-apple-blue bg-system-bg-tertiary border-system-separator"/>
                                <span className="text-sm text-system-label-primary">CE (Contato Efetivo)</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="radio" name="call-result" value="CNE" checked={callResult === 'CNE'} onChange={() => setCallResult('CNE')} className="form-radio text-apple-blue focus:ring-apple-blue bg-system-bg-tertiary border-system-separator"/>
                                <span className="text-sm text-system-label-primary">CNE (Contato Não Efetivo)</span>
                            </label>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="observation" className="text-sm font-medium text-system-label-secondary">Observação</label>
                        <textarea id="observation" value={callObservation} onChange={e => setCallObservation(e.target.value)} rows={3} className={inputClasses}></textarea>
                    </div>
                </>
            );
        }
        if (isNoteEvent) {
             return (
                <>
                    <div>
                        <label className="text-sm font-medium text-system-label-secondary">Tipo de Interação</label>
                         <select value={noteType} onChange={(e) => setNoteType(e.target.value as TimelineEventType)} className={`mt-2 ${inputClasses}`}>
                            <option value={TimelineEventType.Observacao}>Observação (CE)</option>
                            <option value={TimelineEventType.CNE}>Contato Não Efetivo (CNE)</option>
                            <option value={TimelineEventType.Anotacao}>Anotação (sem KPI)</option>
                         </select>
                    </div>
                    <div>
                        <label htmlFor="content" className="text-sm font-medium text-system-label-secondary">Conteúdo</label>
                        <textarea id="content" value={noteContent} onChange={e => setNoteContent(e.target.value)} rows={3} required className={inputClasses}></textarea>
                    </div>
                </>
            );
        }
        return <p className="text-sm text-system-label-secondary">Este tipo de evento não pode ser editado.</p>;
    };

    return (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex justify-center items-center z-50 p-4">
            <div className="bg-system-bg-secondary rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-system-separator flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-system-label-primary">Editar Evento da Timeline</h2>
                    <button onClick={onClose} className="text-system-label-secondary hover:text-system-label-primary">
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                </div>
                 <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {renderFormContent()}
                     <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={!isCallEvent && !isNoteEvent}>Salvar Alterações</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};