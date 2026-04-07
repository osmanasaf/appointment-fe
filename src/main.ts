import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import { appThemePreset } from './assets/theme'

import 'primeicons/primeicons.css'
import 'vue-sonner/style.css'
import './assets/style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(PrimeVue, {
  theme: {
    preset: appThemePreset,
    options: {
      darkModeSelector: false,
    },
  },
})
app.mount('#app')