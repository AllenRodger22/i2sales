import React, { useState, useMemo } from 'react';
import type { Client, AutomatedFollowUp } from '../types';
import { Status, TimelineEventType, AutomatedFollowUpStatus } from '../types';
import { exportToCsv } from '../utils/csvExporter';
import { ClientList } from './ClientList';
import { Card } from './Card';
import { Icon } from './Icon';
import { Button } from './Button';
import { STATUS_OPTIONS } from '../constants';
import { ImportClientsModal } from './ImportClientsModal';
import { useAuth } from '../contexts/AuthContext';

interface DashboardProps {
    userName: string;
    clients: Client[];
    onClientSelect: (id: string) => void;
    onAddClient: () => void;
    onShowProductivityReport: () => void;
    importClients: (
        clientsToImport: Array<Record<string, string>>,
        mapping: Record<string, string>,
        onProgress: (progress: { current: number; total: number; duplicates: number; imported: number; failures: number }) => void
    ) => Promise<{ imported: number; duplicates: number; failures: number }>;
    onLogout: () => void;
    deleteAllClients: () => Promise<void>;
    onShowBiDashboard?: () => void;
    userRole?: 'user' | 'manager' | 'admin';
}

type KpiFilterType = 'overdue' | 'today' | 'future' | 'primeiro-atendimento' | null;

const KpiCard: React.FC<{ title: string; value: number; colorClass: string; isSelected: boolean; onClick: () => void; }> = ({ title, value, colorClass, isSelected, onClick }) => (
    <div onClick={onClick} className={`p-2 rounded-lg cursor-pointer transition-all ${isSelected ? 'ring-2 ring-apple-blue' : 'hover:bg-system-fill-primary'}`}>
        <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
        <p className="text-xs text-system-label-secondary mt-1">{title}</p>
    </div>
);

const getNextFollowUp = (client: Client): string | undefined => {
    const manualFollowUpTime = client.followUpDate ? new Date(client.followUpDate).getTime() : Infinity;
    
    const nextAutomated = (client.automatedFollowUps || [])
        .filter(f => f.status === AutomatedFollowUpStatus.Pending)
        .map(f => new Date(f.date).getTime())
        .sort((a, b) => a - b)[0];

    const nextAutomatedTime = nextAutomated || Infinity;
    
    const soonestTime = Math.min(manualFollowUpTime, nextAutomatedTime);

    return soonestTime !== Infinity ? new Date(soonestTime).toISOString() : undefined;
};


