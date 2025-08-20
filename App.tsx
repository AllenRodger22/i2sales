

import React, { useState, useMemo, useEffect } from 'react';
import { useClients } from './hooks/useClients';
import { Dashboard } from './components/Dashboard';
import { ClientDetail } from './components/ClientDetail';
import { AddClientModal } from './components/AddClientModal';
import { ProductivityReport } from './components/BrokerPanel';
import { UserNamePrompt } from './components/UserNamePrompt';
import { TutorialModal } from './components/TutorialModal';
import { EulaModal } from './components/EulaModal';
import type { Client } from './types';


type View = { type: 'DASHBOARD' } | { type: 'CLIENT_DETAIL'; clientId: string } | { type: 'PRODUCTIVITY_REPORT' };

const App: React.FC = () => {
    const { clients, isLoading, addClient, findClientById, updateClient, addTimelineEvent, addMultipleClients, updateTimelineEvent } = useClients();
    
    const [view, setView] = useState<View>({ type: 'DASHBOARD' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const [isInitialSetupLoading, setIsInitialSetupLoading] = useState(true);
    const [showTutorial, setShowTutorial] = useState(false);
    const [eulaAccepted, setEulaAccepted] = useState(false);

    useEffect(() => {
        try {
            const eulaIsAccepted = localStorage.getItem('crmEulaAccepted_v1') === 'true';
            setEulaAccepted(eulaIsAccepted);

            if (eulaIsAccepted) {
                const storedName = localStorage.getItem('crmUserName');
                if (storedName) {
                    setUserName(storedName);
                }
                const tutorialSeen = localStorage.getItem('crmTutorialSeen_v1');
                if (!tutorialSeen) {
                    setShowTutorial(true);
                }
            }
        } catch (error) {
            console.error("Failed to load initial setup from localStorage", error);
        } finally {
            setIsInitialSetupLoading(false);
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

    const handleCloseTutorial = () => {
        try {
            localStorage.setItem('crmTutorialSeen_v1', 'true');
        } catch (error) {
             console.error("Failed to save tutorial status to localStorage", error);
        }
        setShowTutorial(false);
    };

    const handleNameSet = (name: string) => {
        try {
            localStorage.setItem('crmUserName', name);
            setUserName(name);
        } catch (error) {
            console.error("Failed to save user name to localStorage", error);
        }
    };

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
            return findClientById(view.clientId);
        }
        return null;
    }, [view, findClientById]);

    if (isLoading || isInitialSetupLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-system-bg-secondary">
                <p className="text-system-label-secondary">Carregando...</p>
            </div>
        );
    }
    
    if (!eulaAccepted) {
        return <EulaModal onAccept={handleEulaAccept} />;
    }

    if (!userName) {
        return <UserNamePrompt onNameSet={handleNameSet} />;
    }

    const renderContent = () => {
        switch (view.type) {
            case 'DASHBOARD':
                return (
                    <Dashboard
                        userName={userName}
                        clients={clients}
                        onClientSelect={handleClientSelect}
                        onAddClient={() => setIsModalOpen(true)}
                        onShowProductivityReport={handleShowProductivityReport}
                        addMultipleClients={addMultipleClients}
                    />
                );
            case 'CLIENT_DETAIL':
                return currentClient ? (
                    <ClientDetail
                        client={currentClient}
                        onBack={handleBackToDashboard}
                        updateClient={updateClient}
                        addTimelineEvent={addTimelineEvent}
                        updateTimelineEvent={updateTimelineEvent}
                    />
                ) : null;
            case 'PRODUCTIVITY_REPORT':
                return (
                    <ProductivityReport
                        userName={userName}
                        onBack={handleBackToDashboard}
                        clients={clients}
                    />
                );
            default:
                return null;
        }
    }

    return (
        <div className="min-h-screen bg-system-bg-secondary flex flex-col">
            <main className="flex-grow h-full">
                {showTutorial && <TutorialModal onClose={handleCloseTutorial} />}
                {renderContent()}
                {isModalOpen && (
                    <AddClientModal
                        onClose={() => setIsModalOpen(false)}
                        addClient={addClient}
                    />
                )}
            </main>
             <footer className="text-center p-4 text-xs text-system-label-tertiary flex-shrink-0">
                i2Sales CRM v4.0.1
            </footer>
        </div>
    );
};

export default App;