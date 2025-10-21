import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, API_BASE_URL } from '@/config/constants';
import { toast } from 'sonner';
import { ERROR_MESSAGES } from '@/config/constants';

class ApiClient {
  private axios: AxiosInstance;
  private refreshTokenRequest: Promise<string> | null = null;

  constructor() {
    this.axios = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private getAccessToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  private clearTokens(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  private async refreshAccessToken(): Promise<string> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token available');

      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh-token`,
        { refreshToken }
      );

      const { accessToken, refreshToken: newRefreshToken } = response.data;
      this.setTokens(accessToken, newRefreshToken);
      return accessToken;
    } catch (error) {
      this.clearTokens();
      window.location.href = '/login';
      throw error;
    }
  }

  private async handleRequest(config: AxiosRequestConfig): Promise<AxiosRequestConfig> {
    const token = this.getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }

  private handleRequestError(error: AxiosError): Promise<never> {
    return Promise.reject(error);
  }

  private async handleResponse(response: AxiosResponse): Promise<AxiosResponse> {
    return response;
  }

  private async handleResponseError(error: AxiosError): Promise<never> {
    const originalRequest = error.config as any;

    // Si el error es 401 y no es una solicitud de refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/refresh-token')) {
        // Si falla el refresh token, redirigir al login
        this.clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Intentar refrescar el token
      originalRequest._retry = true;
      
      try {
        if (!this.refreshTokenRequest) {
          this.refreshTokenRequest = this.refreshAccessToken();
        }
        
        const accessToken = await this.refreshTokenRequest;
        this.refreshTokenRequest = null;
        
        // Reintentar la petición original con el nuevo token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return this.axios(originalRequest);
      } catch (refreshError) {
        this.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Manejar otros errores
    const errorMessage = this.getErrorMessage(error);
    toast.error(errorMessage);
    
    return Promise.reject(error);
  }

  private getErrorMessage(error: AxiosError): string {
    if (!error.response) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    const { status, data } = error.response;
    
    if (typeof data === 'object' && data !== null && 'message' in data) {
      return (data as any).message;
    }

    switch (status) {
      case 400:
        return 'Solicitud incorrecta';
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 403:
        return ERROR_MESSAGES.FORBIDDEN;
      case 404:
        return ERROR_MESSAGES.NOT_FOUND;
      case 500:
        return ERROR_MESSAGES.SERVER_ERROR;
      case 504:
        return ERROR_MESSAGES.TIMEOUT;
      default:
        return ERROR_MESSAGES.UNKNOWN;
    }
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axios.interceptors.request.use(
      (config) => this.handleRequest(config),
      (error) => this.handleRequestError(error)
    );

    // Response interceptor
    this.axios.interceptors.response.use(
      (response) => this.handleResponse(response),
      (error) => this.handleResponseError(error)
    );
  }

  // Métodos HTTP
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.get<T>(url, config);
    return response.data;
  }

  public async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axios.post<T>(url, data, config);
    return response.data;
  }

  public async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axios.put<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.delete<T>(url, config);
    return response.data;
  }

  public async upload<T>(
    url: string,
    formData: FormData,
    onUploadProgress?: (progressEvent: ProgressEvent) => void
  ): Promise<T> {
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    if (onUploadProgress) {
      config.onUploadProgress = onUploadProgress;
    }

    const response = await this.axios.post<T>(url, formData, config);
    return response.data;
  }
}

export const api = new ApiClient();
