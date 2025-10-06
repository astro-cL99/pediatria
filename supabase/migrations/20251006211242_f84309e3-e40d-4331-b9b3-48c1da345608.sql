-- Enable realtime for patients table
ALTER TABLE public.patients REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.patients;

-- Enable realtime for admissions table
ALTER TABLE public.admissions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admissions;

-- Enable realtime for anthropometric_data table
ALTER TABLE public.anthropometric_data REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.anthropometric_data;