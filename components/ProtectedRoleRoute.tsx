import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRoleRouteProps {
  requiredRole: 'corretor' | 'gestor';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoleRoute: React.FC<ProtectedRoleRouteProps> = ({ 
  requiredRole, 
  children, 
  fallback = <div className="text-center p-8 text-system-label-secondary">Acesso negado. Você não tem permissão para acessar esta área.</div>
}) => {
  const { user } = useAuth();

  if (!user || user.role !== requiredRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
