import { useState, useEffect, useCallback } from 'react';
import type { Client, TimelineEvent } from '../types';
import { Status, TimelineEventType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
    apiGetClients, 
    apiCreateClient, 
    apiUpdateClient, 
    apiDeleteClient,
    apiDeleteAllClients,
    apiArchiveLead,
} from '../services/api';


const sanitizeText = (text: string | undefined): string => {
    if (!text) return '';
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[´`~^]/g, '');
};

const parsePtBrDate = (dateString?: string): string | undefined => {
    if (!dateString) return undefined;
    const parts = dateString.match(/(\d{2})\/(\d{2})\/(\d{4}),? (\d{2}):(\d{2}):(\d{2})/);
    if (!parts) {
         // Try ISO format as a fallback
        const isoDate = new Date(dateString);
        if (!isNaN(isoDate.getTime())) return isoDate.toISOString();
        return undefined;
    }
    const [, day, month, year, hour, minute, second] = parts;
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).toISOString();
};


const parseAnexos = (anexosString?: string): { customFields: any[]; timeline: any[]; automatedFollowUps: any[] } => {
    const defaults = { customFields: [], timeline: [], automatedFollowUps: [] };
    if (!anexosString || anexosString.trim() === '{}' || anexosString.trim() === '') {
        return defaults;
    }
    try {
        let cleanString = anexosString.trim();
        if (cleanString.startsWith('"') && cleanString.endsWith('"')) {
            cleanString = cleanString.substring(1, cleanString.length - 1);
        }
        const unescapedString = cleanString.replace(/""/g, '"');
        const parsed = JSON.parse(unescapedString);
        return {
            customFields: parsed.customFields || [],
            timeline: parsed.timeline || [],
            automatedFollowUps: parsed.automatedFollowUps || [],
        };
    } catch (e) {
        console.error('Failed to parse anexos JSON:', anexosString, e);
        return defaults;
    }
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
                type: TimelineEventType.Observacao,
                content: 'Cliente cadastrado.',
                date: new Date().toISOString(),
            }],
        };
        await apiCreateClient(newClientData);
        await fetchClients();
    }, [fetchClients]);
    
    const importClients = useCallback(async (
        clientsToImport: Array<Record<string, string>>, 
        mapping: Record<string, string>,
        onProgress: (progress: { current: number; total: number; duplicates: number; imported: number; failures: number }) => void
    ): Promise<{ imported: number; duplicates: number; failures: number }> => {
        const total = clientsToImport.length;
        let imported = 0;
        let duplicates = 0;
        let failures = 0;

        const existingClientsLookup = new Set(
            clients.map(c => `${c.name.trim().toLowerCase()}|${c.phone.replace(/\D/g, '')}`)
        );

        for (let i = 0; i < total; i++) {
            const row = clientsToImport[i];
            const name = sanitizeText(row[mapping.name] || '');
            const phone = (row[mapping.phone] || '').replace(/\D/g, '');

            const duplicateKey = `${name.trim().toLowerCase()}|${phone}`;
            if (!name || !phone) {
                failures++;
            } else if (existingClientsLookup.has(duplicateKey)) {
                duplicates++;
            } else {
                try {
                    const anexos = parseAnexos(row[mapping.anexos]);

                    const saleValueRaw = row[mapping.saleValue];
                    const saleValue = saleValueRaw ? parseFloat(saleValueRaw.replace(/[^0-9,-]/g, '').replace(',', '.')) : undefined;

                    const clientDataForApi = {
                        name,
                        phone: row[mapping.phone] || '',
                        email: sanitizeText(row[mapping.email] || ''),
                        origin: sanitizeText(row[mapping.origin] || 'Importado'),
                        status: (row[mapping.status] as Status) || Status.PrimeiroAtendimento,
                        followUpDate: parsePtBrDate(row[mapping.followUpDate]),
                        saleValue: saleValue && !isNaN(saleValue) ? saleValue : undefined,
                        timeline: anexos.timeline,
                        customFields: anexos.customFields,
                        automatedFollowUps: anexos.automatedFollowUps,
                        isPending: false,
                    };

                    await apiCreateClient(clientDataForApi);
                    imported++;
                    existingClientsLookup.add(duplicateKey);
                } catch (e) {
                    console.error("Failed to import client row:", row, e);
                    failures++;
                }
            }
            onProgress({ current: i + 1, total, duplicates, imported, failures });
        }

        await fetchClients();
        return { imported, duplicates, failures };

    }, [clients, fetchClients]);

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
        await fetchClients(); // Re-fetch all clients to ensure UI consistency with DB
    }, [fetchClients]);

    const deleteClient = useCallback(async (id: string): Promise<boolean> => {
        const originalClients = [...clients];
        const clientToDelete = clients.find(c => c._id === id);
        
        if (!clientToDelete) return false;

        // Optimistic update: remove client from UI immediately
        setClients(prevClients => prevClients.filter(client => client._id !== id));

        try {
            await apiDeleteClient(id);
            return true;
        } catch (error) {
            console.error("Failed to delete client:", error);
            alert(`Não foi possível deletar o cliente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            // Rollback UI change on failure
            setClients(originalClients);
            return false;
        }
    }, [clients]);
    
    const deleteAllClients = useCallback(async () => {
        try {
            const response = await apiDeleteAllClients();
            await fetchClients();
            if (response && response.message) {
                alert(response.message);
            }
        } catch (error) {
             console.error("Failed to delete all clients:", error);
            alert(`Não foi possível deletar todos os clientes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    }, [fetchClients]);

    const archiveClient = async (clientId: string) => {
        try {
            await apiArchiveLead(clientId);
            await fetchClients();
        } catch (error) {
            console.error('Erro ao arquivar cliente:', error);
            throw error;
        }
    };

    return { clients, isLoading, addClient, findClientById, updateClient, importClients, deleteClient, deleteAllClients, archiveClient };
};
