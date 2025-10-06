-- Create admissions table
CREATE TABLE IF NOT EXISTS public.admissions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id),
  admission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  discharge_date TIMESTAMP WITH TIME ZONE,
  admission_source TEXT NOT NULL DEFAULT 'emergency',
  chief_complaint TEXT,
  present_illness TEXT,
  personal_history TEXT,
  family_history TEXT,
  allergies TEXT,
  current_medications TEXT,
  physical_exam TEXT,
  lab_results JSONB,
  imaging_results TEXT,
  admission_diagnoses TEXT[],
  treatment_plan TEXT,
  nursing_orders TEXT,
  medications JSONB,
  status TEXT DEFAULT 'active',
  admitted_by UUID REFERENCES auth.users(id),
  dau_file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view admissions"
  ON public.admissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create admissions"
  ON public.admissions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update admissions"
  ON public.admissions FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_admissions_updated_at
  BEFORE UPDATE ON public.admissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();