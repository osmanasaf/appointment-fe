<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import StatusPill from '@/components/ui/StatusPill.vue'
import {
  getAppointmentDurationMinutes,
  resolveAppointmentMeta,
  type CalendarLookupMaps,
  type FallbackLabelResolvers,
  type ResolvedAppointmentMeta,
} from '@/composables/useCalendarUtils'
import type { AppointmentResponse, AppointmentStatus } from '@/api/appointment'

interface Props {
  appointment: AppointmentResponse
  rowHeight: number
  startHour: number
  lookups: CalendarLookupMaps
  fallbackLabels: FallbackLabelResolvers
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [appointment: AppointmentResponse]
}>()

const { t, locale } = useI18n()

const intlLocale = computed(() => (locale.value === 'tr' ? 'tr-TR' : 'en-US'))

const meta = computed<ResolvedAppointmentMeta>(() =>
  resolveAppointmentMeta(props.appointment, props.lookups, props.fallbackLabels),
)

const durationMinutes = computed(() => getAppointmentDurationMinutes(props.appointment))

const cardStyle = computed(() => {
  const startTime = new Date(props.appointment.scheduledAt)
  const startHourFloat = startTime.getHours() + startTime.getMinutes() / 60
  const durationHours = durationMinutes.value / 60

  const top = (startHourFloat - props.startHour) * props.rowHeight + 4
  const height = durationHours * props.rowHeight - 8

  return {
    top: `${top}px`,
    height: `${Math.max(height, 24)}px`,
  }
})

const statusColors = computed(() => {
  const status: AppointmentStatus = props.appointment.status
  switch (status) {
    case 'CONFIRMED':
    case 'PENDING':
      return { bg: 'var(--primary-tint)', border: 'var(--primary)' }
    case 'COMPLETED':
      return { bg: 'var(--success-tint)', border: 'var(--success)' }
    case 'RISKY':
    case 'CANCELLED':
      return { bg: 'var(--danger-tint)', border: 'var(--danger)' }
    case 'NO_SHOW':
      return { bg: 'var(--warning-tint)', border: 'var(--warning)' }
    default:
      return { bg: 'var(--surface-2)', border: 'var(--hairline)' }
  }
})

const showStatusPill = computed(() => durationMinutes.value > 60)

const startTimeLabel = computed(() => {
  return new Intl.DateTimeFormat(intlLocale.value, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(props.appointment.scheduledAt))
})

const ariaLabel = computed(() =>
  t('calendar.appointmentCard.aria', {
    time: startTimeLabel.value,
    customer: meta.value.customerName,
    service: meta.value.serviceName,
    status: t(`appointmentStatus.${props.appointment.status}`),
  }),
)

function handleClick() {
  emit('click', props.appointment)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleClick()
  }
}
</script>

<template>
  <div
    class="appointment-card"
    :style="{
      ...cardStyle,
      background: statusColors.bg,
      borderLeftColor: statusColors.border,
    }"
    role="button"
    tabindex="0"
    :aria-label="ariaLabel"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <div class="card-time">{{ startTimeLabel }}</div>
    <div class="card-title">{{ meta.customerName }}</div>
    <div class="card-subtitle">{{ meta.serviceName }}</div>
    <div v-if="showStatusPill" class="card-status">
      <StatusPill :status="appointment.status" size="sm" />
    </div>
  </div>
</template>

<style scoped>
.appointment-card {
  position: absolute;
  left: 8px;
  right: 8px;
  border-radius: 10px;
  border-left: 3px solid;
  padding: 8px 10px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.appointment-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-2);
}

.appointment-card:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.card-time {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--ink-3);
  font-family: var(--font-mono);
  letter-spacing: 0.02em;
}

.card-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--ink-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
}

.card-subtitle {
  font-size: 11px;
  color: var(--ink-3);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-status {
  margin-top: 6px;
}
</style>
