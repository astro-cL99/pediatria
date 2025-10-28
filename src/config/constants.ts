// Environment flags
export const IS_DEVELOPMENT = import.meta.env.DEV;
export const IS_PRODUCTION = import.meta.env.PROD;

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// WebSocket Configuration
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

// Local Storage keys
export const AUTH_TOKEN_KEY = 'auth_token';
export const USER_DATA_KEY = 'user_data';
export const REFRESH_TOKEN_KEY = 'refresh_token';

// Roles
export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  RESIDENT: 'resident',
} as const;

// Routes
// Note: These should match your routing configuration
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  PATIENTS: '/patients',
  PATIENT_DETAIL: (id: string) => `/patients/${id}`,
  SHIFTS: '/shifts',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZES = [10, 25, 50, 100] as const;

// Date & Time
// Note: Consider using date-fns or similar for consistent date handling
export const DATE_FORMAT = 'dd/MM/yyyy';
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';

// UI Constants
export const DEBOUNCE_DELAY = 300; // ms
export const TOAST_DURATION = 5000; // ms

export const GENDERS = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'other', label: 'Otro' },
] as const;

export const BLOOD_TYPES = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
] as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Por favor, verifica tu conexión a internet.',
  UNAUTHORIZED: 'No estás autorizado para realizar esta acción.',
  FORBIDDEN: 'No tienes permisos para acceder a este recurso.',
  NOT_FOUND: 'El recurso solicitado no fue encontrado.',
  SERVER_ERROR: 'Error del servidor. Por favor, intenta más tarde.',
  UNKNOWN_ERROR: 'Ocurrió un error inesperado.',
  TIMEOUT: 'La solicitud ha tardado demasiado tiempo.',
  UNKNOWN: 'Error desconocido.',
} as const;

// Socket events
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  PATIENT_UPDATE: 'patient:update',
  ADMISSION_UPDATE: 'admission:update',
  VITAL_SIGNS_UPDATE: 'vital_signs:update',
  NOTIFICATION: 'notification',
} as const;
