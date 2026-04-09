import { api, type ApiResponse } from './client'
import type { PackageResponse } from './customer'

export interface CreatePackageRequest {
  customerId: number
  serviceId: number
  name: string
  totalSessions: number
  expiresAt: string
}

export interface CreatePackageFromTemplateRequest {
  customerId: number
  templateId: number
}

export const packageApi = {
  listByCustomer(customerId: number) {
    return api.get<ApiResponse<PackageResponse[]>>('/packages', {
      params: { customerId },
    })
  },
  listByTemplate(templateId: number) {
    return api.get<ApiResponse<PackageResponse[]>>('/packages', {
      params: { templateId },
    })
  },
  getById(id: number) {
    return api.get<ApiResponse<PackageResponse>>(`/packages/${id}`)
  },
  create(body: CreatePackageRequest) {
    return api.post<ApiResponse<PackageResponse>>('/packages', body)
  },
  createFromTemplate(body: CreatePackageFromTemplateRequest) {
    return api.post<ApiResponse<PackageResponse>>('/packages/from-template', body)
  },
  deductSession(id: number) {
    return api.post<ApiResponse<PackageResponse>>(`/packages/${id}/deduct`)
  },
  addSessions(id: number, count: number) {
    return api.post<ApiResponse<PackageResponse>>(`/packages/${id}/add-sessions`, null, {
      params: { count },
    })
  },
}
