import type { Client, TimelineEvent } from '../types';
import { TimelineEventType, Status } from '../types';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
 
const getToken = () => localStorage.getItem('authToken');

// --- DATA MAPPING FUNCTIONS ---



// --- API FETCH WRAPPER ---
const apiRequest = async (endpoint: string, method: string, body?: any) => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };

    const config: RequestInit = {
        method,
        headers,
    };
    
    if (body) {
        config.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));


    return apiRequest('/api/clientes', 'POST', apiPayload);
};
export const apiUpdateClient = (clientId: string, clientData: Partial<Client>) => {
    const apiPayload = mapClientToApi(clientData);
    return apiRequest(`/api/clientes/${clientId}`, 'PUT', apiPayload);
};

export const apiDeleteClient = (clientId: string) => apiRequest(`/api/clientes/${clientId}`, 'DELETE');

export const apiDeleteAllClients = () => apiRequest(`/api/clientes/bulk-delete`, 'DELETE');

export const apiGetArchivedLeads = async (): Promise<Client[]> => {
    const data = await apiRequest('/api/clientes/archived', 'GET');

    return apiRequest(`/api/clientes/${leadId}/archive`, 'PATCH');
};
export const apiGetCorretores = async (): Promise<any[]> => {
    try {
        const data = await apiRequest('/api/users/corretores', 'GET');
        if (Array.isArray(data) && data.length > 0) return data;
        const alt = await apiRequest('/api/users/all', 'GET');
        return Array.isArray(alt) ? alt : [];
    } catch {
        try {
            const alt = await apiRequest('/api/users/all', 'GET');
            return Array.isArray(alt) ? alt : [];
        } catch {
            return [];
        }
    }
};
 
export const apiGetKpis = (params: string) => {
    return apiRequest(`/api/bi/kpis?${params}`, 'GET');
};

export const apiGetFunnel = (params: string) => {
    return apiRequest(`/api/bi/funnel?${params}`, 'GET');
};

export const apiGetConversionSeries = (params: string) => {
    return apiRequest(`/api/bi/conversion-series?${params}`, 'GET');
};
