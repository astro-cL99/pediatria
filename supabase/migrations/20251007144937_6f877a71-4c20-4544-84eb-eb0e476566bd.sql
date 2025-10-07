-- Crear enum para roles de la aplicación
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'nurse', 'viewer');

-- Tabla de roles de usuarios (NUNCA en profiles o auth.users por seguridad)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID,
  UNIQUE(user_id, role)
);

-- Índices
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas: todos pueden ver roles, solo admins pueden modificar
CREATE POLICY "Anyone can view user roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (true);

-- Función segura para verificar roles (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Función para verificar si es admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Solo admins pueden insertar/actualizar/eliminar roles
CREATE POLICY "Only admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Asignar rol de doctor por defecto al primer usuario (para testing)
-- En producción esto se haría manualmente
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'doctor'
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.users.id)
ON CONFLICT DO NOTHING;