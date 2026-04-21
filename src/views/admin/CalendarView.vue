<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { X } from 'lucide-vue-next'
import { useAppointmentStore } from '@/stores/appointment'
import { useEmployeeStore } from '@/stores/employee'
import { useCustomerStore } from '@/stores/customer'
import { useServiceStore } from '@/stores/service'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import CalendarToolbar from '@/components/calendar/CalendarToolbar.vue'
import CalendarDayView from '@/components/calendar/CalendarDayView.vue'
import CalendarWeekView from '@/components/calendar/CalendarWeekView.vue'
import CalendarMonthView from '@/components/calendar/CalendarMonthView.vue'
import AppointmentDetailPanel from '@/components/appointments/AppointmentDetailPanel.vue'
import EmployeeFilterDropdown from '@/components/filters/EmployeeFilterDropdown.vue'
import StatusFilterDropdown from '@/components/filters/StatusFilterDropdown.vue'

const STATUS_COLOR_MAP: Record<string, string> = {
  PENDING: '#F59E0B',
  CONFIRMED: '#14B8A6',
  RISKY: '#EF4444',
  CANCELLED: '#94A3B8',
  COMPLETED: '#10B981',
  NO_SHOW: '#64748B',
}
import {
  buildLookupMaps,
  formatLocalDate,
  getMondayOfWeek,
  resolveAppointmentMeta,
} from '@/composables/useCalendarUtils'
import type { AppointmentResponse, AppointmentStatus } from '@/api/appointment'

type CalendarView = 'day' | 'week' | 'month'

const APPOINTMENT_FETCH_LIMIT = 500

const STATUS_FILTER_OPTIONS: Array<AppointmentStatus | ''> = [
  '',
  'PENDING',
  'CONFIRMED',
  'RISKY',
  'CANCELLED',
  'COMPLETED',
  'NO_SHOW',
]

const EMPLOYEE_COLOR_PALETTE = [
  '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6',
  '#06B6D4', '#EF4444', '#84CC16', '#F97316', '#A855F7',
] as const

const { t } = useI18n()
const router = useRouter()
const appointmentStore = useAppointmentStore()
const employeeStore = useEmployeeStore()
const customerStore = useCustomerStore()
const serviceStore = useServiceStore()

const currentDate = ref(new Date())
const currentView = ref<CalendarView>('day')
const selectedAppointment = ref<AppointmentResponse | null>(null)

const filterPanelOpen = ref(false)
const filterStatus = ref<AppointmentStatus | ''>('')
const filterEmployeeId = ref<number | ''>('')

const dateRange = computed(() => {
  const view = currentView.value
  const date = currentDate.value

  if (view === 'day') {
    const dateStr = formatLocalDate(date)
    return { startDate: dateStr, endDate: dateStr }
  }

  if (view === 'week') {
    const monday = getMondayOfWeek(date)
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)
    return {
      startDate: formatLocalDate(monday),
      endDate: formatLocalDate(sunday),
    }
  }

  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return {
    startDate: formatLocalDate(firstDay),
    endDate: formatLocalDate(lastDay),
  }
})

const isLoading = computed(() => appointmentStore.loading || employeeStore.loading)
const hasError = computed(() => Boolean(appointmentStore.error || employeeStore.error))

const lookupMaps = computed(() =>
  buildLookupMaps(customerStore.customers, employeeStore.employees, serviceStore.services),
)

const fallbackLabels = computed(() => ({
  customer: (id: number) => t('common.customerFallback', { id }),
  employee: (id: number) => t('common.employeeFallback', { id }),
  service: (id: number) => t('common.serviceFallback', { id }),
}))

const selectedAppointmentMeta = computed(() => {
  if (!selectedAppointment.value) return null
  return resolveAppointmentMeta(selectedAppointment.value, lookupMaps.value, fallbackLabels.value)
})

function employeeColor(id: number): string {
  return EMPLOYEE_COLOR_PALETTE[id % EMPLOYEE_COLOR_PALETTE.length]
}

const filteredAppointments = computed<AppointmentResponse[]>(() => {
  let list = appointmentStore.appointments
  if (filterStatus.value !== '') {
    list = list.filter((a) => a.status === filterStatus.value)
  }
  if (filterEmployeeId.value !== '') {
    list = list.filter((a) => a.employeeId === filterEmployeeId.value)
  }
  return list
})

const employeeAppointmentCounts = computed<Map<number, number>>(() => {
  const counts = new Map<number, number>()
  let base = appointmentStore.appointments
  if (filterStatus.value !== '') {
    base = base.filter((a) => a.status === filterStatus.value)
  }
  for (const a of base) {
    counts.set(a.employeeId, (counts.get(a.employeeId) ?? 0) + 1)
  }
  return counts
})

