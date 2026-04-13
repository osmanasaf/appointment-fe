import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  employeeApi,
  type EmployeeResponse,
  type EmployeeDetailResponse,
  type CreateEmployeeRequest,
  type UpdateEmployeeProfileRequest,
} from '@/api/employee'

export const useEmployeeStore = defineStore('employee', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const employees = ref<EmployeeResponse[]>([])
  const currentEmployee = ref<EmployeeDetailResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const pagination = ref({
    page: 0,
    size: 50,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  })

  // ── Getters ────────────────────────────────────────────────────────────────
  const activeEmployees = computed(() =>
    employees.value.filter((e) => e.status === 'ACTIVE'),
  )

  const onlineBookingEmployees = computed(() =>
    activeEmployees.value.filter((e) => e.acceptsOnlineBooking),
  )

  const isEmpty = computed(() => !loading.value && employees.value.length === 0)

  // ── Actions ────────────────────────────────────────────────────────────────
  async function fetchEmployees(params?: { activeOnly?: boolean; page?: number; size?: number }) {
    loading.value = true
    error.value = null
    try {
      const { data } = await employeeApi.list({
        page: params?.page ?? 0,
        size: params?.size ?? 50,
        activeOnly: params?.activeOnly,
      })
      if (data.success && data.data) {
        employees.value = data.data.content
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
      error.value = (e as Error).message ?? 'Çalışanlar yüklenemedi'
    } finally {
      loading.value = false
    }
  }

  async function fetchEmployee(id: number) {
    loading.value = true
    error.value = null
    try {
      const { data } = await employeeApi.getById(id)
      if (data.success && data.data) {
        currentEmployee.value = data.data
      }
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Çalışan yüklenemedi'
    } finally {
      loading.value = false
    }
  }

  async function createEmployee(request: CreateEmployeeRequest) {
    const { data } = await employeeApi.create(request)
    if (data.success && data.data) {
      employees.value.push(data.data)
    }
    return data
  }

  async function updateEmployee(id: number, request: UpdateEmployeeProfileRequest) {
    const { data } = await employeeApi.update(id, request)
    if (data.success && data.data) {
      _updateInList(data.data)
    }
    return data
  }

  async function activateEmployee(id: number) {
    const { data } = await employeeApi.activate(id)
    if (data.success && data.data) {
      _updateInList(data.data)
    }
    return data
  }

  async function deactivateEmployee(id: number) {
    const { data } = await employeeApi.deactivate(id)
    if (data.success && data.data) {
      _updateInList(data.data)
    }
    return data
  }

  async function deleteEmployee(id: number) {
    const { data } = await employeeApi.delete(id)
    if (data.success) {
      employees.value = employees.value.filter((e) => e.id !== id)
      if (currentEmployee.value?.id === id) currentEmployee.value = null
    }
    return data
  }

  function selectEmployee(employee: EmployeeDetailResponse) {
    currentEmployee.value = employee
  }

  function clearCurrentEmployee() {
    currentEmployee.value = null
  }

  // ── Private ────────────────────────────────────────────────────────────────
  function _updateInList(updated: EmployeeResponse) {
    const idx = employees.value.findIndex((e) => e.id === updated.id)
    if (idx !== -1) employees.value[idx] = updated
    if (currentEmployee.value?.id === updated.id) {
      currentEmployee.value = { ...currentEmployee.value, ...updated }
    }
  }

  return {
    employees,
    currentEmployee,
    loading,
    error,
    pagination,
    activeEmployees,
    onlineBookingEmployees,
    isEmpty,
    fetchEmployees,
    fetchEmployee,
    createEmployee,
    updateEmployee,
    activateEmployee,
    deactivateEmployee,
    deleteEmployee,
    selectEmployee,
    clearCurrentEmployee,
  }
})
