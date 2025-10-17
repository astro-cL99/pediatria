import { z } from 'zod';

// Validador RUT chileno
function validateRUT(rut: string): boolean {
  const cleanRUT = rut.replace(/\./g, '').replace('-', '');
  const body = cleanRUT.slice(0, -1);
  const verifier = cleanRUT.slice(-1).toUpperCase();
  
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedVerifier = 11 - (sum % 11);
  const finalVerifier = expectedVerifier === 11 ? '0' : 
                        expectedVerifier === 10 ? 'K' : 
                        expectedVerifier.toString();
  
  return finalVerifier === verifier;
}

export const patientSchema = z.object({
  name: z.string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre es demasiado largo")
    .regex(/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/, "Solo se permiten letras y espacios"),
  
  rut: z.string()
    .regex(/^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9kK]$/, "RUT inválido (formato: 12.345.678-9)")
    .refine(validateRUT, "RUT no válido"),
  
  date_of_birth: z.string()
    .refine((date) => {
      const birth = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();
      return age >= 0 && age <= 18;
    }, "La fecha debe corresponder a un paciente pediátrico (0-18 años)"),
  
  blood_type: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  
  allergies: z.string().max(500, "Las alergias son demasiado extensas").optional(),
});

export const admissionSchema = z.object({
  chief_complaint: z.string().min(10, "La queja principal debe tener al menos 10 caracteres"),
  admission_diagnoses: z.array(z.string()).min(1, "Debe incluir al menos un diagnóstico"),
  physical_exam: z.object({
    general_condition: z.string().optional(),
    vital_signs: z.object({
      temperature: z.string().optional(),
      heart_rate: z.string().optional(),
      respiratory_rate: z.string().optional(),
      blood_pressure: z.string().optional(),
      oxygen_saturation: z.string().optional(),
    }).optional(),
  }).optional(),
});
