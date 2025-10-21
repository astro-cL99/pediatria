import { ROLES } from '@/config/constants';

export type RouteConfig = {
  path: string;
  element: React.ReactNode;
  isPublic?: boolean;
  roles?: (typeof ROLES)[keyof typeof ROLES][];
  children?: RouteConfig[];
};

export type AppRoute = Omit<RouteConfig, 'element'> & {
  // Aquí podemos agregar metadatos adicionales para las rutas
  title?: string;
  icon?: React.ReactNode;
  showInNav?: boolean;
  hideFromMenu?: boolean;
};
