<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  formatLocalDate,
  resolveAppointmentMeta,
  type CalendarLookupMaps,
  type FallbackLabelResolvers,
} from '@/composables/useCalendarUtils'
import type { AppointmentResponse, AppointmentStatus } from '@/api/appointment'

interface Props {
  appointments: AppointmentResponse[]
  currentDate: Date
  lookups: CalendarLookupMaps
  fallbackLabels: FallbackLabelResolvers
}

interface DayCell {
  day: number
  date: Date | null
  isCurrentMonth: boolean
  localKey: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  appointmentClick: [appointment: AppointmentResponse]
  dayClick: [date: Date]
}>()

const { t, tm, locale } = useI18n()

const PREVIEW_LIMIT = 3

const intlLocale = computed(() => (locale.value === 'tr' ? 'tr-TR' : 'en-US'))

const weekdayLabels = computed(() => {
  const raw = tm('calendar.month.weekdaysShort')
  return Array.isArray(raw) ? (raw as string[]) : []
})

const monthGrid = computed<DayCell[]>(() => {
  const year = props.currentDate.getFullYear()
  const month = props.currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const firstWeekday = firstDay.getDay()
  const startOffset = firstWeekday === 0 ? 6 : firstWeekday - 1
  const daysInMonth = lastDay.getDate()
  const totalCells = Math.ceil((daysInMonth + startOffset) / 7) * 7

  const cells: DayCell[] = []
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startOffset + 1
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push({ day: 0, date: null, isCurrentMonth: false, localKey: null })
    } else {
      const date = new Date(year, month, dayNum)
      cells.push({ day: dayNum, date, isCurrentMonth: true, localKey: formatLocalDate(date) })
    }
  }
  return cells
})

const appointmentsByDay = computed(() => {
  const map = new Map<string, AppointmentResponse[]>()
  props.appointments.forEach((apt) => {
    const dateStr = formatLocalDate(new Date(apt.scheduledAt))
    if (!map.has(dateStr)) map.set(dateStr, [])
    map.get(dateStr)!.push(apt)
  })
  return map
})

const todayKey = computed(() => formatLocalDate(new Date()))

function getDayAppointments(localKey: string | null): AppointmentResponse[] {
  if (!localKey) return []
  return appointmentsByDay.value.get(localKey) ?? []
}

function isToday(localKey: string | null): boolean {
  return localKey === todayKey.value
}

function handleDayClick(cell: DayCell) {
  if (cell.isCurrentMonth && cell.date) emit('dayClick', cell.date)
}

function handleDayKeydown(event: KeyboardEvent, cell: DayCell) {
  if (!cell.isCurrentMonth) return
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleDayClick(cell)
  }
}

function getStatusTokens(status: AppointmentStatus): { bg: string; fg: string } {
  switch (status) {
    case 'CONFIRMED':
    case 'PENDING':
      return { bg: 'var(--primary-tint)', fg: 'var(--primary)' }
    case 'COMPLETED':
      return { bg: 'var(--success-tint)', fg: 'var(--success)' }
    case 'RISKY':
    case 'CANCELLED':
      return { bg: 'var(--danger-tint)', fg: 'var(--danger)' }
    case 'NO_SHOW':
      return { bg: 'var(--warning-tint)', fg: 'var(--warning)' }
    default:
      return { bg: 'var(--surface-2)', fg: 'var(--ink-2)' }
  }
}

function formatAppointmentTime(apt: AppointmentResponse): string {
  return new Intl.DateTimeFormat(intlLocale.value, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(apt.scheduledAt))
}

function getCustomerName(apt: AppointmentResponse): string {
  return resolveAppointmentMeta(apt, props.lookups, props.fallbackLabels).customerName
}

