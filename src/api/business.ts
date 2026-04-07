import { api, type ApiResponse } from './client'

export type BusinessStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

export interface BusinessResponse {
  id: number
  name: string
  slug: string
  phoneNumber: string
  email: string | null
  address: string | null
  description: string | null
  logoUrl: string | null
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
}

export interface UpdateBusinessRequest {
  name?: string
  email?: string
  address?: string
  description?: string
  logoUrl?: string
  autoConfirm?: boolean
  reminderHoursBefore?: number
  sameDayBookingAllowed?: boolean
  maxAdvanceBookingDays?: number
  maxAppointmentsPerCustomerPerDay?: number | null
  whatsappSendPrice?: boolean
}

export const businessApi = {
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
