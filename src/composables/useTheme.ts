import { computed, ref, watch, type Ref } from 'vue'

/**
 * Tema tercihi composable'ı.
 *
 * - "light" / "dark" → manuel seçim
 * - "system" → kullanıcının OS tercihi (varsayılan)
 *
 * `<html>` köküne `theme-dark` class'ı eklenir/çıkarılır; CSS değişkenleri
 * `:root` ve `.theme-dark` bloklarından okunur (`assets/style.css`).
 *
 * Tercih `localStorage`'da `theme-preference` anahtarında tutulur.
 *
 * Faz 2'de Topbar'a bağlanır; Faz 7'de Settings ekranı gelişmiş seçim sunar.
 */

export type ThemePreference = 'light' | 'dark' | 'system'
export type EffectiveTheme = 'light' | 'dark'

const STORAGE_KEY = 'theme-preference'
const DARK_CLASS = 'theme-dark'

let preferenceRef: Ref<ThemePreference> | null = null
let mediaQuery: MediaQueryList | null = null
let mediaListener: ((event: MediaQueryListEvent) => void) | null = null
let initialized = false

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  return 'system'
}

function getSystemTheme(): EffectiveTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: EffectiveTheme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle(DARK_CLASS, theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

function ensureInitialized() {
  if (initialized) return
  initialized = true
  preferenceRef = ref<ThemePreference>(readStoredPreference())

  const update = () => {
    const pref = preferenceRef!.value
    const effective: EffectiveTheme = pref === 'system' ? getSystemTheme() : pref
    applyTheme(effective)
  }

  watch(
    preferenceRef,
    (next) => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, next)
      }
      update()
    },
    { immediate: true },
  )

  if (typeof window !== 'undefined' && window.matchMedia) {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaListener = () => {
      if (preferenceRef!.value === 'system') update()
    }
    mediaQuery.addEventListener('change', mediaListener)
  }
}

export function useTheme() {
  ensureInitialized()
  const preference = preferenceRef!

  const effective = computed<EffectiveTheme>(() =>
    preference.value === 'system' ? getSystemTheme() : preference.value,
  )

  function setPreference(next: ThemePreference) {
    preference.value = next
  }

  function toggle() {
    preference.value = effective.value === 'dark' ? 'light' : 'dark'
  }

  return {
    preference,
    effective,
    setPreference,
    toggle,
  }
}
