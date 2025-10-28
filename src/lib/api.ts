import { QueryClient } from '@tanstack/react-query';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';
import { AUTH_TOKEN_KEY } from '@/config/constants';

// Configuración de axios
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Importante para cookies de autenticación HTTP-only
});

// Interceptor para agregar el token de autenticación
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores globales
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Manejar errores específicos de la API
      const { status, data } = error.response;
      
      // No mostrar error para rutas protegidas cuando no hay sesión
      if (status === 401 && !window.location.pathname.includes('login')) {
        // Redirigir al login se manejará en el hook useAuth
        return Promise.reject(error);
      }

      // Mostrar mensaje de error al usuario
      if (status >= 400) {
        const errorMessage = (data as any)?.message || 'Ha ocurrido un error inesperado';
        toast.error(errorMessage);
      }
    } else if (error.request) {
      // Error de conexión
      toast.error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
    } else {
      // Error al configurar la petición
      console.error('Error:', error.message);
      toast.error('Error al procesar la solicitud');
    }
    
    return Promise.reject(error);
  }
);

// Configuración de React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: (failureCount, error: any) => {
        // No reintentar en errores 4xx (excepto 408 Request Timeout)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Reintentar hasta 3 veces para otros errores
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
  },
});

// Tipos para las respuestas de la API
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Funciones de autenticación
export const authApi = {
  login: (email: string, password: string) => 
    apiClient.post<ApiResponse<{ token: string; user: any }>>('/auth/login', { email, password })
      .then((res) => res.data),
      
  getCurrentUser: () => 
    apiClient.get<ApiResponse<any>>('/auth/me').then((res) => res.data),
    
  logout: () => 
    apiClient.post<ApiResponse<void>>('/auth/logout').then((res) => res.data),
};

// Funciones de la API
export const api = {
  // Pacientes
  getPatients: (params?: any) => 
    apiClient.get<ApiResponse<any[]>>('/patients', { params }).then((res) => res.data),
    
  getPatient: (id: string) => 
    apiClient.get<ApiResponse<any>>(`/patients/${id}`).then((res) => res.data),
    
  createPatient: (data: any) => 
    apiClient.post<ApiResponse<any>>('/patients', data).then((res) => res.data),
    
  updatePatient: (id: string, data: any) => 
    apiClient.put<ApiResponse<any>>(`/patients/${id}`, data).then((res) => res.data),
  
  // Médicos
  getDoctors: () => 
    apiClient.get<ApiResponse<any[]>>('/doctors').then((res) => res.data),
  
  // Historias clínicas
  getMedicalRecords: (patientId: string) => 
    apiClient.get<ApiResponse<any[]>>(`/medical-records?patientId=${patientId}`).then((res) => res.data),
    
  createMedicalRecord: (data: any) => 
    apiClient.post<ApiResponse<any>>('/medical-records', data).then((res) => res.data),
    
  // Turnos
  getShifts: (params: { startDate: string; endDate: string }) => 
    apiClient.get<ApiResponse<any[]>>('/shifts', { params }).then((res) => res.data),
    
  createShift: (data: any) => 
    apiClient.post<ApiResponse<any>>('/shifts', data).then((res) => res.data),
    
  // Tareas
  getTasks: (params?: any) => 
    apiClient.get<ApiResponse<any[]>>('/tasks', { params }).then((res) => res.data),
    
  createTask: (data: any) => 
    apiClient.post<ApiResponse<any>>('/tasks', data).then((res) => res.data),
    
  updateTask: (id: string, data: any) => 
    apiClient.put<ApiResponse<any>>(`/tasks/${id}`, data).then((res) => res.data),
    
  // Alertas
  getAlerts: (params?: any) => 
    apiClient.get<ApiResponse<any[]>>('/alerts', { params }).then((res) => res.data),
    
  markAlertAsRead: (id: string) => 
    apiClient.patch<ApiResponse<any>>(`/alerts/${id}/read`).then((res) => res.data),
};

export default api;
