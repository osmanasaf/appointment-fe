import { createI18n } from 'vue-i18n'
import tr from './locales/tr.json'
import en from './locales/en.json'

export const i18n = createI18n({
  legacy: false,
  locale: 'tr',
  fallbackLocale: 'en',
  messages: {
    tr,
    en,
  },
  globalInjection: true,
})