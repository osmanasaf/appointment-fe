<template>
  <div
    class="employee-card"
    :class="{ 'employee-card--inactive': employee.status !== 'ACTIVE' }"
  >
    <!-- Header: avatar + name/role + toggle + menu -->
    <div class="employee-card__header">
      <div
        class="employee-card__avatar"
        :class="avatarColor"
      >
        {{ initials }}
      </div>
      <div class="employee-card__info">
        <div class="employee-card__name-row">
          <span class="employee-card__name">{{ employee.name }}</span>
        </div>
        <div v-if="employee.title" class="employee-card__role">{{ employee.title }}</div>
      </div>
      
      <!-- Active/Inactive Toggle -->
      <button
        v-if="!employee.owner"
        type="button"
        class="status-toggle"
        :class="{ 'status-toggle--active': employee.status === 'ACTIVE', 'status-toggle--loading': statusLoading }"
        :disabled="statusLoading || employee.status === 'ON_LEAVE'"
        @click.stop="toggleStatus"
      >
        <span class="status-toggle__label">
          {{ employee.status === 'ACTIVE' ? t('employees.active') : t('employees.inactive') }}
        </span>
      </button>
      <div v-else class="owner-badge">
        {{ t('employees.owner') }}
      </div>

      <div class="employee-card__more">
        <button
          type="button"
          class="more-btn"
          :aria-label="t('common.moreActions')"
          @click.stop="toggleMenu"
        >
          <MoreHorizontal :size="14" aria-hidden="true" />
        </button>
        <div v-if="menuOpen" class="employee-more-menu" role="menu" @click="menuOpen = false">
          <button type="button" role="menuitem" class="menu-item" @click="$emit('edit', employee)">
            {{ t('employees.edit') }}
          </button>
          <button type="button" role="menuitem" class="menu-item" @click="$emit('send-invite', employee)">
            {{ t('employees.sendInvite') }}
          </button>
          <button type="button" role="menuitem" class="menu-item" @click="$emit('add-leave', employee)">
            {{ t('employees.addLeave') }}
          </button>
          <button
            v-if="employee.status === 'ACTIVE' && !employee.owner"
            type="button"
            role="menuitem"
            class="menu-item"
            @click="$emit('offboard', employee)"
          >
            {{ t('employees.offboard') }}
          </button>
          <button
            v-if="!employee.owner"
            type="button"
            role="menuitem"
            class="menu-item menu-item--danger"
            @click="$emit('delete', employee)"
          >
            {{ t('employees.delete') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Stats section -->
    <div class="employee-card__stats">
      <div class="stat-item">
        <div class="stat-value">{{ todayAppointments ?? 0 }}</div>
        <div class="stat-label">{{ t('employees.stats.todayAppointments') }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ capabilities.length }}</div>
        <div class="stat-label">{{ t('employees.stats.services') }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-value stat-value--status" :class="statusValueClass">{{ statusLabel }}</div>
        <div class="stat-label">{{ t('employees.stats.status') }}</div>
      </div>
    </div>

    <!-- Capability tags -->
    <div v-if="capabilities.length" class="employee-card__caps">
      <span
        v-for="cap in visibleCaps"
        :key="cap.id"
        class="cap-chip"
      >
        {{ cap.serviceName }}
      </span>
      <span v-if="hiddenCapsCount > 0" class="cap-chip cap-chip--more">
        +{{ hiddenCapsCount }}
      </span>
    </div>
    <div v-else class="employee-card__caps-empty">
      {{ t('employees.noServices') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { MoreHorizontal } from 'lucide-vue-next'
import type { EmployeeCapabilityResponse, EmployeeResponse } from '../../api/employee'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    employee: EmployeeResponse
    capabilities?: EmployeeCapabilityResponse[]
    statusLoading?: boolean
    todayAppointments?: number
  }>(),
  { capabilities: () => [], statusLoading: false, todayAppointments: 0 },
)

const emit = defineEmits<{
  edit: [employee: EmployeeResponse]
  'send-invite': [employee: EmployeeResponse]
  'add-leave': [employee: EmployeeResponse]
  activate: [id: number]
  deactivate: [id: number]
  offboard: [employee: EmployeeResponse]
  delete: [employee: EmployeeResponse]
}>()

const menuOpen = ref(false)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function toggleStatus() {
  if (props.employee.status === 'ACTIVE') {
    emit('deactivate', props.employee.id)
  } else if (props.employee.status === 'INACTIVE') {
    emit('activate', props.employee.id)
  }
}

const AVATAR_COLORS = [
  'employee-card__avatar--tone-0',
  'employee-card__avatar--tone-1',
  'employee-card__avatar--tone-2',
  'employee-card__avatar--tone-3',
  'employee-card__avatar--tone-4',
  'employee-card__avatar--tone-5',
  'employee-card__avatar--tone-6',
  'employee-card__avatar--tone-7',
]

const initials = computed(() =>
  props.employee.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join(''),
)

const avatarColor = computed(() => {
  const idx = props.employee.id % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
})

const statusLabel = computed(() => {
  if (props.employee.status === 'ACTIVE') return t('employees.active')
  if (props.employee.status === 'ON_LEAVE') return t('employees.onLeave')
  return t('employees.inactive')
})

const statusValueClass = computed(() => {
  if (props.employee.status === 'ACTIVE') return 'stat-value--active'
  if (props.employee.status === 'ON_LEAVE') return 'stat-value--leave'
  return 'stat-value--inactive'
})

const visibleCaps = computed(() => props.capabilities.slice(0, 4))
const hiddenCapsCount = computed(() => Math.max(0, props.capabilities.length - 4))
</script>

<style scoped>
.employee-card {
  position: relative;
  padding: 1.25rem;
  border-radius: var(--radius-xl);
  border: 1px solid var(--hairline);
  background: var(--surface);
  box-shadow: var(--shadow-1);
  transition: box-shadow 0.15s, opacity 0.15s;
}

.employee-card:hover {
  box-shadow: var(--shadow-2);
}

.employee-card--inactive {
  opacity: 0.65;
}

.employee-card__header {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
}

.employee-card__avatar {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.employee-card__avatar--tone-0 {
  background: var(--primary);
}

.employee-card__avatar--tone-1 {
  background: var(--niche-tattoo);
}

.employee-card__avatar--tone-2 {
  background: color-mix(in oklab, var(--danger) 78%, var(--surface));
}

.employee-card__avatar--tone-3 {
  background: color-mix(in oklab, var(--success) 75%, var(--ink-3));
}

.employee-card__avatar--tone-4 {
  background: var(--warning);
  color: var(--ink-1);
}

.employee-card__avatar--tone-5 {
  background: color-mix(in oklab, var(--primary) 55%, var(--success) 45%);
}

.employee-card__avatar--tone-6 {
  background: var(--success);
}

.employee-card__avatar--tone-7 {
  background: color-mix(in oklab, var(--danger) 65%, var(--primary));
}

.employee-card__info {
  flex: 1;
  min-width: 0;
}

.employee-card__name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.employee-card__name {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--ink-1);
  line-height: 1.3;
}

.employee-card__role {
  font-size: 0.8125rem;
  color: var(--ink-3);
  margin-top: 0.125rem;
}

/* ── Status Toggle ──────────────────────────────────────────────────────── */

.status-toggle {
  padding: 0.25rem 0.75rem;
  border: none;
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.status-toggle--active {
  background: var(--success-tint);
  color: var(--success);
}

.status-toggle--active:hover:not(:disabled) {
  background: color-mix(in oklab, var(--success-tint) 80%, var(--success));
}

.status-toggle:not(.status-toggle--active) {
  background: var(--surface-2);
  color: var(--ink-4);
}

.status-toggle:not(.status-toggle--active):hover:not(:disabled) {
  background: color-mix(in oklab, var(--surface-2) 70%, var(--ink-4));
  color: var(--ink-3);
}

.status-toggle--loading {
  opacity: 0.6;
  cursor: wait;
}

.status-toggle:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.owner-badge {
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  background: var(--warning-tint);
  color: var(--warning);
  flex-shrink: 0;
}

.status-pill {
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.status-pill--active {
  background: var(--success-tint);
  color: var(--success);
}

.status-pill--inactive {
  background: var(--surface-2);
  color: var(--ink-4);
}

.employee-card__more {
  position: relative;
  flex-shrink: 0;
}

.more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--ink-3);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.more-btn:hover {
  background: var(--surface-2);
  color: var(--ink-1);
}

.employee-more-menu {
  position: absolute;
  top: calc(100% + 0.25rem);
  right: 0;
  min-width: 12rem;
  padding: 0.25rem;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 10;
}

.menu-item {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: none;
  background: transparent;
  color: var(--ink-2);
  font-size: 0.875rem;
  text-align: left;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.menu-item:hover {
  background: var(--surface-2);
  color: var(--ink-1);
}

.menu-item--danger {
  color: var(--danger);
}

.menu-item--danger:hover {
  background: var(--danger-tint);
  color: var(--danger);
}

/* ── Stats Section ──────────────────────────────────────────────────────── */

.employee-card__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.625rem;
  margin-top: 1.125rem;
  padding: 0.875rem 0;
  border-top: 0.5px solid var(--hairline);
  border-bottom: 0.5px solid var(--hairline);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 700;
  color: var(--ink-1);
}

.stat-value--status {
  font-family: inherit;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-full);
  display: inline-block;
}

.stat-value--active {
  background: var(--success-tint);
  color: var(--success);
}

.stat-value--leave {
  background: var(--warning-tint);
  color: var(--warning);
}

.stat-value--inactive {
  background: var(--surface-2);
  color: var(--ink-4);
}

.stat-label {
  font-size: 0.65625rem;
  color: var(--ink-4);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-top: 0.125rem;
}

/* ── Capabilities ────────────────────────────────────────────────────────── */

.employee-card__caps {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.75rem;
}

.cap-chip {
  padding: 0.1875rem 0.625rem;
  background: var(--surface-2);
  border-radius: var(--radius-md);
  font-size: 0.71875rem;
  font-weight: 500;
  color: var(--ink-2);
}

.cap-chip--more {
  color: var(--ink-4);
}

.employee-card__caps-empty {
  margin-top: 0.75rem;
  font-size: 0.8125rem;
  color: var(--ink-4);
  font-style: italic;
}
</style>
