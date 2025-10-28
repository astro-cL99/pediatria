export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'doctor' | 'nurse' | 'resident';
  specialty?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  identifier: string; // RUT o número de identificación
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
  isHospitalized: boolean;
  currentBed?: string;
  currentDoctorId?: string;
  admissionDate?: Date;
  dischargeDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  date: Date;
  subjective: string; // Lo que el paciente refiere
  objective: string; // Lo que el médico observa
  assessment: string; // Diagnóstico
  plan: string; // Plan de tratamiento
  isCritical: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Shift {
  id: string;
  doctorId: string;
  startDate: Date;
  endDate: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  patientsHandover: string[]; // IDs de pacientes que se pasan en el traspaso
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  patientId?: string;
  assignedTo: string; // ID del médico
  createdBy: string; // ID del médico que creó la tarea
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  patientId: string;
  relatedRecordId?: string; // ID del registro relacionado (ej: medicalRecordId)
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}
