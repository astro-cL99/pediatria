import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { AppProvider } from '@/providers/AppProvider';
import App from './App.tsx';
import './index.css';

// Habilitar React Query DevTools solo en desarrollo
const enableDevTools = import.meta.env.DEV;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>
);
