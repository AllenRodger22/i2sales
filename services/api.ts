import type { Client, TimelineEvent } from '../types';
import { TimelineEventType, Status } from '../types';

const API_BASE_URL = 'https://i2sales-backend.onrender.com';

const getToken = () => localStorage.getItem('authToken');

// --- DATA MAPPING FUNCTIONS ---

// Maps API timeline event structure to frontend structure
const mapApiTimelineEventToFrontend = (apiEvent: any): TimelineEvent => ({
    id: apiEvent.id,
    type: apiEvent.tipo as TimelineEventType,
    content: apiEvent.descricao,
    date: apiEvent.data,
    meta: apiEvent.meta,
});

// Maps frontend timeline event structure to API structure
const mapFrontendTimelineEventToApi = (feEvent: TimelineEvent): any => ({
    id: feEvent.id,
    tipo: feEvent.type,
    descricao: feEvent.content,
    data: feEvent.date,
    meta: feEvent.meta,
});


// Maps the full API client object to the frontend Client type
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
    saleValue: apiClient.valor_venda,
    timeline: (apiClient.anexos?.timeline || []).map(mapApiTimelineEventToFrontend),
    customFields: apiClient.anexos?.customFields || [],
    automatedFollowUps: apiClient.anexos?.automatedFollowUps || [],
});

// Maps the frontend Client type to the structure expected by the API
export const mapClientToApi = (client: Partial<Client>): any => {
    const apiClient: any = {};
    if (client.name !== undefined) apiClient.nome = client.name;
    if (client.phone !== undefined) apiClient.telefone = client.phone;
    if (client.email !== undefined) apiClient.email = client.email;
    if (client.origin !== undefined) apiClient.origem = client.origin;
    if (client.status !== undefined) apiClient.status = client.status;
    if (client.isPending !== undefined) apiClient.isPending = client.isPending;
    if (client.followUpDate !== undefined) apiClient.data_followup = client.followUpDate;
    if (client.saleValue !== undefined) apiClient.valor_venda = client.saleValue;

    // The 'anexos' field is always sent, even if empty
    apiClient.anexos = {
        customFields: client.customFields || [],
        timeline: (client.timeline || []).map(mapFrontendTimelineEventToApi),
        automatedFollowUps: client.automatedFollowUps || [],
    };

    return apiClient;
};

// --- API FETCH WRAPPER ---

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
    // Handle empty responses gracefully, which can happen for GET requests on empty collections.
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


// --- CLIENT ENDPOINTS ---
export const apiGetClients = async (): Promise<Client[]> => {
    const data = await apiRequest('/api/clientes', 'GET');
    // If the server returns an empty body (null), return an empty array.
    if (!data) return [];
    return Array.isArray(data) ? data.map(mapApiToClient) : [];
};

export const apiCreateClient = (clientData: any) => {
    // Backend generates id_cliente, data_cadastro, ownerId
    const apiPayload = {
        nome: clientData.name,
        telefone: clientData.phone,
        email: clientData.email,
        origem: clientData.origin,
        status: clientData.status,
        isPending: clientData.isPending,
        data_followup: clientData.followUpDate,
        valor_venda: clientData.saleValue,
        anexos: {
            customFields: clientData.customFields || [],
            timeline: (clientData.timeline || []).map(mapFrontendTimelineEventToApi),
            automatedFollowUps: clientData.automatedFollowUps || [],
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