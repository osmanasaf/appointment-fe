import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * Global Command Palette açık/kapalı state ve keyboard shortcut yönetimi.
 * 
 * - `open()`, `close()`, `toggle()` ile açılır/kapanır.
 * - ⌘K (Mac) / Ctrl+K (Win/Linux) global shortcut ile toggle.
 * - ESC tuşu palette açıkken kapatır (component içinde handle edilir).
 */

const isOpen = ref(false)

function open() {
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

function toggle() {
  isOpen.value = !isOpen.value
}

// Global keyboard listener
let listenerAttached = false

function handleGlobalKeydown(event: KeyboardEvent) {
  // ⌘K (Mac) veya Ctrl+K (Win/Linux)
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault()
    toggle()
  }
}

export function useCommandPalette() {
  // İlk composable çağrısında listener ekle
  if (!listenerAttached && typeof document !== 'undefined') {
    listenerAttached = true
    document.addEventListener('keydown', handleGlobalKeydown)
  }

  onMounted(() => {
    // Component mount edildiğinde zaten listener var
  })

  onBeforeUnmount(() => {
    // Global listener; component unmount edildiğinde temizleme
    // (ama genelde AdminLayout gibi uzun ömürlü component'te kullanılır)
  })

  return {
    isOpen,
    open,
    close,
    toggle,
  }
}
