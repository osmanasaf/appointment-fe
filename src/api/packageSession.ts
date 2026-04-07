import { api, type ApiResponse } from './client'

export type PackageSessionStatus = 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED'

export interface PackageSessionResponse {
  id: number
  customerPackageId: number
  sessionNumber: number
  status: PackageSessionStatus
  appointmentId: number | null
  scheduledAt: string | null
  notes: string | null
}

export interface AssignSessionRequest {
  appointmentId: number
}

export const packageSessionApi = {
  listByPackage(packageId: number) {
    return api.get<ApiResponse<PackageSessionResponse[]>>(`/packages/${packageId}/sessions`)
  },
  assign(packageId: number, sessionId: number, body: AssignSessionRequest) {
    return api.put<ApiResponse<PackageSessionResponse>>(
      `/packages/${packageId}/sessions/${sessionId}/assign`,
      body
    )
  },
  unassign(packageId: number, sessionId: number) {
    return api.put<ApiResponse<PackageSessionResponse>>(
      `/packages/${packageId}/sessions/${sessionId}/unassign`
    )
  },
}
