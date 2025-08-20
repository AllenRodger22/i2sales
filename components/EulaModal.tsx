
import React, { useState } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';

interface EulaModalProps {
    onAccept: () => void;
}

export const EulaModal: React.FC<EulaModalProps> = ({ onAccept }) => {
    const [isChecked, setIsChecked] = useState(false);

    return (
        <div className="fixed inset-0 bg-system-bg-secondary flex justify-center items-center z-[100] p-4">
            <div className="bg-system-bg-primary rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col">
                <div className="p-6 border-b border-system-separator flex-shrink-0">
                    <h2 className="text-2xl font-bold text-system-label-primary">Acordo de Licença de Usuário Final (EULA)</h2>
                </div>
                <div className="p-6 flex-grow overflow-y-auto space-y-6 text-system-label-secondary">
                    <p className="text-sm"><strong>Última atualização:</strong> 20/08/2025</p>
                    <hr className="border-system-separator"/>

                    <h3 className="text-lg font-semibold text-system-label-primary">1. Aceitação dos Termos</h3>
                    <p>Ao instalar, acessar ou utilizar o <strong>i2Sales</strong>, você concorda em cumprir os termos deste Acordo.<br/>Se não concordar, <strong>não use o software</strong>.</p>
                    <hr className="border-system-separator"/>

                    <h3 className="text-lg font-semibold text-system-label-primary">2. Concessão de Licença</h3>
                    <ul className="list-disc list-inside space-y-2">
                        <li><strong>Alan Roger Moreira Aragao</strong> concede ao usuário uma <strong>licença limitada, não exclusiva e intransferível</strong> para uso do i2Sales, exclusivamente para fins comerciais internos.</li>
                        <li>O usuário <strong>não adquire a propriedade do software</strong>, apenas o direito de usá-lo conforme previsto neste acordo.</li>
                    </ul>
                    <hr className="border-system-separator"/>

                    <h3 className="text-lg font-semibold text-system-label-primary">3. Restrições</h3>
                    <p>O usuário não pode:</p>
                    <ul className="list-disc list-inside space-y-2">
                        <li>Copiar, modificar, distribuir ou criar trabalhos derivados do software sem autorização escrita.</li>
                        <li>Alugar, vender, sublicenciar ou disponibilizar o software a terceiros.</li>
                        <li>Reverter engenharia, descompilar ou tentar acessar o código-fonte.</li>
                        <li>Usar o software para atividades ilegais ou que violem leis aplicáveis.</li>
                    </ul>
                    <hr className="border-system-separator"/>

                    <h3 className="text-lg font-semibold text-system-label-primary">4. Propriedade Intelectual</h3>
                    <p>Todo o conteúdo, código, design e funcionalidades do <strong>i2Sales</strong> são de propriedade exclusiva de <strong>Alan Roger Moreira Aragao</strong>, protegidos por leis de direitos autorais, marcas e outras legislações aplicáveis.</p>
                    <hr className="border-system-separator"/>

                    <h3 className="text-lg font-semibold text-system-label-primary">5. Atualizações e Manutenção</h3>
                    <p>O autor pode fornecer atualizações, melhorias ou correções.<br/>Essas atualizações ficam automaticamente sujeitas a este EULA, salvo disposição em contrário.</p>
                    <hr className="border-system-separator"/>

                    <h3 className="text-lg font-semibold text-system-label-primary">6. Suporte</h3>
                    <p>O suporte técnico será oferecido conforme as condições definidas pelo autor.</p>
                    <hr className="border-system-separator"/>

                    <h3 className="text-lg font-semibold text-system-label-primary">7. Limitação de Responsabilidade</h3>
                     <ul className="list-disc list-inside space-y-2">
                        <li>O software é fornecido <strong>“como está”</strong>, sem garantias de desempenho ou adequação a um propósito específico.</li>
                        <li>Em nenhuma circunstância o autor será responsável por perdas indiretas, lucros cessantes ou danos decorrentes do uso ou impossibilidade de uso do software.</li>
                    </ul>
                    <hr className="border-system-separator"/>
                    
                    <h3 className="text-lg font-semibold text-system-label-primary">8. Rescisão</h3>
                    <p>Este acordo permanece em vigor até ser encerrado.<br/>O autor pode rescindir a licença caso o usuário viole qualquer cláusula.<br/>Em caso de rescisão, o usuário deve desinstalar e cessar o uso do software imediatamente.</p>
                    <hr className="border-system-separator"/>

                    <h3 className="text-lg font-semibold text-system-label-primary">9. Lei Aplicável</h3>
                    <p>Este acordo será regido pelas leis brasileiras.<br/>Fica eleito o foro da comarca de <strong>Fortaleza, Ceará</strong>, com renúncia a qualquer outro, para dirimir eventuais litígios.</p>
                    <hr className="border-system-separator"/>

                    <h3 className="text-lg font-semibold text-system-label-primary">10. Disposições Gerais</h3>
                    <ul className="list-disc list-inside space-y-2">
                        <li>Este EULA constitui o acordo integral entre as partes.</li>
                        <li>Se qualquer disposição for considerada inválida, as demais permanecerão em vigor.</li>
                    </ul>
                    <hr className="border-system-separator"/>
                    
                    <p className="text-center font-semibold"><strong>Alan Roger Moreira Aragao</strong> – Todos os direitos reservados.</p>
                </div>
                <div className="p-6 border-t border-system-separator flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={isChecked} 
                            onChange={() => setIsChecked(!isChecked)} 
                            className="form-checkbox h-5 w-5 rounded text-apple-blue bg-system-bg-tertiary border-system-separator focus:ring-apple-blue"
                        />
                        <span className="text-sm text-system-label-primary">Eu li e concordo com os termos e condições.</span>
                    </label>
                    <Button onClick={onAccept} disabled={!isChecked}>
                        Aceitar e Continuar
                    </Button>
                </div>
            </div>
        </div>
    );
};
