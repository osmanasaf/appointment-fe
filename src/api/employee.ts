import { api, type ApiResponse } from './client'

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE'

export interface EmployeeResponse {
  id: number
  businessId: number
  name: string
  phoneNumber: string | null
  email: string | null
  bio: string | null
  profileImageUrl: string | null
  status: EmployeeStatus
  owner: boolean
  createdAt: string
}

export interface CreateEmployeeRequest {
  businessId: number
  name: string
  phoneNumber?: string
  phoneCountryCode?: string
  email?: string
  bio?: string
  owner?: boolean
}

export interface UpdateEmployeeRequest {
  name: string
  phoneNumber?: string
  email?: string
  bio?: string
  owner?: boolean
}

export const employeeApi = {
  list(businessId: number, activeOnly = false) {
    return api.get<ApiResponse<EmployeeResponse[]>>('/employees', {
      params: { businessId, activeOnly },
    })
  },
  getById(id: number) {
    return api.get<ApiResponse<EmployeeResponse>>(`/employees/${id}`)
  },
  create(body: CreateEmployeeRequest) {
    return api.post<ApiResponse<EmployeeResponse>>('/employees', body)
  },
  update(id: number, body: UpdateEmployeeRequest) {
    return api.put<ApiResponse<EmployeeResponse>>(`/employees/${id}`, body)
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
}
