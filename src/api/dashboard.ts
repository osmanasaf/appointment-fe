import { api, type ApiResponse } from './client'

export type DashboardPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY'

export interface TrendPoint {
  date: string
  count: number
}

export interface ServiceCount {
  serviceId: number
  count: number
}

export interface DashboardStatsResponse {
  totalAppointments: number
  pendingCount: number
  confirmedCount: number
  completedCount: number
  cancelledCount: number
  noShowCount: number
  noShowRate: number
  trendData: TrendPoint[]
  serviceDistribution: ServiceCount[]
  hourDistribution: number[]
}

export const dashboardApi = {
  getStats(period: DashboardPeriod = 'DAILY') {
    return api.get<ApiResponse<DashboardStatsResponse>>('/dashboard/stats', {
      params: { period },
    })
  },
}
