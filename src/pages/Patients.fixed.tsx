import { useState, useEffect, useMemo } from "react";
import React from "react";
import { BedAssignment } from "@/types/bed-assignment";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// ... rest of your imports ...

// Make sure this interface matches your data structure
interface BedAssignmentWithPatient extends Omit<BedAssignment, 'patient' | 'admission'> {
  patient: {
    id: string;
    name: string;
    rut: string;
    date_of_birth: string;
    gender?: string;
    allergies: string | null;
  };
  admission: {
    id: string;
    admission_date: string;
    admission_diagnoses: string[];
    oxygen_requirement: {
      type?: string;
      flow?: string | number;
      peep?: string | number;
      fio2?: string | number;
    } | null;
    respiratory_score: string | null;
    viral_panel: string | null;
    pending_tasks: string | null;
    antibiotics: Array<{ name: string; dose: string }>;
    medications: string | null;
  };
}

// Rest of your component code...

// Replace the existing BedAssignment type usage with BedAssignmentWithPatient in your component
// For example:
// const [bedAssignments, setBedAssignments] = useState<BedAssignmentWithPatient[]>([]);

// ... rest of your component code ...
