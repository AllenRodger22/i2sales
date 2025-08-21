// index.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google'; // <-- 1. IMPORTE AQUI
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// 2. PEGUE SEU CLIENT ID DO ARQUIVO .env
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

root.render(
    <React.StrictMode>
        {/* 3. ENVOLVA SEU <APP /> COM O PROVEDOR */}
        <GoogleOAuthProvider clientId={googleClientId}>
            <App />
        </GoogleOAuthProvider>
    </React.StrictMode>
);