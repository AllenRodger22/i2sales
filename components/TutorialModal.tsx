

import React from 'react';
import { Button } from './Button';
import { Icon } from './Icon';

interface TutorialModalProps {
    onClose: () => void;
}

const Rule: React.FC<{ icon: 'alert-triangle' | 'export' | 'whatsapp', title: string, children: React.ReactNode, iconClass?: string }> = ({ icon, title, children, iconClass = 'text-system-label-secondary' }) => (
    <div className="flex items-start gap-4">
        <div className="mt-1">
            <Icon name={icon} className={`w-6 h-6 ${iconClass}`} />
        </div>
        <div>
            <h3 className="font-semibold text-system-label-primary">{title}</h3>
            <p className="text-sm text-system-label-secondary">{children}</p>
        </div>
    </div>
);

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex justify-center items-center z-[100] p-4">
            <div className="bg-system-bg-secondary rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="p-6 border-b border-system-separator">
                    <h2 className="text-xl font-semibold text-system-label-primary">Bem-vindo ao i2Sales CRM!</h2>
                    <p className="text-sm text-system-label-secondary mt-1">Antes de começar, leia estas 3 regras importantes.</p>
                </div>
                <div className="p-6 space-y-6">
                    <Rule icon="alert-triangle" title="Seus Dados Ficam no Navegador" iconClass="text-apple-orange">
                        Tudo fica salvo <strong>apenas no seu navegador atual.</strong> Não limpe os dados de navegação ou cookies, senão você perderá <strong className="text-apple-red">TUDO!</strong>
                    </Rule>
                    <Rule icon="export" title="Exporte Seus Dados Regularmente">
                        Para garantir a segurança das suas informações e ter um backup, use o botão <strong>"Exportar"</strong> na tela principal para salvar uma cópia dos seus clientes.
                    </Rule>
                    <Rule icon="whatsapp" title="Sugestões e Melhorias" iconClass="text-apple-green">
                        Encontrou algum problema ou tem uma ideia? Fale com o Roger. Sua opinião é muito importante!
                        <a 
                            href="https://wa.me/5585985315653" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-apple-blue hover:underline mt-2"
                        >
                            <Icon name="whatsapp" className="w-4 h-4" />
                            Avisar no WhatsApp
                        </a>
                    </Rule>
                </div>
                <div className="p-6 border-t border-system-separator flex justify-end">
                    <Button onClick={onClose}>Entendi, vamos começar!</Button>
                </div>
            </div>
        </div>
    );
};