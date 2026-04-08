<template>
  <AppModal
    :visible="visible"
    :title="t('leaveConflict.title', { count: preview?.totalCount ?? 0 })"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="space-y-4">
      <!-- Conflict list -->
      <ul class="divide-y divide-slate-100 rounded-xl border border-slate-200">
        <li
          v-for="appt in preview?.conflictingAppointments ?? []"
          :key="appt.id"
          class="flex items-center justify-between gap-2 px-3 py-2.5"
        >
          <span class="text-sm text-slate-700">{{ formatAppt(appt) }}</span>
          <span
            class="rounded-full px-2 py-0.5 text-xs font-medium"
            :class="statusClass(appt.status)"
          >
            {{ t(`appointmentStatus.${appt.status}`) }}
          </span>
        </li>
      </ul>

      <!-- Action selection -->
      <div class="space-y-2">
        <p class="text-sm font-medium text-slate-700">{{ t('leaveConflict.chooseAction') }}</p>
        <label class="flex cursor-pointer items-center gap-2.5">
          <input v-model="action" type="radio" value="CANCEL_ALL" class="text-indigo-500" />
          <span class="text-sm text-slate-700">{{ t('employees.cancelAll') }}</span>
        </label>
        <label class="flex cursor-pointer items-center gap-2.5">
          <input v-model="action" type="radio" value="REASSIGN_ALL" class="text-indigo-500" />
          <span class="text-sm text-slate-700">{{ t('employees.reassignAll') }}</span>
        </label>
      </div>

      <!-- Reassign target -->
      <div v-if="action === 'REASSIGN_ALL'" class="space-y-1">
        <label class="block text-sm font-medium text-slate-700" for="conflict-reassign">
          {{ t('employees.selectEmployee') }}
        </label>
        <select id="conflict-reassign" v-model.number="newEmployeeId" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
          <option :value="0">{{ t('employees.selectEmployee') }}</option>
          <option v-for="emp in otherEmployees" :key="emp.id" :value="emp.id">{{ emp.name }}</option>
        </select>
      </div>

      <p v-if="error" class="text-sm text-red-500" role="alert">{{ error }}</p>
    </div>

    <template #footer>
      <AppButton variant="secondary" @click="$emit('update:visible', false)">{{ t('common.cancel') }}</AppButton>
      <AppButton
        variant="primary"
        :disabled="action === 'REASSIGN_ALL' && !newEmployeeId"
        :loading="resolving"
        @click="resolve"
      >
        {{ t('leaveConflict.confirm') }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '../ui/AppModal.vue'
import AppButton from '../ui/AppButton.vue'
import type { ConflictingAppointment, EmployeeResponse, LeaveConflictAction, LeaveConflictPreviewResponse } from '../../api/employee'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  preview: LeaveConflictPreviewResponse | null
  otherEmployees: EmployeeResponse[]
}>()

const emit = defineEmits<{
  'update:visible': [boolean]
  resolve: [action: LeaveConflictAction, newEmployeeId?: number]
}>()

const action = ref<LeaveConflictAction>('CANCEL_ALL')
const newEmployeeId = ref(0)
const resolving = ref(false)
const error = ref<string | null>(null)

function resolve() {
  if (action.value === 'REASSIGN_ALL' && !newEmployeeId.value) return
  emit('resolve', action.value, action.value === 'REASSIGN_ALL' ? newEmployeeId.value : undefined)
}

function formatAppt(appt: ConflictingAppointment) {
  const d = new Date(appt.scheduledAt)
  return d.toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })
}

function statusClass(status: string) {
  if (status === 'CONFIRMED') return 'bg-emerald-100 text-emerald-700'
  if (status === 'PENDING') return 'bg-blue-100 text-blue-700'
  return 'bg-slate-100 text-slate-500'
}
</script>

