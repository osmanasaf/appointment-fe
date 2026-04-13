import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { serviceApi, type ServiceResponse, type CreateServiceRequest, type UpdateServiceRequest } from '@/api/service'

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 dakika

export const useServiceStore = defineStore('service', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const services = ref<ServiceResponse[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  let lastFetchedAt: number | null = null

  // ── Getters ────────────────────────────────────────────────────────────────
  const activeServices = computed(() =>
    services.value.filter((s) => s.active),
  )

  const packageEligibleServices = computed(() =>
    services.value.filter((s) => s.packageEligible && s.active),
  )

  const isEmpty = computed(() => !loading.value && services.value.length === 0)

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Cache'e göre yeniden istek atmaz (TTL süresi dolmamışsa). */
  async function fetchServices(force = false) {
    const isCacheValid =
      lastFetchedAt !== null && Date.now() - lastFetchedAt < CACHE_TTL_MS

    if (!force && isCacheValid && services.value.length > 0) return

    loading.value = true
    error.value = null
    try {
      const { data } = await serviceApi.list()
      if (data.success && data.data) {
        services.value = data.data
        lastFetchedAt = Date.now()
      }
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Hizmetler yüklenemedi'
    } finally {
      loading.value = false
    }
  }

  async function createService(request: CreateServiceRequest) {
    const { data } = await serviceApi.create(request)
    if (data.success && data.data) {
      services.value.push(data.data)
      services.value.sort((a, b) => a.displayOrder - b.displayOrder)
    }
    return data
  }

  async function updateService(id: number, request: UpdateServiceRequest) {
    const { data } = await serviceApi.update(id, request)
    if (data.success && data.data) {
      _updateInList(data.data)
    }
    return data
  }

  async function activateService(id: number) {
    const { data } = await serviceApi.activate(id)
    if (data.success && data.data) {
      _updateInList(data.data)
    }
    return data
  }

  async function deactivateService(id: number) {
    const { data } = await serviceApi.deactivate(id)
    if (data.success && data.data) {
      _updateInList(data.data)
    }
    return data
  }

  async function deleteService(id: number) {
    const { data } = await serviceApi.delete(id)
    if (data.success) {
      services.value = services.value.filter((s) => s.id !== id)
    }
    return data
  }

  function invalidateCache() {
    lastFetchedAt = null
  }

  // ── Private ────────────────────────────────────────────────────────────────
  function _updateInList(updated: ServiceResponse) {
    const idx = services.value.findIndex((s) => s.id === updated.id)
    if (idx !== -1) services.value[idx] = updated
  }

  return {
    services,
    loading,
    error,
    activeServices,
    packageEligibleServices,
    isEmpty,
    fetchServices,
    createService,
    updateService,
    activateService,
    deactivateService,
    deleteService,
    invalidateCache,
  }
})
