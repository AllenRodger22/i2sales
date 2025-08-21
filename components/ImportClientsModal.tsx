import React, { useState } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';

interface ImportClientsModalProps {
    onClose: () => void;
    onImport: (file: File) => Promise<void>;
}

export const ImportClientsModal: React.FC<ImportClientsModalProps> = ({ onClose, onImport }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleImport = async () => {
        if (!file) {
            setError('Por favor, selecione um arquivo .CSV.');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            await onImport(file);
            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro ao importar os clientes.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const getStepContent = () => {
        if (isSuccess) {
            return (
                <div className="text-center p-8 flex flex-col items-center justify-center">
                   <div className="w-16 h-16 rounded-full bg-apple-green/15 flex items-center justify-center mb-4">
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-apple-green">
                           <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                       </svg>
                   </div>
                   <h3 className="text-lg font-semibold text-system-label-primary">Importação Enviada!</h3>
                   <p className="text-sm text-system-label-secondary mt-1">Os clientes estão sendo processados. A lista será atualizada em breve.</p>
                   <Button onClick={onClose} className="mt-6">Fechar</Button>
               </div>
           );
        }
        
        return (
            <>
                 <div className="p-6 border-b border-system-separator flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-system-label-primary">Importar Clientes via CSV</h2>
                     <button onClick={onClose} className="text-system-label-secondary hover:text-system-label-primary">
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-8 text-center space-y-4">
                    <Icon name="upload" className="w-16 h-16 mx-auto text-system-label-tertiary mb-4" />
                    <p className="text-sm text-system-label-secondary">Selecione um arquivo .CSV para importar múltiplos clientes de uma vez.</p>
                    <label className="inline-block w-full cursor-pointer">
                        <div className="flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-all border-2 border-dashed border-system-separator hover:border-apple-blue hover:text-apple-blue">
                             <input type="file" accept=".csv" onChange={handleFileChange} className="sr-only" />
                             <Icon name="sheet" className="w-5 h-5 mr-2" />
                            <span>{file ? file.name : 'Clique para selecionar o arquivo'}</span>
                        </div>
                    </label>
                    {error && <p className="text-sm text-apple-red">{error}</p>}
                </div>
                <div className="p-6 border-t border-system-separator flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleImport} disabled={!file || isLoading}>
                        {isLoading ? 'Importando...' : 'Importar'}
                    </Button>
                </div>
            </>
        );
    }


    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex justify-center items-center z-50 p-4">
            <div className="bg-system-bg-secondary rounded-2xl shadow-2xl w-full max-w-lg">
                {getStepContent()}
            </div>
        </div>
    );
};
