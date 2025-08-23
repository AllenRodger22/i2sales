import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Icon } from './Icon';
import { apiGetKpis, apiGetFunnel, apiGetCorretores, apiGetConversionSeries } from '../services/api';
import type { UserOption } from '../types';
import { exportBiDataToCsv, exportBiDataToPdf, exportBiDataToExcel } from '../utils/biExporter';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';

interface KpiData {
  vgvTotal: number;
  numeroLigacoes: number;
  numeroDocumentos: number;
  totalVendas: number;
  ticketMedio?: number;
  tempoMedioFechamento?: number;
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
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonKpiData, setComparisonKpiData] = useState<KpiData | null>(null);
  const [comparisonFunnelData, setComparisonFunnelData] = useState<FunnelData | null>(null);
  const [conversionSeries, setConversionSeries] = useState<{ date: string; leads: number; vendas: number; conversion: number; }[]>([]);

  const fetchUsers = async () => {
    try {
      const corretores = await apiGetCorretores();
      setUsers(corretores.map((user: any) => ({ id: user._id, name: user.name })));
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        startDate,
        endDate
      });
      if (selectedUsers.length === 1) {
        params.set('userId', selectedUsers[0]);
      } else if (selectedUsers.length > 1) {
        params.set('userIds', selectedUsers.join(','));
      }
      
      const [kpis, funnel, series] = await Promise.all([
        apiGetKpis(params.toString()),
        apiGetFunnel(params.toString()),
        apiGetConversionSeries(params.toString())
      ]);
      
      setKpiData(kpis);
      setFunnelData(funnel);
      setConversionSeries(Array.isArray(series) ? series : []);
      
      if (showComparison) {
        await fetchComparisonData();
      }
    } catch (error) {
      console.error('Erro ao buscar dados de BI:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComparisonData = async () => {
    if (!showComparison) return;
    
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    const comparisonStartDate = new Date(startDateObj);
    comparisonStartDate.setDate(comparisonStartDate.getDate() - daysDiff);
    const comparisonEndDate = new Date(startDateObj);
    comparisonEndDate.setDate(comparisonEndDate.getDate() - 1);
    
    try {
      const params = new URLSearchParams({
        startDate: comparisonStartDate.toISOString().split('T')[0],
        endDate: comparisonEndDate.toISOString().split('T')[0]
      });
      if (selectedUsers.length === 1) {
        params.set('userId', selectedUsers[0]);
      } else if (selectedUsers.length > 1) {
        params.set('userIds', selectedUsers.join(','));
      }
      
      const [kpis, funnel] = await Promise.all([
        apiGetKpis(params.toString()),
        apiGetFunnel(params.toString())
      ]);
      
      setComparisonKpiData(kpis);
      setComparisonFunnelData(funnel);
    } catch (error) {
      console.error('Erro ao buscar dados de comparação:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, selectedUsers]);

  useEffect(() => {
    if (showComparison) {
      fetchComparisonData();
    } else {
      setComparisonKpiData(null);
      setComparisonFunnelData(null);
    }
  }, [showComparison]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalLeads = useMemo(() => {
    if (!funnelData) return 0;
    return funnelData.ligacoes;
  }, [funnelData]);

  const conversionRate = useMemo(() => {
    if (!funnelData) return 0;
    return totalLeads > 0 ? Math.round((funnelData.vendas / totalLeads) * 100) : 0;
  }, [funnelData, totalLeads]);

  const titleText = useMemo(() => {
    if (selectedUsers.length === 1) {
      return `Dashboard de Performance de Vendas do corretor ${getSelectedUserName()}`;
    }
    return 'Dashboard de Performance de Vendas da equipe';
  }, [selectedUsers, users]);

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100);
  };

  const getSelectedUserName = () => {
    if (selectedUsers.length === 1) {
      const user = users.find(u => u.id === selectedUsers[0]);
      return user ? user.name : '';
    }
    return '';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-system-label-primary">{titleText}</h1>
          <p className="text-system-label-secondary mt-2">Análise de performance e inteligência de negócios</p>
        </div>
      </header>

      <Card className="p-6 bg-system-bg-secondary/50 backdrop-blur-sm border border-system-separator/50 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-system-label-primary mb-2">
              📅 Data Inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-system-bg-primary text-system-label-primary border border-system-separator/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/50 focus:border-apple-blue transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-system-label-primary mb-2">
              📅 Data Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-system-bg-primary text-system-label-primary border border-system-separator/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/50 focus:border-apple-blue transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-system-label-primary mb-2">
              👤 Filtrar por Corretor(es)
            </label>
            <select
              multiple
              value={selectedUsers}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const options = Array.from(e.target.selectedOptions).map(o => o.value);
                setSelectedUsers(options);
              }}
              className="w-full bg-system-bg-primary text-system-label-primary border border-system-separator/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/50 focus:border-apple-blue transition-all duration-200 min-h-[120px]"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={fetchData} 
              disabled={isLoading}
              className="bg-apple-blue hover:bg-apple-blue/90 text-white rounded-xl px-6 py-3 font-medium transition-all duration-200 hover:scale-105 shadow-lg shadow-apple-blue/25"
            >
              <Icon name="refresh-cw" className="w-4 h-4 mr-2" />
              {isLoading ? 'Carregando...' : 'Atualizar'}
            </Button>
            <Button 
              onClick={() => setShowComparison(!showComparison)} 
              variant="secondary"
              className="bg-system-fill-secondary hover:bg-system-fill-tertiary text-system-label-primary rounded-xl px-6 py-3 font-medium transition-all duration-200"
            >
              <Icon name="bar-chart-3" className="w-4 h-4 mr-2" />
              {showComparison ? 'Ocultar Comparação' : 'Comparar Períodos'}
            </Button>
          </div>
        </div>
        
        {kpiData && funnelData && (
          <div className="flex flex-wrap gap-2 mt-4">
            <Button 
              onClick={() => exportBiDataToCsv(kpiData, funnelData, startDate, endDate, getSelectedUserName())}
              variant="secondary"
              className="bg-apple-green/10 hover:bg-apple-green/20 text-apple-green border border-apple-green/30 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200"
            >
              <Icon name="download" className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button 
              onClick={() => exportBiDataToPdf(kpiData, funnelData, startDate, endDate, getSelectedUserName())}
              variant="secondary"
              className="bg-apple-red/10 hover:bg-apple-red/20 text-apple-red border border-apple-red/30 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200"
            >
              <Icon name="file-text" className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
            <Button 
              onClick={() => exportBiDataToExcel(kpiData, funnelData, startDate, endDate, getSelectedUserName())}
              variant="secondary"
              className="bg-apple-blue/10 hover:bg-apple-blue/20 text-apple-blue border border-apple-blue/30 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200"
            >
              <Icon name="table" className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        )}
      </Card>

      {kpiData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center p-6 bg-gradient-to-br from-apple-green/10 to-apple-green/5 border border-apple-green/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="text-2xl mb-2">💰</div>
            <h3 className="text-sm font-semibold text-system-label-secondary mb-2">Receita Total (VGV)</h3>
            <p className="text-3xl font-bold text-apple-green">{formatCurrency(kpiData.vgvTotal)}</p>
          </Card>

          <Card className="text-center p-6 bg-gradient-to-br from-apple-blue/10 to-apple-blue/5 border border-apple-blue/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="text-2xl mb-2">📈</div>
            <h3 className="text-sm font-semibold text-system-label-secondary mb-2">Taxa de Conversão</h3>
            <p className={`text-3xl font-bold ${conversionRate >= 20 ? 'text-apple-green' : 'text-apple-orange'}`}>{conversionRate}%</p>
          </Card>

          <Card className="text-center p-6 bg-gradient-to-br from-apple-purple/10 to-apple-purple/5 border border-apple-purple/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="text-2xl mb-2">🎟️</div>
            <h3 className="text-sm font-semibold text-system-label-secondary mb-2">Ticket Médio</h3>
            <p className="text-3xl font-bold text-apple-purple">{formatCurrency(kpiData.ticketMedio || 0)}</p>
          </Card>

          <Card className="text-center p-6 bg-gradient-to-br from-apple-orange/10 to-apple-orange/5 border border-apple-orange/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="text-2xl mb-2">👥</div>
            <h3 className="text-sm font-semibold text-system-label-secondary mb-2">Número de Leads</h3>
            <p className="text-3xl font-bold text-apple-orange">{totalLeads}</p>
          </Card>
        </div>
      )}

      {funnelData && (
        <Card className="p-6 bg-system-bg-secondary/30 backdrop-blur-sm border border-system-separator/50 shadow-xl">
          <h3 className="text-2xl font-bold text-system-label-primary mb-8 text-center">🔄 Funil de Vendas</h3>
          <div className="w-full h-96">
            <ResponsiveContainer>
              <FunnelChart>
                <ReTooltip />
                <Funnel
                  data={[
                    { name: 'Ligações', value: funnelData.ligacoes },
                    { name: 'Atendimentos', value: funnelData.atendimentos },
                    { name: 'Interessados', value: funnelData.interessados },
                    { name: 'Documentação', value: funnelData.documentacao },
                    { name: 'Vendas', value: funnelData.vendas }
                  ]}
                  isAnimationActive
                >
                  <LabelList position="right" fill="#fff" stroke="none" dataKey="name" />
                  <LabelList position="inside" fill="#111" dataKey="value" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center mt-6">
            <div className="text-sm">Ligação → Atendimento: <span className="font-semibold">{funnelData.conversoes.ligacaoParaAtendimento}%</span></div>
            <div className="text-sm">Atendimento → Interessado: <span className="font-semibold">{funnelData.conversoes.atendimentoParaInteressado}%</span></div>
            <div className="text-sm">Interessado → Documentação: <span className="font-semibold">{funnelData.conversoes.interessadoParaDocumentacao}%</span></div>
            <div className="text-sm">Documentação → Venda: <span className="font-semibold">{funnelData.conversoes.documentacaoParaVenda}%</span></div>
          </div>
        </Card>
      {conversionSeries && conversionSeries.length > 0 && (
        <Card className="p-6 bg-system-bg-secondary/30 backdrop-blur-sm border border-system-separator/50 shadow-xl mt-6">
          <h3 className="text-2xl font-bold text-system-label-primary mb-4 text-center">📈 Taxa de Conversão ao longo do tempo</h3>
          <div className="w-full h-80">
            <ResponsiveContainer>
              <LineChart data={conversionSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <ReTooltip formatter={(v, n) => n === 'conversion' ? [`${v}%`, 'Conversão'] : [v, n]} />
                <Line type="monotone" dataKey="conversion" stroke="#007aff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
      )}
    </div>
  );
};
