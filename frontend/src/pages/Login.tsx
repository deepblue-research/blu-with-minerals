import React, { useState, useEffect } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { ShieldCheck } from 'lucide-react';
import {
  Card,
  Separator,
  Alert,
  Spinner
} from '@heroui/react';

interface LoginResponse {
  token: string;
  user: {
    email: string;
    name: string;
    picture: string;
  };
}

/**
 * Login page using Google OAuth and HeroUI v3 BETA components.
 * Access is restricted by the backend based on the authorized email domain.
 */
const Login: React.FC = () => {
  console.log("[Login] Component rendering");
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[Login] Component mounted");
    // Check for existing token
    const token = localStorage.getItem('auth_token');
    if (token) {
      console.log("[Login] Token found, redirecting...");
      navigate('/');
    }
  }, [navigate]);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    console.log("[Login] Google success:", credentialResponse);
    if (!credentialResponse.credential) {
      setError('Login failed: No credentials received');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Send the Google token to our backend for verification and domain check
      const response = await api.post<LoginResponse>('/auth/google', {
        token: credentialResponse.credential,
      });

      // Save the JWT and user info returned by our backend
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));

      // Redirect to dashboard
      navigate('/');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Authentication failed. Please check your account domain.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = () => {
    console.error("[Login] Google sign-in failed");
    setError('Google Sign-In was unsuccessful. Please try again.');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 animate-in fade-in duration-700">
      <Card className="max-w-md w-full shadow-2xl border border-separator/50 bg-surface">
        <Card.Header className="flex flex-col gap-1 p-10 text-center items-center">
          <img src="/logo.svg" width={77} />
          <Card.Title className="text-3xl font-extrabold text-foreground tracking-tight">Welcome Back</Card.Title>
          <Card.Description className="text-muted font-medium">Please sign in to manage your invoices</Card.Description>
        </Card.Header>

        <Separator className="bg-separator/30" />

        <Card.Content className="p-10 space-y-8">
          {error && (
            <Alert status="danger" className="animate-in slide-in-from-top-2 duration-300">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Authentication Error</Alert.Title>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert>
          )}

          <div className="flex justify-center py-4 min-h-[50px]">
            {isLoading ? (
              <div className="flex flex-col items-center gap-4">
                <Spinner size="lg" color="accent" />
                <p className="text-xs font-bold text-muted uppercase tracking-widest">Verifying account...</p>
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={handleError}
                  useOneTap
                  theme="outline"
                  shape="rectangular"
                  size="large"
                  text="signin_with"
                  width="320"
                />
              </div>
            )}
          </div>
        </Card.Content>

        <Card.Footer className="p-10 pt-0">
          <div className="flex items-start gap-4 p-4 bg-default/20 rounded-xl border border-separator/20">
            <ShieldCheck size={20} className="shrink-0 text-foreground mt-0.5" />
            <p className="text-[11px] font-medium leading-relaxed text-muted italic">
              Access is strictly restricted to authorized company accounts.
              Ensure you are signing in with your official domain email address.
            </p>
          </div>
        </Card.Footer>
      </Card>

      <div className="mt-12 flex flex-col items-center gap-2">
        <p className="text-muted text-[10px] font-bold tracking-[0.2em]">
          powered by Adeyak v1.0
        </p>
        <p className="text-muted/50 text-[10px] font-medium">
          &copy; {new Date().getFullYear()} Deepblue Research Private Limited
        </p>
      </div>
    </div>
  );
};

export default Login;
