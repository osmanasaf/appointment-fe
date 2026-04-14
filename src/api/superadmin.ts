import { api, type ApiResponse, type PageResponse } from './client'

export interface SubscriptionBreakdown {
  trialCount: number
  activeCount: number
  expiredCount: number
  suspendedCount: number
}

export interface RegistrationTrendPoint {
  date: string
  count: number
}

export interface SuperAdminOverviewResponse {
  totalBusinesses: number
  activeBusinesses: number
  totalUsers: number
  totalEmployees: number
  subscriptionBreakdown: SubscriptionBreakdown
  registrationTrend: RegistrationTrendPoint[]
}

export interface PlanRevenueBreakdown {
  planCode: string
  businessCount: number
  monthlyPrice: number
  totalRevenue: number
}

export interface SuperAdminRevenueResponse {
  totalMonthlyPotential: number
  planBreakdown: PlanRevenueBreakdown[]
}

export interface SuperAdminBusinessListItem {
  businessId: number
  businessName: string
  slug: string
  category: string
  ownerName: string
  ownerEmail: string
  planCode: string
  subscriptionStatus: string
  subscriptionEnd: string | null
  employeeCount: number
  currentMonthAppointments: number
  registeredAt: string
}

export interface SuperAdminBusinessDetail {
  businessId: number
  businessName: string
  slug: string
  category: string
  status: string
  registeredAt: string
  ownerName: string
  ownerEmail: string
  planCode: string
  subscriptionStatus: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  trialEndDate: string | null
  manual: boolean
  maxEmployees: number
  maxAppointmentsMonthly: number
  maxServices: number
  maxWhatsappMonthly: number
  maxSmsMonthly: number
  currentEmployeeCount: number
  currentMonthAppointments: number
  currentMonthSmsSent: number
  currentMonthWhatsappSent: number
  currentServiceCount: number
  employeeUsageRate: number
  appointmentUsageRate: number
  serviceUsageRate: number
}

export interface ChangePlanRequest {
  planCode: string
  periodMonths?: number
}

export const superadminApi = {
  getOverview() {
    return api.get<ApiResponse<SuperAdminOverviewResponse>>('/superadmin/overview')
  },

  getRevenue() {
    return api.get<ApiResponse<SuperAdminRevenueResponse>>('/superadmin/revenue')
  },

  listBusinesses(page = 0, size = 20, search = '') {
    return api.get<ApiResponse<PageResponse<SuperAdminBusinessListItem>>>('/superadmin/businesses', {
      params: { page, size, search },
    })
  },

  getBusinessDetail(businessId: number) {
    return api.get<ApiResponse<SuperAdminBusinessDetail>>(`/superadmin/businesses/${businessId}`)
  },

  changePlan(businessId: number, request: ChangePlanRequest) {
    return api.put<ApiResponse<void>>(`/superadmin/businesses/${businessId}/plan`, request)
  },

  suspendBusiness(businessId: number) {
    return api.put<ApiResponse<void>>(`/superadmin/businesses/${businessId}/suspend`)
  },

  activateBusiness(businessId: number) {
    return api.put<ApiResponse<void>>(`/superadmin/businesses/${businessId}/activate`)
  },
}
