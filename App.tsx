// components/Auth.tsx
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext'; // Importe seu hook useAuth

// Renomeei para AuthScreen para combinar com o nome que você usou no App.tsx
export const AuthScreen: React.FC = () => {
    // Pegamos a função 'login' do nosso contexto.
    // Precisamos garantir que essa função exista no AuthContext.
    const { login } = useAuth();

    const handleLoginSuccess = async (credentialResponse: CredentialResponse) => {
        const idToken = credentialResponse.credential;
        if (!idToken) {
            console.error("Não foi possível obter o token do Google.");
            return;
        }

        console.log("Token do Google recebido, enviando para o backend...");

        // ETAPA CRÍTICA: Enviar este token para seu backend no Render
        try {
            // Substitua pela URL real do seu backend
            const backendUrl = 'https://SEU_BACKEND.onrender.com/api/v1/auth/google';

            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: idToken }),
            });

            if (!response.ok) {
                throw new Error('Falha na autenticação com o backend.');
            }

            const data = await response.json();
            // 'data' deve ser o objeto com { user: {...}, token: 'seu_jwt_do_backend' }
            
            // Chama a função de login do nosso contexto com os dados do NOSSO backend
            login(data.user, data.token);

        } catch (error) {
            console.error("Erro ao validar o token com o backend:", error);
            // Adicione aqui uma mensagem de erro para o usuário se desejar
        }
    };

    const handleLoginError = () => {
        console.error("Ocorreu um erro durante o login com o Google.");
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-system-bg-secondary text-white">
            <div className="text-center p-8 bg-system-bg rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold mb-2">Bem-vindo ao i2Sales</h1>
                <p className="text-system-label-secondary mb-6">Faça login com sua conta Google para continuar.</p>
                <GoogleLogin
                    onSuccess={handleLoginSuccess}
                    onError={handleLoginError}
                    theme="filled_black"
                    shape="pill"
                    text="continue_with"
                />
            </div>
        </div>
    );
};