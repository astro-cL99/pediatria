import { useState, useMemo } from 'react';
import { medications, diagnosisTemplates, Medication, DiagnosisTemplate } from '@/data/medicationsData';

export interface PrescriptionMedication extends Medication {
  calculatedDose: number;
  maxDose: number | null;
  frequency: string;
  route: string;
  duration: number;
  instructions: string;
}

export interface MedicationInteraction {
  medication1: string;
  medication2: string;
  severity: 'leve' | 'moderada' | 'grave';
  description: string;
}

export const usePrescription = () => {
  const [selectedMeds, setSelectedMeds] = useState<PrescriptionMedication[]>([]);
  const [patientWeight, setPatientWeight] = useState<number | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [diagnosisDescription, setDiagnosisDescription] = useState('');

  const calculateDose = (med: Medication, weight: number | null): { dose: number; maxDose: number | null } => {
    if (!weight) return { dose: 0, maxDose: med.maxDoseMg || null };
    
    let dose = 0;
    
    // Calcular dosis basada en peso si está disponible
    if (med.minDoseMgKg) {
      dose = med.minDoseMgKg * weight;
      
      // Ajustar a dosis máxima si se excede
      if (med.maxDoseMg && dose > med.maxDoseMg) {
        dose = med.maxDoseMg;
      }
      
      // Ajustar a dosis máxima por kg si se excede
      if (med.maxDoseMgKg) {
        const maxDoseByWeight = med.maxDoseMgKg * weight;
        if (dose > maxDoseByWeight) {
          dose = maxDoseByWeight;
        }
      }
    } else if (med.maxDoseMg) {
      // Si no hay dosis por kg, usar dosis máxima
      dose = med.maxDoseMg;
    }
    
    return { 
      dose: parseFloat(dose.toFixed(2)), 
      maxDose: med.maxDoseMg || null 
    };
  };

  const checkInteractions = (): MedicationInteraction[] => {
    const interactions: MedicationInteraction[] = [];
    
    // Verificar interacciones entre todos los pares de medicamentos
    for (let i = 0; i < selectedMeds.length; i++) {
      for (let j = i + 1; j < selectedMeds.length; j++) {
        const med1 = selectedMeds[i];
        const med2 = selectedMeds[j];
        
        // Buscar interacciones directas entre med1 y med2
        const med1Interactions = med1.interactions.filter(
          int => int.withMedication === med2.name
        );
        
        // Buscar interacciones directas entre med2 y med1 (en caso de que estén definidas al revés)
        const med2Interactions = med2.interactions.filter(
          int => int.withMedication === med1.name
        );
        
        // Agregar todas las interacciones encontradas
        med1Interactions.forEach(int => {
          interactions.push({
            medication1: med1.name,
            medication2: med2.name,
            severity: int.severity,
            description: int.description
          });
        });
        
        med2Interactions.forEach(int => {
          interactions.push({
            medication1: med2.name,
            medication2: med1.name,
            severity: int.severity,
            description: int.description
          });
        });
      }
    }
    
    return interactions;
  };

  const applyTemplate = (templateId: string) => {
    const template = diagnosisTemplates.find(t => t.id === templateId);
    if (!template) return;
    
    // Actualizar diagnóstico
    setDiagnosis(template.diagnosisCode);
    setDiagnosisDescription(template.description || '');
    
    // Obtener medicamentos de la plantilla
    const templateMeds = medications
      .filter(m => template.medications.includes(m.id))
      .map(med => {
        const { dose, maxDose } = calculateDose(med, patientWeight);
        return {
          ...med,
          calculatedDose: dose,
          maxDose,
          duration: template.duration,
          instructions: template.description || ''
        };
      });
    
    setSelectedMeds(templateMeds);
  };

  const addMedication = (medId: string) => {
    const existingMed = selectedMeds.find(m => m.id === medId);
    if (existingMed) return;
    
    const med = medications.find(m => m.id === medId);
    if (!med) return;
    
    const { dose, maxDose } = calculateDose(med, patientWeight);
    
    setSelectedMeds([
      ...selectedMeds,
      {
        ...med,
        calculatedDose: dose,
        maxDose,
        frequency: med.frequency,
        route: med.route,
        duration: 7, // Duración por defecto
        instructions: ''
      }
    ]);
  };

  const removeMedication = (medId: string) => {
    setSelectedMeds(selectedMeds.filter(m => m.id !== medId));
  };

  const updateMedication = (medId: string, updates: Partial<PrescriptionMedication>) => {
    setSelectedMeds(
      selectedMeds.map(med => 
        med.id === medId ? { ...med, ...updates } : med
      )
    );
  };

  const clearPrescription = () => {
    setSelectedMeds([]);
    setDiagnosis('');
    setDiagnosisDescription('');
  };

  const interactions = useMemo(() => checkInteractions(), [selectedMeds]);
  
  const hasSevereInteraction = useMemo(
    () => interactions.some(i => i.severity === 'grave'),
    [interactions]
  );

  return {
    // State
    selectedMeds,
    patientWeight,
    diagnosis,
    diagnosisDescription,
    interactions,
    hasSevereInteraction,
    
    // Actions
    setPatientWeight,
    setDiagnosis,
    setDiagnosisDescription,
    calculateDose,
    checkInteractions,
    applyTemplate,
    addMedication,
    removeMedication,
    updateMedication,
    clearPrescription,
    
    // Data
    medications,
    diagnosisTemplates
  };
};
