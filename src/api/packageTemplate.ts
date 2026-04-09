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
  /** Backend işletmeye ait tüm şablonları düz dizi döndürür (sayfalama yok). */
  list() {
    return api.get<ApiResponse<PackageTemplateResponse[]>>('/package-templates')
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
