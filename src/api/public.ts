import { api, type ApiResponse } from './client'

export interface BusinessResponse {
  id: number
  name: string
  slug: string
  phoneNumber: string
  email: string | null
  address: string | null
  description: string | null
}

export interface ServiceResponse {
  id: number
  name: string
  description: string | null
  durationMinutes: number
  price: number | string
  currency: string
}

export interface EmployeeResponse {
  id: number
  name: string
  phoneNumber: string | null
  email: string | null
}

export interface AvailableSlotResponse {
  startTime: string
  endTime: string
  durationMinutes: number
  instantConfirmation: boolean
  label: string
}

export const publicApi = {
  getBusiness(slug: string) {
    return api.get<ApiResponse<BusinessResponse>>(`/public/businesses/${slug}`)
  },
  getServices(slug: string) {
    return api.get<ApiResponse<ServiceResponse[]>>(`/public/businesses/${slug}/services`)
  },
  getEmployees(slug: string) {
    return api.get<ApiResponse<EmployeeResponse[]>>(`/public/businesses/${slug}/employees`)
  },
  getAvailableDates(businessId: number, employeeId: number, serviceId: number, daysAhead = 14) {
    return api.get<ApiResponse<string[]>>('/public/availability/dates', {
      params: { businessId, employeeId, serviceId, daysAhead },
    })
  },
  getAvailableSlots(businessId: number, employeeId: number, serviceId: number, date: string) {
    return api.get<ApiResponse<AvailableSlotResponse[]>>('/public/availability', {
      params: { businessId, employeeId, serviceId, date },
    })
  },
  createAppointment(slug: string, body: {
    employeeId: number
    serviceId: number
    scheduledAt: string
    customerName: string
    phoneNumber: string
    phoneCountryCode?: string
    notes?: string
  }) {
    return api.post<ApiResponse<unknown>>(`/public/businesses/${slug}/appointments`, body)
  },
}
