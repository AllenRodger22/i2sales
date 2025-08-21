import React, { useState } from 'react';
import type { Client, TimelineEvent } from '../types';
import { Status, TimelineEventType } from '../types';
import { KANBAN_COLUMNS, getStatusInfo } from '../constants';
import { Icon } from './Icon';

interface KanbanCardProps {
    client: Client;
    onClientSelect: (id: string) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ client, onClientSelect }) => {
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('clientId', client._id!);
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onClick={() => onClientSelect(client._id!)}
            className="bg-system-bg-primary rounded-xl p-4 shadow-soft dark:shadow-soft-dark cursor-pointer hover:ring-2 hover:ring-apple-blue transition-all space-y-2"
        >
            <div className="flex items-center justify-between">
                <p className="font-semibold text-sm text-system-label-primary truncate flex-1 min-w-0 pr-2">{client.name}</p>
                {client.isPending && <Icon name="alert-triangle" className="w-4 h-4 text-apple-orange flex-shrink-0" title="Cliente com pendência" />}
            </div>
             <div className="text-xs text-system-label-secondary space-y-1">
                 <p className="flex items-center gap-2 truncate">
                    <Icon name="phone" className="w-3 h-3 flex-shrink-0" />
                    <span>{client.phone}</span>
                </p>
                 <p className="flex items-center gap-2 truncate">
                    <Icon name="user" className="w-3 h-3 flex-shrink-0" />
                    <span>{client.origin}</span>
                </p>
            </div>
        </div>
    );
};


interface KanbanColumnProps {
    status: Status;
    clients: Client[];
    onClientSelect: (id: string) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, status: Status) => void;
    isDragOver: boolean;
    onDragEnter: (status: Status) => void;
    onDragLeave: () => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, clients, onClientSelect, onDrop, isDragOver, onDragEnter, onDragLeave }) => {
    const statusInfo = getStatusInfo(status);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    return (
        <div
            onDrop={(e) => onDrop(e, status)}
            onDragOver={handleDragOver}
            onDragEnter={() => onDragEnter(status)}
            onDragLeave={onDragLeave}
            className={`flex flex-col flex-shrink-0 w-80 bg-system-bg-secondary rounded-2xl transition-colors h-full`}
        >
            <div className="flex items-center justify-between p-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${statusInfo.dotClassName}`}></span>
                    <h3 className="font-semibold text-base text-system-label-primary">{statusInfo.label}</h3>
                </div>
                <span className="text-sm font-medium text-system-label-secondary bg-system-fill-primary rounded-full px-2.5 py-0.5">{clients.length}</span>
            </div>
            <div className={`flex-grow p-2 space-y-3 overflow-y-auto min-h-0 scrollbar-hide rounded-b-2xl transition-colors ${isDragOver ? 'bg-apple-blue/10' : ''}`}>
                {clients.map(client => (
                    <KanbanCard key={client._id} client={client} onClientSelect={onClientSelect} />
                ))}
            </div>
        </div>
    );
};

interface KanbanBoardProps {
    clients: Client[];
    onClientSelect: (id: string) => void;
    updateClient: (id: string, data: Partial<Client>) => void;
    addTimelineEvent: (clientId: string, event: Omit<TimelineEvent, 'id' | 'date'>) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ clients, onClientSelect, updateClient, addTimelineEvent }) => {
    const [dragOverColumn, setDragOverColumn] = useState<Status | null>(null);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: Status) => {
        const clientId = e.dataTransfer.getData('clientId');
        const client = clients.find(c => c._id === clientId);

        if (client && newStatus === Status.PrimeiroAtendimento && client.timeline.length > 1) {
            setDragOverColumn(null);
            return; // Prevent dropping back to "Primeiro Atendimento"
        }
        
        if (clientId && client && client.status !== newStatus) {
            const oldStatus = client.status;
            updateClient(clientId, { status: newStatus });

            const oldStatusLabel = getStatusInfo(oldStatus).label;
            const newStatusLabel = getStatusInfo(newStatus).label;

            addTimelineEvent(clientId, {
                type: TimelineEventType.StatusChange,
                content: `Status alterado de '${oldStatusLabel}' para '${newStatusLabel}'`,
                meta: {
                    from: oldStatus,
                    to: newStatus,
                    source: 'kanban'
                }
            });
        }
        setDragOverColumn(null);
    };
    
    return (
        <div className="flex h-full gap-6 overflow-x-auto p-4 sm:p-6 lg:p-8 scrollbar-hide">
            {KANBAN_COLUMNS.map(status => (
                <KanbanColumn
                    key={status}
                    status={status}
                    clients={clients.filter(client => client.status === status)}
                    onClientSelect={onClientSelect}
                    onDrop={handleDrop}
                    isDragOver={dragOverColumn === status}
                    onDragEnter={setDragOverColumn}
                    onDragLeave={() => setDragOverColumn(null)}
                />
            ))}
        </div>
    );
};
