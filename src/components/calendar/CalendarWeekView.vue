<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatLocalDate, getMondayOfWeek } from '@/composables/useCalendarUtils'
import type { AppointmentResponse } from '@/api/appointment'

interface Props {
  appointments: AppointmentResponse[]
  currentDate: Date
}

const props = defineProps<Props>()

const emit = defineEmits<{
  cellClick: [date: Date, hour: number]
}>()

const { t, locale } = useI18n()

const START_HOUR = 9
const END_HOUR = 19
const INTENSITY_LEVELS = 5

const intlLocale = computed(() => (locale.value === 'tr' ? 'tr-TR' : 'en-US'))

const weekDays = computed(() => {
  const monday = getMondayOfWeek(props.currentDate)
  const result: { label: string; date: Date; localKey: string }[] = []

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    const dayName = new Intl.DateTimeFormat(intlLocale.value, { weekday: 'short' }).format(date)
    result.push({
      label: `${dayName} ${date.getDate()}`,
      date,
      localKey: formatLocalDate(date),
    })
  }

  return result
})

const hours = computed(() => {
  const result: number[] = []
  for (let h = START_HOUR; h <= END_HOUR; h++) result.push(h)
  return result
})

const heatmapData = computed(() => {
  const map = new Map<string, number>()

  props.appointments.forEach((apt) => {
    const date = new Date(apt.scheduledAt)
    const dateStr = formatLocalDate(date)
    const hour = date.getHours()

    if (hour < START_HOUR || hour > END_HOUR) return

    const key = `${dateStr}-${hour}`
    map.set(key, (map.get(key) ?? 0) + 1)
  })

  return map
})

function getCount(dayLocalKey: string, hour: number): number {
  return heatmapData.value.get(`${dayLocalKey}-${hour}`) ?? 0
}

function getIntensity(count: number): number {
  if (count === 0) return 0
  if (count <= 2) return 1
  if (count <= 4) return 2
  if (count <= 6) return 3
  return 4
}

function getColorForIntensity(intensity: number): string {
  if (intensity === 0) return 'var(--surface-2)'
  if (intensity === INTENSITY_LEVELS - 1) return 'var(--primary)'
  const opacityPct = [0, 18, 38, 62][intensity] ?? 0
  return `color-mix(in srgb, var(--primary) ${opacityPct}%, transparent)`
}

function getCellAriaLabel(dayLabel: string, hour: number, count: number): string {
  return t('calendar.week.cellAria', {
    day: dayLabel,
    hour: `${String(hour).padStart(2, '0')}:00`,
    count,
  })
}

function handleCellClick(date: Date, hour: number) {
  const target = new Date(date)
  target.setHours(hour, 0, 0, 0)
  emit('cellClick', target, hour)
}
</script>

<template>
  <div class="week-view-card">
    <div class="week-header">
      <div class="week-title">
        <div class="title-lg">{{ t('calendar.week.title') }}</div>
        <div class="body-sm week-subtitle">{{ t('calendar.week.subtitle') }}</div>
      </div>
      <div class="week-legend" role="group" :aria-label="t('calendar.week.legendAria')">
        <span class="legend-label">{{ t('calendar.week.intensity.low') }}</span>
        <div
          v-for="i in INTENSITY_LEVELS"
          :key="i"
          class="legend-swatch"
          :style="{ background: getColorForIntensity(i - 1) }"
          aria-hidden="true"
        />
        <span class="legend-label">{{ t('calendar.week.intensity.high') }}</span>
      </div>
    </div>

    <div class="week-grid-scroll">
      <div class="week-grid">
        <div aria-hidden="true" />

        <div
          v-for="day in weekDays"
          :key="day.localKey"
          class="day-header"
        >
          {{ day.label }}
        </div>

        <template v-for="hour in hours" :key="hour">
          <div class="hour-label" aria-hidden="true">{{ String(hour).padStart(2, '0') }}:00</div>

          <button
            v-for="day in weekDays"
            :key="`${day.localKey}-${hour}`"
            type="button"
            class="heat-cell"
            :class="{ 'heat-cell--filled': getCount(day.localKey, hour) > 0 }"
            :style="{ background: getColorForIntensity(getIntensity(getCount(day.localKey, hour))) }"
            :aria-label="getCellAriaLabel(day.label, hour, getCount(day.localKey, hour))"
            @click="handleCellClick(day.date, hour)"
          >
            <span
              v-if="getCount(day.localKey, hour) > 0"
              class="heat-cell-count"
              :class="{ 'heat-cell-count--inverse': getIntensity(getCount(day.localKey, hour)) >= 3 }"
            >
              {{ getCount(day.localKey, hour) }}
            </span>
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.week-view-card {
  background: var(--surface);
  border-radius: 12px;
  border: 1px solid var(--hairline);
  padding: 22px;
  box-shadow: var(--shadow-1);
}

.week-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  flex-wrap: wrap;
  gap: 12px;
}

.week-subtitle {
  color: var(--ink-3);
  margin-top: 2px;
}

.week-legend {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--ink-3);
  font-weight: 600;
}

.legend-label {
  text-transform: capitalize;
}

.legend-swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid var(--hairline);
}

.week-grid-scroll {
  overflow-x: auto;
  margin: 0 -4px;
  padding: 0 4px;
}

.week-grid {
  display: grid;
  grid-template-columns: 60px repeat(7, minmax(72px, 1fr));
  gap: 4px;
  min-width: 600px;
}

.day-header {
  font-size: 11.5px;
  color: var(--ink-3);
  font-weight: 700;
  text-align: center;
  padding: 4px 0;
}

.hour-label {
  font-size: 11px;
  color: var(--ink-4);
  font-weight: 600;
  font-family: var(--font-mono);
  text-align: right;
  padding-right: 8px;
  align-self: center;
}

.heat-cell {
  position: relative;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.15s ease;
  border: 1px solid var(--hairline);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.heat-cell:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-1);
}

.heat-cell:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  z-index: 1;
}

.heat-cell-count {
  font-size: 11px;
  font-weight: 700;
  color: var(--ink-1);
  line-height: 1;
  pointer-events: none;
}

.heat-cell-count--inverse {
  color: var(--surface);
}

@media (max-width: 768px) {
  .week-view-card {
    padding: 16px;
  }

  .week-grid {
    grid-template-columns: 50px repeat(7, minmax(56px, 1fr));
    gap: 2px;
    min-width: 480px;
  }

  .heat-cell {
    height: 28px;
  }

  .day-header {
    font-size: 10px;
  }

  .hour-label {
    font-size: 10px;
  }
}
</style>
