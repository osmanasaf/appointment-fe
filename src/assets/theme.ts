import Aura from '@primevue/themes/aura'
import { definePreset } from '@primevue/themes'

/**
 * Randevum PrimeVue Theme — yeni tasarım sistemi (Faz 1)
 * - Primary: derin teal (#0D7A8F) — güven veren, profesyonel
 * - Surface: warm off-white (#FAF9F6) light, deep navy (#0A0F18) dark
 * - Focus ring: primary tint (#E7F6F6)
 *
 * NOT: Semantic token değerleri `assets/style.css` içindeki CSS custom property'lerle
 * uyumlu seçilmiştir; PrimeVue bileşenleri ile özel `card`/`pill`/`btn` sınıfları
 * aynı görsel dile bağlanır.
 */
export const appThemePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#F0FDFA',
      100: '#CCFBF1',
      200: '#99F6E4',
      300: '#5EEAD4',
      400: '#2DD4BF',
      500: '#0D7A8F',
      600: '#0E7490',
      700: '#155E75',
      800: '#164E63',
      900: '#0E4F5C',
      950: '#083344',
    },
    focusRing: {
      width: '3px',
      style: 'solid',
      color: '#E7F6F6',
      offset: '0',
    },
    formField: {
      borderRadius: '12px',
      paddingX: '12px',
      paddingY: '10px',
      focusRing: {
        width: '3px',
        style: 'solid',
        color: '#E7F6F6',
        offset: '0',
        shadow: 'none',
      },
    },
    colorScheme: {
      light: {
        surface: {
          0: '#FFFFFF',
          50: '#F8F6F1',
          100: '#F4F2ED',
          200: '#E5E2DA',
          300: '#CBD3DF',
          400: '#98A2B3',
          500: '#5F6B7E',
          600: '#2B3445',
          700: '#0B1220',
          800: '#0B1220',
          900: '#0B1220',
          950: '#000000',
        },
        primary: {
          color: '#0D7A8F',
          contrastColor: '#FFFFFF',
          hoverColor: '#0E7490',
          activeColor: '#155E75',
        },
        formField: {
          background: '#FFFFFF',
          borderColor: 'rgba(11, 18, 32, 0.14)',
          hoverBorderColor: 'rgba(11, 18, 32, 0.22)',
          focusBorderColor: '#0D7A8F',
          color: '#0B1220',
          placeholderColor: '#98A2B3',
        },
      },
      dark: {
        surface: {
          0: '#FFFFFF',
          50: '#F4F6FA',
          100: '#D3DAE5',
          200: '#97A1B2',
          300: '#6A7486',
          400: '#3D4758',
          500: '#1C2432',
          600: '#161D29',
          700: '#121823',
          800: '#0E141E',
          900: '#0A0F18',
          950: '#000000',
        },
        primary: {
          color: '#2DD4BF',
          contrastColor: '#0B1220',
          hoverColor: '#5EEAD4',
          activeColor: '#99F6E4',
        },
        formField: {
          background: '#161D29',
          borderColor: 'rgba(255,255,255,0.14)',
          hoverBorderColor: 'rgba(255,255,255,0.22)',
          focusBorderColor: '#2DD4BF',
          color: '#F4F6FA',
          placeholderColor: '#6A7486',
        },
      },
    },
  },
})
