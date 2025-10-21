import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { ROLES } from '@/config/constants';
import { AppRoute } from '@/types/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
  route: AppRoute;
}

export function ProtectedRoute({ children, route }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si la ruta es pública, permitir el acceso
  if (route.isPublic) {
    return <>{children}</>;
  }

  // Si el usuario no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar roles si la ruta los requiere
  if (route.roles && route.roles.length > 0) {
    const hasRequiredRole = user?.role && route.roles.includes(user.role);
    
    if (!hasRequiredRole) {
      // Redirigir a una página de acceso denegado o al dashboard
      return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
  }

  // Usuario autenticado y autorizado
  return <>{children}</>;
}