function getDayCellAria(cell: DayCell): string | undefined {
  if (!cell.isCurrentMonth || !cell.date) return undefined
  const dateLabel = new Intl.DateTimeFormat(intlLocale.value, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(cell.date)
  const count = getDayAppointments(cell.localKey).length
  return t('calendar.month.dayAria', { date: dateLabel, count })
}
</script>

<template>
  <div class="month-view-card">
    <div class="month-weekdays">
      <div
        v-for="(day, i) in weekdayLabels"
        :key="i"
        class="weekday-label"
      >
        {{ day }}
      </div>
    </div>

    <div class="month-grid">
      <div
        v-for="(cell, i) in monthGrid"
        :key="i"
        class="day-cell"
        :class="{
          'day-cell-today': isToday(cell.localKey),
          'day-cell-disabled': !cell.isCurrentMonth,
        }"
        :role="cell.isCurrentMonth ? 'button' : undefined"
        :tabindex="cell.isCurrentMonth ? 0 : -1"
        :aria-current="isToday(cell.localKey) ? 'date' : undefined"
        :aria-label="getDayCellAria(cell)"
        @click="handleDayClick(cell)"
        @keydown="handleDayKeydown($event, cell)"
      >
        <div class="day-cell-header">
          <div class="day-number mono">{{ cell.day || '' }}</div>
          <div
            v-if="cell.isCurrentMonth && getDayAppointments(cell.localKey).length > 0"
            class="day-count"
          >
            {{ getDayAppointments(cell.localKey).length }}
          </div>
        </div>

        <div
          v-if="cell.isCurrentMonth && getDayAppointments(cell.localKey).length > 0"
          class="day-appointments"
        >
          <div
            v-for="apt in getDayAppointments(cell.localKey).slice(0, PREVIEW_LIMIT)"
            :key="apt.id"
            class="appointment-preview"
            :style="{
              background: getStatusTokens(apt.status).bg,
              color: getStatusTokens(apt.status).fg,
              borderColor: getStatusTokens(apt.status).fg,
            }"
          >
            {{ getCustomerName(apt) }} · {{ formatAppointmentTime(apt) }}
          </div>

          <div
            v-if="getDayAppointments(cell.localKey).length > PREVIEW_LIMIT"
            class="more-count"
            :aria-label="t('calendar.month.moreCountAria', {
              n: getDayAppointments(cell.localKey).length - PREVIEW_LIMIT,
            })"
          >
            {{ t('calendar.month.moreCount', { n: getDayAppointments(cell.localKey).length - PREVIEW_LIMIT }) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.month-view-card {
  background: var(--surface);
  border-radius: 12px;
  border: 1px solid var(--hairline);
  padding: 22px;
  box-shadow: var(--shadow-1);
}

.month-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 8px;
}

.weekday-label {
  font-size: 11.5px;
  color: var(--ink-3);
  font-weight: 700;
  text-align: center;
  padding: 8px 0;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.day-cell {
  min-height: 110px;
  border-radius: 10px;
  padding: 10px;
  background: var(--surface-2);
  border: 1px solid var(--hairline);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  text-align: left;
}

.day-cell:hover:not(.day-cell-disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-2);
}

.day-cell:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.day-cell-today {
  background: var(--primary-tint);
  border: 1.5px solid var(--primary);
}

.day-cell-disabled {
  opacity: 0.4;
  cursor: default;
}

.day-cell-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.day-number {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-2);
}

.day-cell-today .day-number {
  color: var(--primary);
}

.day-count {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--ink-3);
}

.day-cell-today .day-count {
  color: var(--primary);
}

.day-appointments {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.appointment-preview {
  font-size: 10.5px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  border-left: 2px solid;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-count {
  font-size: 10px;
  color: var(--ink-4);
  font-weight: 600;
  padding-left: 2px;
  margin-top: 2px;
}

@media (max-width: 768px) {
  .month-view-card {
    padding: 16px;
  }

  .month-grid {
    gap: 4px;
  }

  .day-cell {
    min-height: 80px;
    padding: 8px;
  }

  .day-number {
    font-size: 12px;
  }

  .appointment-preview {
    font-size: 9.5px;
  }

  .day-appointments .appointment-preview:nth-child(n + 2) {
    display: none;
  }
}
</style>
