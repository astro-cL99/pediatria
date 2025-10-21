import { ReactNode, createContext, useContext, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/config/constants';
import { queryClient } from '@/lib/queryClient';

type AppContextType = {
  socket: Socket | null;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

type AppProviderProps = {
  children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  // Configuración del socket para notificaciones en tiempo real
  const socket = useMemo(() => {
    if (typeof window !== 'undefined') {
      return io(API_BASE_URL, {
        withCredentials: true,
        transports: ['websocket'],
      });
    }
    return null;
  }, []);

  const value = useMemo(() => ({
    socket,
  }), [socket]);

  return (
    <QueryClientProvider client={queryClient}>
      <AppContext.Provider value={value}>
        {children}
        <Toaster 
          position="top-right" 
          richColors
          toastOptions={{
            style: { fontFamily: 'Inter, sans-serif' },
          }}
        />
        <ReactQueryDevtools initialIsOpen={false} />
      </AppContext.Provider>
    </QueryClientProvider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp debe usarse dentro de un AppProvider');
  }
  return context;
}
