<template>
  <span
    class="inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
    :class="toneClass"
  >
    <slot>{{ displayLabel }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AppointmentStatus } from '@/api/appointment'

const { t } = useI18n()

const props = defineProps<{
  status?: AppointmentStatus | string
  label?: string
}>()

const displayLabel = computed(() => {
  if (props.label) return props.label
  if (props.status) return t(('appointmentStatus.' + props.status) as never)
  return ''
})

const toneClass = computed(() => {
  const s = props.status
  if (!s) return 'bg-slate-100 text-slate-700'
  const map: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-900',
    CONFIRMED: 'bg-emerald-100 text-emerald-800',
    RISKY: 'bg-orange-100 text-orange-900',
    COMPLETED: 'bg-sky-100 text-sky-900',
    CANCELLED: 'bg-slate-200 text-slate-700',
    NO_SHOW: 'bg-red-100 text-red-800',
  }
  return map[s] ?? 'bg-slate-100 text-slate-700'
})
</script>
