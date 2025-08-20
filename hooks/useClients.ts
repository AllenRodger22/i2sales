

import { useState, useEffect, useCallback } from 'react';
import type { Client, TimelineEvent } from '../types';
import { Status, TimelineEventType } from '../types';

const CLIENTS_STORAGE_KEY = 'crmClients_v5';

const sanitizeText = (text: string | undefined): string => {
    if (!text) return '';
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[´`~^]/g, '');
};

export const useClients = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const storedClients = localStorage.getItem(CLIENTS_STORAGE_KEY);
            if (storedClients) {
                setClients(JSON.parse(storedClients));
            } else {
                setClients([]);
            }
        } catch (error) {
            console.error("Failed to load clients from localStorage", error);
            setClients([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveClients = useCallback((updater: (clients: Client[]) => Client[]) => {
        setClients(prevClients => {
            const updatedClients = updater(prevClients);
            try {
                localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(updatedClients));
            } catch (error) {
                console.error("Failed to save clients to localStorage", error);
            }
            return updatedClients;
        });
    }, []);

    const addClient = useCallback((clientData: Omit<Client, 'id' | 'createdAt' | 'status' | 'timeline'>) => {
        const newClient: Client = {
            ...clientData,
            name: sanitizeText(clientData.name),
            email: sanitizeText(clientData.email),
            origin: sanitizeText(clientData.origin),
            customFields: clientData.customFields?.map(cf => ({ name: sanitizeText(cf.name), value: sanitizeText(cf.value) })),
            id: `${new Date().toISOString()}-${Math.random().toString(36).substring(2, 9)}`,
            createdAt: new Date().toISOString(),
            status: Status.PrimeiroAtendimento,
            isPending: false,
            timeline: [{
                id: `${new Date().toISOString()}-tl1`,
                type: TimelineEventType.Observacao,
                content: 'Cliente cadastrado.',
                date: new Date().toISOString(),
            }],
        };
        saveClients(prevClients => [...prevClients, newClient]);
    }, [saveClients]);
    
    const addMultipleClients = useCallback((clientsData: Array<Partial<Client> & {name: string, phone: string}>) => {
        const newClients: Client[] = clientsData.map(clientData => {
            // Start with the timeline from the imported data, or an empty array.
            let timeline: TimelineEvent[] = Array.isArray(clientData.timeline) ? [...clientData.timeline] : [];

            // The export already contains a "cadastrado via importação" event.
            // This logic ensures it's added if importing from a source without it.
            const hasImportEvent = timeline.some(e => e.content.includes('cadastrado via importação'));
            if (!hasImportEvent) {
                const creationDate = clientData.createdAt ? new Date(clientData.createdAt) : new Date();
                const importEvent: TimelineEvent = {
                    id: `${creationDate.toISOString()}-tl-import`,
                    type: TimelineEventType.Observacao,
                    content: 'Cliente cadastrado via importação.',
                    date: creationDate.toISOString(),
                };
                // Add it to the array. ClientDetail will sort it by date.
                timeline.push(importEvent);
            }

            if (clientData.followUpDate) {
                 // To avoid duplicates, only add a follow-up event if one doesn't already exist from the import (e.g., from Anexos JSON)
                const hasExistingFollowUp = timeline.some(e => e.type === TimelineEventType.FollowUp);
                if (!hasExistingFollowUp) {
                    try {
                        const date = new Date(clientData.followUpDate);
                        const formattedDate = date.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            timeZone: 'UTC'
                        });

                        const followUpEvent: TimelineEvent = {
                            id: `${new Date().toISOString()}-tl-followup-import`,
                            type: TimelineEventType.FollowUp,
                            content: `Follow-up agendado para ${formattedDate}`,
                            date: new Date().toISOString(), // The event is created now
                        };
                        timeline.push(followUpEvent);
                    } catch(e) {
                        console.error("Could not create follow up timeline event from date", clientData.followUpDate);
                    }
                }
            }
            
            // Re-use createdAt from import if available.
            const createdAt = clientData.createdAt ? new Date(clientData.createdAt).toISOString() : new Date().toISOString();

            return {
                id: clientData.id || `${new Date().toISOString()}-${Math.random().toString(36).substring(2, 9)}`,
                createdAt: createdAt,
                name: sanitizeText(clientData.name),
                phone: clientData.phone,
                email: sanitizeText(clientData.email) || '',
                origin: sanitizeText(clientData.origin) || '',
                status: clientData.status || Status.PrimeiroAtendimento,
                isPending: clientData.isPending || false,
                followUpDate: clientData.followUpDate,
                timeline: timeline,
                customFields: clientData.customFields?.map(cf => ({ name: sanitizeText(cf.name), value: sanitizeText(cf.value) })) || [],
            };
        });
        saveClients(prevClients => [...prevClients, ...newClients]);
    }, [saveClients]);

    const findClientById = useCallback((id: string) => {
        return clients.find(client => client.id === id);
    }, [clients]);

    const updateClient = useCallback((id: string, data: Partial<Client>) => {
        const sanitizedData = { ...data };
        if (sanitizedData.name) sanitizedData.name = sanitizeText(sanitizedData.name);
        if (sanitizedData.email) sanitizedData.email = sanitizeText(sanitizedData.email);
        if (sanitizedData.origin) sanitizedData.origin = sanitizeText(sanitizedData.origin);
        if (sanitizedData.customFields) {
            sanitizedData.customFields = sanitizedData.customFields.map(cf => ({
                name: sanitizeText(cf.name),
                value: sanitizeText(cf.value)
            }));
        }
        
        saveClients(prevClients => prevClients.map(client =>
            client.id === id ? { ...client, ...sanitizedData } : client
        ));
    }, [saveClients]);

    const addTimelineEvent = useCallback((clientId: string, event: Omit<TimelineEvent, 'id' | 'date'>) => {
        const newEvent: TimelineEvent = {
            ...event,
            id: `${new Date().toISOString()}-tl-event`,
            date: new Date().toISOString(),
        };
        saveClients(prevClients => prevClients.map(client => {
            if (client.id === clientId) {
                const newTimeline = [newEvent, ...(client.timeline || [])];
                let newStatus = client.status;

                const interactionTypes: TimelineEventType[] = [
                    TimelineEventType.Anotacao,
                    TimelineEventType.WhatsApp,
                    TimelineEventType.Ligacao,
                    TimelineEventType.Observacao,
                    TimelineEventType.CNE,
                ];

                if (client.status === Status.PrimeiroAtendimento && interactionTypes.includes(newEvent.type)) {
                    newStatus = Status.FluxoDeCadencia;
                    const statusChangeEvent: TimelineEvent = {
                        id: `${new Date().toISOString()}-tl-status-auto`,
                        type: TimelineEventType.StatusChange,
                        content: `Status alterado de '${Status.PrimeiroAtendimento}' para '${Status.FluxoDeCadencia}' automaticamente após primeira interação.`,
                        date: new Date().toISOString(),
                        meta: { from: client.status, to: newStatus }
                    };
                    newTimeline.unshift(statusChangeEvent);
                }
                
                return { ...client, status: newStatus, timeline: newTimeline };
            }
            return client;
        }));
    }, [saveClients]);

    const updateTimelineEvent = useCallback((clientId: string, eventId: string, updatedData: Partial<Omit<TimelineEvent, 'id'>>) => {
        saveClients(prevClients => prevClients.map(client => {
            if (client.id === clientId) {
                const newTimeline = client.timeline.map(event => {
                    if (event.id === eventId) {
                        return { ...event, ...updatedData };
                    }
                    return event;
                });
                return { ...client, timeline: newTimeline };
            }
            return client;
        }));
    }, [saveClients]);

    const deleteClient = useCallback((id: string): boolean => {
        if (window.confirm('Tem certeza que deseja deletar este cliente? Esta ação é irreversível.')) {
            saveClients(prevClients => prevClients.filter(client => client.id !== id));
            return true;
        }
        return false;
    }, [saveClients]);


    return { clients, isLoading, addClient, findClientById, updateClient, addTimelineEvent, addMultipleClients, deleteClient, updateTimelineEvent };
};