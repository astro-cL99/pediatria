import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePatientDetail(patientId: string) {
  return useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePatientAnthropometric(patientId: string) {
  return useQuery({
    queryKey: ["anthropometric", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anthropometric_data")
        .select("*")
        .eq("patient_id", patientId)
        .order("measured_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePatientAdmissions(patientId: string) {
  return useQuery({
    queryKey: ["admissions", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admissions")
        .select("*")
        .eq("patient_id", patientId)
        .order("admission_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  });
}
