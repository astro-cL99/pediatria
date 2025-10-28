import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';

// Configuración base de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Crear instancia de Axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptores para manejar errores globalmente
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    // Manejo de errores global
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      const { status, data } = error.response;
      
      // Mostrar notificación de error
      toast.error(data.message || 'Ocurrió un error inesperado', {
        description: `Código de error: ${status}`,
      });
      
      // Manejar códigos de estado específicos
      if (status === 401) {
        // Redirigir a la página de inicio de sesión si no está autenticado
        // router.push('/auth/login');
      }
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      toast.error('No se pudo conectar con el servidor', {
        description: 'Por favor, verifica tu conexión a internet',
      });
    } else {
      // Algo más causó un error
      toast.error('Error en la configuración de la solicitud', {
        description: error.message,
      });
    }
    
    return Promise.reject(error);
  }
);

// Tipos para las respuestas de la API
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

// Métodos HTTP tipados
export const http = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.get<ApiResponse<T>>(url, config);
    return response.data.data;
  },
  
  post: async <T>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await api.post<ApiResponse<T>>(url, data, config);
    return response.data.data;
  },
  
  put: async <T>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await api.put<ApiResponse<T>>(url, data, config);
    return response.data.data;
  },
  
  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.delete<ApiResponse<T>>(url, config);
    return response.data.data;
  },
  
  patch: async <T>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await api.patch<ApiResponse<T>>(url, data, config);
    return response.data.data;
  },
};

export default api;
