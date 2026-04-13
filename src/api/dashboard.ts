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

// ── Yeni endpoint tipleri (B12) ──────────────────────────────────────────────

export interface ServiceStat {
  serviceId: number
  serviceName: string
  totalAppointments: number
  completedCount: number
  totalRevenue: number
  completionRate: number
}

export interface TopServicesResponse {
  services: ServiceStat[]
}

export interface TopCustomer {
  customerId: number
  name: string
  appointmentCount: number
  noShowCount: number
}

export interface CustomerStatsResponse {
  totalCustomers: number
  newCustomersInPeriod: number
  returningCustomers: number
  returnRate: number
  blacklistedCount: number
  riskyCount: number
  topCustomers: TopCustomer[]
}

export interface PackageSummary {
  packageId: number
  customerName: string
  serviceName: string
  totalSessions: number
  remainingSessions: number
  expiresAt: string | null
  isLow: boolean
  isExpiring: boolean
}

export interface PackageUsageResponse {
  totalActivePackages: number
  lowSessionPackages: number
  expiringPackages: number
  avgUsageRate: number
  packages: PackageSummary[]
}

// ────────────────────────────────────────────────────────────────────────────

export const dashboardApi = {
  getStats(period: DashboardPeriod = 'WEEKLY') {
    return api.get<ApiResponse<DashboardStatsResponse>>('/dashboard/stats', {
      params: { period },
    })
  },

  getTopServices(period: DashboardPeriod = 'MONTHLY', limit = 5) {
    return api.get<ApiResponse<TopServicesResponse>>('/dashboard/top-services', {
      params: { period, limit },
    })
  },

  getCustomerStats(period: DashboardPeriod = 'MONTHLY') {
    return api.get<ApiResponse<CustomerStatsResponse>>('/dashboard/customer-stats', {
      params: { period },
    })
  },

  getPackageUsage() {
    return api.get<ApiResponse<PackageUsageResponse>>('/dashboard/package-usage')
  },
}
