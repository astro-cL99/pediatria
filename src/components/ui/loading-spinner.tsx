import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
}

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div className={cn("animate-spin rounded-full border-4 border-solid border-primary-500 border-t-transparent", className)}>
      <span className="sr-only">Cargando...</span>
    </div>
  );
}
