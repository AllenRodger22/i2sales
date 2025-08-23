import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Icon } from './Icon';
import { apiGetKpis, apiGetFunnel, apiGetCorretores } from '../services/api';
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
  const [isMobile, setIsMobile] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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


  const fetchUsers = async () => {
    try {
      const corretores = await apiGetCorretores();
      setUsers(
        (Array.isArray(corretores) ? corretores : []).map((user: any) => ({
          id: user._id || user.id,
          name: user.name || user.nome || user.username || user.email || 'Sem nome'
        }))
      );
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
      
      const [kpis, funnel] = await Promise.all([
        apiGetKpis(params.toString()),
        apiGetFunnel(params.toString())
      ]);
      
      setKpiData(kpis);
      setFunnelData(funnel);
      
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
  const getSelectedUserName = () => {
    if (selectedUsers.length === 1) {
      const user = users.find(u => u.id === selectedUsers[0]);
      return user ? user.name : '';
    }
    return '';
  };

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;
    return users.filter(u => (u.name || '').toLowerCase().includes(term));
  }, [users, searchTerm]);

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

  return (
    <div className="space-y-8">
      {isMobile && (
        <div className="mb-4 rounded-2xl border border-system-separator/40 bg-system-bg-secondary/60 text-system-label-primary px-4 py-3 text-center font-semibold tracking-wide">
          ABRA NO PC OU LAPTOP!!
        </div>
      )}

      
      <div className="glass-card rounded-3xl p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-system-label-primary mb-2">
              Dashboard de Inteligência
            </h1>
            <p className="text-lg text-system-label-secondary">
              Análise completa de performance e métricas de vendas
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="glass-panel rounded-2xl p-4">
              <label className="block text-sm font-medium text-system-label-secondary mb-2">
                Período de Análise
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="glass-card rounded-xl px-4 py-2 text-sm border-0 focus:ring-2 focus:ring-accent-orange/50 transition-all"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="glass-card rounded-xl px-4 py-2 text-sm border-0 focus:ring-2 focus:ring-accent-orange/50 transition-all"
                />
              </div>
            </div>
            <div className="glass-panel rounded-2xl p-4">
              <label className="block text-sm font-medium text-system-label-secondary mb-2">
                Filtrar por Usuário
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                  className="min-w-[200px] glass-card rounded-xl px-4 py-2 text-sm border-0 focus:ring-2 focus:ring-accent-orange/50 transition-all flex flex-wrap gap-1 items-center justify-between"
                  aria-haspopup="listbox"
                  aria-expanded={isPopoverOpen}
                  aria-label="Filtrar por Usuário"
                >
                <div className="flex flex-wrap gap-1">
                  {selectedUsers.length === 0 && (
                    <span className="text-system-label-secondary">Todos os corretores</span>
                  )}
                  {selectedUsers.map((id) => {
                    const u = users.find(x => x.id === id);
                    return (
                      <span key={id} className="inline-flex items-center gap-1 rounded-full bg-system-fill-secondary/60 text-system-label-primary px-2 py-0.5 text-xs">
                        <Icon name="person" aria-label="Corretor" /> {u?.name || 'Sem nome'}
                        <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedUsers(selectedUsers.filter(x => x !== id)); }} aria-label={`Remover ${u?.name || ''}`}>
                          <Icon name="close" />
                        </button>
                      </span>
                    );
                  })}
                </div>
                <Icon name="expand_more" aria-label="Abrir filtro" />
              </button>

                {isPopoverOpen && (
                  <div className="absolute z-20 mt-2 w-[320px] glass-overlay rounded-2xl p-3 right-0">
                  <div className="mb-2">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar usuários…"
                      className="w-full glass-card rounded-xl px-3 py-2 text-sm border-0 focus:ring-2 focus:ring-accent-orange/50"
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      id="all-corretores"
                      type="checkbox"
                      checked={selectedUsers.length === 0}
                      onChange={() => setSelectedUsers([])}
                    />
                    <label htmlFor="all-corretores" className="text-sm text-system-label-primary">Todos os corretores</label>
                  </div>
                  <div className="max-h-56 overflow-auto pr-1" role="listbox">
                    {filteredUsers.map(u => {
                      const checked = selectedUsers.includes(u.id);
                      return (
                        <label key={u.id} className="flex items-center gap-2 py-1 text-sm text-system-label-primary">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setSelectedUsers(checked ? selectedUsers.filter(x => x !== u.id) : [...selectedUsers, u.id]);
                            }}
                          />
                          <span>{u.name}</span>
                        </label>
                      );
                    })}
                    {filteredUsers.length === 0 && (
                      <div className="py-4 text-center text-system-label-secondary text-sm">Nenhum corretor encontrado</div>
                    )}
                  </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button className="glass-panel rounded-full px-4 py-1.5 text-sm text-system-label-primary hover:scale-105 transition-all" onClick={() => setIsPopoverOpen(false)}>Fechar</button>
                      <button className="bg-accent-orange text-white rounded-full px-4 py-1.5 text-sm hover:scale-105 transition-all" onClick={() => setIsPopoverOpen(false)}>Aplicar</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchData}
                disabled={isLoading}
                className="bg-accent-orange hover:scale-105 text-white rounded-2xl px-5 py-2 text-sm font-medium transition-all duration-300 shadow-lg shadow-accent-orange/25"
              >
                {isLoading ? 'Carregando…' : 'Atualizar'}
              </button>
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="glass-panel hover:scale-105 text-system-label-primary rounded-2xl px-5 py-2 text-sm font-medium transition-all duration-300"
              >
                {showComparison ? 'Ocultar comparação' : 'Comparar períodos'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {kpiData && funnelData && (
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => exportBiDataToCsv(kpiData, funnelData, startDate, endDate, getSelectedUserName())}
            className="glass-panel hover:scale-105 text-accent-orange rounded-2xl px-4 py-2 text-xs font-medium transition-all duration-300"
          >
            Exportar CSV
          </button>
          <button 
            onClick={() => exportBiDataToPdf(kpiData, funnelData, startDate, endDate, getSelectedUserName())}
            className="glass-panel hover:scale-105 text-apple-red rounded-2xl px-4 py-2 text-xs font-medium transition-all duration-300"
          >
            Exportar PDF
          </button>
          <button 
            onClick={() => exportBiDataToExcel(kpiData, funnelData, startDate, endDate, getSelectedUserName())}
            className="glass-panel hover:scale-105 text-apple-orange rounded-2xl px-4 py-2 text-xs font-medium transition-all duration-300"
          >
            Exportar Excel
          </button>
        </div>
      )}

      {kpiData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'VGV Total', value: kpiData.vgvTotal, format: 'currency', icon: '💰' },
            { title: 'Taxa de Conversão', value: conversionRate, format: 'percent', icon: '📊' },
            { title: 'Ticket Médio', value: kpiData.ticketMedio || 0, format: 'currency', icon: '💳' },
            { title: 'Total de Leads', value: totalLeads, format: 'number', icon: '📞' }
          ].map((kpi, index) => (
            <div key={index} className="glass-card rounded-3xl p-6 hover:scale-105 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl group-hover:scale-110 transition-transform duration-300">
                  {kpi.icon}
                </span>
                <div className="w-12 h-12 rounded-full bg-accent-orange/10 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-accent-orange/20"></div>
                </div>
              </div>
              <h3 className="text-sm font-medium text-system-label-secondary mb-2">
                {kpi.title}
              </h3>
              <p className="text-3xl font-bold text-system-label-primary">
                {kpi.format === 'currency' 
                  ? formatCurrency(kpi.value)
                  : kpi.format === 'percent'
                  ? `${kpi.value}%`
                  : kpi.value.toLocaleString('pt-BR')
                }
              </p>
            </div>
          ))}
        </div>
      )}

      {funnelData && (
        <div className="glass-card rounded-3xl p-6">
          <h3 className="text-xl font-semibold text-system-label-primary mb-6 text-center flex items-center justify-center gap-2"><Icon name="leaderboard" aria-label="Funil de Vendas" /> Funil de Vendas</h3>
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
        </div>
      )}
    </div>
  );
};
