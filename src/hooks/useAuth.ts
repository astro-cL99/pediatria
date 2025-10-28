import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi, queryClient } from '@/lib/api';
import { User } from '@/types/models';
import { AUTH_TOKEN_KEY, ROUTES } from '@/config/constants';

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
};

type UseAuthReturn = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

export function useAuth(): UseAuthReturn {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });
  
  const navigate = useNavigate();
  const location = useLocation();

  // Obtener el usuario actual
  const fetchUser = useCallback(async () => {
    try {
      const { data: user } = await authApi.getCurrentUser();
      return user;
    } catch (error) {
      // Si hay un error al obtener el usuario, forzar cierre de sesión
      localStorage.removeItem(AUTH_TOKEN_KEY);
      throw error;
    }
  }, []);

  // Verificar autenticación al cargar
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) {
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            isAuthenticated: false,
          }));
          return;
        }

        const user = await fetchUser();
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error verifying auth:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
        });
        
        // Redirigir al login si no estamos ya en la página de login
        if (!location.pathname.includes('login')) {
          navigate(ROUTES.LOGIN, { 
            state: { from: location },
            replace: true 
          });
        }
      }
    };

    verifyAuth();
  }, [fetchUser, location, navigate]);

  // Función para refrescar los datos del usuario
  const refreshUser = useCallback(async () => {
    try {
      const user = await fetchUser();
      setAuthState(prev => ({
        ...prev,
        user,
        isAuthenticated: true,
        error: null,
      }));
      return user;
    } catch (error) {
      console.error('Error refreshing user:', error);
      throw error;
    }
  }, [fetchUser]);

  // Iniciar sesión
  const login = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const { data } = await authApi.login(email, password);
      const { token, user } = data;
      
      // Guardar el token
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      
      // Actualizar el estado
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      return user;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error al iniciar sesión';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  }, []);

  // Cerrar sesión
  const logout = useCallback(async () => {
    try {
      // Llamar al endpoint de logout
      await authApi.logout();
    } catch (error) {
      console.error('Error during logout:', error);
      // Continuar con el cierre de sesión aunque falle la llamada
    } finally {
      // Limpiar el estado local
      localStorage.removeItem(AUTH_TOKEN_KEY);
      await queryClient.clear();
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      
      // Redirigir al login
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [navigate]);

  return {
    ...authState,
    login,
    logout,
    refreshUser,
  };
}
