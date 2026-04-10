import { api, type ApiResponse } from './client'

export type InviteStatus = 'PENDING' | 'USED' | 'CANCELLED'

export interface EmployeeInviteResponse {
  id: number
  employeeId: number
  employeeName: string
  email: string
  token: string
  status: InviteStatus
  expiresAt: string
  usedAt: string | null
  createdAt: string
}

export interface CreateEmployeeInviteRequest {
  employeeId: number
  email: string
}

export const employeeInviteApi = {
  list() {
    return api.get<ApiResponse<EmployeeInviteResponse[]>>('/employee-invites')
  },
  create(body: CreateEmployeeInviteRequest) {
    return api.post<ApiResponse<EmployeeInviteResponse>>('/employee-invites', body)
  },
  cancel(inviteId: number) {
    return api.delete<ApiResponse<null>>(`/employee-invites/${inviteId}`)
  },
}
