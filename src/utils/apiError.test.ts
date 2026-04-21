import { describe, it, expect } from 'vitest'
import { normalizeApiError } from './apiError'
import type { ApiResponse } from '@/api/client'

describe('normalizeApiError', () => {
  it('should extract backend message and code from axios error', () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Girilen veriler geçersiz',
            details: [
              { field: 'email', message: 'E-posta geçersiz' },
            ],
          },
        } as ApiResponse<unknown>,
      },
    }

    const result = normalizeApiError(axiosError)

    expect(result.code).toBe('VALIDATION_ERROR')
    expect(result.message).toBe('Girilen veriler geçersiz')
    expect(result.fieldErrors).toHaveLength(1)
    expect(result.fieldErrors[0]).toEqual({ field: 'email', message: 'E-posta geçersiz' })
    expect(result.isValidation).toBe(true)
    expect(result.status).toBe(400)
  })

  it('should handle network errors', () => {
    const networkError = {
      isAxiosError: true,
      message: 'Network Error',
      code: 'ECONNABORTED',
    }

    const result = normalizeApiError(networkError)

    expect(result.code).toBe('TIMEOUT')
    expect(result.message).toBe('errors.timeout')
    expect(result.isNetwork).toBe(true)
  })

  it('should handle 401 auth errors', () => {
    const authError = {
      isAxiosError: true,
      response: {
        status: 401,
        data: {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Oturumunuz sona erdi',
          },
        } as ApiResponse<unknown>,
      },
    }

    const result = normalizeApiError(authError)

    expect(result.code).toBe('UNAUTHORIZED')
    expect(result.isAuth).toBe(true)
    expect(result.status).toBe(401)
  })

  it('should handle 500 server errors', () => {
    const serverError = {
      isAxiosError: true,
      response: {
        status: 500,
        data: {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Beklenmeyen bir hata oluştu',
          },
        } as ApiResponse<unknown>,
      },
    }

    const result = normalizeApiError(serverError)

    expect(result.code).toBe('INTERNAL_ERROR')
    expect(result.isServer).toBe(true)
  })

  it('should use fallback message for generic errors', () => {
    const genericError = new Error('Something went wrong')

    const result = normalizeApiError(genericError, 'Fallback mesajı')

    expect(result.message).toBe('Something went wrong')
    expect(result.code).toBe('UNKNOWN')
  })

  it('should handle timeout errors', () => {
    const timeoutError = {
      isAxiosError: true,
      code: 'ETIMEDOUT',
      message: 'timeout of 5000ms exceeded',
    }

    const result = normalizeApiError(timeoutError)

    expect(result.code).toBe('TIMEOUT')
    expect(result.message).toBe('errors.timeout')
    expect(result.isNetwork).toBe(true)
  })

  it('should preserve backend message for 404 errors', () => {
    const notFoundError = {
      isAxiosError: true,
      response: {
        status: 404,
        data: {
          error: {
            code: 'EMPLOYEE_NOT_FOUND',
            message: 'Çalışan bulunamadı',
          },
        } as ApiResponse<unknown>,
      },
    }

    const result = normalizeApiError(notFoundError)

    expect(result.code).toBe('EMPLOYEE_NOT_FOUND')
    expect(result.message).toBe('Çalışan bulunamadı')
    expect(result.status).toBe(404)
  })
})
