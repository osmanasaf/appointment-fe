import axios from 'axios'
import type { ApiResponse, ApiFieldError } from '@/api/client'

export interface NormalizedApiError {
  code: string
  message: string
  status?: number
  fieldErrors: ApiFieldError[]
  isNetwork: boolean
  isAuth: boolean
  isForbidden: boolean
  isValidation: boolean
  isServer: boolean
  raw: unknown
}

/**
 * Axios veya genel exception'dan normalize edilmiş hata döndürür.
 * Backend mesajı öncelikli, teknik hatalar için i18n fallback.
 */
export function normalizeApiError(e: unknown, fallback = 'Bir hata oluştu'): NormalizedApiError {
  const defaultError: NormalizedApiError = {
    code: 'UNKNOWN',
    message: fallback,
    fieldErrors: [],
    isNetwork: false,
    isAuth: false,
    isForbidden: false,
    isValidation: false,
    isServer: false,
    raw: e,
  }

  if (!e) return defaultError

  if (axios.isAxiosError(e)) {
    const status = e.response?.status
    const body = e.response?.data as ApiResponse<unknown> | undefined
    const errorData = body?.error

    const code = errorData?.code ?? 'UNKNOWN'
    const fieldErrors = (errorData?.details as ApiFieldError[] | undefined) ?? []

    let message = errorData?.message ?? fallback

    if (e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT') {
      return {
        ...defaultError,
        code: 'TIMEOUT',
        message: 'errors.timeout',
        isNetwork: true,
      }
    }

    if (e.message?.toLowerCase().includes('network') || !e.response) {
      return {
        ...defaultError,
        code: 'NETWORK_ERROR',
        message: 'errors.network',
        isNetwork: true,
      }
    }

    return {
      code,
      message,
      status,
      fieldErrors,
      isNetwork: false,
      isAuth: status === 401,
      isForbidden: status === 403,
      isValidation: status === 400 || status === 422 || code === 'VALIDATION_ERROR',
      isServer: status ? status >= 500 : false,
      raw: e,
    }
  }

  if (e instanceof Error) {
    return {
      ...defaultError,
      message: e.message || fallback,
    }
  }

  return defaultError
}

/**
 * Axios veya genel exception'dan okunabilir hata mesajı çıkarır.
 * Backend'in standart ApiResponse.error.message formatını okur.
 * 
 * @deprecated normalizeApiError kullanın (daha kapsamlı).
 */
export function extractApiError(e: unknown, fallback = 'Bir hata oluştu'): string {
  return normalizeApiError(e, fallback).message
}
