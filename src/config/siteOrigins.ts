const DEFAULT_LANDING_ORIGIN = 'https://randevum.pro'
const DEFAULT_APP_ORIGIN = 'https://app.randevum.pro'
const API_V1_SUFFIX = '/api/v1'

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '')
}

export function migrateLegacyRandevumDomain(url: string): string {
  return url.replace(/randevum\.tr/gi, 'randevum.pro')
}

function resolveEnvOrigin(envValue: string | undefined, fallback: string): string {
  const raw = envValue?.trim()
  const base = raw && raw.length > 0 ? stripTrailingSlash(raw) : fallback
  return migrateLegacyRandevumDomain(base)
}

export function resolveLandingOrigin(): string {
  return resolveEnvOrigin(import.meta.env.VITE_LANDING_URL, DEFAULT_LANDING_ORIGIN)
}

export function resolveAppOrigin(): string {
  return resolveEnvOrigin(import.meta.env.VITE_APP_BASE_URL, DEFAULT_APP_ORIGIN)
}

export function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim()
  if (!raw) {
    return ''
  }
  let base = migrateLegacyRandevumDomain(raw.replace(/\/$/, ''))
  if (!base.endsWith(API_V1_SUFFIX)) {
    base = `${base}${API_V1_SUFFIX}`
  }
  return base
}
