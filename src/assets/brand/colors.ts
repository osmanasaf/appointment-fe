/**
 * Randevum Brand Color Palette
 * Güven veren mavi/teal tonları
 */

export const brandColors = {
  primary: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
    950: '#083344',
    DEFAULT: '#0891B2',
  },
  secondary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
    950: '#1E1B4B',
    DEFAULT: '#6366F1',
  },
  success: {
    light: '#D1FAE5',
    DEFAULT: '#10B981',
    dark: '#059669',
  },
  warning: {
    light: '#FEF3C7',
    DEFAULT: '#F59E0B',
    dark: '#D97706',
  },
  danger: {
    light: '#FEE2E2',
    DEFAULT: '#EF4444',
    dark: '#DC2626',
  },
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
} as const

export const nicheColors = {
  hair: '#0891B2',
  beauty: '#EC4899',
  nail: '#F43F5E',
  tattoo: '#8B5CF6',
  psych: '#3B82F6',
  diet: '#22C55E',
} as const

export const gradients = {
  primary: 'from-teal-600 via-cyan-600 to-blue-600',
  hero: 'from-teal-600 via-teal-700 to-cyan-800',
  card: 'from-teal-50 to-cyan-50',
} as const
