<script setup lang="ts">
/**
 * StatusPill - Appointment status badge component
 *
 * UI seviyesinde genişletilmiş status union; sunucu enum'una `IN_PROGRESS`/`RESCHEDULE_REQUESTED`
 * eklendiğinde tek kaynak hâline gelir (şu anda API'den gelmezler).
 */
type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'RISKY'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'RESCHEDULE_REQUESTED'
  | 'IN_PROGRESS'

interface Props {
  status: AppointmentStatus
  label?: string
  size?: 'xs' | 'sm' | 'md'
  dot?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  dot: true
})

const statusConfig: Record<
  AppointmentStatus,
  { defaultLabel: string; color: string; tint: string }
> = {
  CONFIRMED: {
    defaultLabel: 'Confirmed',
    color: 'var(--success)',
    tint: 'var(--success-tint)'
  },
  COMPLETED: {
    defaultLabel: 'Completed',
    color: 'var(--success)',
    tint: 'var(--success-tint)'
  },
  PENDING: {
    defaultLabel: 'Pending',
    color: 'var(--warning)',
    tint: 'var(--warning-tint)'
  },
  RESCHEDULE_REQUESTED: {
    defaultLabel: 'Reschedule',
    color: 'var(--warning)',
    tint: 'var(--warning-tint)'
  },
  IN_PROGRESS: {
    defaultLabel: 'In Progress',
    color: 'var(--info)',
    tint: 'var(--info-tint)'
  },
  RISKY: {
    defaultLabel: 'Risky',
    color: 'var(--warning)',
    tint: 'var(--warning-tint)'
  },
  CANCELLED: {
    defaultLabel: 'Cancelled',
    color: 'var(--danger)',
    tint: 'var(--danger-tint)'
  },
  NO_SHOW: {
    defaultLabel: 'No Show',
    color: 'var(--danger)',
    tint: 'var(--danger-tint)'
  }
}

const config = statusConfig[props.status]
const displayLabel = props.label ?? config.defaultLabel

const sizeClasses = {
  xs: 'status-pill--xs',
  sm: 'status-pill--sm',
  md: 'status-pill--md'
}
</script>

<template>
  <span
    class="status-pill"
    :class="[sizeClasses[size], { 'status-pill--risky': status === 'RISKY' }]"
    :style="{ background: config.tint, color: config.color }"
  >
    <span
      v-if="dot"
      class="status-pill__dot"
      :style="{ background: config.color }"
      aria-hidden="true"
    />
    <span>{{ displayLabel }}</span>
  </span>
</template>

<style scoped>
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: var(--r-full);
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
}

.status-pill--xs {
  padding: 2px 8px;
  font-size: 10.5px;
  gap: 4px;
}

.status-pill--sm {
  padding: 4px 10px;
  font-size: 11.5px;
}

.status-pill--md {
  padding: 6px 12px;
  font-size: 12.5px;
}

.status-pill__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-pill--xs .status-pill__dot {
  width: 5px;
  height: 5px;
}

.status-pill--md .status-pill__dot {
  width: 7px;
  height: 7px;
}

.status-pill--risky {
  border-left: 2px solid var(--warning);
  padding-left: calc(8px + 2px);
}

.status-pill--risky.status-pill--sm {
  padding-left: calc(10px + 2px);
}

.status-pill--risky.status-pill--md {
  padding-left: calc(12px + 2px);
}
</style>
