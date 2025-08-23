export enum Status {
    PrimeiroAtendimento = 'Primeiro Atendimento',
    FluxoDeCadencia = 'Fluxo de Cadência',
    Tratativa = 'Tratativa',
    AguardandoDoc = 'Aguardando Doc',
    DocCompleta = 'Doc Completa',
    EmAnalise = 'Em Análise',
    Aprovado = 'Aprovado',
    Reprovado = 'Reprovado',
    VendaGerada = 'Venda Gerada',
    Arquivado = 'Arquivado',
}

export enum TimelineEventType {
    Observacao = 'Observação', // Contato Efetivo (CE)
    Anotacao = 'Anotação', // Nota sem impacto em KPI
    Ligacao = 'Ligação',
    WhatsApp = 'WhatsApp',
    StatusChange = 'Mudança de Status',
    FollowUp = 'Follow-up Agendado',
    CNE = 'Contato Não Efetivo',
}

export interface TimelineEvent {
    id: string;
    type: TimelineEventType;
    content: string;
    date: string;
    meta?: Record<string, any>;
}

export enum AutomatedFollowUpStatus {
    Pending = 'Pendente',
    Done = 'Feito',
    Missed = 'Não Feito',
    Cancelled = 'Cancelado',
}

export interface AutomatedFollowUp {
    id: string;
    date: string;
    status: AutomatedFollowUpStatus;
}

export interface Client {
    _id?: string; // Database ID from MongoDB
    id: string;
    name: string;
    phone: string;
    email: string;
    origin: string;
    status: Status;
    createdAt: string;
    isPending?: boolean;
    followUpDate?: string;
    saleValue?: number;
    timeline: TimelineEvent[];
    customFields?: { name: string; value: string }[];
    automatedFollowUps?: AutomatedFollowUp[];
    ownerId?: string;
    isArchived?: boolean;
}


// Tipos para o Relatório de Produtividade
export interface DailyProductivity {
    ligacoes: number;
    atendimentos: number; // Contato Efetivo
    tratativas: number;
    documentacao: number;
    cne: number; // Contato Não Efetivo
    vendas: number;
}

export interface ProductivityReportData {
    [date: string]: DailyProductivity; // Key é 'YYYY-MM-DD'
}

// Tipos para o Painel do Corretor (BrokerPanel) / Produtividade Manual
export interface Metric {
    id: 'ligacoes' | 'atendimentos' | 'interessados' | 'documentacoes' | 'vendas';
    label: string;
    value: number;
}

export interface Prospect {
    id: string;
    name: string;
    phone: string;
    origin: string;
}

export interface DayMetrics {
    ligacoes: number;
    atendimentos: number;
    interessados: number;
    documentacoes: number;
    vendas: number;
}

export interface SavedDay {
    date: string; // YYYY-MM-DD
    metrics: DayMetrics;
    prospects: Prospect[];
}

export interface EnhancedKpiData {
    vgvTotal: number;
    numeroLigacoes: number;
    numeroDocumentos: number;
    totalVendas: number;
    ticketMedio?: number;
    tempoMedioFechamento?: number;
}

export interface UserOption {
    id: string;
    name: string;
}
