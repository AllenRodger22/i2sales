import React, { useState, useMemo, useEffect } from 'react';
import { useClients } from './hooks/useClients';
import { Dashboard } from './components/Dashboard';
import { ClientDetail } from './components/ClientDetail';
import { AddClientModal } from './components/AddClientModal';
import { ProductivityReport } from './components/BrokerPanel';
import { DashboardGestor } from './components/DashboardGestor';
import { LeadPool } from './components/LeadPool';
import { AuthCallback } from './components/AuthCallback';
import { ProtectedRoleRoute } from './components/ProtectedRoleRoute';
import { AuthScreen } from './components/Auth';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { EulaModal } from './components/EulaModal';
import type { Client } from './types';


type View = { type: 'DASHBOARD' } | { type: 'CLIENT_DETAIL'; clientId: string } | { type: 'PRODUCTIVITY_REPORT' } | { type: 'DASHBOARD_GESTOR' } | { type: 'LEAD_POOL' };

const CrmApp: React.FC<{ userName: string, onLogout: () => void, userRole: 'corretor' | 'gestor' }> = ({ userName, onLogout, userRole }) => {
    const { clients, isLoading, addClient, findClientById, updateClient, importClients, deleteClient, deleteAllClients } = useClients();
    
    const [view, setView] = useState<View>({ type: userRole === 'gestor' ? 'DASHBOARD_GESTOR' : 'DASHBOARD' });
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleClientSelect = (id: string) => {
        setView({ type: 'CLIENT_DETAIL', clientId: id });
    };

    const handleBackToDashboard = () => {
        setView({ type: 'DASHBOARD' });
    };

    const handleShowProductivityReport = () => {
        setView({ type: 'PRODUCTIVITY_REPORT' });
    };

    const currentClient = useMemo(() => {
        if (view.type === 'CLIENT_DETAIL') {
            // Client ID from the backend is `_id`
            return findClientById(view.clientId);
        }
        return null;
    }, [view, findClientById]);
    
    if (isLoading) {
         return (
            <div className="flex items-center justify-center h-screen bg-system-bg-secondary">
                <p className="text-system-label-secondary">Carregando seus dados...</p>
            </div>
        );
    }


    const renderContent = () => {
        switch (view.type) {
            case 'DASHBOARD':
                return (
                    <Dashboard
                        userName={userName}
                        clients={clients}
                        onClientSelect={(id) => handleClientSelect(id)}
                        onAddClient={() => setIsModalOpen(true)}
                        onShowProductivityReport={handleShowProductivityReport}
                        importClients={importClients}
                        onLogout={onLogout}
                        deleteAllClients={deleteAllClients}
                    />
                );
            case 'CLIENT_DETAIL':
                return currentClient ? (
                    <ClientDetail
                        client={currentClient}
                        onBack={handleBackToDashboard}
                        updateClient={updateClient}
                        deleteClient={deleteClient}
                    />
                ) : (
                     <div className="flex items-center justify-center h-screen bg-system-bg-secondary">
                        <p className="text-system-label-secondary">Cliente não encontrado. <a href="#" onClick={handleBackToDashboard} className="text-apple-blue">Voltar ao painel.</a></p>
                    </div>
                );
            case 'PRODUCTIVITY_REPORT':
                return (
                    <ProductivityReport
                        userName={userName}
                        onBack={handleBackToDashboard}
                        clients={clients}
                    />
                );
            case 'DASHBOARD_GESTOR':
                return (
                    <ProtectedRoleRoute requiredRole="gestor">
                        <div className="min-h-full flex flex-col">
                            <nav className="bg-system-bg-secondary border-b border-system-separator p-4">
                                <div className="flex items-center justify-between max-w-7xl mx-auto">
                                    <div className="flex items-center space-x-6">
                                        <button
                                            onClick={() => setView({ type: 'DASHBOARD_GESTOR' })}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                view.type === 'DASHBOARD_GESTOR'
                                                    ? 'bg-apple-blue text-white'
                                                    : 'text-system-label-primary hover:bg-system-fill-primary'
                                            }`}
                                        >
                                            Dashboard BI
                                        </button>
                                        <button
                                            onClick={() => setView({ type: 'LEAD_POOL' })}
                                            className="px-3 py-2 rounded-lg text-sm font-medium text-system-label-primary hover:bg-system-fill-primary transition-colors"
                                        >
                                            Bolsão de Leads
                                        </button>
                                        <button
                                            onClick={() => setView({ type: 'DASHBOARD' })}
                                            className="px-3 py-2 rounded-lg text-sm font-medium text-system-label-primary hover:bg-system-fill-primary transition-colors"
                                        >
                                            Visão Corretor
                                        </button>
                                    </div>
                                    <button
                                        onClick={onLogout}
                                        className="px-3 py-2 rounded-lg text-sm font-medium text-system-label-primary hover:bg-system-fill-primary transition-colors"
                                    >
                                        Sair
                                    </button>
                                </div>
                            </nav>
                            <div className="flex-1">
                                <DashboardGestor />
                            </div>
                        </div>
                    </ProtectedRoleRoute>
                );
            case 'LEAD_POOL':
                return (
                    <ProtectedRoleRoute requiredRole="gestor">
                        <div className="min-h-full flex flex-col">
                            <nav className="bg-system-bg-secondary border-b border-system-separator p-4">
                                <div className="flex items-center justify-between max-w-7xl mx-auto">
                                    <div className="flex items-center space-x-6">
                                        <button
                                            onClick={() => setView({ type: 'DASHBOARD_GESTOR' })}
                                            className="px-3 py-2 rounded-lg text-sm font-medium text-system-label-primary hover:bg-system-fill-primary transition-colors"
                                        >
                                            Dashboard BI
                                        </button>
                                        <button
                                            onClick={() => setView({ type: 'LEAD_POOL' })}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                view.type === 'LEAD_POOL'
                                                    ? 'bg-apple-blue text-white'
                                                    : 'text-system-label-primary hover:bg-system-fill-primary'
                                            }`}
                                        >
                                            Bolsão de Leads
                                        </button>
                                        <button
                                            onClick={() => setView({ type: 'DASHBOARD' })}
                                            className="px-3 py-2 rounded-lg text-sm font-medium text-system-label-primary hover:bg-system-fill-primary transition-colors"
                                        >
                                            Visão Corretor
                                        </button>
                                    </div>
                                    <button
                                        onClick={onLogout}
                                        className="px-3 py-2 rounded-lg text-sm font-medium text-system-label-primary hover:bg-system-fill-primary transition-colors"
                                    >
                                        Sair
                                    </button>
                                </div>
                            </nav>
                            <div className="flex-1">
                                <LeadPool />
                            </div>
                        </div>
                    </ProtectedRoleRoute>
                );
            default:
                return null;
        }
    }

    return (
        <div className="min-h-screen bg-system-bg-secondary flex flex-col">
            <main className="flex-grow h-full">
                {renderContent()}
                {isModalOpen && (
                    <AddClientModal
                        onClose={() => setIsModalOpen(false)}
                        addClient={addClient}
                    />
                )}
            </main>
             <footer className="text-center p-4 text-xs text-system-label-tertiary flex-shrink-0 flex items-center justify-center gap-2">
                <span>i2Sales CRM v5.0.0</span>
            </footer>
        </div>
    );
}


