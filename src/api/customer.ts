import { api, type ApiResponse } from './client'

export interface CustomerResponse {
  id: number
  businessId: number
  name: string
  phoneNumber: string
  email: string | null
  notes: string | null
  address: string | null
  nationalIdMasked: string | null
  noShowCount: number
  blacklisted: boolean
  blacklistReason: string | null
  risky: boolean
  noShowForcesManualApproval: boolean
  createdAt: string
}

export interface CreateCustomerRequest {
  businessId: number
  name: string
  phoneNumber: string
  phoneCountryCode?: string
  email?: string
  notes?: string
  address?: string
  nationalId?: string
}

export interface UpdateCustomerRequest {
  name: string
  email?: string
  notes?: string
  address?: string
  nationalId?: string
}

export interface PackageResponse {
  id: number
  customerId: number
  serviceId: number
  templateId: number | null
  name: string
  totalSessions: number
  remainingSessions: number
  expiresAt: string
  active: boolean
  expired: boolean
  lowOnSessions: boolean
}

export const customerApi = {
  list(businessId: number) {
    return api.get<ApiResponse<CustomerResponse[]>>('/customers', {
      params: { businessId },
    })
  },
  getById(id: number) {
    return api.get<ApiResponse<CustomerResponse>>(`/customers/${id}`)
  },
  getPackages(id: number) {
    return api.get<ApiResponse<PackageResponse[]>>(`/customers/${id}/packages`)
  },
  create(body: CreateCustomerRequest) {
    return api.post<ApiResponse<CustomerResponse>>('/customers', body)
  },
  update(id: number, body: UpdateCustomerRequest) {
    return api.put<ApiResponse<CustomerResponse>>(`/customers/${id}`, body)
  },
  blacklist(id: number, reason: string) {
    return api.post<ApiResponse<CustomerResponse>>(`/customers/${id}/blacklist`, null, {
      params: { reason },
    })
  },
  removeBlacklist(id: number) {
    return api.post<ApiResponse<CustomerResponse>>(`/customers/${id}/remove-blacklist`)
  },
  clearNoShowApproval(id: number) {
    return api.post<ApiResponse<CustomerResponse>>(`/customers/${id}/clear-no-show-approval`)
  },
  delete(id: number) {
    return api.delete<ApiResponse<null>>(`/customers/${id}`)
  },
}
