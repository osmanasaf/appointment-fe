import { api, type ApiResponse } from './client'

export type UserRole = 'ADMIN' | 'BUSINESS_OWNER' | 'EMPLOYEE'

export interface UserInfo {
  id: number
  email: string
  name: string
  businessId: number | null
  businessSlug: string | null
  role: UserRole
}

export interface AuthResponseData {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: UserInfo
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  phoneNumber?: string
  businessName: string
  /** `GET /businesses/categories` yanıtındaki `code` */
  businessCategory: string
}

export const authApi = {
  login(body: LoginRequest) {
    return api.post<ApiResponse<AuthResponseData>>('/auth/login', body)
  },
  register(body: RegisterRequest) {
    return api.post<ApiResponse<AuthResponseData>>('/auth/register', body)
  },
}
