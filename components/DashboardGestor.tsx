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
  const [isMobile, setIsMobile] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    if ((mq as any).addEventListener) {
      (mq as any).addEventListener('change', update);
    } else {
      (mq as any).addListener(update);
    }
    return () => {
      if ((mq as any).removeEventListener) {
        (mq as any).removeEventListener('change', update);
      } else {
        (mq as any).removeListener(update);
      }
    };
  }, []);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    if (mq.addEventListener) {
      mq.addEventListener('change', update);
    } else {
      mq.addListener(update);
    }
    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener('change', update);
      } else {
        mq.removeListener(update);
      }
    };
  }, []);

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
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-system-label-primary">{titleText}</h1>
          <p className="text-system-label-secondary mt-1">Análise de performance e inteligência de negócios</p>
        </div>
        <div className="w-full sm:w-auto sm:ml-auto">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              aria-label="Data Inicial"
              className="w-full sm:w-auto bg-system-bg-primary/70 text-system-label-primary border border-system-separator/40 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              aria-label="Data Final"
              className="w-full sm:w-auto bg-system-bg-primary/70 text-system-label-primary border border-system-separator/40 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all"
            />
            <div className="relative">
              <select
                multiple
                value={selectedUsers}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const options = Array.from(e.target.selectedOptions).map((o) => (o as HTMLOptionElement).value);
                  if (options.includes('ALL')) {
                    setSelectedUsers([]);
                  } else {
                    setSelectedUsers(options);
                  }
                }}
                className="min-w-[220px] bg-system-bg-primary/70 text-system-label-primary border border-system-separator/40 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all min-h-[96px]"
                aria-label="Filtrar por Corretor(es)"
              >
                <option value="ALL">Todos os corretores</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
      {isMobile && (
        <div className="mb-4 rounded-2xl border border-apple-orange/40 bg-apple-orange/10 text-apple-orange px-4 py-3 text-center font-semibold tracking-wide">
          ABRA NO PC OU LAPTOP!!
        </div>
      )}

              <Button
                onClick={fetchData}
                disabled={isLoading}
                className="bg-apple-blue hover:bg-apple-blue/90 text-white rounded-full px-5 py-2 text-sm font-medium transition-all"
              >
                {isLoading ? 'Carregando…' : 'Atualizar'}
              </Button>
              <Button
                onClick={() => setShowComparison(!showComparison)}
                variant="secondary"
                className="bg-system-fill-secondary/60 hover:bg-system-fill-tertiary text-system-label-primary rounded-full px-5 py-2 text-sm font-medium transition-all"
              >
                {showComparison ? 'Ocultar comparação' : 'Comparar períodos'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {kpiData && funnelData && (
        <div className="flex flex-wrap gap-2 mt-3">
          <Button 
            onClick={() => exportBiDataToCsv(kpiData, funnelData, startDate, endDate, getSelectedUserName())}
            variant="secondary"
            className="bg-system-bg-secondary/50 hover:bg-system-bg-secondary text-system-label-primary border border-system-separator/40 rounded-full px-4 py-2 text-xs font-medium transition-all"
          >
            Exportar CSV
          </Button>
          <Button 
            onClick={() => exportBiDataToPdf(kpiData, funnelData, startDate, endDate, getSelectedUserName())}
            variant="secondary"
            className="bg-system-bg-secondary/50 hover:bg-system-bg-secondary text-system-label-primary border border-system-separator/40 rounded-full px-4 py-2 text-xs font-medium transition-all"
          >
            Exportar PDF
          </Button>
          <Button 
            onClick={() => exportBiDataToExcel(kpiData, funnelData, startDate, endDate, getSelectedUserName())}
            variant="secondary"
            className="bg-system-bg-secondary/50 hover:bg-system-bg-secondary text-system-label-primary border border-system-separator/40 rounded-full px-4 py-2 text-xs font-medium transition-all"
          >
            Exportar Excel
          </Button>
        </div>
      )}

      {kpiData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="text-center p-5 bg-system-bg-secondary/40 border border-system-separator/40 rounded-2xl">
            <h3 className="text-xs font-medium text-system-label-secondary mb-1">Receita Total (VGV)</h3>
            <p className="text-2xl font-semibold text-system-label-primary">{formatCurrency(kpiData.vgvTotal)}</p>
          </Card>

          <Card className="text-center p-5 bg-system-bg-secondary/40 border border-system-separator/40 rounded-2xl">
            <h3 className="text-xs font-medium text-system-label-secondary mb-1">Taxa de Conversão</h3>
            <p className="text-2xl font-semibold text-system-label-primary">{conversionRate}%</p>
          </Card>

          <Card className="text-center p-5 bg-system-bg-secondary/40 border border-system-separator/40 rounded-2xl">
            <h3 className="text-xs font-medium text-system-label-secondary mb-1">Ticket Médio</h3>
            <p className="text-2xl font-semibold text-system-label-primary">{formatCurrency(kpiData.ticketMedio || 0)}</p>
          </Card>

          <Card className="text-center p-5 bg-system-bg-secondary/40 border border-system-separator/40 rounded-2xl">
            <h3 className="text-xs font-medium text-system-label-secondary mb-1">Número de Leads</h3>
            <p className="text-2xl font-semibold text-system-label-primary">{totalLeads}</p>
          </Card>
        </div>
      )}

      {funnelData && (
        <Card className="p-6 bg-system-bg-secondary/40 border border-system-separator/40 rounded-2xl">
          <h3 className="text-xl font-semibold text-system-label-primary mb-6 text-center">Funil de Vendas</h3>
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
      )}
      {conversionSeries && conversionSeries.length > 0 && (
        <Card className="p-6 bg-system-bg-secondary/40 border border-system-separator/40 rounded-2xl mt-6">
          <h3 className="text-xl font-semibold text-system-label-primary mb-4 text-center">Taxa de Conversão ao longo do tempo</h3>
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
    </div>
  );
};
