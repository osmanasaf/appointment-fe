import { api, type ApiResponse } from './client'

export interface PackageTemplateResponse {
  id: number
  businessId: number
  serviceId: number
  name: string
  totalSessions: number
  price: number | null
  active: boolean
}

export interface CreatePackageTemplateRequest {
  businessId: number
  serviceId: number
  name: string
  totalSessions: number
  price?: number | null
}

export interface UpdatePackageTemplateRequest {
  name?: string
  totalSessions?: number
  price?: number | null
}

export const packageTemplateApi = {
  listByBusiness(businessId: number) {
    return api.get<ApiResponse<PackageTemplateResponse[]>>('/package-templates', {
      params: { businessId },
    })
  },
  getById(id: number) {
    return api.get<ApiResponse<PackageTemplateResponse>>(`/package-templates/${id}`)
  },
  create(body: CreatePackageTemplateRequest) {
    return api.post<ApiResponse<PackageTemplateResponse>>('/package-templates', body)
  },
  update(id: number, body: UpdatePackageTemplateRequest) {
    return api.put<ApiResponse<PackageTemplateResponse>>(`/package-templates/${id}`, body)
  },
  deactivate(id: number) {
    return api.delete<ApiResponse<null>>(`/package-templates/${id}`)
  },
}
