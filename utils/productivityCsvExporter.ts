import type { ProductivityReportData } from '../types';

export const exportProductivityReportToCsv = (
    reportData: ProductivityReportData,
    userName: string,
    startDate: string,
    endDate: string
) => {
    const headers = ['Data', 'Ligações', 'CNE', 'Contatos Efetivos', 'Tratativas', 'Documentação', 'Vendas'];
    
    let csvContent = headers.join(',') + '\n';

    const sortedDates = Object.keys(reportData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    sortedDates.forEach(dateKey => {
        const day = reportData[dateKey];
        const formattedDate = new Date(dateKey).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        const row = [
            formattedDate,
            day.ligacoes,
            day.cne,
            day.atendimentos,
            day.tratativas,
            day.documentacao,
            day.vendas,
        ];
        csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const safeUserName = userName.replace(/ /g, '_');
        const start = startDate.split('-').reverse().join('');
        const end = endDate.split('-').reverse().join('');
        link.setAttribute('download', `produtividade_${safeUserName}_${start}-${end}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};