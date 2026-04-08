import { api, type ApiResponse } from './client'

export type BusinessStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

/** İşletme sektörü / kategori (dropdown); backend ile aynı kod değerleri */
export interface BusinessCategoryResponse {
  code: string
  label: string
}

export interface BusinessResponse {
  id: number
  name: string
  slug: string
  phoneNumber: string
  email: string | null
  address: string | null
  description: string | null
  logoUrl: string | null
  /** İşletme kategorisi kodu (örn. BEAUTY_SALON) */
  category: string | null
  autoConfirm: boolean
  reminderHoursBefore: number
  sameDayBookingAllowed: boolean
  maxAdvanceBookingDays: number
  maxAppointmentsPerCustomerPerDay: number | null
  whatsappSendPrice: boolean
  status: BusinessStatus
  createdAt: string
}

export interface CreateBusinessRequest {
  name: string
  phoneNumber: string
  phoneCountryCode?: string
  email?: string
  address?: string
  description?: string
  category?: string
}

export interface UpdateBusinessRequest {
  name?: string
  email?: string
  address?: string
  description?: string
  logoUrl?: string
  category?: string
  autoConfirm?: boolean
  reminderHoursBefore?: number
  sameDayBookingAllowed?: boolean
  maxAdvanceBookingDays?: number
  maxAppointmentsPerCustomerPerDay?: number | null
  whatsappSendPrice?: boolean
}

export const businessApi = {
  getCategories() {
    return api.get<ApiResponse<BusinessCategoryResponse[]>>('/businesses/categories')
  },
  create(body: CreateBusinessRequest) {
    return api.post<ApiResponse<BusinessResponse>>('/businesses', body)
  },
  getById(id: number) {
    return api.get<ApiResponse<BusinessResponse>>(`/businesses/${id}`)
  },
  getBySlug(slug: string) {
    return api.get<ApiResponse<BusinessResponse>>(`/businesses/slug/${slug}`)
  },
  update(id: number, body: UpdateBusinessRequest) {
    return api.put<ApiResponse<BusinessResponse>>(`/businesses/${id}`, body)
  },
  delete(id: number) {
    return api.delete<ApiResponse<null>>(`/businesses/${id}`)
  },
}
