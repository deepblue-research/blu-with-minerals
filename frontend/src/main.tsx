import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Critical Error: 'root' element not found in DOM.");
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      {GOOGLE_CLIENT_ID ? (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </GoogleOAuthProvider>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          textAlign: 'center',
          fontFamily: 'sans-serif',
          backgroundColor: '#f9fafb'
        }}>
          <h1 style={{ color: '#ef4444', marginBottom: '8px', fontSize: '24px', fontWeight: 'bold' }}>Configuration Error</h1>
          <p style={{ color: '#4b5563', maxWidth: '400px' }}>
            The <code>VITE_GOOGLE_CLIENT_ID</code> environment variable is missing.
            Google Authentication cannot be initialized without a valid Client ID.
          </p>
          <div style={{ marginTop: '20px', padding: '12px', background: '#fee2e2', borderRadius: '8px', fontSize: '14px', color: '#b91c1c' }}>
            Please check your <code>.env</code> file in the frontend directory.
          </div>
        </div>
      )}
    </React.StrictMode>,
  );
}
