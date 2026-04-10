import Aura from '@primevue/themes/aura'
import { definePreset } from '@primevue/themes'

/**
 * Ayarla PrimeVue Theme
 * Primary: Teal (güven veren, profesyonel)
 */
export const appThemePreset = definePreset(Aura, {
  semantic: {
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
    },
  },
})