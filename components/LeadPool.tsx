import React, { useState, useEffect } from 'react';
import type { Client } from '../types';
import { Card } from './Card';
import { Button } from './Button';
import { Icon } from './Icon';
import { apiGetArchivedLeads, apiAssignLead, apiGetCorretores } from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
}

export const LeadPool: React.FC = () => {
  const [archivedLeads, setArchivedLeads] = useState<Client[]>([]);
  const [corretores, setCorretores] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assigningLeadId, setAssigningLeadId] = useState<string | null>(null);

  const fetchArchivedLeads = async () => {
    try {
      const response = await apiGetArchivedLeads();
      setArchivedLeads(response);
    } catch (error) {
      console.error('Erro ao buscar leads arquivados:', error);
    }
  };

  const fetchCorretores = async () => {
    try {
      const response = await apiGetCorretores();
      setCorretores(response);
    } catch (error) {
      console.error('Erro ao buscar corretores:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchArchivedLeads(), fetchCorretores()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleAssignLead = async (leadId: string, userId: string) => {
    setAssigningLeadId(leadId);
    try {
      await apiAssignLead(leadId, userId);
      
      await fetchArchivedLeads();
      alert('Lead atribuído com sucesso!');
    } catch (error) {
      console.error('Erro ao atribuir lead:', error);
      alert('Erro ao atribuir lead. Tente novamente.');
    } finally {
      setAssigningLeadId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-system-label-secondary">Carregando bolsão de leads...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-system-label-primary">Bolsão de Leads</h1>
        <p className="text-system-label-secondary mt-1">
          Gerencie e distribua leads para os corretores ({archivedLeads.length} leads disponíveis)
        </p>
      </header>

      <div className="grid gap-4">
        {archivedLeads.length === 0 ? (
          <Card className="text-center p-8">
            <Icon name="inbox" className="w-12 h-12 mx-auto text-system-label-tertiary mb-4" />
            <p className="text-system-label-secondary">Nenhum lead no bolsão no momento.</p>
          </Card>
        ) : (
          archivedLeads.map((lead) => (
            <Card key={lead._id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-system-label-primary">{lead.name}</h3>
                  <div className="text-sm text-system-label-secondary space-y-1">
                    <p>📞 {lead.phone}</p>
                    <p>📧 {lead.email}</p>
                    <p>🏷️ {lead.origin}</p>
                    <p>📅 {new Date(lead.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <select
                    className="bg-system-bg-primary text-system-label-primary border border-system-separator rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAssignLead(lead._id!, e.target.value);
                        e.target.value = '';
                      }
                    }}
                    disabled={assigningLeadId === lead._id}
                  >
                    <option value="">Selecionar corretor...</option>
                    {corretores.map((corretor) => (
                      <option key={corretor._id} value={corretor._id}>
                        {corretor.name}
                      </option>
                    ))}
                  </select>
                  
                  {assigningLeadId === lead._id && (
                    <div className="text-sm text-system-label-secondary">Atribuindo...</div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
