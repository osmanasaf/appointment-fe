import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  customerApi,
  type CustomerResponse,
  type CreateCustomerRequest,
  type UpdateCustomerRequest,
  type PackageResponse,
} from '@/api/customer'

export const useCustomerStore = defineStore('customer', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const customers = ref<CustomerResponse[]>([])
  const currentCustomer = ref<CustomerResponse | null>(null)
  const currentCustomerPackages = ref<PackageResponse[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')

  const pagination = ref({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  })

  // ── Getters ────────────────────────────────────────────────────────────────
  const blacklistedCustomers = computed(() =>
    customers.value.filter((c) => c.blacklisted),
  )

  const riskyCustomers = computed(() =>
    customers.value.filter((c) => c.risky),
  )

  const totalCount = computed(() => pagination.value.totalElements)

  // ── Actions ────────────────────────────────────────────────────────────────
  async function fetchCustomers(params?: { page?: number; size?: number; search?: string }) {
    loading.value = true
    error.value = null
    if (params?.search !== undefined) searchQuery.value = params.search
    try {
      const { data } = await customerApi.list({
        page: params?.page ?? 0,
        size: params?.size ?? 20,
      })
      if (data.success && data.data) {
        customers.value = data.data.content
        pagination.value = {
          page: data.data.page,
          size: data.data.size,
          totalElements: data.data.totalElements,
          totalPages: data.data.totalPages,
          hasNext: data.data.hasNext,
          hasPrevious: data.data.hasPrevious,
        }
      }
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Müşteriler yüklenemedi'
    } finally {
      loading.value = false
    }
  }

  async function fetchCustomer(id: number) {
    loading.value = true
    error.value = null
    try {
      const { data } = await customerApi.getById(id)
      if (data.success && data.data) {
        currentCustomer.value = data.data
      }
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Müşteri yüklenemedi'
    } finally {
      loading.value = false
    }
  }

  async function fetchCustomerPackages(id: number) {
    try {
      const { data } = await customerApi.getPackages(id)
      if (data.success && data.data) {
        currentCustomerPackages.value = data.data
      }
    } catch {
      currentCustomerPackages.value = []
    }
  }

  async function createCustomer(request: CreateCustomerRequest) {
    const { data } = await customerApi.create(request)
    if (data.success && data.data) {
      customers.value.unshift(data.data)
      pagination.value.totalElements++
    }
    return data
  }

  async function updateCustomer(id: number, request: UpdateCustomerRequest) {
    const { data } = await customerApi.update(id, request)
    if (data.success && data.data) {
      _updateInList(data.data)
    }
    return data
  }

  async function blacklistCustomer(id: number, reason: string) {
    const { data } = await customerApi.blacklist(id, reason)
    if (data.success && data.data) {
      _updateInList(data.data)
    }
    return data
  }

  async function removeBlacklist(id: number) {
    const { data } = await customerApi.removeBlacklist(id)
    if (data.success && data.data) {
      _updateInList(data.data)
    }
    return data
  }

  async function clearNoShowApproval(id: number) {
    const { data } = await customerApi.clearNoShowApproval(id)
    if (data.success && data.data) {
      _updateInList(data.data)
    }
    return data
  }

  async function deleteCustomer(id: number) {
    const { data } = await customerApi.delete(id)
    if (data.success) {
      customers.value = customers.value.filter((c) => c.id !== id)
      pagination.value.totalElements--
      if (currentCustomer.value?.id === id) currentCustomer.value = null
    }
    return data
  }

  function selectCustomer(customer: CustomerResponse) {
    currentCustomer.value = customer
    currentCustomerPackages.value = []
  }

  function clearCurrentCustomer() {
    currentCustomer.value = null
    currentCustomerPackages.value = []
  }

  function setPage(page: number) {
    pagination.value.page = page
  }

  // ── Private ────────────────────────────────────────────────────────────────
  function _updateInList(updated: CustomerResponse) {
    const idx = customers.value.findIndex((c) => c.id === updated.id)
    if (idx !== -1) customers.value[idx] = updated
    if (currentCustomer.value?.id === updated.id) {
      currentCustomer.value = updated
    }
  }

  return {
    customers,
    currentCustomer,
    currentCustomerPackages,
    loading,
    error,
    searchQuery,
    pagination,
    blacklistedCustomers,
    riskyCustomers,
    totalCount,
    fetchCustomers,
    fetchCustomer,
    fetchCustomerPackages,
    createCustomer,
    updateCustomer,
    blacklistCustomer,
    removeBlacklist,
    clearNoShowApproval,
    deleteCustomer,
    selectCustomer,
    clearCurrentCustomer,
    setPage,
  }
})
