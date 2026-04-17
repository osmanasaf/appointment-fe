import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { businessApi, type BusinessResponse } from '@/api/business'
import { serviceApi, type ServiceResponse } from '@/api/service'
import { employeeApi, type EmployeeResponse, type EmployeeCapabilityResponse } from '@/api/employee'
import { fetchAllPageContent } from '@/api/client'

export type SetupStepKey =
  | 'business'
  | 'services'
  | 'employees'
  | 'assignments'
  | 'hours'
  | 'share'

export interface SetupStepStatus {
  key: SetupStepKey
  index: number
  done: boolean
}

const TOTAL_STEPS = 6

const SETUP_DISMISSED_KEY = 'setup_dismissed_v1'
const SETUP_DISMISS_TTL_MS = 24 * 60 * 60 * 1000

export const useSetupStore = defineStore('setup', () => {
  const business = ref<BusinessResponse | null>(null)
  const services = ref<ServiceResponse[]>([])
  const employees = ref<EmployeeResponse[]>([])
  const capabilitiesByEmployee = ref<Map<number, EmployeeCapabilityResponse[]>>(new Map())

  const loading = ref(false)
  const loaded = ref(false)
  const loadError = ref<string | null>(null)

  const currentStep = ref(1)

  const businessDone = computed(() => {
    const b = business.value
    return !!b && !!b.name?.trim() && !!b.phoneNumber?.trim() && !!b.category?.trim()
  })

  const activeServices = computed(() => services.value.filter((s) => s.active))
  const servicesDone = computed(() => activeServices.value.length > 0)

  const activeEmployees = computed(() => employees.value.filter((e) => e.status === 'ACTIVE'))
  const employeesDone = computed(() => employees.value.length > 0)

  const totalAssignments = computed(() => {
    let total = 0
    for (const list of capabilitiesByEmployee.value.values()) {
      total += list.filter((c) => c.active).length
    }
    return total
  })

  const assignmentsDone = computed(() => totalAssignments.value > 0)
  const hoursDone = computed(() => activeEmployees.value.length > 0)
  const shareDone = computed(() => !!business.value?.slug?.trim())

  const stepStatuses = computed<SetupStepStatus[]>(() => [
    { key: 'business', index: 1, done: businessDone.value },
    { key: 'services', index: 2, done: servicesDone.value },
    { key: 'employees', index: 3, done: employeesDone.value },
    { key: 'assignments', index: 4, done: assignmentsDone.value },
    { key: 'hours', index: 5, done: hoursDone.value },
    { key: 'share', index: 6, done: shareDone.value },
  ])

  const completedCount = computed(() => stepStatuses.value.filter((s) => s.done).length)
  const totalCount = computed(() => TOTAL_STEPS)
  const progressPercent = computed(() =>
    Math.round((completedCount.value / totalCount.value) * 100),
  )

  const isComplete = computed(
    () =>
      businessDone.value &&
      servicesDone.value &&
      employeesDone.value &&
      assignmentsDone.value,
  )

  const firstIncompleteStep = computed<number>(() => {
    const first = stepStatuses.value.find((s) => !s.done)
    return first ? first.index : TOTAL_STEPS
  })

  function indexFor(key: SetupStepKey): number {
    return stepStatuses.value.find((s) => s.key === key)?.index ?? 1
  }

  function setCurrentStep(step: number) {
    if (!Number.isFinite(step)) return
    currentStep.value = Math.min(Math.max(1, Math.trunc(step)), TOTAL_STEPS)
  }

  function isDismissedFresh(): boolean {
    const raw = window.localStorage.getItem(SETUP_DISMISSED_KEY)
    if (!raw) return false
    const ts = Number(raw)
    if (!Number.isFinite(ts) || ts <= 0) return false
    return Date.now() - ts < SETUP_DISMISS_TTL_MS
  }

  function markDismissed() {
    window.localStorage.setItem(SETUP_DISMISSED_KEY, String(Date.now()))
  }

  function clearDismissed() {
    window.localStorage.removeItem(SETUP_DISMISSED_KEY)
  }

  async function loadBusiness(businessId: number) {
    const { data } = await businessApi.getById(businessId)
    if (data.success && data.data) {
      business.value = data.data
    }
  }

  async function loadServices() {
    const { data } = await serviceApi.list()
    if (data.success && data.data) {
      services.value = data.data
    } else {
      services.value = []
    }
  }

  async function loadEmployees() {
    employees.value = await fetchAllPageContent((page, size) => employeeApi.list({ page, size }))
  }

  async function loadCapabilities() {
    const list = employees.value
    if (list.length === 0) {
      capabilitiesByEmployee.value = new Map()
      return
    }
    const results = await Promise.allSettled(
      list.map((emp) => employeeApi.getCapabilities(emp.id)),
    )
    const next = new Map<number, EmployeeCapabilityResponse[]>()
    results.forEach((r, idx) => {
      const empId = list[idx].id
      if (r.status === 'fulfilled') {
        next.set(empId, r.value.data.data ?? [])
      } else {
        next.set(empId, [])
      }
    })
    capabilitiesByEmployee.value = next
  }

  async function load(force = false) {
    const auth = useAuthStore()
    const businessId = auth.user?.businessId ?? null
    if (!businessId) {
      loaded.value = true
      return
    }
    if (loaded.value && !force) return

    loading.value = true
    loadError.value = null
    try {
      await loadBusiness(businessId)
      await Promise.all([loadServices(), loadEmployees()])
      await loadCapabilities()
      loaded.value = true
    } catch (e) {
      loadError.value = e instanceof Error ? e.message : 'Setup verisi alınamadı.'
    } finally {
      loading.value = false
    }
  }

  async function ensureLoaded() {
    if (!loaded.value) {
      await load()
    }
  }

  async function refresh() {
    await load(true)
  }

  function setBusiness(b: BusinessResponse) {
    business.value = b
  }

  function setServices(list: ServiceResponse[]) {
    services.value = list
  }

  function setEmployees(list: EmployeeResponse[]) {
    employees.value = list
  }

  function setCapabilities(empId: number, list: EmployeeCapabilityResponse[]) {
    const next = new Map(capabilitiesByEmployee.value)
    next.set(empId, list)
    capabilitiesByEmployee.value = next
  }

  function reset() {
    business.value = null
    services.value = []
    employees.value = []
    capabilitiesByEmployee.value = new Map()
    loaded.value = false
    loading.value = false
    loadError.value = null
    currentStep.value = 1
  }

  return {
    business,
    services,
    employees,
    capabilitiesByEmployee,
    loading,
    loaded,
    loadError,
    currentStep,
    activeServices,
    activeEmployees,
    totalAssignments,
    businessDone,
    servicesDone,
    employeesDone,
    assignmentsDone,
    hoursDone,
    shareDone,
    stepStatuses,
    completedCount,
    totalCount,
    progressPercent,
    isComplete,
    firstIncompleteStep,
    indexFor,
    setCurrentStep,
    isDismissedFresh,
    markDismissed,
    clearDismissed,
    load,
    ensureLoaded,
    refresh,
    setBusiness,
    setServices,
    setEmployees,
    setCapabilities,
    reset,
  }
})
