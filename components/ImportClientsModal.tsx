import React, { useState, useCallback } from 'react';
import type { Client } from '../types';
import { Status } from '../types';
import { Button } from './Button';
import { Icon } from './Icon';

interface ImportClientsModalProps {
    onClose: () => void;
    onImport: (clients: Array<Partial<Client> & { name: string; phone: string }>) => void;
}

type CrmField = 'name' | 'phone' | 'email' | 'origin' | 'status' | 'createdAt' | 'followUpDate' | 'anexos';

const CRM_FIELDS: { value: CrmField; label: string }[] = [
    { value: 'name', label: 'Nome (Obrigatório)' },
    { value: 'phone', label: 'Telefone (Obrigatório)' },
    { value: 'email', label: 'E-mail' },
    { value: 'origin', label: 'Origem' },
    { value: 'status', label: 'Status' },
    { value: 'createdAt', label: 'Data Cadastro' },
    { value: 'followUpDate', label: 'Data Follow-up' },
    { value: 'anexos', label: 'Anexos (Histórico/Campos)' },
];

// A more robust CSV parser that handles quoted fields, commas within fields, and escaped quotes.
const parseCsv = (csvText: string): { headers: string[], rows: Record<string, string>[] } => {
    const lines = csvText.replace(/^\uFEFF/, '').trim().replace(/\r\n/g, '\n').split('\n');
    if (lines.length === 0 || !lines[0]) return { headers: [], rows: [] };

    const parseLine = (line: string): string[] => {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // Escaped quote
                    current += '"';
                    i++; // Skip the next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        return values;
    };
    
    const headers = parseLine(lines[0]).map(h => h.trim());
    
    const rows = lines.slice(1).map(line => {
        if (!line.trim()) return null;
        const values = parseLine(line);
        const rowObject: Record<string, string> = {};

        // Heuristic to handle malformed CSVs where date/time columns are split
        if (values.length > headers.length) {
            let valueIndex = 0;
            for (let headerIndex = 0; headerIndex < headers.length; headerIndex++) {
                const header = headers[headerIndex];
                const headerLower = header.toLowerCase();
                
                // If we have more values than remaining headers, and current header is a date,
                // and the next value looks like a time, assume it has been split and join them.
                if ((headerLower.includes('data') || headerLower.includes('date')) && (values.length - valueIndex > headers.length - headerIndex)) {
                     const nextValue = values[valueIndex + 1];
                     const nextValueIsTime = nextValue && /^\d{1,2}:\d{2}:\d{2}$/.test(nextValue.trim());
                     if(nextValueIsTime){
                        rowObject[header] = `${values[valueIndex] || ''}, ${nextValue || ''}`.trim();
                        valueIndex += 2;
                        continue;
                     }
                }
                
                rowObject[header] = values[valueIndex] || '';
                valueIndex += 1;
            }
        } else {
            headers.forEach((header, index) => {
                rowObject[header] = values[index] || '';
            });
        }
        
        return rowObject;
    }).filter((r): r is NonNullable<typeof r> => r !== null && Object.keys(r).length > 0);

    return { headers, rows };
};


const parsePtBrDate = (dateString: string): string | undefined => {
    if (!dateString) return undefined;
    // e.g., "26/07/2024, 15:30:00" or just "26/07/2024"
    const parts = dateString.split(',');
    const datePart = parts[0].trim();
    const timePart = parts.length > 1 ? parts[1].trim() : '00:00:00';

    const dateParts = datePart.split('/');
    if (dateParts.length !== 3) return undefined;

    const [day, month, year] = dateParts;
    
    // ISO format is YYYY-MM-DDTHH:mm:ss
    const isoString = `${year}-${month}-${day}T${timePart}`;
    const date = new Date(isoString);

    if (isNaN(date.getTime())) return undefined;

    return date.toISOString();
};

const baseInputClasses = "bg-system-bg-primary text-system-label-primary border border-system-separator rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent placeholder-system-label-tertiary";


