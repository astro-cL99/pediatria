-- Create epicrisis table to store generated epicrisis documents
CREATE TABLE IF NOT EXISTS public.epicrisis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id),
  admission_id UUID REFERENCES public.admissions(id),
  
  -- Patient info
  patient_name TEXT NOT NULL,
  patient_rut TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  age_at_discharge TEXT,
  
  -- Dates and weights
  admission_date TIMESTAMP WITH TIME ZONE NOT NULL,
  admission_weight NUMERIC,
  discharge_date TIMESTAMP WITH TIME ZONE NOT NULL,
  discharge_weight NUMERIC,
  
  -- Diagnoses
  admission_diagnosis TEXT NOT NULL,
  discharge_diagnosis TEXT NOT NULL,
  
  -- Clinical content
  evolution_and_treatment TEXT NOT NULL,
  
  -- Exams
  laboratory_exams TEXT,
  imaging_exams TEXT,
  
  -- Discharge
  discharge_instructions TEXT,
  attending_physician TEXT NOT NULL,
  physician_signature TEXT,
  
  -- File reference
  pdf_file_path TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.epicrisis ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view epicrisis"
  ON public.epicrisis
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create epicrisis"
  ON public.epicrisis
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Authenticated users can update own epicrisis"
  ON public.epicrisis
  FOR UPDATE
  USING (created_by = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_epicrisis_updated_at
  BEFORE UPDATE ON public.epicrisis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();