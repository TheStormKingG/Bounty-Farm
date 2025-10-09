// index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

// '/' in normal dev; '/Bounty-Farm/' (or similar) when served under a subpath
const BASENAME = (import.meta as any).env?.BASE_URL ?? '/';

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter basename={BASENAME}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
