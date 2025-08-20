import React, { useState, useMemo, useEffect } from 'react';
import type { Client, ProductivityReportData, DailyProductivity } from '../types';
import { useProductivityReport } from '../hooks/useProductivity';
import { exportProductivityReportToCsv } from '../utils/productivityCsvExporter';
import { Icon } from './Icon';
import { Button } from './Button';
import { Card } from './Card';

interface ProductivityReportProps {
    userName: string;
    onBack: () => void;
    clients: Client[];
}

const KpiCard: React.FC<{ label: string, value: number, icon: 'user' | 'phone-off' | 'message-circle' | 'edit-3' | 'sheet' | 'dollar-sign' }> = ({ label, value, icon }) => (
    <Card>
        <div className="flex items-center">
            <div className="p-3 rounded-full bg-apple-blue/15">
                <Icon name={icon} className="w-6 h-6 text-apple-blue" />
            </div>
            <div className="ml-4">
                <p className="text-sm text-system-label-secondary">{label}</p>
                <p className="text-3xl font-bold text-system-label-primary">{value}</p>
            </div>
        </div>
    </Card>
);

const getISODateString = (date: Date) => date.toISOString().split('T')[0];

export const ProductivityReport: React.FC<ProductivityReportProps> = ({ userName, onBack, clients }) => {
    const { getReportForPeriod } = useProductivityReport(clients);

    const [filterPreset, setFilterPreset] = useState<'today' | 'last7days' | 'custom'>('custom');
    
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [startDate, setStartDate] = useState(getISODateString(firstDayOfMonth));
    const [endDate, setEndDate] = useState(getISODateString(today));

    useEffect(() => {
        const todayStr = getISODateString(new Date());
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 6);
        const weekAgoStr = getISODateString(weekAgo);

        if (startDate === todayStr && endDate === todayStr) {
            setFilterPreset('today');
        } else if (startDate === weekAgoStr && endDate === todayStr) {
            setFilterPreset('last7days');
        } else {
             setFilterPreset('custom');
        }
    }, [startDate, endDate]);


    const { dailyData, totals } = useMemo(() => {
        return getReportForPeriod(startDate, endDate);
    }, [startDate, endDate, getReportForPeriod]);

    const handleExport = () => {
        exportProductivityReportToCsv(dailyData, userName, startDate, endDate);
    };

    const setTodayFilter = () => {
        const todayStr = getISODateString(new Date());
        setStartDate(todayStr);
        setEndDate(todayStr);
    };

    const setLast7DaysFilter = () => {
        const today = new Date();
        const endDateStr = getISODateString(today);
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);
        const startDateStr = getISODateString(sevenDaysAgo);

        setStartDate(startDateStr);
        setEndDate(endDateStr);
    };
    
    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStartDate(e.target.value);
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEndDate(e.target.value);
    };
    
    const baseInputClasses = "bg-system-bg-primary text-system-label-primary border border-system-separator rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent placeholder-system-label-tertiary";

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
            <header>
                <button onClick={onBack} className="flex items-center text-sm text-apple-blue font-semibold mb-6">
                    <Icon name="arrow-left" className="w-4 h-4 mr-2" />
                    Voltar ao Painel
                </button>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-system-label-primary">Relatório de Produtividade</h1>
                        <p className="text-system-label-secondary mt-1">Análise de performance baseada nas interações com clientes.</p>
                    </div>
                </div>
            </header>

            <Card>
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="inline-flex items-center bg-system-fill-primary p-1 rounded-xl">
                         <button onClick={setTodayFilter} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${filterPreset === 'today' ? 'bg-system-bg-primary shadow-soft dark:shadow-soft-dark text-system-label-primary' : 'text-system-label-secondary hover:text-system-label-primary'}`}>Hoje</button>
                         <button onClick={setLast7DaysFilter} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${filterPreset === 'last7days' ? 'bg-system-bg-primary shadow-soft dark:shadow-soft-dark text-system-label-primary' : 'text-system-label-secondary hover:text-system-label-primary'}`}>Última Semana</button>
                    </div>

                    <div className="flex-1 flex flex-col sm:flex-row items-center gap-4 sm:justify-end">
                        <div className="w-full sm:w-auto">
                            <label htmlFor="start-date" className="text-sm font-medium text-system-label-secondary">De</label>
                            <input
                                id="start-date"
                                type="date"
                                value={startDate}
                                onChange={handleStartDateChange}
                                className={`mt-1 block w-full ${baseInputClasses}`}
                            />
                        </div>
                        <div className="w-full sm:w-auto">
                             <label htmlFor="end-date" className="text-sm font-medium text-system-label-secondary">Até</label>
                            <input
                                id="end-date"
                                type="date"
                                value={endDate}
                                onChange={handleEndDateChange}
                                className={`mt-1 block w-full ${baseInputClasses}`}
                            />
                        </div>
                        <div className="self-end pt-5 sm:pt-0">
                            <Button variant="secondary" onClick={handleExport} disabled={Object.keys(dailyData).length === 0}>
                                <Icon name="export" className="w-4 h-4 mr-2" />
                                Exportar
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            <div>
                <h2 className="text-2xl font-semibold text-system-label-primary mb-4">Totais do Período</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    <KpiCard label="Ligações" value={totals.ligacoes} icon="user" />
                    <KpiCard label="Contatos Efetivos (CE)" value={totals.atendimentos} icon="message-circle" />
                    <KpiCard label="Tratativas" value={totals.tratativas} icon="edit-3" />
                    <KpiCard label="Documentação" value={totals.documentacao} icon="sheet" />
                    <KpiCard label="Vendas" value={totals.vendas} icon="dollar-sign" />
                </div>
            </div>

            <Card>
                 <h2 className="text-2xl font-semibold text-system-label-primary mb-4">Detalhes por Dia</h2>
                 <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                <th className="px-4 py-3.5 text-left text-sm font-semibold text-system-label-primary">Data</th>
                                <th className="px-4 py-3.5 text-left text-sm font-semibold text-system-label-primary">Ligações</th>
                                <th className="px-4 py-3.5 text-left text-sm font-semibold text-system-label-primary">CE</th>
                                <th className="px-4 py-3.5 text-left text-sm font-semibold text-system-label-primary">Tratativas</th>
                                <th className="px-4 py-3.5 text-left text-sm font-semibold text-system-label-primary">Documentação</th>
                                <th className="px-4 py-3.5 text-left text-sm font-semibold text-system-label-primary">Vendas</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-system-separator">
                            {Object.keys(dailyData).length > 0 ? (
                                Object.entries(dailyData).map(([date, data]) => (
                                    <tr key={date}>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-system-label-primary">{new Date(date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-system-label-secondary">{data.ligacoes}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-system-label-secondary">{data.atendimentos}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-system-label-secondary">{data.tratativas}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-system-label-secondary">{data.documentacao}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-system-label-secondary">{data.vendas}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-system-label-secondary">Nenhuma atividade registrada no período selecionado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                 </div>
            </Card>
        </div>
    );
};