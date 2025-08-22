import { Status } from './types';

export const KANBAN_COLUMNS: Status[] = [
    Status.PrimeiroAtendimento,
    Status.FluxoDeCadencia,
    Status.Tratativa,
    Status.AguardandoDoc,
    Status.DocCompleta,
    Status.EmAnalise,
    Status.Aprovado,
    Status.VendaGerada,
    Status.Reprovado,
];

export const STATUS_OPTIONS: { value: Status; label: string; className: string; dotClassName: string }[] = [
    { value: Status.PrimeiroAtendimento, label: 'Primeiro Atendimento', className: 'bg-apple-blue/15 text-apple-blue', dotClassName: 'bg-apple-blue' },
    { value: Status.FluxoDeCadencia, label: 'Fluxo de Cadência', className: 'bg-apple-lime/15 text-apple-lime', dotClassName: 'bg-apple-lime' },
    { value: Status.Tratativa, label: 'Tratativa', className: 'bg-apple-yellow/20 text-yellow-700 dark:text-apple-yellow', dotClassName: 'bg-apple-yellow' },
    { value: Status.AguardandoDoc, label: 'Aguardando Doc', className: 'bg-apple-purple/15 text-apple-purple', dotClassName: 'bg-apple-purple' },
    { value: Status.DocCompleta, label: 'Doc Completa', className: 'bg-apple-indigo/15 text-apple-indigo', dotClassName: 'bg-apple-indigo' },
    { value: Status.EmAnalise, label: 'Em Análise', className: 'bg-apple-orange/15 text-apple-orange', dotClassName: 'bg-apple-orange' },
    { value: Status.Aprovado, label: 'Aprovado', className: 'bg-apple-green/15 text-apple-green', dotClassName: 'bg-apple-green' },
    { value: Status.Reprovado, label: 'Reprovado', className: 'bg-apple-red/15 text-apple-red', dotClassName: 'bg-apple-red' },
    { value: Status.VendaGerada, label: 'Venda Gerada', className: 'bg-apple-teal/15 text-apple-teal', dotClassName: 'bg-apple-teal' },
    { value: Status.Arquivado, label: 'Arquivado', className: 'bg-system-fill-primary text-system-label-secondary', dotClassName: 'bg-system-label-tertiary' },
];

export const getStatusInfo = (status: Status) => {
    return STATUS_OPTIONS.find(option => option.value === status) || { label: 'Desconhecido', className: 'bg-system-fill-primary text-system-label-secondary', dotClassName: 'bg-system-label-tertiary' };
};

export const CNE_OPTIONS = ['N chamou', 'N Atendeu', 'Caixa Postal', 'Numero Invalido', 'Fora de Area', 'Ocupado', 'Bloqueado'];
