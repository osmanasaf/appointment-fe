import { api, type ApiResponse, type PageResponse } from './client'

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'RISKY'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW'

export type AppointmentSource = 'ONLINE' | 'PHONE' | 'WALK_IN' | 'MANUAL'

export interface StaffAppointmentRequest {
  employeeId: number
  serviceId: number
  scheduledAt: string
  customerName: string
  phoneNumber: string
  phoneCountryCode?: string
  notes?: string
  source: 'PHONE' | 'WALK_IN'
}

export interface CreateAppointmentRequest {
  customerId: number
  employeeId: number
  serviceId: number
  scheduledAt: string
  notes?: string
  customerNotes?: string
  source?: string
}

export interface AppointmentResponse {
  id: number
  businessId: number
  customerId: number
  employeeId: number
  serviceId: number
  scheduledAt: string
  endAt: string
  durationMinutes: number
  status: AppointmentStatus
  risky: boolean
  riskReason: string | null
  confirmedAt: string | null
  notes: string | null
  customerNotes: string | null
  reminderSent: boolean
  createdAt: string
  source: AppointmentSource
  packageSessionId: number | null
}

export const appointmentApi = {
  list(params?: { startDate?: string; endDate?: string; page?: number; size?: number }) {
    return api.get<ApiResponse<PageResponse<AppointmentResponse>>>('/appointments', {
      params: { page: 0, size: 20, ...params },
    })
  },
  listByCustomer(customerId: number) {
    return api.get<ApiResponse<AppointmentResponse[]>>('/appointments', {
      params: { customerId },
    })
  },
  getRisky() {
    return api.get<ApiResponse<AppointmentResponse[]>>('/appointments/risky')
  },
  getById(id: number) {
    return api.get<ApiResponse<AppointmentResponse>>(`/appointments/${id}`)
  },
  confirm(id: number) {
    return api.post<ApiResponse<AppointmentResponse>>(`/appointments/${id}/confirm`)
  },
  cancel(id: number, reason?: string) {
    return api.post<ApiResponse<AppointmentResponse>>(`/appointments/${id}/cancel`, null, {
      params: reason ? { reason } : {},
    })
  },
  complete(id: number) {
    return api.post<ApiResponse<AppointmentResponse>>(`/appointments/${id}/complete`)
  },
  markNoShow(id: number) {
    return api.post<ApiResponse<AppointmentResponse>>(`/appointments/${id}/no-show`)
  },
  delete(id: number) {
    return api.delete<ApiResponse<null>>(`/appointments/${id}`)
  },
  createStaff(request: StaffAppointmentRequest) {
    return api.post<ApiResponse<AppointmentResponse>>('/appointments/staff', request)
  },
  create(request: CreateAppointmentRequest) {
    return api.post<ApiResponse<AppointmentResponse>>('/appointments', request)
  },
}
