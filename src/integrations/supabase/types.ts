export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admissions: {
        Row: {
          admission_date: string | null
          admission_diagnoses: string[] | null
          admission_source: string
          admitted_by: string | null
          allergies: string | null
          chief_complaint: string | null
          created_at: string | null
          current_medications: string | null
          dau_file_path: string | null
          discharge_date: string | null
          family_history: string | null
          id: string
          imaging_results: string | null
          lab_results: Json | null
          medications: Json | null
          nursing_orders: string | null
          patient_id: string | null
          personal_history: string | null
          physical_exam: string | null
          present_illness: string | null
          status: string | null
          treatment_plan: string | null
          updated_at: string | null
        }
        Insert: {
          admission_date?: string | null
          admission_diagnoses?: string[] | null
          admission_source?: string
          admitted_by?: string | null
          allergies?: string | null
          chief_complaint?: string | null
          created_at?: string | null
          current_medications?: string | null
          dau_file_path?: string | null
          discharge_date?: string | null
          family_history?: string | null
          id?: string
          imaging_results?: string | null
          lab_results?: Json | null
          medications?: Json | null
          nursing_orders?: string | null
          patient_id?: string | null
          personal_history?: string | null
          physical_exam?: string | null
          present_illness?: string | null
          status?: string | null
          treatment_plan?: string | null
          updated_at?: string | null
        }
        Update: {
          admission_date?: string | null
          admission_diagnoses?: string[] | null
          admission_source?: string
          admitted_by?: string | null
          allergies?: string | null
          chief_complaint?: string | null
          created_at?: string | null
          current_medications?: string | null
          dau_file_path?: string | null
          discharge_date?: string | null
          family_history?: string | null
          id?: string
          imaging_results?: string | null
          lab_results?: Json | null
          medications?: Json | null
          nursing_orders?: string | null
          patient_id?: string | null
          personal_history?: string | null
          physical_exam?: string | null
          present_illness?: string | null
          status?: string | null
          treatment_plan?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      anthropometric_data: {
        Row: {
          bmi: number | null
          body_surface_area: number | null
          created_at: string | null
          head_circumference_cm: number | null
          height_cm: number
          id: string
          measured_at: string | null
          measured_by: string | null
          notes: string | null
          patient_id: string | null
          weight_kg: number
        }
        Insert: {
          bmi?: number | null
          body_surface_area?: number | null
          created_at?: string | null
          head_circumference_cm?: number | null
          height_cm: number
          id?: string
          measured_at?: string | null
          measured_by?: string | null
          notes?: string | null
          patient_id?: string | null
          weight_kg: number
        }
        Update: {
          bmi?: number | null
          body_surface_area?: number | null
          created_at?: string | null
          head_circumference_cm?: number | null
          height_cm?: number
          id?: string
          measured_at?: string | null
          measured_by?: string | null
          notes?: string | null
          patient_id?: string | null
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "anthropometric_data_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      cie10_codes: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          description: string
          id: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          description: string
          id?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          description?: string
          id?: string
        }
        Relationships: []
      }
      clinical_protocols: {
        Row: {
          category: string
          clinical_references: string[] | null
          complications: string[] | null
          content: string
          contraindications: string[] | null
          created_at: string | null
          criteria: Json | null
          id: string
          indications: string[] | null
          last_updated: string | null
          monitoring_parameters: Json | null
          procedure_steps: Json | null
          protocol_name: string
          source: string
          version: string | null
        }
        Insert: {
          category: string
          clinical_references?: string[] | null
          complications?: string[] | null
          content: string
          contraindications?: string[] | null
          created_at?: string | null
          criteria?: Json | null
          id?: string
          indications?: string[] | null
          last_updated?: string | null
          monitoring_parameters?: Json | null
          procedure_steps?: Json | null
          protocol_name: string
          source: string
          version?: string | null
        }
        Update: {
          category?: string
          clinical_references?: string[] | null
          complications?: string[] | null
          content?: string
          contraindications?: string[] | null
          created_at?: string | null
          criteria?: Json | null
          id?: string
          indications?: string[] | null
          last_updated?: string | null
          monitoring_parameters?: Json | null
          procedure_steps?: Json | null
          protocol_name?: string
          source?: string
          version?: string | null
        }
        Relationships: []
      }
      daily_evolutions: {
        Row: {
          admission_id: string
          assessment: string | null
          created_at: string | null
          created_by: string
          evolution_date: string
          evolution_time: string
          id: string
          objective: string | null
          patient_id: string
          plan: string | null
          subjective: string | null
          updated_at: string | null
          vital_signs: Json | null
        }
        Insert: {
          admission_id: string
          assessment?: string | null
          created_at?: string | null
          created_by: string
          evolution_date?: string
          evolution_time?: string
          id?: string
          objective?: string | null
          patient_id: string
          plan?: string | null
          subjective?: string | null
          updated_at?: string | null
          vital_signs?: Json | null
        }
        Update: {
          admission_id?: string
          assessment?: string | null
          created_at?: string | null
          created_by?: string
          evolution_date?: string
          evolution_time?: string
          id?: string
          objective?: string | null
          patient_id?: string
          plan?: string | null
          subjective?: string | null
          updated_at?: string | null
          vital_signs?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_evolutions_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_evolutions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnoses: {
        Row: {
          created_at: string | null
          diagnosed_by: string | null
          diagnosis: string
          diagnosis_date: string | null
          id: string
          is_current: boolean | null
          notes: string | null
          patient_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          diagnosed_by?: string | null
          diagnosis: string
          diagnosis_date?: string | null
          id?: string
          is_current?: boolean | null
          notes?: string | null
          patient_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          diagnosed_by?: string | null
          diagnosis?: string
          diagnosis_date?: string | null
          id?: string
          is_current?: boolean | null
          notes?: string | null
          patient_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnoses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_measurements: {
        Row: {
          bmi: number | null
          created_at: string | null
          head_circumference_cm: number | null
          height_cm: number | null
          id: string
          measured_by: string
          measurement_date: string | null
          notes: string | null
          patient_id: string
          weight_kg: number | null
        }
        Insert: {
          bmi?: number | null
          created_at?: string | null
          head_circumference_cm?: number | null
          height_cm?: number | null
          id?: string
          measured_by: string
          measurement_date?: string | null
          notes?: string | null
          patient_id: string
          weight_kg?: number | null
        }
        Update: {
          bmi?: number | null
          created_at?: string | null
          head_circumference_cm?: number | null
          height_cm?: number | null
          id?: string
          measured_by?: string
          measurement_date?: string | null
          notes?: string | null
          patient_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_measurements_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_documents: {
        Row: {
          document_type: string
          file_name: string
          file_path: string
          id: string
          notes: string | null
          patient_id: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          document_type: string
          file_name: string
          file_path: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          document_type?: string
          file_name?: string
          file_path?: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          admission_date: string | null
          allergies: string | null
          blood_type: Database["public"]["Enums"]["blood_type"] | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string
          discharge_date: string | null
          id: string
          name: string
          rut: string
          status: Database["public"]["Enums"]["patient_status"] | null
          updated_at: string | null
        }
        Insert: {
          admission_date?: string | null
          allergies?: string | null
          blood_type?: Database["public"]["Enums"]["blood_type"] | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth: string
          discharge_date?: string | null
          id?: string
          name: string
          rut: string
          status?: Database["public"]["Enums"]["patient_status"] | null
          updated_at?: string | null
        }
        Update: {
          admission_date?: string | null
          allergies?: string | null
          blood_type?: Database["public"]["Enums"]["blood_type"] | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string
          discharge_date?: string | null
          id?: string
          name?: string
          rut?: string
          status?: Database["public"]["Enums"]["patient_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          role: string
          specialty: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id: string
          role?: string
          specialty?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          role?: string
          specialty?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      protocol_templates: {
        Row: {
          category: string
          created_at: string | null
          created_by: string
          diagnosis_code: string | null
          id: string
          is_active: boolean | null
          name: string
          template_data: Json
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by: string
          diagnosis_code?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          template_data: Json
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string
          diagnosis_code?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          template_data?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "doctor" | "nurse" | "viewer"
      blood_type: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-"
      patient_status: "active" | "discharged" | "transferred" | "deceased"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "doctor", "nurse", "viewer"],
      blood_type: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      patient_status: ["active", "discharged", "transferred", "deceased"],
    },
  },
} as const
