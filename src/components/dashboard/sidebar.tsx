'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User } from 'next-auth';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Stethoscope,
  Pill,
  FilePlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';

const navigation = [
  { name: 'Resumen', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pacientes', href: '/dashboard/patients', icon: Users },
  { name: 'Citas', href: '/dashboard/appointments', icon: Calendar },
  { name: 'Expedientes', href: '/dashboard/records', icon: FileText },
  { name: 'Recetas', href: '/dashboard/prescriptions', icon: Pill },
  { name: 'Consultas', href: '/dashboard/consultations', icon: Stethoscope },
  { name: 'Nuevo', href: '/dashboard/new', icon: FilePlus, isAction: true },
];

interface DashboardSidebarProps {
  user: User;
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center">
            <span className="text-xl font-bold text-pediatric-primary">PediFlow</span>
          </Link>
        </div>

        {/* User profile */}
        <div className="flex items-center p-4 border-b border-gray-200">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-pediatric-primary/10 flex items-center justify-center text-pediatric-primary font-semibold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">{user?.name || 'Usuario'}</p>
            <p className="text-xs font-medium text-gray-500">{user?.role || 'Rol'}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md',
                  pathname === item.href
                    ? 'bg-pediatric-primary/10 text-pediatric-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  item.isAction ? 'mt-6 border-t border-gray-200 pt-4' : ''
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 flex-shrink-0 h-5 w-5',
                    pathname === item.href
                      ? 'text-pediatric-primary'
                      : 'text-gray-400 group-hover:text-gray-500'
                  )}
                  aria-hidden="true"
                />
                {item.name}
                {item.isAction && (
                  <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pediatric-primary/10 text-pediatric-primary">
                    Nuevo
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom section */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
