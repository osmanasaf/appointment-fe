<script setup lang="ts">
/**
 * AppointmentDetailPanel — randevu master/detail görünümünün sağ paneli.
 * Üstte gradient header (status tonuna göre), altta müşteri kartı, meta bilgiler ve aksiyon butonları.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Check,
  CheckCheck,
  X,
  UserMinus,
  UserCircle2,
  Scissors,
  Clock,
  Phone,
  MapPin,
  Globe,
  StickyNote,
  CalendarClock,
} from 'lucide-vue-next'
import StatusPill from '@/components/ui/StatusPill.vue'
import AppButton from '@/components/ui/AppButton.vue'
import type { AppointmentResponse, AppointmentStatus } from '@/api/appointment'

interface Props {
  appointment: AppointmentResponse | null
  customerName: string
  employeeName: string
  serviceName: string
  customerPhone?: string | null
  employeeColor?: string
  actingId?: number | null
  actingAction?: string
  customerHasNoShow?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  customerPhone: null,
  employeeColor: 'var(--primary)',
  actingId: null,
  actingAction: '',
  customerHasNoShow: false,
})

const emit = defineEmits<{
  confirm: [id: number]
  complete: [id: number]
  cancel: [appointment: AppointmentResponse]
  noShow: [appointment: AppointmentResponse]
  close: []
}>()

const { t } = useI18n()

const STATUS_TONE: Record<AppointmentStatus, { from: string; to: string }> = {
  PENDING: { from: 'var(--warning)', to: 'color-mix(in oklab, var(--warning) 70%, transparent)' },
  CONFIRMED: { from: 'var(--primary)', to: 'var(--primary-pressed)' },
  RISKY: { from: 'var(--warning)', to: 'var(--danger)' },
  COMPLETED: { from: 'var(--success)', to: 'color-mix(in oklab, var(--success) 70%, transparent)' },
  CANCELLED: { from: 'var(--ink-3)', to: 'var(--ink-4)' },
  NO_SHOW: { from: 'var(--danger)', to: 'color-mix(in oklab, var(--danger) 70%, transparent)' },
}

const headerStyle = computed(() => {
  if (!props.appointment) return {}
  const tone = STATUS_TONE[props.appointment.status] ?? STATUS_TONE.PENDING
  return {
    background: `linear-gradient(135deg, ${tone.from} 0%, ${tone.to} 100%)`,
  }
})

const canAct = computed(() => {
  if (!props.appointment) return false
  return ['PENDING', 'CONFIRMED', 'RISKY'].includes(props.appointment.status)
})

const canConfirm = computed(() => {
  const s = props.appointment?.status
  return s === 'PENDING' || s === 'RISKY'
})

const initial = computed(() => props.customerName.charAt(0).toUpperCase() || '?')

const formattedDate = computed(() => {
  if (!props.appointment) return ''
  const d = new Date(props.appointment.scheduledAt)
  return new Intl.DateTimeFormat('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
})

const formattedTime = computed(() => {
  if (!props.appointment) return ''
  return new Intl.DateTimeFormat('tr-TR', { timeStyle: 'short' }).format(
    new Date(props.appointment.scheduledAt),
  )
})

function statusLabel(status: AppointmentStatus): string {
  return t(`appointmentStatus.${status}`)
}

function isLoading(action: string): boolean {
  return props.actingId === props.appointment?.id && props.actingAction === action
}
</script>

<template>
  <aside class="detail-panel" :aria-label="t('appointmentsView.detail.title')">
    <button
      v-if="appointment"
      type="button"
      class="detail-panel__close"
      :aria-label="t('common.close')"
      @click="emit('close')"
    >
      <X class="size-4" aria-hidden="true" />
    </button>

    <div v-if="!appointment" class="detail-panel__empty">
      <CalendarClock class="size-10" aria-hidden="true" style="color: var(--ink-4)" />
      <p class="title" style="color: var(--ink-2)">
        {{ t('appointmentsView.detail.emptyTitle') }}
      </p>
      <p class="body-sm" style="color: var(--ink-4)">
        {{ t('appointmentsView.detail.emptyHint') }}
      </p>
    </div>

    <template v-else>
      <header class="detail-panel__header" :style="headerStyle">
        <div class="detail-panel__header-top">
          <StatusPill
            :status="appointment.status"
            :label="statusLabel(appointment.status)"
            size="sm"
          />
          <span v-if="customerHasNoShow" class="detail-panel__warning-tag">
            {{ t('appointmentsView.detail.requiresConfirm') }}
          </span>
        </div>

        <p class="detail-panel__time">{{ formattedTime }}</p>
        <p class="detail-panel__date">{{ formattedDate }}</p>
        <p class="detail-panel__duration">
          <Clock class="size-3.5" aria-hidden="true" />
          {{ t('appointmentsView.detail.durationMin', { n: appointment.durationMinutes }) }}
        </p>
      </header>

      <div class="detail-panel__body">
        <section class="detail-panel__customer">
          <div
            class="detail-panel__avatar"
            :style="{ background: employeeColor }"
            aria-hidden="true"
          >
            {{ initial }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="caption" style="color: var(--ink-4)">
              {{ t('appointmentsView.detail.customer') }}
            </p>
            <p class="title truncate" style="color: var(--ink-1)">{{ customerName }}</p>
            <a
              v-if="customerPhone"
              :href="`tel:${customerPhone}`"
              class="body-sm flex items-center gap-1.5 hover:underline"
              style="color: var(--primary)"
            >
              <Phone class="size-3.5" aria-hidden="true" />
              {{ customerPhone }}
            </a>
          </div>
        </section>

        <dl class="detail-panel__meta">
          <div class="detail-panel__meta-row">
            <dt>
              <UserCircle2 class="size-4" aria-hidden="true" />
              {{ t('appointmentsView.detail.employee') }}
            </dt>
            <dd>{{ employeeName }}</dd>
          </div>
          <div class="detail-panel__meta-row">
            <dt>
              <Scissors class="size-4" aria-hidden="true" />
              {{ t('appointmentsView.detail.service') }}
            </dt>
            <dd>{{ serviceName }}</dd>
          </div>
          <div v-if="appointment.source" class="detail-panel__meta-row">
            <dt>
              <Phone v-if="appointment.source === 'PHONE'" class="size-4" aria-hidden="true" />
              <MapPin v-else-if="appointment.source === 'WALK_IN'" class="size-4" aria-hidden="true" />
              <Globe v-else class="size-4" aria-hidden="true" />
              {{ t('appointmentsView.detail.source') }}
            </dt>
            <dd>{{ t(`appointmentsView.source.${appointment.source}`) }}</dd>
          </div>
        </dl>

        <section v-if="appointment.notes" class="detail-panel__notes">
          <p class="caption flex items-center gap-1.5" style="color: var(--ink-4)">
            <StickyNote class="size-3.5" aria-hidden="true" />
            {{ t('appointmentsView.detail.notes') }}
          </p>
          <p class="body-sm" style="color: var(--ink-2)">{{ appointment.notes }}</p>
        </section>
      </div>

      <footer v-if="canAct" class="detail-panel__actions">
        <AppButton
          v-if="canConfirm"
          variant="primary"
          size="sm"
          :loading="isLoading('confirm')"
          @click="emit('confirm', appointment.id)"
        >
          <Check class="size-4" aria-hidden="true" />
          {{ t('appointmentsView.action.confirm') }}
        </AppButton>
        <AppButton
          variant="primary"
          size="sm"
          :loading="isLoading('complete')"
          @click="emit('complete', appointment.id)"
        >
          <CheckCheck class="size-4" aria-hidden="true" />
          {{ t('appointmentsView.action.complete') }}
        </AppButton>
        <AppButton variant="secondary" size="sm" @click="emit('cancel', appointment)">
          <X class="size-4" aria-hidden="true" />
          {{ t('appointmentsView.action.cancel') }}
        </AppButton>
        <AppButton
          variant="danger"
          size="sm"
          :loading="isLoading('noshow')"
          @click="emit('noShow', appointment)"
        >
          <UserMinus class="size-4" aria-hidden="true" />
          {{ t('appointmentsView.action.noShow') }}
        </AppButton>
      </footer>
    </template>
  </aside>
</template>

<style scoped>
.detail-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--r-lg);
  overflow: hidden;
  box-shadow: var(--shadow-1);
  min-height: 360px;
}

.detail-panel__close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--r-full);
  border: 0;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  cursor: pointer;
  transition: background 0.15s ease;
}

.detail-panel__close:hover {
  background: rgba(255, 255, 255, 0.32);
}

.detail-panel__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px 24px;
  text-align: center;
  background: var(--surface-2);
}

.detail-panel__header {
  padding: 28px 24px 24px;
  color: #fff;
  position: relative;
}

.detail-panel__header-top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.detail-panel__warning-tag {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--r-full);
}

.detail-panel__time {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.5px;
}

.detail-panel__date {
  margin-top: 4px;
  font-size: 14px;
  opacity: 0.92;
  text-transform: capitalize;
}

.detail-panel__duration {
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.18);
  padding: 4px 10px;
  border-radius: var(--r-full);
}

.detail-panel__body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-panel__customer {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-panel__avatar {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: var(--r-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 18px;
}

.detail-panel__meta {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  border-top: 1px solid var(--hairline);
  padding-top: 16px;
}

.detail-panel__meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
}

.detail-panel__meta-row dt {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ink-4);
  font-weight: 500;
}

.detail-panel__meta-row dd {
  margin: 0;
  color: var(--ink-1);
  font-weight: 600;
  text-align: right;
}

.detail-panel__notes {
  border-top: 1px solid var(--hairline);
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px 24px 24px;
  border-top: 1px solid var(--hairline);
  background: var(--surface-2);
}
</style>
