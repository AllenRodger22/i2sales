import React from 'react';
import type { SavedDay, ProductivityReportData, DailyProductivity } from '../types';
import { Button } from './Button';
import { Icon } from './Icon';
import { exportProductivityReportToCsv } from '../utils/productivityCsvExporter';

interface SavedDaysSheetModalProps {
    onClose: () => void;
    savedDays: SavedDay[];
    userName: string;
}

export const SavedDaysSheetModal: React.FC<SavedDaysSheetModalProps> = ({ onClose, savedDays, userName }) => {
    
    const sortedDays = [...savedDays].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleExport = () => {
        if (savedDays.length === 0) return;

        const reportData: ProductivityReportData = savedDays.reduce((acc, day) => {
            acc[day.date] = {
                ligacoes: day.metrics.ligacoes,
                atendimentos: day.metrics.atendimentos,
                documentacao: day.metrics.documentacoes,
                vendas: day.metrics.vendas,
                // These metrics from DailyProductivity are not in SavedDay, so we default to 0.
                cne: 0,
                tratativas: 0,
            };
            return acc;
        }, {} as ProductivityReportData);

        const dates = savedDays.map(d => new Date(`${d.date}T00:00:00Z`));
        const startDate = new Date(Math.min(...dates.map(d => d.getTime()))).toISOString().split('T')[0];
        const endDate = new Date(Math.max(...dates.map(d => d.getTime()))).toISOString().split('T')[0];

        exportProductivityReportToCsv(reportData, userName, startDate, endDate);
    };
    
    return (
         <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-apple-gray-100 dark:bg-apple-gray-800 rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
                <div className="p-4 sm:p-6 border-b border-apple-gray-200 dark:border-apple-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-semibold text-apple-gray-800 dark:text-apple-gray-100">Planilha de Produtividade</h2>
                    <div className="flex items-center gap-4">
                        <Button variant="secondary" onClick={handleExport} disabled={savedDays.length === 0}>
                            <Icon name="export" className="w-4 h-4 mr-2" />
                            Baixar .CSV
                        </Button>
                        <button onClick={onClose} className="text-apple-gray-500 hover:text-apple-gray-800 dark:hover:text-apple-gray-200">
                            <Icon name="x" className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <div className="flex-grow overflow-auto">
                    {sortedDays.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
                                <thead className="bg-apple-gray-100 dark:bg-apple-gray-800 sticky top-0 z-10">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-apple-gray-600 dark:text-apple-gray-400 uppercase tracking-wider">Data</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-apple-gray-600 dark:text-apple-gray-400 uppercase tracking-wider">Ligações</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-apple-gray-600 dark:text-apple-gray-400 uppercase tracking-wider">Atendimentos</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-apple-gray-600 dark:text-apple-gray-400 uppercase tracking-wider">Interessados</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-apple-gray-600 dark:text-apple-gray-400 uppercase tracking-wider">Documentações</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-apple-gray-600 dark:text-apple-gray-400 uppercase tracking-wider">Vendas</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-apple-gray-800 divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
                                    {sortedDays.map((day) => (
                                        <tr key={day.date}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-apple-gray-900 dark:text-apple-gray-100">{new Date(day.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray-600 dark:text-apple-gray-300">{day.metrics.ligacoes}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray-600 dark:text-apple-gray-300">{day.metrics.atendimentos}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray-600 dark:text-apple-gray-300">{day.metrics.interessados}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray-600 dark:text-apple-gray-300">{day.metrics.documentacoes}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray-600 dark:text-apple-gray-300">{day.metrics.vendas}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-apple-gray-500 dark:text-apple-gray-400">Nenhum dia salvo ainda.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};