export const ImportClientsModal: React.FC<ImportClientsModalProps> = ({ onClose, onImport }) => {
    const [step, setStep] = useState(1); // 1: upload, 2: map, 3: result
    const [fileName, setFileName] = useState('');
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [customFieldNames, setCustomFieldNames] = useState<Record<string, string>>({});
    const [importCount, setImportCount] = useState(0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                const { headers, rows } = parseCsv(text);
                setCsvHeaders(headers);
                setCsvRows(rows);
                
                const initialMapping: Record<string, string> = {};
                const autoMap: Record<string, CrmField> = {
                    'nome': 'name', 'name': 'name', 'cliente': 'name',
                    'telefone': 'phone', 'phone': 'phone', 'celular': 'phone',
                    'email': 'email', 'e-mail': 'email',
                    'origem': 'origin', 'source': 'origin',
                    'status': 'status',
                    'data cadastro': 'createdAt',
                    'data follow-up': 'followUpDate', 'data followup': 'followUpDate', 'follow-up': 'followUpDate', 'followup': 'followUpDate',
                    'anexos (json)': 'anexos'
                };

                headers.forEach(h => {
                    const lowerHeader = h.toLowerCase().trim().replace(/"/g, '');
                    const mappedField = autoMap[lowerHeader];
                    initialMapping[h] = mappedField || 'ignore';
                });
                setMapping(initialMapping);

                const initialCustomNames: Record<string, string> = {};
                headers.forEach(h => {
                    initialCustomNames[h] = h;
                });
                setCustomFieldNames(initialCustomNames);

                setStep(2);
            };
            reader.readAsText(file, 'UTF-8');
        }
    };

    const handleImport = () => {
        const mappedValues = Object.values(mapping);
        if (!mappedValues.includes('name') || !mappedValues.includes('phone')) {
            alert('Por favor, mapeie as colunas "Nome" e "Telefone".');
            return;
        }

        const newClientsData = csvRows.map(row => {
            const clientData: Partial<Client> = { customFields: [] };
            
            for (const header of csvHeaders) {
                const mappedTo = mapping[header];
                const value = row[header];
                if (!mappedTo || mappedTo === 'ignore' || !value) continue;

                if (mappedTo === 'status') {
                    const availableStatuses = Object.values(Status) as string[];
                    const matchedStatus = availableStatuses.find(s => s.toLowerCase() === value.trim().toLowerCase());
                    if (matchedStatus) {
                        clientData.status = matchedStatus as Status;
                    }
                } else if (mappedTo === 'anexos') {
                    try {
                        // The value might be enclosed in double quotes which need to be stripped for JSON parsing.
                        const cleanValue = value.startsWith('"') && value.endsWith('"') ? value.substring(1, value.length - 1).replace(/""/g, '"') : value;
                        const anexos = JSON.parse(cleanValue);
                        if (anexos.timeline) {
                            clientData.timeline = anexos.timeline;
                        }
                        if (anexos.customFields) {
                            clientData.customFields = [...(clientData.customFields || []), ...anexos.customFields];
                        }
                    } catch (e) {
                        console.error(`Failed to parse 'Anexos (JSON)' for row: ${JSON.stringify(row)}`, e);
                    }
                } else if (mappedTo === 'custom') {
                    const customFieldName = customFieldNames[header] || header;
                    if (customFieldName && clientData.customFields) {
                        clientData.customFields.push({ name: customFieldName, value });
                    }
                } else if (mappedTo === 'createdAt' || mappedTo === 'followUpDate') {
                    clientData[mappedTo] = parsePtBrDate(value);
                } else {
                    (clientData as any)[mappedTo] = value;
                }
            }

            // Deduplicate custom fields if 'anexos' and 'custom' mappings are used.
            if (clientData.customFields && clientData.customFields.length > 0) {
                 const uniqueCustomFields = Array.from(new Map(clientData.customFields.map(item => [item.name, item])).values());
                 clientData.customFields = uniqueCustomFields;
            }

            const name = clientData.name;
            const phone = clientData.phone;

            if (name && phone) {
                 return { ...clientData, name, phone };
            }
            return null;
        }).filter((c): c is NonNullable<typeof c> => c !== null);
        
        onImport(newClientsData);
        setImportCount(newClientsData.length);
        setStep(3);
    };

    const getStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="text-center p-8">
                        <Icon name="upload" className="w-16 h-16 mx-auto text-system-label-tertiary mb-4" />
                        <h3 className="text-lg font-semibold text-system-label-primary">Importar Clientes</h3>
                        <p className="text-sm text-system-label-secondary mt-1">Selecione um arquivo .CSV para começar.</p>
                        <label className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-all transform focus:outline-none focus:ring-2 focus:ring-apple-blue focus:ring-offset-2 bg-apple-blue text-white hover:brightness-110 mt-6 cursor-pointer">
                            <input type="file" accept=".csv" onChange={handleFileChange} className="sr-only" />
                            <span>Selecionar Arquivo</span>
                        </label>
                    </div>
                );
            case 2:
                return (
                    <>
                        <div className="p-6 border-b border-system-separator">
                            <h2 className="text-xl font-semibold text-system-label-primary">Mapear Colunas</h2>
                            <p className="text-sm text-system-label-secondary mt-1">Combine as colunas do seu arquivo com os campos do CRM.</p>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <table className="min-w-full">
                                <thead>
                                    <tr>
                                        <th className="pb-4 text-left text-sm font-semibold text-system-label-primary">Coluna do Arquivo</th>
                                        <th className="pb-4 text-left text-sm font-semibold text-system-label-primary">Campo no CRM</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-system-separator">
                                    {csvHeaders.map(header => (
                                        <tr key={header}>
                                            <td className="py-3 pr-4 text-sm text-system-label-primary font-medium">{header}</td>
                                            <td className="py-3 text-sm flex items-center gap-2">
                                                <select
                                                    value={mapping[header] || 'ignore'}
                                                    onChange={e => setMapping(prev => ({...prev, [header]: e.target.value}))}
                                                    className={`flex-1 ${baseInputClasses}`}
                                                >
                                                    <option value="ignore">Não importar</option>
                                                    {CRM_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                                    <option value="custom">Novo Campo Personalizado</option>
                                                </select>
                                                {mapping[header] === 'custom' && (
                                                    <input
                                                        type="text"
                                                        value={customFieldNames[header]}
                                                        onChange={e => setCustomFieldNames(prev => ({...prev, [header]: e.target.value}))}
                                                        className={`flex-1 ${baseInputClasses}`}
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 border-t border-system-separator flex justify-end gap-3">
                            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                            <Button onClick={handleImport}>Importar Clientes</Button>
                        </div>
                    </>
                );
            case 3:
                return (
                     <div className="text-center p-8 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-apple-green/15 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-apple-green">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-system-label-primary">Importação Concluída</h3>
                        <p className="text-sm text-system-label-secondary mt-1"><b>{importCount} de {csvRows.length}</b> clientes foram importados com sucesso.</p>
                        <Button onClick={onClose} className="mt-6">Fechar</Button>
                    </div>
                )
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex justify-center items-center z-50 p-4">
            <div className="bg-system-bg-secondary rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col">
                {step !== 2 && <div className="p-4 flex justify-end">
                     <button onClick={onClose} className="text-system-label-secondary hover:text-system-label-primary">
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                </div>}
                {getStepContent()}
            </div>
        </div>
    );
};