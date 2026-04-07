import { api, type ApiResponse } from './client'
import type { EmployeeResponse } from './employee'

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

  /** Belirli bir hizmeti yapabilen çalışanları listeler */
  getEmployeesForService(slug: string, serviceId: number) {
    return api.get<ApiResponse<EmployeeResponse[]>>(
      `/public/businesses/${slug}/services/${serviceId}/employees`,
    )
  },

  /** employeeId opsiyonel — verilmezse tüm yetkin çalışanların slotları birleştirilir */
  getAvailableSlotsBySlug(
    slug: string,
    serviceId: number,
    date: string,
    employeeId?: number,
  ) {
    return api.get<ApiResponse<AvailableSlotResponse[]>>(
      `/public/businesses/${slug}/availability`,
      { params: { serviceId, date, ...(employeeId ? { employeeId } : {}) } },
    )
  },

  getAvailableSlots(
    businessId: number,
    serviceId: number,
    date: string,
    employeeId?: number,
  ) {
    return api.get<ApiResponse<AvailableSlotResponse[]>>('/public/availability', {
      params: { businessId, serviceId, date, ...(employeeId ? { employeeId } : {}) },
    })
  },

  getAvailableDates(
    businessId: number,
    serviceId: number,
    daysAhead = 14,
    employeeId?: number,
  ) {
    return api.get<ApiResponse<string[]>>('/public/availability/dates', {
      params: { businessId, serviceId, daysAhead, ...(employeeId ? { employeeId } : {}) },
    })
  },

  createAppointment(
    slug: string,
    body: {
      employeeId: number
      serviceId: number
      scheduledAt: string
      customerName: string
      phoneNumber: string
      phoneCountryCode?: string
      notes?: string
    },
  ) {
    return api.post<ApiResponse<unknown>>(`/public/businesses/${slug}/appointments`, body)
  },
}
