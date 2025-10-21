import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROLES, ROUTES } from '@/config/constants';
import { useAuthContext } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/routes/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Páginas
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const PatientsPage = lazy(() => import('@/pages/PatientsPage'));
const PatientDetailPage = lazy(() => import('@/pages/PatientDetailPage'));
const ShiftsPage = lazy(() => import('@/pages/ShiftsPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Componente de carga
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner className="h-12 w-12" />
  </div>
);

// Rutas de la aplicación
export function AppRoutes() {
  const { isAuthenticated } = useAuthContext();

  // Si el usuario está autenticado, redirigir al dashboard
  if (isAuthenticated) {
    return (
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<DashboardPage />} />
            
            {/* Pacientes */}
            <Route path="patients">
              <Route index element={<PatientsPage />} />
              <Route path=":id" element={<PatientDetailPage />} />
            </Route>

            {/* Turnos */}
            <Route 
              path="shifts" 
              element={
                <ProtectedRoute roles={[ROLES.DOCTOR, ROLES.ADMIN]}>
                  <ShiftsPage />
                </ProtectedRoute>
              } 
            />

            {/* Reportes */}
            <Route 
              path="reports" 
              element={
                <ProtectedRoute roles={[ROLES.ADMIN]}>
                  <ReportsPage />
                </ProtectedRoute>
              } 
            />

            {/* Ruta por defecto para rutas no encontradas */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    );
  }

  // Rutas públicas
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
