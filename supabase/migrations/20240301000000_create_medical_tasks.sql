-- CreateEnum
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE task_status AS ENUM ('pending', 'in-progress', 'completed', 'overdue', 'cancelled');
CREATE TYPE task_category AS ENUM ('medication', 'procedure', 'follow-up', 'test', 'other');

-- CreateTable
CREATE TABLE IF NOT EXISTS public.medical_tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    priority task_priority NOT NULL DEFAULT 'medium',
    status task_status NOT NULL DEFAULT 'pending',
    category task_category NOT NULL DEFAULT 'other',
    patient_id UUID,
    patient_name TEXT,
    assigned_to UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    recurring JSONB,
    
    -- Constraints
    CONSTRAINT medical_tasks_pkey PRIMARY KEY (id),
    CONSTRAINT fk_patient
        FOREIGN KEY (patient_id) 
        REFERENCES public.patients(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_assigned_to
        FOREIGN KEY (assigned_to) 
        REFERENCES auth.users(id)
        ON DELETE SET NULL
);

-- CreateIndex for better query performance
CREATE INDEX IF NOT EXISTS idx_medical_tasks_due_date ON public.medical_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_medical_tasks_status ON public.medical_tasks(status);
CREATE INDEX IF NOT EXISTS idx_medical_tasks_priority ON public.medical_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_medical_tasks_patient_id ON public.medical_tasks(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_tasks_assigned_to ON public.medical_tasks(assigned_to);

-- Enable RLS (Row Level Security)
ALTER TABLE public.medical_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow authenticated users to read their own tasks or tasks assigned to them
CREATE POLICY "Enable read access for authenticated users"
ON public.medical_tasks
FOR SELECT
TO authenticated
USING (
    auth.uid() = assigned_to OR 
    (SELECT COUNT(*) FROM auth.users WHERE id = auth.uid()) > 0
);

-- Allow users to insert their own tasks
CREATE POLICY "Enable insert for authenticated users"
ON public.medical_tasks
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to update their own tasks or tasks assigned to them
CREATE POLICY "Enable update for task owners and assignees"
ON public.medical_tasks
FOR UPDATE
TO authenticated
USING (
    auth.uid() = assigned_to OR 
    (SELECT COUNT(*) FROM auth.users WHERE id = auth.uid()) > 0
);

-- Allow users to delete their own tasks
CREATE POLICY "Enable delete for task owners"
ON public.medical_tasks
FOR DELETE
TO authenticated
USING (
    auth.uid() = assigned_to
);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at column on each update
DROP TRIGGER IF EXISTS update_medical_tasks_updated_at ON public.medical_tasks;
CREATE TRIGGER update_medical_tasks_updated_at
BEFORE UPDATE ON public.medical_tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add a function to check for overdue tasks
CREATE OR REPLACE FUNCTION check_overdue_tasks()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark tasks as overdue if due date has passed and status is not completed/cancelled
    UPDATE public.medical_tasks
    SET status = 'overdue'::task_status
    WHERE due_date < NOW()
    AND status NOT IN ('completed', 'cancelled');
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to check for overdue tasks periodically
DROP TRIGGER IF EXISTS trigger_check_overdue_tasks ON public.medical_tasks;
CREATE TRIGGER trigger_check_overdue_tasks
AFTER INSERT OR UPDATE ON public.medical_tasks
FOR EACH STATEMENT
EXECUTE FUNCTION check_overdue_tasks();

-- Create a function to get tasks due soon (for notifications)
CREATE OR REPLACE FUNCTION get_tasks_due_soon(hours_ahead INT DEFAULT 24)
RETURNS TABLE (
    id UUID,
    title TEXT,
    due_date TIMESTAMPTZ,
    patient_name TEXT,
    assigned_to UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.due_date,
        t.patient_name,
        t.assigned_to
    FROM public.medical_tasks t
    WHERE 
        t.due_date BETWEEN NOW() AND (NOW() + (hours_ahead || ' hours')::INTERVAL)
        AND t.status NOT IN ('completed', 'cancelled');
END;
$$ LANGUAGE plpgsql STABLE;
