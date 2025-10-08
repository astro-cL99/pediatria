-- Create bed_assignments table for managing patient bed assignments
CREATE TABLE IF NOT EXISTS public.bed_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  admission_id UUID REFERENCES public.admissions(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  bed_number INTEGER NOT NULL CHECK (bed_number BETWEEN 1 AND 3),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  discharged_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX idx_bed_assignments_active ON public.bed_assignments(is_active, room_number) WHERE is_active = true;
CREATE INDEX idx_bed_assignments_patient ON public.bed_assignments(patient_id);
CREATE INDEX idx_bed_assignments_admission ON public.bed_assignments(admission_id);

-- Enable RLS
ALTER TABLE public.bed_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view bed assignments"
  ON public.bed_assignments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create bed assignments"
  ON public.bed_assignments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update bed assignments"
  ON public.bed_assignments FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Add new fields to admissions table
ALTER TABLE public.admissions 
  ADD COLUMN IF NOT EXISTS oxygen_requirement JSONB,
  ADD COLUMN IF NOT EXISTS respiratory_score TEXT,
  ADD COLUMN IF NOT EXISTS viral_panel TEXT,
  ADD COLUMN IF NOT EXISTS pending_tasks TEXT,
  ADD COLUMN IF NOT EXISTS antibiotics JSONB;

-- Create trigger for updated_at on bed_assignments
CREATE TRIGGER update_bed_assignments_updated_at
  BEFORE UPDATE ON public.bed_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();