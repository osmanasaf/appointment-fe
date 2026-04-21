import { computed, type Ref } from 'vue'
import type { ApiFieldError } from '@/api/client'

/**
 * Form field-level hata yönetimi.
 * ValidationException'dan gelen fieldErrors'ı input'lara bağlar.
 */
export function useFormErrors(fieldErrors: Ref<ApiFieldError[]>) {
  const errorMap = computed(() => {
    const map = new Map<string, string>()
    fieldErrors.value.forEach(err => {
      map.set(err.field, err.message)
    })
    return map
  })

  function getFieldError(fieldName: string): string | undefined {
    return errorMap.value.get(fieldName)
  }

  function hasFieldError(fieldName: string): boolean {
    return errorMap.value.has(fieldName)
  }

  function clearFieldErrors() {
    fieldErrors.value = []
  }

  return {
    getFieldError,
    hasFieldError,
    clearFieldErrors,
    errorMap,
  }
}
