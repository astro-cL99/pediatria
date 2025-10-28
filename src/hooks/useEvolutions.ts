import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Evolution {
  id: string;
  patient_id: string;
  admission_id: string;
  evolution_date: string;
  evolution_time: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  vital_signs: any;
  created_by: string;
  created_at: string;
}

export function useEvolutions(admissionId: string) {
  return useQuery({
    queryKey: ["evolutions", admissionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_evolutions")
        .select("*")
        .eq("admission_id", admissionId)
        .order("evolution_date", { ascending: false })
        .order("evolution_time", { ascending: false });

      if (error) throw error;
      return data as Evolution[];
    },
    enabled: !!admissionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateEvolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (evolution: Omit<Evolution, "id" | "created_at" | "created_by">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { data, error } = await supabase
        .from("daily_evolutions")
        .insert([{ ...evolution, created_by: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newEvolution) => {
      const admissionId = newEvolution.admission_id;
      await queryClient.cancelQueries({ queryKey: ["evolutions", admissionId] });

      const previous = queryClient.getQueryData<Evolution[]>(["evolutions", admissionId]);

      // Optimistically add
      queryClient.setQueryData<Evolution[]>(["evolutions", admissionId], (old = []) => [
        { ...newEvolution, id: "temp-" + Date.now() } as Evolution,
        ...old,
      ]);

      return { previous, admissionId };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["evolutions", context.admissionId], context.previous);
      }
      toast.error("Error al crear evolución");
    },
    onSuccess: (data, variables, context) => {
      toast.success("Evolución registrada");
    },
    onSettled: (data, error, variables, context) => {
      if (context?.admissionId) {
        queryClient.invalidateQueries({ queryKey: ["evolutions", context.admissionId] });
      }
    },
  });
}
