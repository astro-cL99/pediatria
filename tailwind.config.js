/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Colores principales de la marca
        primary: {
          DEFAULT: '#3B82F6', // Azul estándar
          foreground: '#ffffff',
          light: '#93C5FD',
          dark: '#1D4ED8',
        },
        secondary: {
          DEFAULT: '#10B981', // Verde esmeralda
          foreground: '#ffffff',
          light: '#6EE7B7',
          dark: '#059669',
        },
        accent: {
          DEFAULT: '#F59E0B', // Ámbar
          foreground: '#ffffff',
          light: '#FCD34D',
          dark: '#D97706',
        },
        // Colores específicos para pediatría
        pediatric: {
          lightBlue: '#E0F2FE',
          softPink: '#FCE7F3',
          paleGreen: '#D1FAE5',
          lightYellow: '#FEF3C7',
        },
        // Estados y alertas
        success: {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
          dark: '#059669',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#D97706',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
          dark: '#DC2626',
        },
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        heading: ['var(--font-inter)'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('tailwindcss-animate'),
  ],
};
