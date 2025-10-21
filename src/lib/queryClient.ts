import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: (failureCount, error: any) => {
        // No reintentar en errores 4xx (excepto 408 Request Timeout)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Reintentar hasta 3 veces para otros errores
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
  },
});
