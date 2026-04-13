import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { appointmentApi, type AppointmentResponse, type AppointmentStatus, type StaffAppointmentRequest, type CreateAppointmentRequest } from '@/api/appointment'

export interface AppointmentFilters {
  status?: AppointmentStatus
  startDate?: string
  endDate?: string
  employeeId?: number
  page?: number
  size?: number
}

export const useAppointmentStore = defineStore('appointment', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const appointments = ref<AppointmentResponse[]>([])
  const riskyAppointments = ref<AppointmentResponse[]>([])
  const currentAppointment = ref<AppointmentResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const pagination = ref({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  })

  const filters = ref<AppointmentFilters>({})

  // ── Getters ────────────────────────────────────────────────────────────────
  const pendingCount = computed(
    () => appointments.value.filter((a) => a.status === 'PENDING').length,
  )

  const todayAppointments = computed(() => {
    const today = new Date().toISOString().slice(0, 10)
    return appointments.value.filter((a) => a.scheduledAt.startsWith(today))
  })

  const hasMore = computed(() => pagination.value.hasNext)

  // ── Actions ────────────────────────────────────────────────────────────────
  async function fetchAppointments(params?: AppointmentFilters) {
    loading.value = true
    error.value = null
    if (params) filters.value = { ...filters.value, ...params }
    try {
      const { data } = await appointmentApi.list({
        page: filters.value.page ?? 0,
        size: filters.value.size ?? 20,
        startDate: filters.value.startDate,
        endDate: filters.value.endDate,
      })
      if (data.success && data.data) {
        appointments.value = data.data.content
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
      error.value = (e as Error).message ?? 'Randevular yüklenemedi'
    } finally {
      loading.value = false
    }
  }

  async function fetchRiskyAppointments() {
    try {
      const { data } = await appointmentApi.getRisky()
      if (data.success && data.data) {
        riskyAppointments.value = data.data
      }
    } catch {
      // Sessiz hata — ana liste yükleniyorsa bu kritik değil
    }
  }

  async function fetchAppointment(id: number) {
    loading.value = true
    error.value = null
    try {
      const { data } = await appointmentApi.getById(id)
      if (data.success && data.data) {
        currentAppointment.value = data.data
      }
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Randevu yüklenemedi'
    } finally {
      loading.value = false
    }
  }

  async function confirmAppointment(id: number) {
    const { data } = await appointmentApi.confirm(id)
    if (data.success && data.data) {
      _updateInList(data.data)
    }
    return data
  }

  async function cancelAppointment(id: number, reason?: string) {
    const { data } = await appointmentApi.cancel(id, reason)
    if (data.success && data.data) {
      _updateInList(data.data)
    }
    return data
  }

  async function completeAppointment(id: number) {
    const { data } = await appointmentApi.complete(id)
    if (data.success && data.data) {
      _updateInList(data.data)
    }
    return data
  }

  async function markNoShow(id: number) {
    const { data } = await appointmentApi.markNoShow(id)
    if (data.success && data.data) {
      _updateInList(data.data)
    }
    return data
  }

  async function deleteAppointment(id: number) {
    const { data } = await appointmentApi.delete(id)
    if (data.success) {
      appointments.value = appointments.value.filter((a) => a.id !== id)
    }
    return data
  }

  async function createStaffAppointment(request: StaffAppointmentRequest) {
    const { data } = await appointmentApi.createStaff(request)
    if (data.success && data.data) {
      appointments.value.unshift(data.data)
    }
    return data
  }

  async function createAppointment(request: CreateAppointmentRequest) {
    const { data } = await appointmentApi.create(request)
    if (data.success && data.data) {
      appointments.value.unshift(data.data)
    }
    return data
  }

  function setPage(page: number) {
    filters.value.page = page
  }

  function resetFilters() {
    filters.value = {}
  }

  // ── Private ────────────────────────────────────────────────────────────────
  function _updateInList(updated: AppointmentResponse) {
    const idx = appointments.value.findIndex((a) => a.id === updated.id)
    if (idx !== -1) appointments.value[idx] = updated
    if (currentAppointment.value?.id === updated.id) {
      currentAppointment.value = updated
    }
  }

  return {
    appointments,
    riskyAppointments,
    currentAppointment,
    loading,
    error,
    pagination,
    filters,
    pendingCount,
    todayAppointments,
    hasMore,
    fetchAppointments,
    fetchRiskyAppointments,
    fetchAppointment,
    confirmAppointment,
    cancelAppointment,
    completeAppointment,
    markNoShow,
    deleteAppointment,
    createStaffAppointment,
    createAppointment,
    setPage,
    resetFilters,
  }
})