const statusChips = computed(() =>
  STATUS_FILTER_OPTIONS.map((status) => {
    const count =
      status === ''
        ? appointmentStore.appointments.length
        : appointmentStore.appointments.filter((a) => a.status === status).length
    const labelKey = status === '' ? 'all' : status.toLowerCase()
    return {
      value: status,
      label: t(`calendar.filterPanel.status.${labelKey}`),
      count,
    }
  }),
)

const statusOptions = computed(() =>
  statusChips.value
    .filter((c) => c.value !== '')
    .map((c) => ({
      value: c.value as string,
      label: c.label,
      count: c.count,
      color: STATUS_COLOR_MAP[c.value as string],
    })),
)

const statusTotalCount = computed(
  () => statusChips.value.find((c) => c.value === '')?.count ?? appointmentStore.appointments.length,
)

const activeFilterCount = computed(() => {
  let n = 0
  if (filterStatus.value !== '') n += 1
  if (filterEmployeeId.value !== '') n += 1
  return n
})

function handlePrev() {
  const view = currentView.value
  const date = new Date(currentDate.value)
  if (view === 'day') date.setDate(date.getDate() - 1)
  else if (view === 'week') date.setDate(date.getDate() - 7)
  else date.setMonth(date.getMonth() - 1)
  currentDate.value = date
}

function handleNext() {
  const view = currentView.value
  const date = new Date(currentDate.value)
  if (view === 'day') date.setDate(date.getDate() + 1)
  else if (view === 'week') date.setDate(date.getDate() + 7)
  else date.setMonth(date.getMonth() + 1)
  currentDate.value = date
}

function handleToday() {
  currentDate.value = new Date()
}

function handleViewChange(view: CalendarView) {
  currentView.value = view
}

function handleAppointmentClick(appointment: AppointmentResponse) {
  selectedAppointment.value = appointment
}

function handleClosePanel() {
  selectedAppointment.value = null
}

function handleMonthDayClick(date: Date) {
  currentDate.value = date
  currentView.value = 'day'
}

function handleWeekCellClick(date: Date) {
  currentDate.value = date
  currentView.value = 'day'
}

function handleFilterClick() {
  filterPanelOpen.value = !filterPanelOpen.value
}

function clearFilters() {
  filterStatus.value = ''
  filterEmployeeId.value = ''
}

function handleNewAppointmentClick() {
  const dateStr = formatLocalDate(currentDate.value)
  void router.push({ path: '/admin/appointments', query: { new: '1', date: dateStr } })
}

async function fetchAppointmentsForRange() {
  const range = dateRange.value
  await appointmentStore.fetchAppointments({
    startDate: range.startDate,
    endDate: range.endDate,
    page: 0,
    size: APPOINTMENT_FETCH_LIMIT,
  })
}

async function fetchSupportingData() {
  await Promise.all([
    employeeStore.fetchEmployees({ activeOnly: false }),
    customerStore.fetchCustomers({ size: APPOINTMENT_FETCH_LIMIT }),
    serviceStore.fetchServices(),
  ])
}

function handleRetry() {
  void fetchAppointmentsForRange()
  void fetchSupportingData()
}

watch([dateRange, currentView], () => {
  void fetchAppointmentsForRange()
})

onMounted(() => {
  void fetchAppointmentsForRange()
  void fetchSupportingData()
})
</script>

