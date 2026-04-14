import { api, type ApiResponse } from './client'

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'BUSINESS_OWNER' | 'EMPLOYEE'

export interface UserInfo {
  id: number
  email: string
  name: string
  businessId: number | null
  employeeId: number | null
  businessSlug: string | null
  role: UserRole
}

export interface AuthResponseData {
  accessToken: string
  refreshToken: string
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

export interface RegisterEmployeeRequest {
  email: string
  password: string
  name: string
  phoneNumber?: string
  inviteToken: string
}

export interface EmployeeInvitePreview {
  email: string
  employeeName: string
  businessName: string
}

export interface ResendVerificationRequest {
  email: string
}

export interface VerifyOtpRequest {
  email: string
  otp: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  resetToken: string
  newPassword: string
}

export interface ResetTokenResponse {
  resetToken: string
}

export const authApi = {
  login(body: LoginRequest) {
    return api.post<ApiResponse<AuthResponseData>>('/auth/login', body)
  },
  register(body: RegisterRequest) {
    return api.post<ApiResponse<void>>('/auth/register', body)
  },
  registerEmployee(body: RegisterEmployeeRequest) {
    return api.post<ApiResponse<void>>('/auth/register-employee', body)
  },
  getEmployeeInvitePreview(token: string) {
    return api.get<ApiResponse<EmployeeInvitePreview>>('/public/employee-invite/preview', {
      params: { token },
    })
  },
  
  // OTP tabanlı kayıt doğrulama
  verifyRegistrationOtp(body: VerifyOtpRequest) {
    return api.post<ApiResponse<AuthResponseData>>('/auth/verify-registration-otp', body)
  },
  resendRegistrationOtp(body: { email: string }) {
    return api.post<ApiResponse<void>>('/auth/resend-registration-otp', body)
  },

  // Eski link tabanlı doğrulama (geriye uyumluluk)
  verifyEmail(token: string) {
    return api.get<ApiResponse<void>>('/auth/verify-email', { params: { token } })
  },
  resendVerification(body: ResendVerificationRequest) {
    return api.post<ApiResponse<void>>('/auth/resend-verification', body)
  },

  // Şifre sıfırlama
  forgotPassword(body: ForgotPasswordRequest) {
    return api.post<ApiResponse<void>>('/auth/forgot-password', body)
  },
  verifyResetOtp(body: VerifyOtpRequest) {
    return api.post<ApiResponse<ResetTokenResponse>>('/auth/verify-reset-otp', body)
  },
  resetPassword(body: ResetPasswordRequest) {
    return api.post<ApiResponse<void>>('/auth/reset-password', body)
  },

  // Token yenileme - refresh token httpOnly cookie'den gelir
  refreshToken() {
    return api.post<ApiResponse<AuthResponseData>>('/auth/refresh', {})
  },
  logout(accessToken?: string | null) {
    return api.post<ApiResponse<void>>(
      '/auth/logout',
      {},
      accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {},
    )
  },
}
