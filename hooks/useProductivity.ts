

import { useMemo } from 'react';
import type { Client, ProductivityReportData, DailyProductivity } from '../types';
import { Status, TimelineEventType } from '../types';

const getInitialDailyProductivity = (): DailyProductivity => ({
    ligacoes: 0,
    cne: 0,
    atendimentos: 0,
    documentacao: 0,
    tratativas: 0,
    vendas: 0,
});

const calculateFullReport = (clients: Client[]): ProductivityReportData => {
    const report: ProductivityReportData = {};

    const getDayEntry = (dateKey: string): DailyProductivity => {
        if (!report[dateKey]) {
            report[dateKey] = getInitialDailyProductivity();
        }
        return report[dateKey];
    };

    clients.forEach(client => {
        // Sort timeline oldest to newest to find the *first* event of each type
        const sortedTimeline = [...(client.timeline || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // 1. Ligações: First call attempt (Ligacao, Observacao, or CNE)
        const firstCall = sortedTimeline.find(e =>
            [TimelineEventType.Ligacao, TimelineEventType.Observacao, TimelineEventType.CNE].includes(e.type)
        );
        if (firstCall) {
            const dateKey = new Date(firstCall.date).toISOString().split('T')[0];
            getDayEntry(dateKey).ligacoes += 1;
        }

        // 2. Contatos Efetivos (CE): First of (Ligacao with CE) or (Observacao not system-generated)
        const firstCE = sortedTimeline.find(e => {
            if (e.type === TimelineEventType.Ligacao && e.content.includes(': CE')) return true;
            // A simple "Observacao" is considered a CE. Exclude system-generated ones.
            if (e.type === TimelineEventType.Observacao && e.content !== 'Cliente cadastrado.' && e.content !== 'Cliente cadastrado via importação.') return true;
            return false;
        });
        if (firstCE) {
            const dateKey = new Date(firstCE.date).toISOString().split('T')[0];
            getDayEntry(dateKey).atendimentos += 1;
        }
        
        // CNEs: First CNE event.
        const firstCNE = sortedTimeline.find(e =>
            e.type === TimelineEventType.CNE || (e.type === TimelineEventType.Ligacao && e.content.includes(': CNE'))
        );
        if (firstCNE) {
            const dateKey = new Date(firstCNE.date).toISOString().split('T')[0];
            getDayEntry(dateKey).cne += 1;
        }

        // 3. Tratativas: First status change TO Tratativa
        const firstTratativa = sortedTimeline.find(e =>
            e.type === TimelineEventType.StatusChange && e.meta?.to === Status.Tratativa
        );
        if (firstTratativa) {
            const dateKey = new Date(firstTratativa.date).toISOString().split('T')[0];
            getDayEntry(dateKey).tratativas += 1;
        }

        // 4. Documentação: First status change TO DocCompleta
        const firstDoc = sortedTimeline.find(e =>
            e.type === TimelineEventType.StatusChange && e.meta?.to === Status.DocCompleta
        );
        if (firstDoc) {
            const dateKey = new Date(firstDoc.date).toISOString().split('T')[0];
            getDayEntry(dateKey).documentacao += 1;
        }

        // 5. Vendas: First status change TO VendaGerada
        const firstVenda = sortedTimeline.find(e =>
            e.type === TimelineEventType.StatusChange && e.meta?.to === Status.VendaGerada
        );
        if (firstVenda) {
            const dateKey = new Date(firstVenda.date).toISOString().split('T')[0];
            getDayEntry(dateKey).vendas += 1;
        }
    });

    return report;
};


export const useProductivityReport = (clients: Client[]) => {
    const fullReport = useMemo(() => calculateFullReport(clients), [clients]);

    const getReportForPeriod = (startDate: string, endDate: string) => {
        const dailyData: ProductivityReportData = {};
        const totals: DailyProductivity = {
            ligacoes: 0,
            cne: 0,
            atendimentos: 0,
            tratativas: 0,
            documentacao: 0,
            vendas: 0,
        };
        
        const start = new Date(`${startDate}T00:00:00`);
        const end = new Date(`${endDate}T23:59:59`);

        Object.entries(fullReport).forEach(([dateKey, data]) => {
            const entryDate = new Date(`${dateKey}T00:00:00`);
            if (entryDate >= start && entryDate <= end) {
                dailyData[dateKey] = data;
                totals.ligacoes += data.ligacoes;
                totals.cne += data.cne;
                totals.atendimentos += data.atendimentos;
                totals.tratativas += data.tratativas;
                totals.documentacao += data.documentacao;
                totals.vendas += data.vendas;
            }
        });
        
        const sortedDailyData = Object.entries(dailyData)
            .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
            .reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {} as ProductivityReportData);


        return { dailyData: sortedDailyData, totals };
    };

    return { getReportForPeriod };
};