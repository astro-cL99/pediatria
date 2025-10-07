import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Patient {
  id: string;
  name: string;
  rut: string;
  date_of_birth: string;
  blood_type: string | null;
  status: string;
  admission_date: string | null;
  discharge_date: string | null;
  allergies: string | null;
}

export function usePatients() {
  return useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Patient[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdatePatientStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "discharged" | "deceased" | "transferred" }) => {
      const { data, error } = await supabase
        .from("patients")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["patients"] });

      // Snapshot previous value
      const previous = queryClient.getQueryData<Patient[]>(["patients"]);

      // Optimistically update
      queryClient.setQueryData<Patient[]>(["patients"], (old) =>
        old?.map((p) => (p.id === id ? { ...p, status } : p))
      );

      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(["patients"], context.previous);
      }
      toast.error("Error al actualizar estado");
    },
    onSuccess: () => {
      toast.success("Estado actualizado");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}
