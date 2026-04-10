<template>
  <div
    class="group relative flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
    :class="{ 'ring-2 ring-indigo-300': employee.status === 'ON_LEAVE' }"
  >
    <!-- Header -->
    <div class="flex items-start gap-3">
      <!-- Avatar -->
      <div
        class="flex size-11 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
        :class="avatarColor"
      >
        {{ initials }}
      </div>

      <!-- Info -->
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <span class="truncate font-semibold text-slate-900">{{ employee.name }}</span>
          <span v-if="employee.owner" class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            {{ t('employees.owner') }}
          </span>
        </div>
        <span v-if="employee.title" class="text-xs text-slate-500">{{ employee.title }}</span>
      </div>

      <!-- Status badge -->
      <span
        class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
        :class="statusClass"
      >
        {{ statusLabel }}
      </span>
    </div>

    <!-- Contact -->
    <p v-if="employee.phoneNumber || employee.email" class="truncate text-xs text-slate-500">
      <span v-if="employee.phoneNumber">{{ employee.phoneNumber }}</span>
      <span v-if="employee.phoneNumber && employee.email" class="mx-1 text-slate-300">·</span>
      <span v-if="employee.email">{{ employee.email }}</span>
    </p>

    <!-- Capability tags -->
    <div v-if="capabilities.length" class="flex flex-wrap gap-1.5">
      <span
        v-for="cap in visibleCaps"
        :key="cap.id"
        class="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
      >
        {{ cap.serviceName }}
      </span>
      <span v-if="hiddenCapsCount > 0" class="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-400">
        +{{ hiddenCapsCount }}
      </span>
    </div>

    <!-- Actions -->
    <div class="flex flex-wrap gap-1.5 pt-1">
      <AppButton variant="secondary" size="sm" @click="$emit('edit', employee)">
        {{ t('employees.edit') }}
      </AppButton>
      <AppButton variant="secondary" size="sm" @click="$emit('send-invite', employee)">
        {{ t('employees.sendInvite') }}
      </AppButton>
      <AppButton variant="secondary" size="sm" @click="$emit('add-leave', employee)">
        {{ t('employees.addLeave') }}
      </AppButton>
      <AppButton
        v-if="employee.status === 'ACTIVE'"
        variant="secondary"
        size="sm"
        :loading="statusLoading"
        @click="$emit('deactivate', employee.id)"
      >
        {{ t('employees.deactivate') }}
      </AppButton>
      <AppButton
        v-else-if="employee.status === 'INACTIVE'"
        variant="primary"
        size="sm"
        :loading="statusLoading"
        @click="$emit('activate', employee.id)"
      >
        {{ t('employees.activate') }}
      </AppButton>
      <AppButton
        v-if="employee.status === 'ACTIVE' && !employee.owner"
        variant="secondary"
        size="sm"
        @click="$emit('offboard', employee)"
      >
        {{ t('employees.offboard') }}
      </AppButton>
      <AppButton
        v-if="!employee.owner"
        variant="danger"
        size="sm"
        @click="$emit('delete', employee)"
      >
        {{ t('employees.delete') }}
      </AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '../ui/AppButton.vue'
import type { EmployeeCapabilityResponse, EmployeeResponse } from '../../api/employee'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    employee: EmployeeResponse
    capabilities?: EmployeeCapabilityResponse[]
    statusLoading?: boolean
  }>(),
  { capabilities: () => [], statusLoading: false },
)

defineEmits<{
  edit: [employee: EmployeeResponse]
  'send-invite': [employee: EmployeeResponse]
  'add-leave': [employee: EmployeeResponse]
  activate: [id: number]
  deactivate: [id: number]
  offboard: [employee: EmployeeResponse]
  delete: [employee: EmployeeResponse]
}>()

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-pink-500', 'bg-teal-500',
  'bg-orange-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-rose-500',
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

const statusClass = computed(() => {
  if (props.employee.status === 'ACTIVE') return 'bg-emerald-100 text-emerald-700'
  if (props.employee.status === 'ON_LEAVE') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-500'
})

const statusLabel = computed(() => {
  if (props.employee.status === 'ACTIVE') return t('employees.active')
  if (props.employee.status === 'ON_LEAVE') return t('employees.onLeave')
  return t('employees.inactive')
})

const visibleCaps = computed(() => props.capabilities.slice(0, 3))
const hiddenCapsCount = computed(() => Math.max(0, props.capabilities.length - 3))
</script>
