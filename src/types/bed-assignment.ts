export interface BedAssignment {
  id: string;
  room_number: string;
  bed_number: number;
  patient_id: string;
  admission_id: string;
  assigned_at: string;
  service: 'pediatria' | 'cirugia' | 'ucip';
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
