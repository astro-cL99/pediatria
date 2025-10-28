import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/ui/icons';
import { Activity } from 'lucide-react';

// Esquema de validación con Zod
const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido').min(1, 'El correo es requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = (location.state as any)?.from?.pathname || ROUTES.DASHBOARD;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      await login(data.email, data.password);
      
      // Mostrar notificación de éxito
      toast.success('¡Bienvenido de nuevo!', {
        description: 'Has iniciado sesión correctamente.',
      });
      
      // Redirigir al usuario a la página desde donde vino o al dashboard
      navigate(from, { replace: true });
    } catch (error) {
      // El error ya se maneja en el interceptor de axios
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Icons.activity className="h-16 w-auto text-primary-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Iniciar sesión en PediFlow
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          O{' '}
          <Link
            to="#"
            className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
          >
            solicita acceso al sistema
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </Label>
              <div className="mt-1 relative">
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  disabled={isLoading}
                  {...register('email')}
                  className={errors.email ? 'border-red-300' : ''}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </Label>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  {...register('password')}
                  className={errors.password ? 'border-red-300' : ''}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Checkbox
                  id="rememberMe"
                  disabled={isLoading}
                  {...register('rememberMe')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <Label
                  htmlFor="rememberMe"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Recordarme
                </Label>
              </div>

              <div className="text-sm">
                <Link
                  to="#"
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  O continúa con
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                type="button"
                disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <Icons.mail className="h-5 w-5" />
                <span className="ml-2">Google</span>
              </Button>

              <Button
                variant="outline"
                type="button"
                disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <Icons.shield className="h-5 w-5" />
                <span className="ml-2">Microsoft</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            ¿No tienes una cuenta?{' '}
            <Link
              to="#"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Contáctanos
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
