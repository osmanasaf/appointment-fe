import axios from 'axios'
import type { ApiResponse } from '@/api/client'

/**
 * Axios veya genel exception'dan okunabilir hata mesajı çıkarır.
 * Backend'in standart ApiResponse.error.message formatını okur.
 */
export function extractApiError(e: unknown, fallback = 'Bir hata oluştu'): string {
  if (axios.isAxiosError(e)) {
    const body = e.response?.data as ApiResponse<unknown> | undefined
    if (body?.error?.message) return body.error.message
    if (e.message) return e.message
  }
  if (e instanceof Error && e.message) return e.message
  return fallback
}
