import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Client, TimelineEvent } from '../types';
import { Status, TimelineEventType } from '../types';
import { STATUS_OPTIONS, getStatusInfo } from '../constants';
import { Button } from './Button';
import { Icon } from './Icon';
import { Card } from './Card';
import { EditClientModal } from './EditClientModal';
import { LogCallModal } from './LogCallModal';
import { EditTimelineEventModal } from './EditTimelineEventModal';

interface ClientDetailProps {
    client: Client;
    onBack: () => void;
    updateClient: (id: string, data: Partial<Client>) => Promise<void>;
    deleteClient: (id: string) => Promise<boolean>;
}

const inputClasses = "block w-full bg-system-bg-tertiary dark:bg-system-bg-secondary text-system-label-primary border border-system-separator rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent placeholder-system-label-tertiary";
const editableTypes: TimelineEventType[] = [TimelineEventType.Ligacao, TimelineEventType.Observacao, TimelineEventType.CNE, TimelineEventType.Anotacao];
const secondaryButtonLinkClasses = "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-apple-blue focus:ring-offset-2 dark:focus:ring-offset-system-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed bg-system-fill-primary text-system-label-primary hover:bg-system-fill-secondary active:brightness-95 dark:active:brightness-105";

const TimelineItem: React.FC<{ event: TimelineEvent; onEdit: (event: TimelineEvent) => void; isLast: boolean; }> = ({ event, onEdit, isLast }) => {
    const getIcon = (type: TimelineEventType) => {
        const iconClass = "w-5 h-5 text-system-label-secondary";
        switch (type) {
            case TimelineEventType.WhatsApp:
                return <Icon name="whatsapp" className="w-5 h-5 text-apple-green" />;
            case TimelineEventType.FollowUp:
                return <Icon name="calendar" className={iconClass} />;
            default:
                return <div className="h-3 w-3 rounded-full bg-system-label-tertiary"></div>;
        }
    }
    
    const isEditable = editableTypes.includes(event.type);

    return (
        <li 
            className={`relative flex gap-x-4 group`}
            onClick={() => isEditable && onEdit(event)}
        >
            {!isLast && <div className="absolute left-3 top-6 bottom-2 w-px bg-system-separator"></div>}
            <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-system-bg-secondary rounded-full mt-2 ring-8 ring-system-bg-primary">
                {getIcon(event.type)}
            </div>
            <div className="flex-auto py-2">
                <div className="flex justify-between items-start">
                    <p className="text-sm text-system-label-primary leading-6">{event.content}</p>
                    {isEditable && 
                        <button onClick={() => onEdit(event)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-system-fill-primary">
                            <Icon name="edit-3" className="w-4 h-4 text-system-label-secondary" />
                        </button>
                    }
                </div>
                <time dateTime={event.date} className="flex-none text-xs text-system-label-tertiary mt-1">
                    {new Date(event.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </time>
            </div>
        </li>
    );
};

const getLocalDateTimePickerString = (isoString: string | undefined): string => {
    if (!isoString) return '';
    try {
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return '';
        const pad = (num: number) => String(num).padStart(2, '0');
        // Format for datetime-local input, which wants "YYYY-MM-DDTHH:mm"
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (e) {
        return '';
    }
};

export const ClientDetail: React.FC<ClientDetailProps> = ({ client, onBack, updateClient, deleteClient }) => {
    const [editedClient, setEditedClient] = useState<Client>(() => JSON.parse(JSON.stringify(client)));
    const [isSaving, setIsSaving] = useState(false);
    const [observation, setObservation] = useState('');
    const [isLogCallModalOpen, setIsLogCallModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        setEditedClient(JSON.parse(JSON.stringify(client)));
    }, [client]);

    const statusInfo = getStatusInfo(editedClient.status);
    const followUpDateForInput = getLocalDateTimePickerString(editedClient.followUpDate);

    const sortedTimeline = useMemo(() => {
        return [...(editedClient.timeline || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [editedClient.timeline]);

    const addLocalTimelineEvent = useCallback((event: Omit<TimelineEvent, 'id' | 'date'>) => {
        const newEvent: TimelineEvent = {
            ...event,
            id: `${new Date().toISOString()}-tl-event-${Math.random()}`,
            date: new Date().toISOString(),
        };
        setEditedClient(prev => ({ ...prev, timeline: [newEvent, ...(prev.timeline || [])] }));
    }, []);

    const formatWhatsAppPhone = (phone: string): string => {
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length === 8) return `55859${cleanPhone}`;
        if (cleanPhone.startsWith('55')) {
            const phoneWithoutCC = cleanPhone.substring(2);
            if (phoneWithoutCC.length === 10) {
                 const ddd = phoneWithoutCC.substring(0, 2);
                 const number = phoneWithoutCC.substring(2);
                 return `55${ddd}9${number}`;
            }
            return cleanPhone;
        }
        if (cleanPhone.length === 11) return `55${cleanPhone}`;
        if (cleanPhone.length === 10) {
            const ddd = cleanPhone.substring(0, 2);
            const number = cleanPhone.substring(2);
            return `55${ddd}9${number}`;
        }
        return `55${cleanPhone}`;
    };

    const whatsAppPhone = formatWhatsAppPhone(editedClient.phone);

    const handleSaveNote = () => {
        if (!observation.trim()) return;
        addLocalTimelineEvent({ type: TimelineEventType.Anotacao, content: observation });
        setObservation('');
    };

    const handleStatusChange = (newStatus: Status) => {
        if (editedClient.status === newStatus) return;
        if (newStatus === Status.PrimeiroAtendimento && editedClient.timeline.length > 1) return;

        const oldStatusLabel = getStatusInfo(editedClient.status).label;
        const newStatusLabel = STATUS_OPTIONS.find(s => s.value === newStatus)?.label || newStatus;
        
        setEditedClient(prev => {
            const newEvent: TimelineEvent = {
                id: `${new Date().toISOString()}-tl-event-${Math.random()}`,
                type: TimelineEventType.StatusChange,
                content: `Status alterado de '${oldStatusLabel}' para '${newStatusLabel}'`,
                date: new Date().toISOString(),
                meta: { from: prev.status, to: newStatus }
            };
            return {
                ...prev,
                status: newStatus,
                timeline: [newEvent, ...(prev.timeline || [])]
            };
        });
    };
    
    const handleFollowUpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const localDateString = e.target.value;
        if (!localDateString) {
            setEditedClient(prev => ({...prev, followUpDate: undefined}));
            return;
        }
        const date = new Date(localDateString);
        if (!isNaN(date.getTime())) {
            setEditedClient(prev => ({...prev, followUpDate: date.toISOString()}));
        }
    };
    
    const handleFollowUpSave = () => {
        const currentFollowUp = client.followUpDate;
        const newFollowUp = editedClient.followUpDate;

        if (currentFollowUp === newFollowUp) return;

        if (!newFollowUp) {
            addLocalTimelineEvent({ type: TimelineEventType.FollowUp, content: `Follow-up removido.` });
        } else {
            const formattedDate = new Date(newFollowUp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            addLocalTimelineEvent({ type: TimelineEventType.FollowUp, content: `Follow-up agendado para ${formattedDate}` });
        }
        // State is already updated via handleFollowUpChange, this just adds the timeline event
    };

    const handleLogCall = (result: 'CE' | 'CNE', observationText: string) => {
        let content = `Ligação realizada: ${result}`;
        if (observationText) content += ` - ${observationText}`;
        addLocalTimelineEvent({ type: TimelineEventType.Ligacao, content });
    };
    
    const handleSaveTimelineEvent = (eventId: string, updatedData: Partial<Omit<TimelineEvent, 'id'>>) => {
        setEditedClient(prev => ({
            ...prev,
            timeline: prev.timeline.map(event => (event.id === eventId) ? { ...event, ...updatedData } : event)
        }));
        setEditingEvent(null);
    };

    const handleSaveClientDetails = (updatedData: Partial<Client>) => {
        setEditedClient(prev => ({ ...prev, ...updatedData }));
        addLocalTimelineEvent({ type: TimelineEventType.Anotacao, content: "Dados do cliente atualizados." });
        setIsEditModalOpen(false);
    };

    const handleTogglePendency = () => {
        const newPendingState = !editedClient.isPending;
        setEditedClient(prev => ({...prev, isPending: newPendingState}));
        addLocalTimelineEvent({ type: TimelineEventType.Anotacao, content: newPendingState ? 'Pendência adicionada.' : 'Pendência resolvida.' });
    };

    const handleArchive = () => {
        handleStatusChange(Status.Arquivado);
    };

    const handlePermanentDelete = async () => {
        const confirmation = window.confirm(
            'Você tem certeza que deseja deletar este cliente permanentemente? Esta ação não pode ser desfeita.'
        );
        if (confirmation) {
            setIsSaving(true);
            const success = await deleteClient(client._id!);
            if (success) {
                onBack();
            } else {
                setIsSaving(false);
            }
        }
    };

    const handleBack = async () => {
        const hasChanges = JSON.stringify(client) !== JSON.stringify(editedClient);
        if (hasChanges) {
            setIsSaving(true);
            try {
                await updateClient(client._id!, editedClient);
                onBack();
            } catch (error) {
                console.error("Failed to save changes:", error);
                alert("Falha ao salvar as alterações. Por favor, tente novamente.");
                setIsSaving(false);
            }
        } else {
            onBack();
        }
    };

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
                <header>
                    <button onClick={handleBack} className="flex items-center text-sm text-apple-blue font-semibold mb-6" disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Icon name="save" className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                            </>
                        ) : (
                            <>
                                <Icon name="arrow-left" className="w-4 h-4 mr-2" /> Voltar ao Painel
                            </>
                        )}
                    </button>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                {editedClient.isPending && <Icon name="alert-triangle" className="w-7 h-7 text-apple-orange flex-shrink-0" title="Cliente com pendência"/>}
                                <h1 className="text-4xl font-bold tracking-tight text-system-label-primary">{editedClient.name}</h1>
                                <button onClick={() => setIsEditModalOpen(true)} className="text-system-label-secondary hover:text-apple-blue p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-apple-blue focus:ring-offset-2 dark:focus:ring-offset-system-bg-secondary" aria-label="Editar cliente">
                                    <Icon name="edit-3" className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="mt-3 flex flex-col sm:flex-row sm:flex-wrap sm:gap-x-6 gap-y-1 text-base text-system-label-secondary">
                                 <p>{editedClient.email}</p>
                                 <p>{editedClient.phone}</p>
                                 <p>Origem: {editedClient.origin}</p>
                            </div>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.className} flex-shrink-0`}>{statusInfo.label}</span>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card>
                            <h2 className="text-lg font-semibold text-system-label-primary mb-4">Adicionar Interação</h2>
                            <div className="space-y-4">
                                <div>
                                    <textarea value={observation} onChange={(e) => setObservation(e.target.value)} rows={3} placeholder="Digite aqui para registrar uma interação..." className={inputClasses}></textarea>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Button onClick={handleSaveNote} variant="secondary"><Icon name="save" className="w-4 h-4 mr-2" />Salvar Anotação</Button>
                                        <a href={`https://wa.me/${whatsAppPhone}`} target="_blank" rel="noopener noreferrer" onClick={() => addLocalTimelineEvent({ type: TimelineEventType.WhatsApp, content: 'Iniciado contato via WhatsApp.' })} className={secondaryButtonLinkClasses}>
                                            <Icon name="whatsapp" className="w-4 h-4 mr-2" />WhatsApp
                                        </a>
                                        <a href={`tel:${editedClient.phone.replace(/\D/g, '')}`} className={secondaryButtonLinkClasses}>
                                            <Icon name="phone" className="w-4 h-4 mr-2" />Ligar
                                        </a>
                                        <Button onClick={() => setIsLogCallModalOpen(true)} variant="secondary"><Icon name="phone" className="w-4 h-4 mr-2" />Registrar Ligação</Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card>
                            <h2 className="text-lg font-semibold text-system-label-primary mb-4">Linha do Tempo</h2>
                             <ul role="list" className="-mb-8">
                                {sortedTimeline.length > 0 ?
                                    sortedTimeline.map((event, index) => <TimelineItem key={event.id} event={event} onEdit={setEditingEvent} isLast={index === sortedTimeline.length - 1} />) :
                                    <p className="text-sm text-system-label-secondary">Nenhum evento na linha do tempo.</p>
                                }
                            </ul>
                        </Card>
                    </div>
                    <div className="lg:col-span-1 space-y-8">
                         <Card>
                            <h2 className="text-lg font-semibold text-system-label-primary mb-4">Ações</h2>
                            <div className="space-y-6">
                               <div>
                                    <label className="text-sm font-medium text-system-label-secondary">Mudar Status</label>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {STATUS_OPTIONS.map(opt => {
                                            const hasInteracted = editedClient.timeline.length > 1;
                                            const isDisabled = opt.value === Status.PrimeiroAtendimento && hasInteracted;
                                            return (
                                                <button key={opt.value} 
                                                    onClick={() => handleStatusChange(opt.value)}
                                                    disabled={isDisabled}
                                                    className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all border
                                                        ${editedClient.status === opt.value ? `${opt.className} border-transparent ring-2 ring-offset-2 ring-apple-blue dark:ring-offset-system-bg-primary`
                                                            : 'bg-system-bg-primary border-system-separator text-system-label-primary hover:bg-system-fill-primary'
                                                        }
                                                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`
                                                    }
                                                >{opt.label}</button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <Button onClick={handleTogglePendency} variant="secondary"
                                        className={`w-full ${editedClient.isPending ? 'text-apple-orange ring-1 ring-apple-orange' : ''}`}
                                    ><Icon name="alert-triangle" className="w-4 h-4 mr-2" />{editedClient.isPending ? 'Resolver Pendência' : 'Marcar Pendência'}</Button>
                                </div>
                                 <div>
                                    <label htmlFor="follow-up-date" className="text-sm font-medium text-system-label-secondary">Agendar Follow-up</label>
                                    <input id="follow-up-date" type="datetime-local" value={followUpDateForInput} onChange={handleFollowUpChange} className={`mt-1 ${inputClasses}`} />
                                    <Button onClick={handleFollowUpSave} variant="secondary" className="mt-2 w-full">
                                        <Icon name="calendar" className="w-4 h-4 mr-2"/>
                                        Agendar Follow-up
                                    </Button>
                                </div>
                            </div>
                             <div className="border-t border-system-separator mt-6 pt-4">
                                {editedClient.status === Status.Arquivado ? (
                                    <Button
                                        onClick={handlePermanentDelete}
                                        disabled={isSaving}
                                        variant="ghost"
                                        className="w-full !text-apple-red hover:!bg-apple-red/10 active:!bg-apple-red/20"
                                    >
                                        <Icon name="trash-2" className="w-4 h-4 mr-2" />
                                        Deletar Permanentemente
                                    </Button>
                                ) : (
                                    <Button onClick={handleArchive} variant="secondary" className="w-full">
                                        <Icon name="archive" className="w-4 h-4 mr-2" />
                                        Arquivar Cliente
                                    </Button>
                                )}
                            </div>
                        </Card>
                        <Card>
                            <h2 className="text-lg font-semibold text-system-label-primary mb-4">Informações Adicionais</h2>
                            {editedClient.customFields && editedClient.customFields.length > 0 ? (
                                <dl className="space-y-4">
                                    {editedClient.customFields.map((field, index) => (
                                        <div key={index} className="text-sm">
                                            <dt className="text-system-label-secondary font-medium">{field.name}:</dt>
                                            <dd className="mt-0.5 text-system-label-primary break-words">{field.value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            ) : (<p className="text-sm text-system-label-secondary">Nenhum campo personalizado.</p>)}
                        </Card>
                    </div>
                </div>
            </div>
            {isEditModalOpen && (<EditClientModal client={editedClient} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveClientDetails} />)}
            {isLogCallModalOpen && (<LogCallModal onClose={() => setIsLogCallModalOpen(false)} onLogCall={handleLogCall} />)}
            {editingEvent && (<EditTimelineEventModal event={editingEvent} onClose={() => setEditingEvent(null)} onSave={handleSaveTimelineEvent} />)}
        </>
    );
};