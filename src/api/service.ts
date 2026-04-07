import { api, type ApiResponse } from './client'
import type { EmployeeResponse } from './employee'

export interface ServiceResponse {
  id: number
  businessId: number
  name: string
  description: string | null
  durationMinutes: number
  bufferBeforeMinutes: number
  bufferAfterMinutes: number
  totalDurationMinutes: number
  price: number | string
  currency: string
  requiresConfirmation: boolean
  sameDayBookingAllowed: boolean
  packageEligible: boolean
  active: boolean
  displayOrder: number
  createdAt: string
}

export interface CreateServiceRequest {
  businessId: number
  name: string
  description?: string
  durationMinutes: number
  bufferBeforeMinutes?: number
  bufferAfterMinutes?: number
  price?: number
  requiresConfirmation?: boolean
  sameDayBookingAllowed?: boolean
  packageEligible?: boolean
}

export interface UpdateServiceRequest {
  name: string
  description?: string
  durationMinutes: number
  bufferBeforeMinutes?: number
  bufferAfterMinutes?: number
  price?: number
  requiresConfirmation?: boolean
  sameDayBookingAllowed?: boolean
  packageEligible?: boolean
}

export const serviceApi = {
  list(businessId: number, activeOnly = false, packageEligible?: boolean) {
    return api.get<ApiResponse<ServiceResponse[]>>('/services', {
      params: { businessId, activeOnly, packageEligible },
    })
  },
  getById(id: number) {
    return api.get<ApiResponse<ServiceResponse>>(`/services/${id}`)
  },
  create(body: CreateServiceRequest) {
    return api.post<ApiResponse<ServiceResponse>>('/services', body)
  },
  update(id: number, body: UpdateServiceRequest) {
    return api.put<ApiResponse<ServiceResponse>>(`/services/${id}`, body)
  },
  activate(id: number) {
    return api.post<ApiResponse<ServiceResponse>>(`/services/${id}/activate`)
  },
  deactivate(id: number) {
    return api.post<ApiResponse<ServiceResponse>>(`/services/${id}/deactivate`)
  },
  delete(id: number) {
    return api.delete<ApiResponse<null>>(`/services/${id}`)
  },
  /** Bu hizmeti yapabilen çalışanları listeler (GET /services/{id}/employees) */
  getCapableEmployees(id: number) {
    return api.get<ApiResponse<EmployeeResponse[]>>(`/services/${id}/employees`)
  },
}
