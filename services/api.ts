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
    timeline: (apiClient.anexos?.timeline || []).map(mapApiTimelineEventToFrontend),
    customFields: apiClient.anexos?.customFields || [],
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

    // The 'anexos' field is always sent, even if empty
    apiClient.anexos = {
        customFields: client.customFields || [],
        timeline: (client.timeline || []).map(mapFrontendTimelineEventToApi),
    };

    return apiClient;
};

// --- API FETCH WRAPPER ---

const apiRequest = async (endpoint: string, method: string, body?: any, isFormData = false) => {
    const headers: HeadersInit = {};
    const token = getToken();
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
        method,
        headers,
    };
    
    if (body) {
        config.body = isFormData ? body : JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    // For 204 No Content response
    if (response.status === 204) {
        return null;
    }

    return response.json();
};

// --- AUTH ENDPOINTS ---
export const apiRegister = (data: any) => apiRequest('/api/auth/register', 'POST', data);
export const apiLogin = (data: any) => apiRequest('/api/auth/login', 'POST', data);


// --- CLIENT ENDPOINTS ---
export const apiGetClients = async (): Promise<Client[]> => {
    const data = await apiRequest('/api/clientes', 'GET');
    return data.map(mapApiToClient);
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

export const apiUploadClients = (formData: FormData) => {
    return apiRequest('/api/clientes/upload', 'POST', formData, true);
};
