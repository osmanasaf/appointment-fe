import axios from 'axios'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ApiResponse } from '@/api/client'
import { authApi, type UserInfo, type LoginRequest, type RegisterRequest, type AuthResponseData } from '@/api/auth'

const TOKEN_KEY = 'accessToken'
const USER_KEY = 'user'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  
  function getStoredUser(): UserInfo | null {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as UserInfo
    } catch {
      return null
    }
  }
  const user = ref<UserInfo | null>(getStoredUser())

  const isAuthenticated = computed(() => !!token.value)
  const isEmployee = computed(() => user.value?.role === 'EMPLOYEE')
  const isBusinessOwner = computed(() => user.value?.role === 'BUSINESS_OWNER')
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isSuperAdmin = computed(() => user.value?.role === 'SUPER_ADMIN')
  const currentEmployeeId = computed(() => user.value?.employeeId ?? null)

  // Token yenileme durumu (race condition önleme)
  let refreshPromise: Promise<boolean> | null = null

  function setAuth(authData: AuthResponseData): void
  function setAuth(accessToken: string, userData: UserInfo): void
  function setAuth(authDataOrToken: AuthResponseData | string, userData?: UserInfo) {
    if (typeof authDataOrToken === 'string') {
      token.value = authDataOrToken
      user.value = userData!
      localStorage.setItem(TOKEN_KEY, authDataOrToken)
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
    } else {
      token.value = authDataOrToken.accessToken
      user.value = authDataOrToken.user
      localStorage.setItem(TOKEN_KEY, authDataOrToken.accessToken)
      localStorage.setItem(USER_KEY, JSON.stringify(authDataOrToken.user))
      // Refresh token artık httpOnly cookie'de, localStorage'a kaydetmiyoruz
    }
  }

  async function logout() {
    const accessTokenSnapshot = token.value
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    try {
      await authApi.logout(accessTokenSnapshot)
    } catch {
      // Sunucu hatası: yerel oturum zaten temizlendi
    }
  }

  async function login(credentials: LoginRequest) {
    try {
      const { data } = await authApi.login(credentials)
      if (data.success && data.data) {
        setAuth(data.data)
        return data
      }
      throw new Error(data.error?.message ?? 'Giriş başarısız')
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        const body = e.response?.data as ApiResponse<unknown> | undefined
        if (e.response?.status === 403 && body?.error?.code === 'EMAIL_NOT_VERIFIED') {
          throw e
        }
        if (body?.error?.message) {
          throw new Error(body.error.message)
        }
      }
      throw e
    }
  }

  async function register(payload: RegisterRequest) {
    const { data } = await authApi.register(payload)
    if (data.success) {
      return data
    }
    throw new Error(data.error?.message ?? 'Kayıt başarısız')
  }

  /**
   * Access token'ı refresh token kullanarak yeniler.
   * Refresh token httpOnly cookie'de, otomatik gönderilir.
   */
  async function refreshAccessToken(): Promise<boolean> {
    // Zaten bir refresh işlemi varsa, onu bekle
    if (refreshPromise) {
      return refreshPromise
    }

    refreshPromise = (async () => {
      try {
        const { data } = await authApi.refreshToken()
        if (data.success && data.data) {
          setAuth(data.data)
          return true
        }
        // Refresh başarısız - logout yap
        await logout()
        return false
      } catch {
        // Refresh başarısız - logout yap
        await logout()
        return false
      } finally {
        refreshPromise = null
      }
    })()

    return refreshPromise
  }

  return { 
    token, 
    user, 
    isAuthenticated, 
    isEmployee, 
    isBusinessOwner, 
    isAdmin, 
    isSuperAdmin,
    currentEmployeeId,
    login, 
    register, 
    logout, 
    setAuth,
    refreshAccessToken
  }
})