export const Dashboard: React.FC<DashboardProps> = ({ userName, clients, onClientSelect, onAddClient, onShowProductivityReport, importClients, onLogout, deleteAllClients, onShowBiDashboard, userRole }) => {
    const { user } = useAuth();
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
    const [kpiFilter, setKpiFilter] = useState<KpiFilterType>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const clientsWithNextFollowUp = useMemo(() => {
        return clients.map(c => ({ ...c, nextFollowUp: getNextFollowUp(c) }));
    }, [clients]);

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    
    const totalLeads = clients.length;
    const primeiroAtendimentoCount = clients.filter(c => c.status === Status.PrimeiroAtendimento).length;
    
    const followUpsToday = clientsWithNextFollowUp.filter(c => {
        if (c.status === Status.Arquivado || !c.nextFollowUp) return false;
        const d = new Date(c.nextFollowUp);
        return d >= startOfToday && d <= endOfToday;
    }).length;

    const overdueFollowUps = clientsWithNextFollowUp.filter(c => c.status !== Status.Arquivado && c.nextFollowUp && new Date(c.nextFollowUp) < startOfToday).length;
    const futureFollowUps = clientsWithNextFollowUp.filter(c => c.status !== Status.Arquivado && c.nextFollowUp && new Date(c.nextFollowUp) > endOfToday).length;


    const handleKpiFilterClick = (filter: KpiFilterType) => {
        setKpiFilter(prev => (prev === filter ? null : filter));
    };

    const filteredClients = useMemo(() => {
        let tempClients = clientsWithNextFollowUp;
        
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);

        switch (kpiFilter) {
            case 'overdue':
                tempClients = tempClients.filter(c => c.status !== Status.Arquivado && c.nextFollowUp && new Date(c.nextFollowUp) < startOfToday);
                break;
            case 'today':
                tempClients = tempClients.filter(c => {
                    if (c.status === Status.Arquivado || !c.nextFollowUp) return false;
                    const d = new Date(c.nextFollowUp);
                    return d >= startOfToday && d <= endOfToday;
                });
                break;
            case 'future':
                tempClients = tempClients.filter(c => c.status !== Status.Arquivado && c.nextFollowUp && new Date(c.nextFollowUp) > endOfToday);
                break;
            case 'primeiro-atendimento':
                tempClients = tempClients.filter(c => c.status === Status.PrimeiroAtendimento);
                break;
        }

        if (statusFilter !== 'all') {
            tempClients = tempClients.filter(client => client.status === statusFilter);
        }

        const searchString = filter.toLowerCase();
        if (!searchString) return tempClients;

        return tempClients.filter(client => {
            const timelineString = client.timeline?.map(event => event.content).join(' ').toLowerCase() || '';
            const customFieldsString = client.customFields?.map(f => `${f.name} ${f.value}`).join(' ').toLowerCase() || '';
            const clientDataString = [
                client.name,
                client.email,
                client.phone,
                client.origin,
                customFieldsString,
                timelineString,
            ].join(' ').toLowerCase();

            if (clientDataString.includes(searchString)) {
                return true;
            }

            // Special search for CE/CNE by event type
            if (searchString === 'ce') {
                return client.timeline?.some(event =>
                    event.type === TimelineEventType.Observacao ||
                    (event.type === TimelineEventType.Ligacao && event.content.includes(': CE'))
                );
            }

            if (searchString === 'cne') {
                return client.timeline?.some(event =>
                    event.type === TimelineEventType.CNE ||
                    (event.type === TimelineEventType.Ligacao && event.content.includes(': CNE'))
                );
            }

            return false;
        });
    }, [clientsWithNextFollowUp, filter, statusFilter, kpiFilter]);

    const handleExport = () => {
        exportToCsv(clients, userName);
    };

    const handleBulkDelete = async () => {
        const confirm1 = window.confirm('TEM CERTEZA ABSOLUTA? Esta ação irá apagar TODOS os clientes.');
        if (confirm1) {
          const confirm2 = window.prompt('Para confirmar, digite "DELETAR TUDO" na caixa abaixo.');
          if (confirm2 === 'DELETAR TUDO') {
            await deleteAllClients();
          } else {
            alert('Operação cancelada.');
          }
        }
    };
    
    const baseInputClasses = "bg-system-bg-primary text-system-label-primary border border-system-separator rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent placeholder-system-label-tertiary";

    return (
        <div className="min-h-screen">
            <div className="p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-8">
                <div className="glass-card rounded-3xl p-8">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight text-system-label-primary mb-2">
                                Painel de Controle
                            </h1>
                            <p className="text-lg text-system-label-secondary">
                                Bem-vindo(a), {userName}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            {(userRole === 'manager' || userRole === 'admin') && onShowBiDashboard && (
                                <button
                                    onClick={onShowBiDashboard}
                                    className="px-6 py-3 rounded-2xl text-sm font-semibold bg-accent-orange text-white shadow-lg shadow-accent-orange/25 hover:scale-105 transition-all duration-300 flex items-center gap-2"
                                >
                                    <Icon name="bar-chart-3" className="w-4 h-4" />
                                    Dashboard BI
                                </button>
                            )}
                            <button
                                onClick={onShowProductivityReport}
                                className="px-6 py-3 rounded-2xl text-sm font-semibold glass-card hover:scale-105 transition-all duration-300 flex items-center gap-2"
                            >
                                <Icon name="bar-chart-2" className="w-4 h-4" />
                                Produtividade
                            </button>
                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="px-6 py-3 rounded-2xl text-sm font-semibold glass-card hover:scale-105 transition-all duration-300 flex items-center gap-2"
                            >
                                <Icon name="upload" className="w-4 h-4" />
                                Importar
                            </button>
                            <button
                                onClick={handleExport}
                                className="px-6 py-3 rounded-2xl text-sm font-semibold glass-card hover:scale-105 transition-all duration-300 flex items-center gap-2"
                            >
                                <Icon name="export" className="w-4 h-4" />
                                Exportar
                            </button>
                            <button
                                onClick={onLogout}
                                className="px-6 py-3 rounded-2xl text-sm font-semibold glass-panel text-system-label-secondary hover:text-system-label-primary hover:scale-105 transition-all duration-300"
                            >
                                Sair
                            </button>
                            <button
                                onClick={onAddClient}
                                className="px-6 py-3 rounded-2xl text-sm font-semibold bg-accent-orange text-white shadow-lg shadow-accent-orange/25 hover:scale-105 transition-all duration-300 flex items-center gap-2"
                            >
                                <Icon name="plus" className="w-4 h-4" />
                                Novo Cliente
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card rounded-3xl p-6">
                        <h3 className="text-lg font-semibold text-system-label-secondary mb-4">Follow-up</h3>
                        <div className="flex justify-around items-center text-center">
                            <div 
                                onClick={() => handleKpiFilterClick('overdue')}
                                className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 ${
                                    kpiFilter === 'overdue' ? 'bg-accent-orange/20 ring-2 ring-accent-orange' : 'hover:bg-system-fill-primary/50'
                                }`}
                            >
                                <p className="text-3xl font-bold text-apple-red">{overdueFollowUps}</p>
                                <p className="text-sm text-system-label-secondary mt-1">Atrasado</p>
                            </div>
                            <div className="h-12 w-px bg-system-separator/30"></div>
                            <div 
                                onClick={() => handleKpiFilterClick('today')}
                                className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 ${
                                    kpiFilter === 'today' ? 'bg-accent-orange/20 ring-2 ring-accent-orange' : 'hover:bg-system-fill-primary/50'
                                }`}
                            >
                                <p className="text-3xl font-bold text-apple-orange">{followUpsToday}</p>
                                <p className="text-sm text-system-label-secondary mt-1">Hoje</p>
                            </div>
                            <div className="h-12 w-px bg-system-separator/30"></div>
                            <div 
                                onClick={() => handleKpiFilterClick('future')}
                                className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 ${
                                    kpiFilter === 'future' ? 'bg-accent-orange/20 ring-2 ring-accent-orange' : 'hover:bg-system-fill-primary/50'
                                }`}
                            >
                                <p className="text-3xl font-bold text-apple-indigo">{futureFollowUps}</p>
                                <p className="text-sm text-system-label-secondary mt-1">Futuro</p>
                            </div>
                        </div>
                    </div>

                    <div 
                        onClick={() => handleKpiFilterClick('primeiro-atendimento')}
                        className={`glass-card rounded-3xl p-6 text-center flex flex-col justify-center cursor-pointer transition-all duration-300 hover:scale-105 ${
                            kpiFilter === 'primeiro-atendimento' ? 'ring-2 ring-accent-orange bg-accent-orange/10' : ''
                        }`}
                    >
                        <h3 className="text-lg font-semibold text-system-label-secondary mb-2">Primeiro Atendimento</h3>
                        <p className="text-4xl font-bold text-system-label-primary">{primeiroAtendimentoCount}</p>
                    </div>

                    <div 
                        onClick={() => setKpiFilter(null)}
                        className={`glass-card rounded-3xl p-6 text-center flex flex-col justify-center cursor-pointer transition-all duration-300 hover:scale-105 ${
                            kpiFilter === null ? 'ring-2 ring-accent-orange bg-accent-orange/10' : ''
                        }`}
                    >
                        <h3 className="text-lg font-semibold text-system-label-secondary mb-2">Leads na Base</h3>
                        <p className="text-4xl font-bold text-system-label-primary">{totalLeads}</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="text-2xl font-semibold text-system-label-primary">Clientes ({filteredClients.length})</h2>
                    <div className="flex items-center gap-4 flex-wrap w-full sm:w-auto">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as Status | 'all')}
                            className={baseInputClasses}
                        >
                            <option value="all">Todos os Status</option>
                            {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        <input
                            type="text"
                            placeholder="Buscar em tudo..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className={`${baseInputClasses} w-full sm:w-56`}
                        />
                    </div>
                </div>
            </div>
            
            <div className="flex-grow min-h-0 w-full max-w-7xl mx-auto">
                 <div className="px-4 sm:px-6 lg:px-8 pb-8">
                    <Card className="p-2 sm:p-3">
                        <ClientList clients={filteredClients} onClientSelect={onClientSelect} />
                    </Card>
                 </div>
            </div>
            {isImportModalOpen && <ImportClientsModal onClose={() => setIsImportModalOpen(false)} onImport={importClients} />}
        </div>
    );
};
