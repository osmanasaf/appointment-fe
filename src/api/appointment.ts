import { api, type ApiResponse } from './client'

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'RISKY'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW'

export type AppointmentSource = 'ONLINE' | 'PHONE' | 'WALK_IN' | 'MANUAL'

export interface StaffAppointmentRequest {
  businessId: number
  employeeId: number
  serviceId: number
  scheduledAt: string
  customerName: string
  phoneNumber: string
  phoneCountryCode?: string
  notes?: string
  source: 'PHONE' | 'WALK_IN'
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
  list(businessId: number, startDate?: string, endDate?: string) {
    return api.get<ApiResponse<AppointmentResponse[]>>('/appointments', {
      params: { businessId, startDate, endDate },
    })
  },
  getRisky(businessId: number) {
    return api.get<ApiResponse<AppointmentResponse[]>>('/appointments/risky', {
      params: { businessId },
    })
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
}
