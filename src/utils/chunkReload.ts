const CHUNK_RELOAD_FLAG = 'app:chunk-reload'

const DYNAMIC_IMPORT_ERROR_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /Loading chunk \w+ failed/i,
  /error loading dynamically imported module/i,
  /Unable to preload CSS/i,
] as const

export function isDynamicImportError(error: unknown): boolean {
  if (!error) return false
  const message = error instanceof Error ? error.message : String(error)
  return DYNAMIC_IMPORT_ERROR_PATTERNS.some(pattern => pattern.test(message))
}

export function reloadForFreshChunks(targetPath?: string): void {
  if (typeof window === 'undefined') return

  const path = targetPath ?? window.location.pathname + window.location.search + window.location.hash
  const alreadyTried = sessionStorage.getItem(CHUNK_RELOAD_FLAG)

  if (alreadyTried === path) return

  sessionStorage.setItem(CHUNK_RELOAD_FLAG, path)
  window.location.assign(path)
}

export function clearChunkReloadFlag(currentPath: string): void {
  if (typeof window === 'undefined') return
  const flagged = sessionStorage.getItem(CHUNK_RELOAD_FLAG)
  if (flagged && flagged !== currentPath) {
    sessionStorage.removeItem(CHUNK_RELOAD_FLAG)
  }
}

export function installGlobalChunkReloadHandler(): void {
  if (typeof window === 'undefined') return

  window.addEventListener('error', event => {
    if (isDynamicImportError(event.error) || isDynamicImportError(event.message)) {
      reloadForFreshChunks()
    }
  })

  window.addEventListener('unhandledrejection', event => {
    if (isDynamicImportError(event.reason)) {
      event.preventDefault()
      reloadForFreshChunks()
    }
  })
}
