import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRoleRouteProps {
  requiredRole: 'user' | 'manager' | 'admin' | ('manager' | 'admin')[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoleRoute: React.FC<ProtectedRoleRouteProps> = ({ 
  requiredRole, 
  children, 
  fallback = <div className="text-center p-8 text-system-label-secondary">Acesso negado. Você não tem permissão para acessar esta área.</div>
}) => {
  const { user } = useAuth();

  const hasRequiredRole = Array.isArray(requiredRole) 
    ? requiredRole.includes(user?.role as any)
    : user?.role === requiredRole || (requiredRole === 'manager' && user?.role === 'admin') || (requiredRole === 'admin' && user?.role === 'manager');

  if (!user || !hasRequiredRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
