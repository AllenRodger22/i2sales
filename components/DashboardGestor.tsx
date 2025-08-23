import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Icon } from './Icon';
import { apiGetKpis, apiGetFunnel } from '../services/api';

interface KpiData {
  vgvTotal: number;
  ticketMedio: number;
  totalVendas: number;
  tempoMedioFechamento: number;
}

interface FunnelData {
  ligacoes: number;
  atendimentos: number;
  interessados: number;
  documentacao: number;
  vendas: number;
  conversoes: {
    ligacaoParaAtendimento: number;
    atendimentoParaInteressado: number;
    interessadoParaDocumentacao: number;
    documentacaoParaVenda: number;
  };
}

export const DashboardGestor: React.FC = () => {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [kpis, funnel] = await Promise.all([
        apiGetKpis(startDate, endDate),
        apiGetFunnel(startDate, endDate)
      ]);
      
      setKpiData(kpis);
      setFunnelData(funnel);
    } catch (error) {
      console.error('Erro ao buscar dados de BI:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-system-label-primary">Dashboard Gestor</h1>
        <p className="text-system-label-secondary mt-1">Análise de performance e inteligência de negócios</p>
      </header>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-system-label-primary mb-2">
              Data Inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-system-bg-primary text-system-label-primary border border-system-separator rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-system-label-primary mb-2">
              Data Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-system-bg-primary text-system-label-primary border border-system-separator rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
            />
          </div>
          <Button onClick={fetchData} disabled={isLoading}>
            <Icon name="refresh-cw" className="w-4 h-4 mr-2" />
            {isLoading ? 'Carregando...' : 'Atualizar'}
          </Button>
        </div>
      </Card>

      {kpiData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center p-6">
            <h3 className="text-sm font-semibold text-system-label-secondary mb-2">VGV Total</h3>
            <p className="text-3xl font-bold text-apple-green">{formatCurrency(kpiData.vgvTotal)}</p>
          </Card>
          
          <Card className="text-center p-6">
            <h3 className="text-sm font-semibold text-system-label-secondary mb-2">Ticket Médio</h3>
            <p className="text-3xl font-bold text-apple-blue">{formatCurrency(kpiData.ticketMedio)}</p>
          </Card>
          
          <Card className="text-center p-6">
            <h3 className="text-sm font-semibold text-system-label-secondary mb-2">Total de Vendas</h3>
            <p className="text-3xl font-bold text-apple-purple">{kpiData.totalVendas}</p>
          </Card>
          
          <Card className="text-center p-6">
            <h3 className="text-sm font-semibold text-system-label-secondary mb-2">Tempo Médio de Fechamento</h3>
            <p className="text-3xl font-bold text-apple-orange">{kpiData.tempoMedioFechamento} dias</p>
          </Card>
        </div>
      )}

      {funnelData && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-system-label-primary mb-6">Funil de Vendas</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-system-fill-secondary rounded-lg">
              <div>
                <span className="font-medium text-system-label-primary">Ligações</span>
                <p className="text-sm text-system-label-secondary">Clientes contatados</p>
              </div>
              <span className="text-2xl font-bold text-system-label-primary">{funnelData.ligacoes}</span>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="text-center text-sm text-system-label-secondary">
                ↓ {funnelData.conversoes.ligacaoParaAtendimento}% de conversão
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-system-fill-secondary rounded-lg">
              <div>
                <span className="font-medium text-system-label-primary">Atendimentos</span>
                <p className="text-sm text-system-label-secondary">Primeiro contato realizado</p>
              </div>
              <span className="text-2xl font-bold text-system-label-primary">{funnelData.atendimentos}</span>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="text-center text-sm text-system-label-secondary">
                ↓ {funnelData.conversoes.atendimentoParaInteressado}% de conversão
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-system-fill-secondary rounded-lg">
              <div>
                <span className="font-medium text-system-label-primary">Interessados</span>
                <p className="text-sm text-system-label-secondary">Demonstraram interesse</p>
              </div>
              <span className="text-2xl font-bold text-system-label-primary">{funnelData.interessados}</span>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="text-center text-sm text-system-label-secondary">
                ↓ {funnelData.conversoes.interessadoParaDocumentacao}% de conversão
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-system-fill-secondary rounded-lg">
              <div>
                <span className="font-medium text-system-label-primary">Documentação</span>
                <p className="text-sm text-system-label-secondary">Enviaram documentos</p>
              </div>
              <span className="text-2xl font-bold text-system-label-primary">{funnelData.documentacao}</span>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="text-center text-sm text-system-label-secondary">
                ↓ {funnelData.conversoes.documentacaoParaVenda}% de conversão
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-apple-green bg-opacity-10 border border-apple-green rounded-lg">
              <div>
                <span className="font-medium text-apple-green">Vendas</span>
                <p className="text-sm text-apple-green opacity-80">Negócios fechados</p>
              </div>
              <span className="text-2xl font-bold text-apple-green">{funnelData.vendas}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
