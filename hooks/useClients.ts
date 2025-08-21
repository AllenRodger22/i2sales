import { useState, useEffect, useCallback } from 'react';
import type { Client, TimelineEvent } from '../types';
import { Status, TimelineEventType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
    apiGetClients, 
    apiCreateClient, 
    apiUpdateClient, 
    apiDeleteClient,
    apiUploadClients
} from '../services/api';


const sanitizeText = (text: string | undefined): string => {
    if (!text) return '';
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[´`~^]/g, '');
};

export const useClients = () => {
    const { isAuthenticated } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchClients = useCallback(async () => {
        if (!isAuthenticated) return;
        setIsLoading(true);
        try {
            const serverClients = await apiGetClients();
            setClients(serverClients);
        } catch (error) {
            console.error("Failed to fetch clients from server", error);
            // Optionally, handle logout on 401/403 errors
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);
    
    const addClient = useCallback(async (clientData: Omit<Client, 'id' | 'createdAt' | 'status' | 'timeline'>) => {
        const newClientData = {
            ...clientData,
            name: sanitizeText(clientData.name),
            email: sanitizeText(clientData.email),
            origin: sanitizeText(clientData.origin),
            customFields: clientData.customFields?.map(cf => ({ name: sanitizeText(cf.name), value: sanitizeText(cf.value) })),
            status: Status.PrimeiroAtendimento,
            isPending: false,
            timeline: [{
                id: `${new Date().toISOString()}-tl1`,
                type: TimelineEventType.Observacao,
                content: 'Cliente cadastrado.',
                date: new Date().toISOString(),
            }],
        };
        await apiCreateClient(newClientData);
        await fetchClients(); // Refetch to get the new client with its server-generated ID
    }, [fetchClients]);
    
    const importClients = useCallback(async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        await apiUploadClients(formData);
        await fetchClients();
    }, [fetchClients]);

    const findClientById = useCallback((id: string) => {
        // Now finds by `_id` which is the unique database identifier
        return clients.find(client => client._id === id);
    }, [clients]);

    const updateClient = useCallback(async (id: string, data: Partial<Client>) => {
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
        
        await apiUpdateClient(id, sanitizedData);
        // Optimistic update for faster UI response
        setClients(prevClients => prevClients.map(client =>
            client._id === id ? { ...client, ...sanitizedData } : client
        ));
        // Optional: refetch for consistency, but optimistic is faster
        // await fetchClients();
    }, [fetchClients]);

    const addTimelineEvent = useCallback(async (clientId: string, event: Omit<TimelineEvent, 'id' | 'date'>) => {
        const client = clients.find(c => c._id === clientId);
        if (!client) return;
        
        const newEvent: TimelineEvent = {
            ...event,
            id: `${new Date().toISOString()}-tl-event-${Math.random()}`,
            date: new Date().toISOString(),
        };

        const updatedTimeline = [newEvent, ...(client.timeline || [])];
        await updateClient(clientId, { timeline: updatedTimeline });

    }, [clients, updateClient]);

    const updateTimelineEvent = useCallback(async (clientId: string, eventId: string, updatedData: Partial<Omit<TimelineEvent, 'id'>>) => {
        const client = clients.find(c => c._id === clientId);
        if (!client) return;

        const newTimeline = client.timeline.map(event => {
            if (event.id === eventId) {
                return { ...event, ...updatedData };
            }
            return event;
        });
        await updateClient(clientId, { timeline: newTimeline });
    }, [clients, updateClient]);

    const deleteClient = useCallback(async (id: string): Promise<boolean> => {
        if (window.confirm('Tem certeza que deseja deletar este cliente? Esta ação é irreversível.')) {
            await apiDeleteClient(id);
            setClients(prevClients => prevClients.filter(client => client._id !== id));
            return true;
        }
        return false;
    }, []);


    return { clients, isLoading, addClient, findClientById, updateClient, addTimelineEvent, importClients, deleteClient, updateTimelineEvent };
};
