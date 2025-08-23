import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Icon } from './Icon';
import { apiGetKpis, apiGetFunnel, apiGetCorretores } from '../services/api';
import type { UserOption } from '../types';

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
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [users, setUsers] = useState<UserOption[]>([]);

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
        endDate,
        ...(selectedUser && { userId: selectedUser })
      });
      
      const [kpis, funnel] = await Promise.all([
        apiGetKpis(params.toString()),
        apiGetFunnel(params.toString())
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
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, selectedUser]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-system-label-primary">Dashboard BI</h1>
        <p className="text-system-label-secondary mt-2">Análise de performance e inteligência de negócios</p>
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
              👤 Filtrar por Usuário
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full bg-system-bg-primary text-system-label-primary border border-system-separator/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/50 focus:border-apple-blue transition-all duration-200"
            >
              <option value="">Todos os usuários</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <Button 
            onClick={fetchData} 
            disabled={isLoading}
            className="bg-apple-blue hover:bg-apple-blue/90 text-white rounded-xl px-6 py-3 font-medium transition-all duration-200 hover:scale-105 shadow-lg shadow-apple-blue/25"
          >
            <Icon name="refresh-cw" className="w-4 h-4 mr-2" />
            {isLoading ? 'Carregando...' : 'Atualizar'}
          </Button>
        </div>
      </Card>

      {kpiData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center p-6 bg-gradient-to-br from-apple-green/10 to-apple-green/5 border border-apple-green/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="text-2xl mb-2">💰</div>
            <h3 className="text-sm font-semibold text-system-label-secondary mb-2">VGV Total</h3>
            <p className="text-3xl font-bold text-apple-green">{formatCurrency(kpiData.vgvTotal)}</p>
          </Card>
          
          <Card className="text-center p-6 bg-gradient-to-br from-apple-blue/10 to-apple-blue/5 border border-apple-blue/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="text-2xl mb-2">📞</div>
            <h3 className="text-sm font-semibold text-system-label-secondary mb-2">Número de Ligações</h3>
            <p className="text-3xl font-bold text-apple-blue">{kpiData.numeroLigacoes}</p>
          </Card>
          
          <Card className="text-center p-6 bg-gradient-to-br from-apple-purple/10 to-apple-purple/5 border border-apple-purple/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="text-2xl mb-2">📄</div>
            <h3 className="text-sm font-semibold text-system-label-secondary mb-2">Número de Documentos</h3>
            <p className="text-3xl font-bold text-apple-purple">{kpiData.numeroDocumentos}</p>
          </Card>
          
          <Card className="text-center p-6 bg-gradient-to-br from-apple-orange/10 to-apple-orange/5 border border-apple-orange/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="text-sm font-semibold text-system-label-secondary mb-2">Total de Vendas</h3>
            <p className="text-3xl font-bold text-apple-orange">{kpiData.totalVendas}</p>
          </Card>
        </div>
      )}

      {funnelData && (
        <Card className="p-6 bg-system-bg-secondary/30 backdrop-blur-sm border border-system-separator/50 shadow-xl">
          <h3 className="text-2xl font-bold text-system-label-primary mb-8 text-center">🔄 Funil de Vendas</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-red-500/20 to-red-400/10 border border-red-400/30 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
              <div>
                <span className="font-bold text-system-label-primary text-lg">📞 Ligações</span>
                <p className="text-sm text-system-label-secondary">Clientes contatados</p>
              </div>
              <span className="text-3xl font-bold text-red-500">{funnelData.ligacoes}</span>
            </div>
            
            <div className="flex items-center justify-center py-2">
              <div className="text-center text-sm font-medium text-system-label-secondary bg-system-fill-primary/50 px-4 py-2 rounded-full">
                ↓ {funnelData.conversoes.ligacaoParaAtendimento}% de conversão
              </div>
            </div>
            
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-orange-500/20 to-orange-400/10 border border-orange-400/30 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
              <div>
                <span className="font-bold text-system-label-primary text-lg">🤝 Atendimentos</span>
                <p className="text-sm text-system-label-secondary">Primeiro contato realizado</p>
              </div>
              <span className="text-3xl font-bold text-orange-500">{funnelData.atendimentos}</span>
            </div>
            
            <div className="flex items-center justify-center py-2">
              <div className="text-center text-sm font-medium text-system-label-secondary bg-system-fill-primary/50 px-4 py-2 rounded-full">
                ↓ {funnelData.conversoes.atendimentoParaInteressado}% de conversão
              </div>
            </div>
            
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-yellow-500/20 to-yellow-400/10 border border-yellow-400/30 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
              <div>
                <span className="font-bold text-system-label-primary text-lg">💡 Interessados</span>
                <p className="text-sm text-system-label-secondary">Demonstraram interesse</p>
              </div>
              <span className="text-3xl font-bold text-yellow-600">{funnelData.interessados}</span>
            </div>
            
            <div className="flex items-center justify-center py-2">
              <div className="text-center text-sm font-medium text-system-label-secondary bg-system-fill-primary/50 px-4 py-2 rounded-full">
                ↓ {funnelData.conversoes.interessadoParaDocumentacao}% de conversão
              </div>
            </div>
            
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-500/20 to-blue-400/10 border border-blue-400/30 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
              <div>
                <span className="font-bold text-system-label-primary text-lg">📄 Documentação</span>
                <p className="text-sm text-system-label-secondary">Enviaram documentos</p>
              </div>
              <span className="text-3xl font-bold text-blue-500">{funnelData.documentacao}</span>
            </div>
            
            <div className="flex items-center justify-center py-2">
              <div className="text-center text-sm font-medium text-system-label-secondary bg-system-fill-primary/50 px-4 py-2 rounded-full">
                ↓ {funnelData.conversoes.documentacaoParaVenda}% de conversão
              </div>
            </div>
            
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-500/30 to-green-400/20 border-2 border-green-400/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div>
                <span className="font-bold text-green-600 text-xl">🎉 Vendas</span>
                <p className="text-sm text-green-600/80">Negócios fechados</p>
              </div>
              <span className="text-4xl font-bold text-green-600">{funnelData.vendas}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
