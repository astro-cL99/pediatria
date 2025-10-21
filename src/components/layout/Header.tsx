import { Link } from 'react-router-dom';
import { User } from '@/types/models';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';

type HeaderProps = {
  user: User;
};

export function Header({ user }: HeaderProps) {
  const { logout } = useAuthContext();
  
  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-semibold text-gray-800">
            PediFlow
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button className="p-1 rounded-full text-gray-600 hover:text-gray-800 focus:outline-none">
              <span className="sr-only">Notificaciones</span>
              <div className="h-6 w-6">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
            </button>
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
          </div>
          
          <div className="relative">
            <button className="flex items-center space-x-2 focus:outline-none">
              <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
              <span className="hidden md:inline-block text-sm font-medium text-gray-700">
                {user.firstName} {user.lastName}
              </span>
            </button>
            
            <div className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              <Link to="/perfil" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Mi perfil
              </Link>
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
