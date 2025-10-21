import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
  db: {
    schema: 'public',
  },
});

// Tipos de tablas de Supabase
export type Tables = {
  medical_tasks: {
    Row: {
      id: string;
      title: string;
      description: string | null;
      due_date: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      status: 'pending' | 'in-progress' | 'completed' | 'overdue' | 'cancelled';
      category: 'medication' | 'procedure' | 'follow-up' | 'test' | 'other';
      patient_id: string | null;
      patient_name: string | null;
      assigned_to: string | null;
      created_at: string;
      updated_at: string;
      completed_at: string | null;
      notes: string | null;
      recurring: string | null; // JSON string
    };
    Insert: {
      id?: string;
      title: string;
      description?: string | null;
      due_date: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      status: 'pending' | 'in-progress' | 'completed' | 'overdue' | 'cancelled';
      category: 'medication' | 'procedure' | 'follow-up' | 'test' | 'other';
      patient_id?: string | null;
      patient_name?: string | null;
      assigned_to?: string | null;
      created_at?: string;
      updated_at?: string;
      completed_at?: string | null;
      notes?: string | null;
      recurring?: string | null; // JSON string
    };
    Update: {
      id?: string;
      title?: string;
      description?: string | null;
      due_date?: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      status?: 'pending' | 'in-progress' | 'completed' | 'overdue' | 'cancelled';
      category?: 'medication' | 'procedure' | 'follow-up' | 'test' | 'other';
      patient_id?: string | null;
      patient_name?: string | null;
      assigned_to?: string | null;
      created_at?: string;
      updated_at?: string;
      completed_at?: string | null;
      notes?: string | null;
      recurring?: string | null; // JSON string
    };
  };
};

// Tipos para las suscripciones en tiempo real
export type RealtimePayload<T> = {
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  record: T | null;
  old_record: T | null;
};

export default supabase;
