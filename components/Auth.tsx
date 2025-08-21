// components/Auth.tsx
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';

export const AuthScreen: React.FC = () => {
    // Pegamos a função loginWithGoogle e o estado de erro do nosso contexto
    const { loginWithGoogle, error } = useAuth();

    const handleLoginSuccess = async (credentialResponse: CredentialResponse) => {
        const idToken = credentialResponse.credential;
        if (idToken) {
            try {
                await loginWithGoogle(idToken);
                // O contexto cuidará do resto: salvar token, usuário e redirecionar
            } catch (err) {
                // O erro já está sendo tratado no contexto,
                // mas podemos logar aqui se quisermos.
                console.error("Falha no processo de login com Google.");
            }
        }
    };

    const handleLoginError = () => {
        console.error("Ocorreu um erro durante o login com o Google (callback da biblioteca).");
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-system-bg-secondary text-white">
            <div className="text-center p-8 bg-system-bg rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold mb-2">Bem-vindo ao i2Sales</h1>
                <p className="text-system-label-secondary mb-6">Faça login com sua conta Google para continuar.</p>
                <GoogleLogin
                    onSuccess={handleLoginSuccess}
                    onError={handleLoginError}
                />
                {/* Mostra a mensagem de erro vinda do contexto */}
                {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>
        </div>
    );
};