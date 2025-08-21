import { useState, useEffect, useCallback } from 'react';
import type { Client, TimelineEvent } from '../types';
import { Status, TimelineEventType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
    apiGetClients, 
    apiCreateClient, 
    apiUpdateClient, 
    apiDeleteClient
} from '../services/api';


const sanitizeText = (text: string | undefined): string => {
    if (!text) return '';
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[´`~^]/g, '');
};

// Helper function to parse CSV from the old app format
const parseLegacyCsv = (csvText: string): Partial<Client>[] => {
    const lines = csvText.trim().replace(/^\uFEFF/, '').split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const dataRows = lines.slice(1);
    const clients: Partial<Client>[] = [];

    const parseBrDate = (dateStr: string | undefined): string | undefined => {
        if (!dateStr || !dateStr.trim()) return undefined;
        // Format: "19/08/2025, 13:47:46" or "21/08/2025, 09:00:00"
        const parts = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4}),?\s*(\d{2}):(\d{2}):(\d{2})?/);
        if (!parts) {
             try {
                const d = new Date(dateStr);
                if (!isNaN(d.getTime())) return d.toISOString();
            } catch (e) {}
            console.warn("Could not parse date:", dateStr);
            return undefined;
        };
        const [, day, month, year, hour, minute, second] = parts;
        return new Date(`${year}-${month}-${day}T${hour || '00'}:${minute || '00'}:${second || '00'}`).toISOString();
    };


    for (const line of dataRows) {
        if (!line.trim()) continue;

        const values = [];
        let inQuotes = false;
        let field = '';
        let ptr = 0;
        
        while (ptr < line.length) {
            const char = line[ptr];
            if (char === '"') {
                if (inQuotes && line[ptr + 1] === '"') {
                    field += '"';
                    ptr++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(field);
                field = '';
            } else {
                field += char;
            }
            ptr++;
        }
        values.push(field);


        if (values.length !== headers.length) {
            console.warn("Skipping malformed CSV row:", line);
            continue;
        }

        const row = headers.reduce((obj, header, i) => {
            obj[header] = values[i];
            return obj;
        }, {} as Record<string, string>);

        const anexosStr = row['Anexos (JSON)'];
        let timeline: TimelineEvent[] = [];
        let customFields: { name: string, value: string }[] = [];

        if (anexosStr) {
            try {
                const parsedAnexos = JSON.parse(anexosStr.replace(/""/g, '"'));
                timeline = parsedAnexos.timeline || [];
                customFields = parsedAnexos.customFields || [];
            } catch (e) {
                console.error("Error parsing Anexos JSON for row:", row, e);
            }
        }
        
        if (!timeline.some(e => e.content?.includes('importação'))) {
            timeline.unshift({
                id: `${new Date(parseBrDate(row['Data Cadastro']) || Date.now()).toISOString()}-tl-import`,
                type: TimelineEventType.Observacao,
                content: 'Cliente cadastrado via importação.',
                date: new Date(parseBrDate(row['Data Cadastro']) || Date.now()).toISOString()
            });
        }

        const client: Partial<Client> = {
            name: row['Nome'] || 'Nome não informado',
            phone: row['Telefone'] || '',
            email: row['E-mail'] || '',
            origin: row['Origem'] || 'Importado',
            status: (Object.values(Status).find(s => s === row['Status']) || Status.PrimeiroAtendimento) as Status,
            createdAt: parseBrDate(row['Data Cadastro']) || new Date().toISOString(),
            followUpDate: parseBrDate(row['Data Follow-up']),
            timeline,
            customFields,
        };
        clients.push(client);
    }
    return clients;
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
        await fetchClients();
    }, [fetchClients]);
    
    const importClients = useCallback(async (file: File, onProgress?: (progress: { processed: number, total: number }) => void) => {
        const fileContent = await file.text();
        const clientsToImport = parseLegacyCsv(fileContent);
        
        const total = clientsToImport.length;
        let processed = 0;
        
        onProgress?.({ processed, total });
        
        for (const clientData of clientsToImport) {
            try {
                await apiCreateClient({
                    name: clientData.name,
                    phone: clientData.phone,
                    email: clientData.email,
                    origin: clientData.origin,
                    status: clientData.status,
                    isPending: clientData.isPending,
                    followUpDate: clientData.followUpDate,
                    customFields: clientData.customFields,
                    timeline: clientData.timeline,
                });
            } catch(error) {
                 console.error(`Failed to import client ${clientData.name}:`, error);
            } finally {
                processed++;
                onProgress?.({ processed, total });
            }
        }
        
        await fetchClients();
    }, [fetchClients]);


    const findClientById = useCallback((id: string) => {
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
        setClients(prevClients => prevClients.map(client =>
            client._id === id ? { ...client, ...sanitizedData } : client
        ));
    }, []);

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