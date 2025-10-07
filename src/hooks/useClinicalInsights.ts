import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClinicalInsight {
  id: string;
  insight_type: string;
  data: any;
  generated_at: string;
}

export function useClinicalInsights() {
  return useQuery({
    queryKey: ["clinical-insights"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinical_insights")
        .select("*")
        .order("generated_at", { ascending: false });

      if (error) throw error;
      return data as ClinicalInsight[];
    },
  });
}

export function useGenerateInsights() {
  return async () => {
    try {
      const { data, error } = await supabase.functions.invoke("analyze-patterns");

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || "Error al generar insights");
      }

      toast.success("Insights generados exitosamente");
      return data;
    } catch (error: any) {
      toast.error(error.message || "Error al generar insights");
      throw error;
    }
  };
}
