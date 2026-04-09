import axios, { type AxiosError } from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? ''

export const api = axios.create({
  baseURL: baseURL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

/** Sunucu MethodArgumentNotValidException / validation cevaplarındaki alan hataları */
export interface ApiFieldError {
  field: string
  message: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: {
    code: string
    message: string
    details?: ApiFieldError[] | null
    timestamp?: string
  }
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

/** Sayfalı API cevabından dizi al (eski `data` doğrudan dizi iken kırılan yerler için). */
export function pageContent<T>(data: PageResponse<T> | undefined | null): T[] {
  return data?.content ?? []
}

/**
 * hasNext olduğu sürece sayfaları çeker (admin tam liste; max sayfa güvenlik sınırı).
 */
export async function fetchAllPageContent<T>(
  fetchPage: (page: number, size: number) => Promise<{ data: ApiResponse<PageResponse<T>> }>,
  options?: { maxPages?: number; pageSize?: number },
): Promise<T[]> {
  const maxPages = options?.maxPages ?? 30
  const pageSize = options?.pageSize ?? 100
  const all: T[] = []
  for (let page = 0; page < maxPages; page++) {
    const res = await fetchPage(page, pageSize)
    const body = res.data
    if (!body?.success || !body.data) break
    all.push(...pageContent(body.data))
    if (!body.data.hasNext) break
  }
  return all
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<ApiResponse<unknown>>) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
