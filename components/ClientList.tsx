import React from 'react';
import type { Client } from '../types';
import { getStatusInfo } from '../constants';
import { Icon } from './Icon';

interface ClientListProps {
    clients: Client[];
    onClientSelect: (id: string) => void;
}

const ClientListItem: React.FC<{
    client: Client;
    onSelect: () => void;
}> = ({ client, onSelect }) => {
    const statusInfo = getStatusInfo(client.status);

    return (
        <li
            onClick={onSelect}
            className="rounded-xl hover:bg-system-bg-secondary transition-colors duration-150 cursor-pointer"
        >
            <div className="flex items-center space-x-4 p-4">
                <div className="flex-1 min-w-0 flex items-center space-x-3">
                    {client.isPending && <Icon name="alert-triangle" className="w-5 h-5 text-apple-orange flex-shrink-0" title="Cliente com pendência" />}
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-system-label-primary truncate">
                            {client.name}
                            <span className="ml-2 font-normal text-xs text-system-label-tertiary">{client.origin}</span>
                        </p>
                        <p className="text-sm text-system-label-secondary truncate">{client.phone || client.email}</p>
                    </div>
                </div>
                <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
                        {statusInfo.label}
                    </span>
                </div>
            </div>
        </li>
    );
};

export const ClientList: React.FC<ClientListProps> = ({ clients, onClientSelect }) => {
    if (clients.length === 0) {
        return <p className="text-center text-system-label-secondary py-12">Nenhum cliente encontrado.</p>;
    }

    return (
        <div className="flow-root">
            <ul role="list" className="divide-y divide-system-separator">
                {clients.map((client) => (
                    <ClientListItem 
                        key={client._id} 
                        client={client} 
                        onSelect={() => onClientSelect(client._id!)}
                    />
                ))}
            </ul>
        </div>
    );
};
