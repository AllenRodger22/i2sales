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
    
    const baseInputClasses = "glass-input text-system-label-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent placeholder-system-label-tertiary";

    return (
        <div className="min-h-full flex flex-col">
            <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-8 flex-shrink-0">
                <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-system-label-primary">Painel</h1>
                        <p className="text-system-label-secondary mt-1">Bem-vindo(a), {userName}.</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
                        {(userRole === 'manager' || userRole === 'admin') && onShowBiDashboard && (
                            <Button variant="secondary" onClick={onShowBiDashboard} className="bg-apple-blue/10 hover:bg-apple-blue/20 text-apple-blue border border-apple-blue/30">
                                Dashboard BI
                            </Button>
                        )}
                         <Button variant="secondary" onClick={onShowProductivityReport}>
                            <Icon name="bar-chart-2" className="w-4 h-4 mr-2" />
                            Produtividade
                        </Button>
                         <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}>
                            <Icon name="upload" className="w-4 h-4 mr-2" />
                            Importar
                        </Button>
                         <Button variant="secondary" onClick={handleExport}>
                            <Icon name="export" className="w-4 h-4 mr-2" />
                            Exportar
                        </Button>
                        <Button onClick={onLogout} variant="secondary">Sair</Button>
                        <Button onClick={onAddClient}>
                            <Icon name="plus" className="w-4 h-4 mr-2" />
                            Novo Cliente
                        </Button>
                    </div>
                </header>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <h3 className="text-sm font-semibold text-system-label-secondary mb-3">Follow-up</h3>
                        <div className="flex justify-around items-center text-center">
                            <KpiCard title="Atrasado" value={overdueFollowUps} colorClass="text-apple-red" isSelected={kpiFilter === 'overdue'} onClick={() => handleKpiFilterClick('overdue')} />
                            <div className="h-10 w-px bg-system-separator"></div>
                            <KpiCard title="Hoje" value={followUpsToday} colorClass="text-apple-orange" isSelected={kpiFilter === 'today'} onClick={() => handleKpiFilterClick('today')} />
                            <div className="h-10 w-px bg-system-separator"></div>
                           <KpiCard title="Futuro" value={futureFollowUps} colorClass="text-apple-indigo" isSelected={kpiFilter === 'future'} onClick={() => handleKpiFilterClick('future')} />
                        </div>
                    </Card>

                    <Card onClick={() => handleKpiFilterClick('primeiro-atendimento')} className={`text-center flex flex-col justify-center cursor-pointer transition-all ${kpiFilter === 'primeiro-atendimento' ? 'ring-2 ring-apple-blue' : ''}`}>
                        <h3 className="text-sm font-semibold text-system-label-secondary">Primeiro Atendimento</h3>
                        <p className="text-4xl font-bold text-system-label-primary mt-2">{primeiroAtendimentoCount}</p>
                    </Card>

                    <Card onClick={() => setKpiFilter(null)} className={`text-center flex flex-col justify-center cursor-pointer transition-all ${kpiFilter === null ? 'ring-2 ring-apple-blue' : ''}`}>
                        <h3 className="text-sm font-semibold text-system-label-secondary">Leads na Base</h3>
                        <p className="text-4xl font-bold text-system-label-primary mt-2">{totalLeads}</p>
                    </Card>
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
