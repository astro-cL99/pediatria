-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for patient blood type
CREATE TYPE blood_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');

-- Create enum for patient status
CREATE TYPE patient_status AS ENUM ('active', 'discharged', 'transferred', 'deceased');

-- Create profiles table for medical staff
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'doctor',
  specialty TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rut TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  blood_type blood_type,
  allergies TEXT,
  status patient_status DEFAULT 'active',
  admission_date TIMESTAMPTZ DEFAULT NOW(),
  discharge_date TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on patients
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Patients policies
CREATE POLICY "Authenticated users can view patients"
  ON public.patients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create patients"
  ON public.patients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update patients"
  ON public.patients FOR UPDATE
  TO authenticated
  USING (true);

-- Create anthropometric_data table for weight, height, BMI, etc.
CREATE TABLE public.anthropometric_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  weight_kg NUMERIC(5,2) NOT NULL,
  height_cm NUMERIC(5,2) NOT NULL,
  bmi NUMERIC(5,2),
  body_surface_area NUMERIC(5,3),
  head_circumference_cm NUMERIC(5,2),
  measured_at TIMESTAMPTZ DEFAULT NOW(),
  measured_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on anthropometric_data
ALTER TABLE public.anthropometric_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view anthropometric data"
  ON public.anthropometric_data FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create anthropometric data"
  ON public.anthropometric_data FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create diagnoses table
CREATE TABLE public.diagnoses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  diagnosis TEXT NOT NULL,
  diagnosis_date TIMESTAMPTZ DEFAULT NOW(),
  diagnosed_by UUID REFERENCES auth.users(id),
  is_current BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on diagnoses
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view diagnoses"
  ON public.diagnoses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create diagnoses"
  ON public.diagnoses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update diagnoses"
  ON public.diagnoses FOR UPDATE
  TO authenticated
  USING (true);

-- Create medical_documents table for PDF uploads
CREATE TABLE public.medical_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Enable RLS on medical_documents
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view documents"
  ON public.medical_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can upload documents"
  ON public.medical_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diagnoses_updated_at
  BEFORE UPDATE ON public.diagnoses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'doctor')
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for medical documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-documents', 'medical-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for medical documents
CREATE POLICY "Authenticated users can view medical documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'medical-documents');

CREATE POLICY "Authenticated users can upload medical documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'medical-documents');

CREATE POLICY "Authenticated users can update medical documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'medical-documents');

CREATE POLICY "Authenticated users can delete medical documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'medical-documents');