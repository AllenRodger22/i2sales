
import type { Client } from '../types';

export const exportToCsv = (clients: Client[], userName: string) => {
    const headers = ['ID Cliente', 'Nome', 'Telefone', 'E-mail', 'Origem', 'Status', 'Data Cadastro', 'Data Follow-up', 'Anexos (JSON)'];
    
    let csvContent = headers.join(',') + '\n';

    clients.forEach(client => {
        const anexos = {
            customFields: client.customFields || [],
            timeline: client.timeline || []
        };
        const anexosJsonString = JSON.stringify(anexos);
        // To be safe in CSV, we wrap fields with commas or quotes in double quotes, and escape internal double quotes by doubling them.
        const safeAnexos = `"${anexosJsonString.replace(/"/g, '""')}"`;
        
        const row = [
            client.id,
            `"${client.name.replace(/"/g, '""')}"`,
            `"${client.phone}"`,
            `"${client.email}"`,
            `"${client.origin.replace(/"/g, '""')}"`,
            client.status,
            `"${new Date(client.createdAt).toLocaleString('pt-BR')}"`,
            client.followUpDate ? `"${new Date(client.followUpDate).toLocaleString('pt-BR')}"` : '',
            safeAnexos,
        ];
        csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const safeUserName = userName.replace(/ /g, '_');
        link.setAttribute('download', `clientes_${safeUserName}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
