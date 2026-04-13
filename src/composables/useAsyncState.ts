import { ref, type Ref } from 'vue'
import { extractApiError } from '@/utils/apiError'

export interface AsyncState<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  execute: () => Promise<void>
  retry: () => Promise<void>
}

/**
 * Async veri yükleme için standart state yönetimi.
 * Loading, error ve retry mantığını tek yerde toplar.
 *
 * Kullanım:
 *   const { data, loading, error, execute } = useAsyncState(() => api.getList())
 *   onMounted(execute)
 */
export function useAsyncState<T>(
  fetcher: () => Promise<T>,
  options?: {
    /** İlk çalıştırmada immediate true ise hemen tetiklenir. Default: false */
    immediate?: boolean
    /** Hata mesajı için fallback metin */
    errorMessage?: string
  },
): AsyncState<T> {
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function execute() {
    loading.value = true
    error.value = null
    try {
      data.value = await fetcher()
    } catch (e: unknown) {
      error.value = extractApiError(e, options?.errorMessage ?? 'Bir hata oluştu')
    } finally {
      loading.value = false
    }
  }

  if (options?.immediate) {
    execute()
  }

  return {
    data,
    loading,
    error,
    execute,
    retry: execute,
  }
}
