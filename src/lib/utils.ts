import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Class name utilities
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatting
export function formatDate(date: Date | string | number) {
  return new Date(date).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// Currency formatting
export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
}

// Form validation
type ValidationResult = {
  isValid: boolean;
  message?: string;
};

export const validateEmail = (email: string): ValidationResult => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return { isValid: false, message: 'El correo es requerido' };
  if (!re.test(email)) return { isValid: false, message: 'Correo electrónico inválido' };
  return { isValid: true };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password) return { isValid: false, message: 'La contraseña es requerida' };
  if (password.length < 8) return { isValid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
  return { isValid: true };
};

export const validateRequired = (value: string, fieldName: string): ValidationResult => {
  if (!value || value.trim() === '') {
    return { isValid: false, message: `${fieldName} es requerido` };
  }
  return { isValid: true };
};

export const validatePhone = (phone: string): ValidationResult => {
  const re = /^[0-9+\s-]+$/;
  if (!phone) return { isValid: false, message: 'El teléfono es requerido' };
  if (!re.test(phone)) return { isValid: false, message: 'Número de teléfono inválido' };
  return { isValid: true };
};

// Format date to YYYY-MM-DD for input[type="date"]
export const formatDateForInput = (date: Date | string): string => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

// Debounce function for search inputs
export const debounce = <F extends (...args: any[]) => any>(
  func: F,
  wait: number
): ((...args: Parameters<F>) => void) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<F>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
