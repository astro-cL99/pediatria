import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAuthContext } from '@/contexts/AuthContext';

export function MainLayout() {
  const { user } = useAuthContext();

  if (!user) {
    return null; // O un componente de carga
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4">
          <div className="container mx-auto px-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
