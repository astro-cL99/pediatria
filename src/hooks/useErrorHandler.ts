import { useCallback } from "react";
import { toast } from "sonner";

export function useErrorHandler() {
  const handleError = useCallback((error: any, context?: string) => {
    console.error(`Error${context ? ` in ${context}` : ""}:`, error);

    let message = "Ha ocurrido un error inesperado";

    if (error?.message) {
      message = error.message;
    } else if (typeof error === "string") {
      message = error;
    }

    toast.error(message, {
      action: context
        ? {
            label: "Reintentar",
            onClick: () => window.location.reload(),
          }
        : undefined,
    });
  }, []);

  return { handleError };
}
