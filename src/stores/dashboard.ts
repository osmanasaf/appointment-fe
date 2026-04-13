import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  dashboardApi,
  type DashboardPeriod,
  type DashboardStatsResponse,
  type TopServicesResponse,
  type CustomerStatsResponse,
  type PackageUsageResponse,
} from '@/api/dashboard'

export const useDashboardStore = defineStore('dashboard', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const stats = ref<DashboardStatsResponse | null>(null)
  const topServices = ref<TopServicesResponse | null>(null)
  const customerStats = ref<CustomerStatsResponse | null>(null)
  const packageUsage = ref<PackageUsageResponse | null>(null)
  const period = ref<DashboardPeriod>('WEEKLY')
  const loading = ref(false)
  const loadingTopServices = ref(false)
  const loadingCustomerStats = ref(false)
  const loadingPackageUsage = ref(false)
  const error = ref<string | null>(null)

  // ── Getters ────────────────────────────────────────────────────────────────
  const noShowRate = computed(() => stats.value?.noShowRate ?? 0)

  const completionRate = computed(() => {
    if (!stats.value || stats.value.totalAppointments === 0) return 0
    return Math.round(
      (stats.value.completedCount / stats.value.totalAppointments) * 100,
    )
  })

  const todayCount = computed(() => stats.value?.totalAppointments ?? 0)

  const hasData = computed(() => stats.value !== null)

  // ── Actions ────────────────────────────────────────────────────────────────
  async function fetchStats(selectedPeriod?: DashboardPeriod) {
    if (selectedPeriod) period.value = selectedPeriod
    loading.value = true
    error.value = null
    try {
      const { data } = await dashboardApi.getStats(period.value)
      if (data.success && data.data) {
        stats.value = data.data
      }
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'İstatistikler yüklenemedi'
    } finally {
      loading.value = false
    }
  }

  async function fetchTopServices(limit = 5) {
    loadingTopServices.value = true
    try {
      const { data } = await dashboardApi.getTopServices(period.value, limit)
      if (data.success && data.data) {
        topServices.value = data.data
      }
    } catch {
      // Sessiz hata — ana stats daha önemli
    } finally {
      loadingTopServices.value = false
    }
  }

  async function fetchCustomerStats() {
    loadingCustomerStats.value = true
    try {
      const { data } = await dashboardApi.getCustomerStats(period.value)
      if (data.success && data.data) {
        customerStats.value = data.data
      }
    } catch {
      // Sessiz hata
    } finally {
      loadingCustomerStats.value = false
    }
  }

  async function fetchPackageUsage() {
    loadingPackageUsage.value = true
    try {
      const { data } = await dashboardApi.getPackageUsage()
      if (data.success && data.data) {
        packageUsage.value = data.data
      }
    } catch {
      // Sessiz hata
    } finally {
      loadingPackageUsage.value = false
    }
  }

  /** Tüm dashboard verilerini paralel olarak çeker. */
  async function fetchAll(selectedPeriod?: DashboardPeriod) {
    if (selectedPeriod) period.value = selectedPeriod
    await Promise.all([
      fetchStats(),
      fetchTopServices(),
      fetchCustomerStats(),
      fetchPackageUsage(),
    ])
  }

  function setPeriod(newPeriod: DashboardPeriod) {
    period.value = newPeriod
  }

  function reset() {
    stats.value = null
    topServices.value = null
    customerStats.value = null
    packageUsage.value = null
    error.value = null
  }

  return {
    stats,
    topServices,
    customerStats,
    packageUsage,
    period,
    loading,
    loadingTopServices,
    loadingCustomerStats,
    loadingPackageUsage,
    error,
    noShowRate,
    completionRate,
    todayCount,
    hasData,
    fetchStats,
    fetchTopServices,
    fetchCustomerStats,
    fetchPackageUsage,
    fetchAll,
    setPeriod,
    reset,
  }
})
