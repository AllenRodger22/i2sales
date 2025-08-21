// services/api.ts

import type { Client, TimelineEvent } from '../types';
import { TimelineEventType, Status } from '../types';

// A URL base do seu backend, que já está correta.
const API_BASE_URL = 'https://i2sales-backend.onrender.com';

const getToken = () => localStorage.getItem('authToken');

// --- DATA MAPPING FUNCTIONS ---
// (Todo o seu código de mapeamento permanece exatamente o mesmo)
const mapApiTimelineEventToFrontend = (apiEvent: any): TimelineEvent => ({
    id: apiEvent.id,
    type: apiEvent.tipo as TimelineEventType,
    content: apiEvent.descricao,
    date: apiEvent.data,
    meta: apiEvent.meta,
});

const mapFrontendTimelineEventToApi = (feEvent: TimelineEvent): any => ({
    id: feEvent.id,
    tipo: feEvent.type,
    descricao: feEvent.content,
    data: feEvent.date,
    meta: feEvent.meta,
});

export const mapApiToClient = (apiClient: any): Client => ({
    _id: apiClient._id,
    id: apiClient.id_cliente,
    name: apiClient.nome,
    phone: apiClient.telefone,
    email: apiClient.email,
    origin: apiClient.origem,
    status: apiClient.status as Status,
    createdAt: apiClient.data_cadastro,
    isPending: apiClient.isPending || false,
    followUpDate: apiClient.data_followup,
    timeline: (apiClient.anexos?.timeline || []).map(mapApiTimelineEventToFrontend),
    customFields: apiClient.anexos?.customFields || [],
});

export const mapClientToApi = (client: Partial<Client>): any => {
    const apiClient: any = {};
    if (client.name !== undefined) apiClient.nome = client.name;
    if (client.phone !== undefined) apiClient.telefone = client.phone;
    if (client.email !== undefined) apiClient.email = client.email;
    if (client.origin !== undefined) apiClient.origem = client.origin;
    if (client.status !== undefined) apiClient.status = client.status;
    if (client.isPending !== undefined) apiClient.isPending = client.isPending;
    if (client.followUpDate !== undefined) apiClient.data_followup = client.followUpDate;

    apiClient.anexos = {
        customFields: client.customFields || [],
        timeline: (client.timeline || []).map(mapFrontendTimelineEventToApi),
    };

    return apiClient;
};


// --- API FETCH WRAPPER ---
// (Sua função apiRequest permanece exatamente a mesma)
const apiRequest = async (endpoint: string, method: string, body?: any) => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const token = getToken();
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

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
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();
    if (!responseText) {
        return null;
    }

    try {
        return JSON.parse(responseText);
    } catch (error) {
        console.error("Failed to parse JSON from response:", responseText);
        throw new Error("Received an invalid response from the server.");
    }
};

// --- AUTH ENDPOINTS ---
export const apiRegister = (data: any) => apiRequest('/api/auth/register', 'POST', data);
export const apiLogin = (data: any) => apiRequest('/api/auth/login', 'POST', data);

// ==================================================================
// ===================  NOVA FUNÇÃO ADICIONADA AQUI ===================
// ==================================================================

/**
 * Envia o token do Google para o backend para validação e login/registro.
 * @param googleToken O token ID recebido do pop-up de login do Google.
 * @returns A resposta do backend, que deve incluir o token de sessão da sua aplicação.
 */
export const apiLoginWithGoogle = (googleToken: string) => {
    return apiRequest('/api/auth/google', 'POST', { token: googleToken });
};


// --- CLIENT ENDPOINTS ---
// (Todos os seus endpoints de cliente permanecem exatamente os mesmos)
export const apiGetClients = async (): Promise<Client[]> => {
    const data = await apiRequest('/api/clientes', 'GET');
    if (!data) return [];
    return Array.isArray(data) ? data.map(mapApiToClient) : [];
};

export const apiCreateClient = (clientData: any) => {
    const apiPayload = {
        nome: clientData.name,
        telefone: clientData.phone,
        email: clientData.email,
        origem: clientData.origin,
        status: clientData.status,
        isPending: clientData.isPending,
        data_followup: clientData.followUpDate,
        anexos: {
            customFields: clientData.customFields || [],
            timeline: (clientData.timeline || []).map(mapFrontendTimelineEventToApi)
        }
    };
    return apiRequest('/api/clientes', 'POST', apiPayload);
};

export const apiUpdateClient = (clientId: string, clientData: Partial<Client>) => {
    const apiPayload = mapClientToApi(clientData);
    return apiRequest(`/api/clientes/${clientId}`, 'PUT', apiPayload);
};

export const apiDeleteClient = (clientId: string) => apiRequest(`/api/clientes/${clientId}`, 'DELETE');

export const apiDeleteAllClients = () => apiRequest(`/api/clientes/bulk-delete`, 'DELETE');