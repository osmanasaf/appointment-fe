import { api, type ApiResponse } from './client'

export type PlanCode = 'SOLO' | 'PRO' | 'ENTERPRISE'

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED'

export interface PlanResponse {
  id: number
  code: PlanCode
  maxEmployees: number
  maxAppointmentsMonthly: number
  maxServices: number
  maxBranches: number
  features: string[]
  featureNames: Record<string, string>
  monthlyPrice: number | string
  yearlyPrice: number | string
}

export interface BusinessSubscriptionResponse {
  businessId: number
  planCode: PlanCode
  status: SubscriptionStatus
  trialEndDate: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  manual: boolean
}

export interface PlanUsageResponse {
  year: number
  month: number
  appointmentsCount: number
  smsSent: number
  whatsappSent: number
  maxAppointmentsMonthly: number
}

export const planApi = {
  listPlans() {
    return api.get<ApiResponse<PlanResponse[]>>('/plans')
  },
  getMySubscription() {
    return api.get<ApiResponse<BusinessSubscriptionResponse>>('/me/subscription')
  },
  getMyUsage() {
    return api.get<ApiResponse<PlanUsageResponse>>('/me/subscription/usage')
  },
}
