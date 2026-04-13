import { computed } from 'vue'
import { resolveAppOrigin } from '@/config/siteOrigins'

const APP_ORIGIN = resolveAppOrigin()

export function appPublicUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (import.meta.env.DEV) {
    return normalized
  }
  return `${APP_ORIGIN}${normalized}`
}

export function useAppPublicUrl() {
  return {
    loginUrl: computed(() => appPublicUrl('/login')),
    registerUrl: computed(() => appPublicUrl('/register')),
    registerEmployeeUrl: computed(() => appPublicUrl('/register-employee')),
    appPublicUrl,
  }
}