const AppContent: React.FC = () => {
    const { isAuthenticated, user, isLoading, logout } = useAuth();
    const [eulaAccepted, setEulaAccepted] = useState(false);
    const [isEulaLoading, setIsEulaLoading] = useState(true);

    if (window.location.pathname === '/auth/callback') {
        return <AuthCallback />;
    }

     useEffect(() => {
        try {
            const eulaIsAccepted = localStorage.getItem('crmEulaAccepted_v1') === 'true';
            setEulaAccepted(eulaIsAccepted);
        } catch (error) {
            console.error("Failed to load EULA status from localStorage", error);
        } finally {
            setIsEulaLoading(false);
        }
    }, []);

    const handleEulaAccept = () => {
        try {
            localStorage.setItem('crmEulaAccepted_v1', 'true');
            setEulaAccepted(true);
        } catch (error) {
            console.error("Failed to save EULA status to localStorage", error);
        }
    };
    
    if (isLoading || isEulaLoading) {
         return (
            <div className="flex items-center justify-center h-screen bg-system-bg-secondary">
                <p className="text-system-label-secondary">Carregando...</p>
            </div>
        );
    }
    
    if (!eulaAccepted) {
        return <EulaModal onAccept={handleEulaAccept} />;
    }

    if (!isAuthenticated || !user) {
        return <AuthScreen />;
    }

    return <CrmApp userName={user.name} onLogout={logout} userRole={user.role} />;
};


const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};


export default App;
