import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const AuthCallback: React.FC = () => {
  const { handleAuthSuccess } = useAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const name = urlParams.get('name');
    const role = urlParams.get('role');

    if (token && name && role) {
      handleAuthSuccess({
        token,
        userName: decodeURIComponent(name),
        role: role as 'corretor' | 'gestor'
      });
      
      window.history.replaceState({}, document.title, '/');
    } else {
      window.location.href = '/';
    }
  }, [handleAuthSuccess]);

  return (
    <div className="flex items-center justify-center h-screen bg-system-bg-secondary">
      <p className="text-system-label-secondary">Finalizando login...</p>
    </div>
  );
};
