import { z } from 'zod';

export const patientFormSchema = z.object({
  firstName: z.string().min(2, {
    message: 'El nombre debe tener al menos 2 caracteres.',
  }),
  lastName: z.string().min(2, {
    message: 'El apellido debe tener al menos 2 caracteres.',
  }),
  birthDate: z.string({
    message: 'La fecha de nacimiento es requerida.',
  }),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    message: 'Debes seleccionar un género.',
  }),
  rut: z.string().regex(/^\d{7,8}-[\dkK]$/, {
    message: 'El RUT no es válido.',
  }),
  email: z.string().email({
    message: 'Por favor ingresa un correo electrónico válido.',
  }),
  phone: z.string().min(8, {
    message: 'El teléfono debe tener al menos 8 dígitos.',
  }),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;
