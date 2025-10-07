import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface UseAutoSaveOptions {
  key: string;
  data: any;
  delay?: number;
}

export function useAutoSave({ key, data, delay = 2000 }: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef<string>();

  useEffect(() => {
    const currentData = JSON.stringify(data);
    
    // Don't save if data hasn't changed
    if (currentData === previousDataRef.current) {
      return;
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, currentData);
        previousDataRef.current = currentData;
        toast.success("Borrador guardado automáticamente", {
          duration: 2000,
        });
      } catch (error) {
        console.error("Error saving draft:", error);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, key, delay]);

  const loadDraft = (): any => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Error loading draft:", error);
      return null;
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(key);
      toast.success("Borrador eliminado");
    } catch (error) {
      console.error("Error clearing draft:", error);
    }
  };

  return { loadDraft, clearDraft };
}