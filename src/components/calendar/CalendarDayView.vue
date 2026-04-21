<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import CalendarAppointmentCard from './CalendarAppointmentCard.vue'
import {
  formatLocalDate,
  getInitials,
  type CalendarLookupMaps,
  type FallbackLabelResolvers,
} from '@/composables/useCalendarUtils'
import type { AppointmentResponse } from '@/api/appointment'
import type { EmployeeResponse } from '@/api/employee'

interface Props {
  appointments: AppointmentResponse[]
  employees: EmployeeResponse[]
  currentDate: Date
  lookups: CalendarLookupMaps
  fallbackLabels: FallbackLabelResolvers
}

const props = defineProps<Props>()

const emit = defineEmits<{
  appointmentClick: [appointment: AppointmentResponse]
}>()

const { t } = useI18n()

const START_HOUR = 9
const END_HOUR = 19
const ROW_HEIGHT = 64
const MAX_VISIBLE_EMPLOYEES = 6

const hours = computed(() => {
  const result: string[] = []
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    result.push(`${h.toString().padStart(2, '0')}:00`)
  }
  return result
})

const visibleEmployees = computed(() => props.employees.slice(0, MAX_VISIBLE_EMPLOYEES))

const hasEmployees = computed(() => visibleEmployees.value.length > 0)

const appointmentsByEmployee = computed(() => {
  const map = new Map<number, AppointmentResponse[]>()
  const dateStr = formatLocalDate(props.currentDate)

  props.appointments.forEach((apt) => {
    if (formatLocalDate(new Date(apt.scheduledAt)) !== dateStr) return
    const empId = apt.employeeId
    if (!map.has(empId)) map.set(empId, [])
    map.get(empId)!.push(apt)
  })

  return map
})

const isToday = computed(
  () => formatLocalDate(new Date()) === formatLocalDate(props.currentDate),
)

const nowPosition = computed(() => {
  if (!isToday.value) return null
  const now = new Date()
  const currentHour = now.getHours() + now.getMinutes() / 60
  if (currentHour < START_HOUR || currentHour > END_HOUR) return null

  const top = (currentHour - START_HOUR) * ROW_HEIGHT
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return { top, timeStr }
})

const gridTemplateColumns = computed(
  () => `80px repeat(${visibleEmployees.value.length}, minmax(160px, 1fr))`,
)

function getEmployeeAppointments(employeeId: number): AppointmentResponse[] {
  return appointmentsByEmployee.value.get(employeeId) ?? []
}
</script>

<template>
  <div class="day-view-card">
    <div v-if="!hasEmployees" class="empty-state" role="status">
      <p class="body state-message">{{ t('calendar.day.noEmployees') }}</p>
    </div>

    <template v-else>
      <div class="day-header" :style="{ gridTemplateColumns }">
        <div class="day-header-gutter" aria-hidden="true" />
        <div
          v-for="employee in visibleEmployees"
          :key="employee.id"
          class="day-header-employee"
        >
          <div class="employee-avatar" aria-hidden="true">
            {{ getInitials(employee.name) }}
          </div>
          <div class="employee-info">
            <div class="employee-name">{{ employee.name }}</div>
            <div class="employee-meta">
              {{ t('calendar.day.active') }} ·
              {{ t('calendar.day.appointmentCount', { count: getEmployeeAppointments(employee.id).length }) }}
            </div>
          </div>
        </div>
      </div>

      <div class="day-body">
        <div class="day-grid" :style="{ gridTemplateColumns }">
          <div class="time-gutter" aria-hidden="true">
            <div
              v-for="hour in hours"
              :key="hour"
              class="time-label"
              :style="{ height: `${ROW_HEIGHT}px` }"
            >
              {{ hour }}
            </div>
          </div>

          <div
            v-for="employee in visibleEmployees"
            :key="employee.id"
            class="employee-column"
          >
            <div
              v-for="(hour, i) in hours"
              :key="i"
              class="hour-slot"
              :style="{ height: `${ROW_HEIGHT}px` }"
            />

            <CalendarAppointmentCard
              v-for="apt in getEmployeeAppointments(employee.id)"
              :key="apt.id"
              :appointment="apt"
              :row-height="ROW_HEIGHT"
              :start-hour="START_HOUR"
              :lookups="lookups"
              :fallback-labels="fallbackLabels"
              @click="emit('appointmentClick', apt)"
            />
          </div>
        </div>

        <div
          v-if="nowPosition"
          class="now-line"
          :style="{ top: `${nowPosition.top}px` }"
          :aria-label="t('calendar.day.now')"
          role="presentation"
        >
          <div class="now-dot" aria-hidden="true" />
          <div class="now-label">{{ nowPosition.timeStr }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.day-view-card {
  background: var(--surface);
  border-radius: 12px;
  border: 1px solid var(--hairline);
  overflow: hidden;
  box-shadow: var(--shadow-1);
}

.empty-state {
  padding: 64px 24px;
  text-align: center;
}

.state-message {
  color: var(--ink-3);
}

.day-header {
  display: grid;
  border-bottom: 1px solid var(--hairline);
  background: var(--surface-2);
}

.day-header-gutter {
  height: 100%;
}

.day-header-employee {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-left: 1px solid var(--hairline);
}

.employee-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary);
  color: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  flex-shrink: 0;
}

.employee-info {
  overflow: hidden;
}

.employee-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.employee-meta {
  font-size: 10.5px;
  color: var(--ink-4);
  font-weight: 600;
  text-transform: uppercase;
}

.day-body {
  position: relative;
}

.day-grid {
  display: grid;
}

.time-gutter {
  display: flex;
  flex-direction: column;
}

.time-label {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 6px 10px;
  font-size: 11px;
  color: var(--ink-4);
  font-weight: 600;
  font-family: var(--font-mono);
}

.employee-column {
  position: relative;
  border-left: 1px solid var(--hairline);
}

.hour-slot {
  border-bottom: 1px solid var(--hairline);
}

.now-line {
  position: absolute;
  left: 80px;
  right: 0;
  height: 2px;
  background: var(--danger);
  z-index: 2;
  pointer-events: none;
}

.now-dot {
  position: absolute;
  left: -4px;
  top: -4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--danger);
}

.now-label {
  position: absolute;
  left: -70px;
  top: -10px;
  font-size: 10.5px;
  color: var(--danger);
  font-weight: 700;
  font-family: var(--font-mono);
  background: var(--surface);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--hairline);
}

@media (max-width: 1024px) {
  .day-view-card {
    overflow-x: auto;
  }

  .day-grid,
  .day-header {
    min-width: 800px;
  }
}

@media (max-width: 768px) {
  .employee-name {
    font-size: 12px;
  }

  .employee-meta {
    font-size: 10px;
  }
}
</style>
