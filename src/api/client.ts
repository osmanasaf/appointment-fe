import axios, { type AxiosError } from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? ''

export const api = axios.create({
  baseURL: baseURL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // httpOnly cookie desteği için
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

// Token yenileme için flag (race condition önleme)
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: unknown = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve()
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = err.config
    
    // 401 hatası varsa refresh dene
    if (err.response?.status === 401 && originalRequest && !originalRequest.headers['X-Retry']) {
      // Refresh endpoint'ine istek yapılıyorsa logout
      if (originalRequest.url?.includes('/auth/refresh')) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(err)
      }

      // Zaten refresh yapılıyorsa kuyruğa ekle
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => {
          return api(originalRequest)
        }).catch((error) => {
          return Promise.reject(error)
        })
      }

      isRefreshing = true

      try {
        // Token yenileme isteği - httpOnly cookie otomatik gönderilir
        const response = await axios.post<ApiResponse<{
          accessToken: string
          refreshToken: string
          user: unknown
        }>>(
          `${api.defaults.baseURL}/auth/refresh`,
          {}, // Body boş, refresh token cookie'den gelecek
          { 
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true 
          }
        )

        if (response.data.success && response.data.data) {
          const { accessToken, user } = response.data.data
          
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('user', JSON.stringify(user))
          
          // Bekleyen istekleri işle
          processQueue()
          
          // Orijinal isteği yeni token ile tekrarla
          originalRequest.headers['X-Retry'] = 'true'
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        } else {
          throw new Error('Refresh failed')
        }
      } catch (refreshError) {
        processQueue(refreshError)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)
