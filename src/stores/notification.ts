import { defineStore } from 'pinia'
import { ref } from 'vue'
import { toast } from 'vue-sonner'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  duration?: number
  description?: string
}

export const useNotificationStore = defineStore('notification', () => {
  // Son gösterilen toast'ı takip et (test/erişilebilirlik için)
  const lastToast = ref<{ type: ToastType; message: string } | null>(null)

  function showSuccess(message: string, options?: ToastOptions) {
    lastToast.value = { type: 'success', message }
    toast.success(message, {
      duration: options?.duration ?? 3000,
      description: options?.description,
    })
  }

  function showError(message: string, options?: ToastOptions) {
    lastToast.value = { type: 'error', message }
    toast.error(message, {
      duration: options?.duration ?? 5000,
      description: options?.description,
    })
  }

  function showWarning(message: string, options?: ToastOptions) {
    lastToast.value = { type: 'warning', message }
    toast.warning(message, {
      duration: options?.duration ?? 4000,
      description: options?.description,
    })
  }

  function showInfo(message: string, options?: ToastOptions) {
    lastToast.value = { type: 'info', message }
    toast.info(message, {
      duration: options?.duration ?? 3000,
      description: options?.description,
    })
  }

  /**
   * API hatası için standardize edilmiş hata mesajı gösterir.
   * error nesnesi veya string kabul eder.
   */
  function showApiError(error: unknown, fallback = 'Bir hata oluştu') {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : fallback
    showError(message)
  }

  return {
    lastToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showApiError,
  }
})
