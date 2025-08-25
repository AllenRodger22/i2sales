import React, { useMemo } from 'react';
import type { Metric } from '../types';
import { Button } from './Button';
import { Icon } from './Icon';

interface FunnelModalProps {
    onClose: () => void;
    metrics: Metric[];
}

const FunnelStep: React.FC<{
    label: string;
    value: number;
    conversionRate?: number;
    isFirst?: boolean;
    conversionIndex?: number;
}> = ({ label, value, conversionRate, isFirst = false, conversionIndex }) => {
    
    const getConversionColor = (): string => {
        if (conversionRate === undefined || conversionIndex === undefined || conversionIndex < 0) {
            return 'bg-apple-blue/15 text-apple-blue';
        }

        const green = 'bg-apple-green/15 text-apple-green';
        const yellow = 'bg-apple-yellow/20 text-yellow-700 dark:text-apple-yellow';
        const red = 'bg-apple-red/15 text-apple-red';

        // Primeira conversão (Ligações -> Atendimentos) tem meta de 30%
        if (conversionIndex === 0) {
            const target = 30;
            if (conversionRate > target) return green;
            if (conversionRate >= target - 5) return yellow; // Amarelo se for entre 25% e 30%
            return red;
        }
        
        // Demais conversões tem meta de 20%
        const target = 20;
        if (conversionRate > target) return green;
        if (conversionRate >= target - 5) return yellow; // Amarelo se for entre 15% e 20%
        return red;
    };

    const conversionColorClass = getConversionColor();
    
    return (
        <div className="flex flex-col items-center">
            {!isFirst && (
                 <div className="flex flex-col items-center my-2">
                    <div className="h-8 w-px bg-system-separator"></div>
                    <div className={`text-xs font-semibold py-1 px-2 rounded-full ${conversionColorClass}`}>
                        {conversionRate?.toFixed(1) ?? 0}%
                    </div>
                     <div className="h-8 w-px bg-system-separator"></div>
                </div>
            )}
            <div className="flex items-center gap-4 p-4 rounded-xl glass w-full max-w-xs justify-between">
                <span className="text-sm font-medium text-system-label-primary">{label}</span>
                <span className="text-lg font-bold text-system-label-primary">{value}</span>
            </div>
        </div>
    );
};


export const FunnelModal: React.FC<FunnelModalProps> = ({ onClose, metrics }) => {
    
    const funnelData = useMemo(() => {
        const getMetric = (id: Metric['id']) => metrics.find(m => m.id === id)?.value ?? 0;
        
        const ligacoes = getMetric('ligacoes');
        const atendimentos = getMetric('atendimentos');
        const interessados = getMetric('interessados');
        const documentacoes = getMetric('documentacoes');
        const vendas = getMetric('vendas');

        const calcRate = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);

        return {
            steps: [
                { label: 'Ligações', value: ligacoes },
                { label: 'Atendimentos', value: atendimentos },
                { label: 'Interessados', value: interessados },
                { label: 'Documentações', value: documentacoes },
                { label: 'Vendas', value: vendas },
            ],
            conversions: [
                calcRate(atendimentos, ligacoes),
                calcRate(interessados, atendimentos),
                calcRate(documentacoes, interessados),
                calcRate(vendas, documentacoes),
            ]
        }
    }, [metrics]);
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex justify-center items-center z-50 p-4">
            <div className="glass rounded-2xl shadow-2xl w-full max-w-sm">
                <div className="p-6 border-b border-system-separator flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-system-label-primary">Funil de Vendas do Dia</h2>
                     <button onClick={onClose} className="text-system-label-secondary hover:text-system-label-primary">
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                    {funnelData.steps.map((step, index) => (
                        <FunnelStep 
                            key={step.label}
                            label={step.label}
                            value={step.value}
                            isFirst={index === 0}
                            conversionRate={funnelData.conversions[index - 1]}
                            conversionIndex={index - 1}
                        />
                    ))}
                </div>
                 <div className="p-6 border-t border-system-separator flex justify-end">
                    <Button variant="secondary" onClick={onClose}>Fechar</Button>
                </div>
            </div>
        </div>
    );
};