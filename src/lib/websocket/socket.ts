import { io, Socket } from 'socket.io-client';
import { WS_BASE_URL, SOCKET_EVENTS } from '@/config/constants';
import { getAccessToken } from './auth';

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;
  private eventHandlers: Map<string, Set<Function>> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 5000; // 5 segundos

  private constructor() {
    this.initializeSocket();
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  private initializeSocket() {
    if (this.socket) {
      this.disconnect();
    }

    const token = getAccessToken();
    if (!token) {
      console.warn('No authentication token available for WebSocket connection');
      return;
    }

    this.socket = io(WS_BASE_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectInterval,
      autoConnect: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emitEvent(SOCKET_EVENTS.CONNECT);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emitEvent(SOCKET_EVENTS.DISCONNECT, reason);
      this.handleReconnect();
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emitEvent(SOCKET_EVENTS.ERROR, error);
    });

    // Escuchar eventos personalizados
    this.socket.onAny((event, ...args) => {
      this.emitEvent(event, ...args);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          this.socket.connect();
        }
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  public connect() {
    if (this.socket) {
      this.socket.connect();
    } else {
      this.initializeSocket();
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  public subscribe(event: string, callback: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)?.add(callback);

    // Devolver función para cancelar la suscripción
    return () => this.unsubscribe(event, callback);
  }

  public unsubscribe(event: string, callback: Function) {
    if (this.eventHandlers.has(event)) {
      const callbacks = this.eventHandlers.get(event)!;
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  private emitEvent(event: string, ...args: any[]) {
    if (this.eventHandlers.has(event)) {
      const callbacks = this.eventHandlers.get(event)!;
      callbacks.forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  public emit(event: string, data?: any, callback?: Function) {
    if (!this.socket) {
      console.warn('Socket not initialized');
      return false;
    }
    
    return new Promise((resolve, reject) => {
      if (callback) {
        this.socket?.emit(event, data, (response: any) => {
          if (response.error) {
            reject(response.error);
          } else {
            resolve(response);
          }
        });
      } else {
        this.socket?.emit(event, data);
        resolve(undefined);
      }
    });
  }

  public isSocketConnected(): boolean {
    return this.isConnected;
  }

  public reconnect() {
    this.reconnectAttempts = 0;
    if (this.socket) {
      this.socket.connect();
    } else {
      this.initializeSocket();
    }
  }
}

export const socketService = SocketService.getInstance();
