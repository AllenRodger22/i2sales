import React, { useState, useCallback, useMemo } from 'react';
import Papa from 'papaparse';
import { Button } from './Button';
import { Icon } from './Icon';

interface ImportClientsModalProps {
    onClose: () => void;
    onImport: (
        clientsToImport: Array<Record<string, string>>,
        mapping: Record<string, string>,
        onProgress: (progress: { current: number; total: number; duplicates: number; imported: number; failures: number }) => void
    ) => Promise<{ imported: number; duplicates: number; failures: number }>;
}

type Step = 'UPLOAD' | 'MAPPING' | 'IMPORTING' | 'SUMMARY';

const REQUIRED_FIELDS: Record<string, string> = { name: 'Nome', phone: 'Telefone' };
const OPTIONAL_FIELDS: Record<string, string> = { 
    email: 'E-mail', 
    origin: 'Origem',
    status: 'Status',
    createdAt: 'Data Cadastro',
    followUpDate: 'Data Follow-up',
    saleValue: 'Valor de Venda',
    anexos: 'Anexos (JSON)'
};

const baseInputClasses = "block w-full bg-system-bg-tertiary dark:bg-system-bg-secondary text-system-label-primary border border-system-separator rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent placeholder-system-label-tertiary";


export const ImportClientsModal: React.FC<ImportClientsModalProps> = ({ onClose, onImport }) => {
    const [step, setStep] = useState<Step>('UPLOAD');
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvData, setCsvData] = useState<Array<Record<string, string>>>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [progress, setProgress] = useState({ current: 0, total: 0, duplicates: 0, imported: 0, failures: 0 });

    const resetState = useCallback(() => {
        setStep('UPLOAD');
        setFile(null);
        setError(null);
        setCsvHeaders([]);
        setCsvData([]);
        setMapping({});
        setProgress({ current: 0, total: 0, duplicates: 0, imported: 0, failures: 0 });
    }, []);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (!selectedFile.type.includes('csv') && !selectedFile.name.endsWith('.csv')) {
            setError('Por favor, selecione um arquivo .csv');
            return;
        }

        setFile(selectedFile);
        setError(null);

        Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results: any) => {
                if (results.errors.length) {
                    setError('Erro ao processar o arquivo CSV. Verifique o formato.');
                    console.error("CSV Parsing errors:", results.errors);
                    return;
                }
                const headers = results.meta.fields || [];
                setCsvHeaders(headers);
                setCsvData(results.data as Array<Record<string, string>>);
                
                const newMapping: Record<string, string> = {};
                const allFields = {...REQUIRED_FIELDS, ...OPTIONAL_FIELDS};
                Object.keys(allFields).forEach(fieldKey => {
                    const fieldName = allFields[fieldKey as keyof typeof allFields].toLowerCase().replace(/ \(.+\)/, ''); // remove "(JSON)" for matching
                    const foundHeader = headers.find((h: string) => h.toLowerCase().includes(fieldName));
                    if (foundHeader) {
                        newMapping[fieldKey] = foundHeader;
                    }
                });
                setMapping(newMapping);

                setStep('MAPPING');
            },
            error: (err: any) => {
                setError(`Erro ao processar o arquivo: ${err.message}`);
            }
        });
    }, []);
    
    const handleMappingChange = (field: string, csvHeader: string) => {
        setMapping(prev => ({ ...prev, [field]: csvHeader }));
    };

    const isMappingValid = useMemo(() => {
        return !!mapping.name && !!mapping.phone;
    }, [mapping]);

    const handleStartImport = useCallback(async () => {
        if (!isMappingValid) {
            setError('Os campos "Nome" e "Telefone" são obrigatórios.');
            return;
        }
        setError(null);
        setStep('IMPORTING');
        try {
            const finalResults = await onImport(csvData, mapping, setProgress);
            setProgress(prev => ({ ...prev, ...finalResults }));
            setStep('SUMMARY');
        } catch (e: any) {
            setError(`Ocorreu um erro durante a importação: ${e.message}`);
            setStep('MAPPING');
        }
    }, [csvData, mapping, onImport, isMappingValid]);
    
    const MappingField = ({ fieldKey, fieldLabel }: { fieldKey: string, fieldLabel: string }) => (
        <div key={fieldKey} className="grid grid-cols-2 items-center gap-4">
            <label className="text-sm font-medium text-system-label-primary text-right">{fieldLabel}</label>
            <select value={mapping[fieldKey] || ''} onChange={(e) => handleMappingChange(fieldKey, e.target.value)} className={baseInputClasses}>
                <option value="">Selecione uma coluna</option>
                {csvHeaders.map(header => <option key={header} value={header}>{header}</option>)}
            </select>
        </div>
    );

    const renderStep = () => {
        switch (step) {
            case 'UPLOAD':
                return (
                    <div className="text-center">
                        <label htmlFor="csv-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-system-separator border-dashed rounded-lg cursor-pointer bg-system-bg-tertiary hover:bg-system-fill-primary">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Icon name="upload" className="w-10 h-10 mb-3 text-system-label-secondary" />
                                <p className="mb-2 text-sm text-system-label-secondary"><span className="font-semibold">Clique para enviar</span> ou arraste e solte</p>
                                <p className="text-xs text-system-label-tertiary">Arquivo CSV (máx. 5MB)</p>
                            </div>
                            <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                        </label>
                         {file && <p className="mt-4 text-sm text-system-label-secondary">Arquivo selecionado: {file.name}</p>}
                    </div>
                );

            case 'MAPPING':
                return (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        <p className="text-sm text-system-label-secondary">Combine as colunas do seu arquivo CSV com os campos do CRM. <strong className="text-system-label-primary">Nome</strong> e <strong className="text-system-label-primary">Telefone</strong> são obrigatórios.</p>
                        
                        <fieldset className="space-y-4 border-t border-system-separator pt-4">
                            <legend className="text-xs font-semibold text-system-label-secondary uppercase -translate-y-6 bg-system-bg-secondary px-2">Campos Obrigatórios</legend>
                             {Object.entries(REQUIRED_FIELDS).map(([fieldKey, fieldLabel]) => <MappingField key={fieldKey} fieldKey={fieldKey} fieldLabel={fieldLabel} />)}
                        </fieldset>

                        <fieldset className="space-y-4 border-t border-system-separator pt-4">
                            <legend className="text-xs font-semibold text-system-label-secondary uppercase -translate-y-6 bg-system-bg-secondary px-2">Campos Opcionais (Histórico)</legend>
                            {Object.entries(OPTIONAL_FIELDS).map(([fieldKey, fieldLabel]) => <MappingField key={fieldKey} fieldKey={fieldKey} fieldLabel={fieldLabel} />)}
                        </fieldset>
                    </div>
                );
            
            case 'IMPORTING':
                const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
                return (
                    <div className="text-center py-8">
                        <p className="text-lg font-semibold text-system-label-primary">Importando clientes...</p>
                        <div className="w-full bg-system-fill-primary rounded-full h-2.5 mt-4">
                            <div className="bg-apple-blue h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <p className="text-sm text-system-label-secondary mt-2">{progress.current} de {progress.total}</p>
                        <div className="mt-4 text-xs text-system-label-tertiary">
                            <span>Importados: {progress.imported}</span> | <span>Duplicados: {progress.duplicates}</span> | <span>Falhas: {progress.failures}</span>
                        </div>
                    </div>
                );

            case 'SUMMARY':
                return (
                    <div className="text-center py-8">
                         <Icon name="users" className="w-12 h-12 mx-auto text-apple-green mb-4" />
                        <h3 className="text-xl font-bold text-system-label-primary">Importação Concluída!</h3>
                        <div className="mt-4 space-y-2 text-system-label-secondary">
                             <p><strong className="text-system-label-primary">{progress.imported}</strong> clientes foram importados com sucesso.</p>
                             <p><strong className="text-system-label-primary">{progress.duplicates}</strong> clientes foram ignorados por serem duplicados.</p>
                             <p><strong className="text-system-label-primary">{progress.failures}</strong> registros não puderam ser importados por falta de dados ou erro.</p>
                        </div>
                    </div>
                );
        }
    };

    const getModalTitle = () => {
        switch (step) {
            case 'UPLOAD': return 'Importar Clientes de CSV';
            case 'MAPPING': return 'Mapear Campos';
            case 'IMPORTING': return 'Importando...';
            case 'SUMMARY': return 'Resumo da Importação';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex justify-center items-center z-50 p-4">
            <div className="bg-system-bg-secondary rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="p-6 border-b border-system-separator flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-system-label-primary">{getModalTitle()}</h2>
                     <button onClick={onClose} className="text-system-label-secondary hover:text-system-label-primary">
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 min-h-[250px] flex items-center justify-center">
                    {error ? (
                        <div className="text-center text-apple-red">
                            <Icon name="alert-triangle" className="w-8 h-8 mx-auto mb-2" />
                            <p>{error}</p>
                        </div>
                    ) : renderStep()}
                </div>

                <div className="p-6 border-t border-system-separator flex justify-between items-center">
                    <div>
                        {step === 'MAPPING' && <Button type="button" variant="secondary" onClick={resetState}>Voltar</Button>}
                    </div>
                     <div className="flex items-center gap-3">
                        {step !== 'IMPORTING' && <Button type="button" variant="secondary" onClick={onClose}>
                            {step === 'SUMMARY' ? 'Fechar' : 'Cancelar'}
                        </Button>}
                        {step === 'MAPPING' && <Button type="button" onClick={handleStartImport} disabled={!isMappingValid}>Iniciar Importação</Button>}
                        {step === 'SUMMARY' && <Button type="button" onClick={resetState}>Importar Novo Arquivo</Button>}
                    </div>
                </div>
            </div>
        </div>
    );
};