import React, { useState } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Login failed: No credentials received');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Send the Google token to our backend for verification and domain check
      const response: any = await api.post('/auth/google', {
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
    setError('Google Sign-In was unsuccessful. Please try again.');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="p-8 text-center border-b border-gray-50">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 shadow-lg shadow-blue-200">
            I
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Welcome Back</h1>
          <p className="text-gray-500 mt-2 font-medium">Please sign in to manage your invoices</p>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle size={20} className="shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div className="flex justify-center py-4">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-sm font-bold text-gray-500">Verifying account...</p>
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={handleError}
                useOneTap
                theme="filled_blue"
                shape="pill"
                size="large"
                text="signin_with"
                width="100%"
              />
            )}
          </div>

          <div className="pt-4 border-t border-gray-50">
            <div className="flex items-center gap-3 text-gray-400">
              <ShieldCheck size={18} className="shrink-0" />
              <p className="text-[11px] font-medium leading-relaxed">
                Access is restricted to authorized company accounts.
                Ensure you are signing in with your official domain email.
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-8 text-gray-400 text-xs font-medium tracking-wide uppercase">
        &copy; {new Date().getFullYear()} Invoice Generator Service
      </p>
    </div>
  );
};

export default Login;
