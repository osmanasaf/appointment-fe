import { useRouter } from 'vue-router'
import { useToast } from './useToast'
import { useUpgradeModal } from './useUpgradeModal'
import { normalizeApiError, type NormalizedApiError } from '@/utils/apiError'

interface ErrorHandlerContext {
  display?: 'toast' | 'inline' | 'silent'
  onPlanLimit?: () => void
  onEmailNotVerified?: (email?: string) => void
  onValidation?: (fieldErrors: Array<{ field: string; message: string }>) => void
  fallbackMessage?: string
}

/**
 * Merkezi API hata yönetimi.
 * Code-bazlı aksiyonları otomatik tetikler, display stratejisini yönetir.
 */
export function useApiError() {
  const toast = useToast()
  const router = useRouter()
  const upgradeModal = useUpgradeModal()

  function handle(error: unknown, context?: ErrorHandlerContext): NormalizedApiError {
    const normalized = normalizeApiError(error, context?.fallbackMessage)
    const display = context?.display ?? 'inline'

    // Code-bazlı özel aksiyonlar
    if (normalized.code === 'EMAIL_NOT_VERIFIED' && context?.onEmailNotVerified) {
      context.onEmailNotVerified()
      return normalized
    }

    if (normalized.code === 'PLAN_LIMIT_EXCEEDED') {
      if (context?.onPlanLimit) {
        context.onPlanLimit()
      } else {
        // Default aksiyon: UpgradeModal aç
        upgradeModal.show(normalized.message)
      }
      if (display === 'toast') {
        toast.error(normalized.message)
      }
      return normalized
    }

    if (normalized.isValidation && normalized.fieldErrors.length > 0 && context?.onValidation) {
      context.onValidation(normalized.fieldErrors)
      return normalized
    }

    // 401 oturum hatası → login'e yönlendir (refresh zaten interceptor'da denenir)
    if (normalized.isAuth && normalized.code === 'UNAUTHORIZED') {
      toast.error(normalized.message)
      router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
      return normalized
    }

    // Display stratejisi
    if (display === 'toast') {
      toast.error(normalized.message)
    }
    // 'inline' veya 'silent' durumunda caller'ın göstermesi beklenir

    return normalized
  }

  return { handle }
}