<template>
  <div class="view-calendar">
    <SectionHeader :title="t('calendar.title')" :subtitle="t('calendar.subtitle')" />

    <CalendarToolbar
      :view="currentView"
      :current-date="currentDate"
      :filter-active="activeFilterCount > 0"
      :filter-count="activeFilterCount"
      :filter-panel-open="filterPanelOpen"
      @prev="handlePrev"
      @next="handleNext"
      @today="handleToday"
      @view-change="handleViewChange"
      @filter-click="handleFilterClick"
      @new-appointment-click="handleNewAppointmentClick"
    />

    <Transition name="filter-panel">
      <section
        v-if="filterPanelOpen"
        class="filter-panel"
        role="region"
        :aria-label="t('calendar.filterPanel.title')"
      >
        <div class="filter-panel__row">
          <span class="filter-panel__label">{{ t('calendar.filterPanel.statusLabel') }}</span>
          <StatusFilterDropdown
            :model-value="filterStatus"
            :options="statusOptions"
            :total-count="statusTotalCount"
            :all-label="t('calendar.filterPanel.status.all')"
            :aria-label="t('calendar.filterPanel.statusLabel')"
            @update:model-value="(v) => (filterStatus = v as AppointmentStatus | '')"
          />
        </div>

        <div class="filter-panel__row">
          <span class="filter-panel__label">{{ t('calendar.filterPanel.employeeLabel') }}</span>
          <EmployeeFilterDropdown
            v-model="filterEmployeeId"
            :employees="employeeStore.activeEmployees"
            :counts="employeeAppointmentCounts"
            :color-fn="employeeColor"
            :aria-label="t('calendar.filterPanel.employeeLabel')"
          />
        </div>

        <div class="filter-panel__actions">
          <AppButton
            variant="secondary"
            size="sm"
            :disabled="activeFilterCount === 0"
            @click="clearFilters"
          >
            <X :size="14" :stroke-width="2" aria-hidden="true" />
            {{ t('calendar.filterPanel.clear') }}
          </AppButton>
        </div>
      </section>
    </Transition>

    <div v-if="isLoading" class="state-container">
      <div class="spinner" aria-hidden="true" />
      <p class="body-sm state-message">{{ t('calendar.loading') }}</p>
    </div>

    <div v-else-if="hasError" class="state-container" role="alert">
      <p class="body state-message error-message">{{ t('calendar.error') }}</p>
      <AppButton variant="secondary" size="sm" @click="handleRetry">
        {{ t('calendar.retry') }}
      </AppButton>
    </div>

    <div v-else class="calendar-content">
      <CalendarDayView
        v-if="currentView === 'day'"
        :appointments="filteredAppointments"
        :employees="filterEmployeeId === '' ? employeeStore.activeEmployees : employeeStore.activeEmployees.filter((e) => e.id === filterEmployeeId)"
        :current-date="currentDate"
        :lookups="lookupMaps"
        :fallback-labels="fallbackLabels"
        @appointment-click="handleAppointmentClick"
      />
      <CalendarWeekView
        v-else-if="currentView === 'week'"
        :appointments="filteredAppointments"
        :current-date="currentDate"
        @cell-click="handleWeekCellClick"
      />
      <CalendarMonthView
        v-else
        :appointments="filteredAppointments"
        :current-date="currentDate"
        :lookups="lookupMaps"
        :fallback-labels="fallbackLabels"
        @appointment-click="handleAppointmentClick"
        @day-click="handleMonthDayClick"
      />
    </div>

    <Teleport to="body">
      <Transition name="slide-panel">
        <div
          v-if="selectedAppointment && selectedAppointmentMeta"
          class="appointment-panel-overlay"
          @click="handleClosePanel"
        >
          <div class="appointment-panel-wrapper" @click.stop>
            <AppointmentDetailPanel
              :appointment="selectedAppointment"
              :customer-name="selectedAppointmentMeta.customerName"
              :employee-name="selectedAppointmentMeta.employeeName"
              :service-name="selectedAppointmentMeta.serviceName"
              :customer-phone="selectedAppointmentMeta.customerPhone"
              @close="handleClosePanel"
            />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.view-calendar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px 20px;
}

.state-message {
  color: var(--ink-3);
}

.error-message {
  color: var(--danger);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--surface-2);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.calendar-content {
  flex: 1;
}

/* ─── Filter panel ───────────────────────────────────────────────────── */
.filter-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-1);
}

.filter-panel__row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-panel__label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-4);
  flex-shrink: 0;
  min-width: 64px;
}

.filter-panel__actions {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--hairline);
  padding-top: 12px;
}

/* Filter panel slide animation */
.filter-panel-enter-active,
.filter-panel-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease, max-height 0.22s ease;
  max-height: 400px;
  overflow: hidden;
}

.filter-panel-enter-from,
.filter-panel-leave-to {
  opacity: 0;
  transform: translateY(-4px);
  max-height: 0;
}

@media (prefers-reduced-motion: reduce) {
  .filter-panel-enter-active,
  .filter-panel-leave-active {
    transition: none;
  }
}

.appointment-panel-overlay {
  position: fixed;
  inset: 0;
  background: var(--scrim, rgba(0, 0, 0, 0.45));
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
}

.appointment-panel-wrapper {
  width: 100%;
  max-width: 480px;
  background: var(--surface);
  box-shadow: var(--shadow-3);
  overflow-y: auto;
}

.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: opacity 0.2s ease;
}

.slide-panel-enter-active .appointment-panel-wrapper,
.slide-panel-leave-active .appointment-panel-wrapper {
  transition: transform 0.25s ease;
}

.slide-panel-enter-from,
.slide-panel-leave-to {
  opacity: 0;
}

.slide-panel-enter-from .appointment-panel-wrapper {
  transform: translateX(100%);
}

.slide-panel-leave-to .appointment-panel-wrapper {
  transform: translateX(100%);
}

@media (max-width: 768px) {
  .appointment-panel-wrapper {
    max-width: 100%;
  }
}
</style>
