import { resolveLandingOrigin } from '@/config/siteOrigins'

export function buildPublicBookingUrl(slug: string): string {
  const trimmed = slug.trim()
  if (!trimmed) return ''
  const path = `/b/${trimmed}`
  if (import.meta.env.DEV) {
    const origin =
      typeof globalThis.window !== 'undefined' ? globalThis.window.location.origin : ''
    return origin ? `${origin}${path}` : path
  }
  return `${resolveLandingOrigin()}${path}`
}
