import { api, type ApiResponse } from './client'

// ─── Enums ─────────────────────────────────────────────────────────────────

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE'
export type SkillLevel = 'JUNIOR' | 'INTERMEDIATE' | 'SENIOR' | 'EXPERT'
export type OffboardAction = 'CANCEL_ALL' | 'REASSIGN_ALL'
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'RISKY' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'

// ─── Employee Types ─────────────────────────────────────────────────────────

export interface EmployeeResponse {
  id: number
  businessId: number
  name: string
  title: string | null
  phoneNumber: string | null
  email: string | null
  bio: string | null
  profileImageUrl: string | null
  status: EmployeeStatus
  owner: boolean
  experienceYears: number | null
  acceptsOnlineBooking: boolean
  createdAt: string
}

export interface EmployeeDetailResponse extends EmployeeResponse {}

export interface CreateEmployeeRequest {
  businessId: number
  name: string
  phoneNumber?: string
  phoneCountryCode?: string
  email?: string
  bio?: string
  owner?: boolean
}

export interface UpdateEmployeeProfileRequest {
  name: string
  title?: string
  email?: string
  bio?: string
  profileImageUrl?: string
  experienceYears?: number
  acceptsOnlineBooking?: boolean
}

// ─── Capability Types ───────────────────────────────────────────────────────

export interface EmployeeCapabilityResponse {
  id: number
  employeeId: number
  serviceId: number
  serviceName: string
  customDurationMinutes: number | null
  customPrice: number | null
  skillLevel: SkillLevel
  active: boolean
  createdAt: string
}

export interface AssignCapabilityRequest {
  serviceId: number
  customDurationMinutes?: number
  customPrice?: number
  skillLevel?: SkillLevel
}

// ─── Schedule Types ─────────────────────────────────────────────────────────

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

export interface EmployeeScheduleResponse {
  id: number
  employeeId: number
  dayOfWeek: DayOfWeek
  startTime: string   // "HH:mm:ss"
  endTime: string     // "HH:mm:ss"
  breakStart: string | null
  breakEnd: string | null
  closed: boolean
}

export interface EmployeeScheduleRequest {
  dayOfWeek: DayOfWeek
  startTime?: string  // "HH:mm" veya "HH:mm:ss"
  endTime?: string
  breakStart?: string
  breakEnd?: string
  closed?: boolean
}

// ─── Offboarding Types ──────────────────────────────────────────────────────

export interface AffectedAppointmentResponse {
  id: number
  customerId: number
  serviceId: number
  scheduledAt: string
  status: AppointmentStatus
}

export interface OffboardRequest {
  action: OffboardAction
  newEmployeeId?: number  // REASSIGN_ALL için zorunlu
}

export interface OffboardSummaryResponse {
  affectedAppointmentCount: number
  action: OffboardAction
  reassignedToEmployeeId: number | null
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const employeeApi = {
  // Employee CRUD
  list(businessId: number, activeOnly = false) {
    return api.get<ApiResponse<EmployeeResponse[]>>('/employees', {
      params: { businessId, activeOnly },
    })
  },
  getById(id: number) {
    return api.get<ApiResponse<EmployeeDetailResponse>>(`/employees/${id}`)
  },
  create(body: CreateEmployeeRequest) {
    return api.post<ApiResponse<EmployeeResponse>>('/employees', body)
  },
  update(id: number, body: UpdateEmployeeProfileRequest) {
    return api.put<ApiResponse<EmployeeDetailResponse>>(`/employees/${id}`, body)
  },
  activate(id: number) {
    return api.post<ApiResponse<EmployeeResponse>>(`/employees/${id}/activate`)
  },
  deactivate(id: number) {
    return api.post<ApiResponse<EmployeeResponse>>(`/employees/${id}/deactivate`)
  },
  delete(id: number) {
    return api.delete<ApiResponse<null>>(`/employees/${id}`)
  },

  // Capabilities
  getCapabilities(id: number) {
    return api.get<ApiResponse<EmployeeCapabilityResponse[]>>(`/employees/${id}/capabilities`)
  },
  assignCapability(id: number, body: AssignCapabilityRequest) {
    return api.post<ApiResponse<EmployeeCapabilityResponse>>(`/employees/${id}/capabilities`, body)
  },
  removeCapability(id: number, serviceId: number) {
    return api.delete<ApiResponse<null>>(`/employees/${id}/capabilities/${serviceId}`)
  },

  // Schedule
  getSchedule(id: number) {
    return api.get<ApiResponse<EmployeeScheduleResponse[]>>(`/employees/${id}/schedule`)
  },
  setDaySchedule(id: number, body: EmployeeScheduleRequest) {
    return api.post<ApiResponse<EmployeeScheduleResponse>>(`/employees/${id}/schedule`, body)
  },

  // Offboarding
  offboardPreview(id: number) {
    return api.get<ApiResponse<AffectedAppointmentResponse[]>>(`/employees/${id}/offboard-preview`)
  },
  offboard(id: number, body: OffboardRequest) {
    return api.post<ApiResponse<OffboardSummaryResponse>>(`/employees/${id}/offboard`, body)
  },
}
