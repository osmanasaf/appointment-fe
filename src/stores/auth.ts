import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, type UserInfo, type LoginRequest, type RegisterRequest } from '@/api/auth'

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

  function setAuth(accessToken: string, userData: UserInfo) {
    token.value = accessToken
    user.value = userData
    localStorage.setItem(TOKEN_KEY, accessToken)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  async function login(credentials: LoginRequest) {
    const { data } = await authApi.login(credentials)
    if (data.success && data.data) {
      setAuth(data.data.accessToken, data.data.user)
      return data
    }
    throw new Error(data.error?.message ?? 'Giriş başarısız')
  }

  async function register(payload: RegisterRequest) {
    const { data } = await authApi.register(payload)
    if (data.success) {
      return data
    }
    throw new Error(data.error?.message ?? 'Kayıt başarısız')
  }

  return { token, user, isAuthenticated, login, register, logout, setAuth }
})
