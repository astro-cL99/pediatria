import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { socketService, SocketService } from '@/lib/websocket';
import { useAuth } from '@/hooks/useAuth';

interface WebSocketContextType {
  socketService: SocketService;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  subscribe: (event: string, callback: Function) => () => void;
  emit: (event: string, data?: any, callback?: Function) => Promise<any>;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  // Connect to WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
      return () => {
        socketService.disconnect();
      };
    }
  }, [isAuthenticated]);

  const value = useMemo(() => ({
    socketService,
    isConnected: socketService.isSocketConnected(),
    connect: () => socketService.connect(),
    disconnect: () => socketService.disconnect(),
    subscribe: (event: string, callback: Function) => socketService.subscribe(event, callback),
    emit: (event: string, data?: any, callback?: Function) => 
      socketService.emit(event, data, callback),
  }), []);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// HOC para componentes de clase
export const withWebSocket = <P extends object>(
  WrappedComponent: React.ComponentType<P & { websocket: WebSocketContextType }>
): React.FC<P> => {
  const WithWebSocket: React.FC<P> = (props) => {
    const websocket = useWebSocket();
    return <WrappedComponent {...props} websocket={websocket} />;
  };
  return WithWebSocket;
};
