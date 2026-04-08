<template>
  <div class="space-y-5">
    <!-- Add leave form -->
    <div class="rounded-xl border border-slate-200 p-4">
      <h3 class="mb-4 text-sm font-semibold text-slate-700">{{ t('leave.newLeave') }}</h3>
      <div class="grid gap-3 sm:grid-cols-2">
        <div class="space-y-1">
          <label class="block text-sm font-medium text-slate-700" for="lv-start">{{ t('leave.startDate') }} *</label>
          <input id="lv-start" v-model="form.startDate" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" type="date" :min="today" required />
        </div>
        <div class="space-y-1">
          <label class="block text-sm font-medium text-slate-700" for="lv-end">{{ t('leave.endDate') }} *</label>
          <input id="lv-end" v-model="form.endDate" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" type="date" :min="form.startDate || today" required />
        </div>
        <div class="space-y-1 sm:col-span-2">
          <label class="block text-sm font-medium text-slate-700">{{ t('leave.type') }} *</label>
          <select v-model="form.leaveType" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
            <option v-for="lt in leaveTypes" :key="lt" :value="lt">{{ t(`leaveType.${lt}`) }}</option>
          </select>
        </div>
        <div class="space-y-1 sm:col-span-2">
          <label class="block text-sm font-medium text-slate-700" for="lv-reason">{{ t('leave.reason') }}</label>
          <input id="lv-reason" v-model="form.reason" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" type="text" maxlength="500" />
        </div>
      </div>

      <!-- Conflict warning -->
      <div
        v-if="conflictPreview && conflictPreview.hasConflicts"
        class="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3"
      >
        <svg class="mt-0.5 size-4 shrink-0 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
        </svg>
        <div class="flex-1">
          <p class="text-sm font-medium text-amber-800">
            {{ t('leave.conflictWarning', { count: conflictPreview.totalCount }) }}
          </p>
          <AppButton variant="ghost" size="sm" class="mt-1 text-amber-700 underline" @click="$emit('show-conflicts', conflictPreview)">
            {{ t('leave.viewConflicts') }}
          </AppButton>
        </div>
      </div>

      <div class="mt-4 flex justify-end gap-2">
        <AppButton
          variant="secondary"
          size="sm"
          :loading="conflictLoading"
          @click="checkConflicts"
        >
          {{ t('leave.checkConflicts') }}
        </AppButton>
        <AppButton
          variant="primary"
          size="sm"
          :loading="loading"
          @click="submit"
        >
          {{ t('leave.createLeave') }}
        </AppButton>
      </div>
      <p v-if="formError" class="mt-2 text-sm text-red-500" role="alert">{{ formError }}</p>
    </div>

    <!-- Leave list -->
    <div>
      <h3 class="mb-2 text-sm font-semibold text-slate-700">{{ t('leave.history') }}</h3>
      <div v-if="loading && leaves.length === 0" class="space-y-2">
        <div v-for="i in 3" :key="i" class="h-12 animate-pulse rounded-lg bg-slate-100" />
      </div>
      <p v-else-if="leaves.length === 0" class="text-sm text-slate-400">{{ t('leave.noLeaves') }}</p>
      <ul v-else class="divide-y divide-slate-100 rounded-xl border border-slate-200">
        <li
          v-for="leave in leaves"
          :key="leave.id"
          class="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
        >
          <div class="space-y-0.5">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-slate-800">{{ formatDateRange(leave) }}</span>
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="leave.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
              >
                {{ t(`leaveStatus.${leave.status}`) }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                {{ t(`leaveType.${leave.leaveType}`) }}
              </span>
              <span v-if="leave.reason" class="text-xs text-slate-400">{{ leave.reason }}</span>
            </div>
          </div>
          <AppButton
            v-if="leave.status === 'ACTIVE' && !isPast(leave.endDate)"
            variant="danger"
            size="sm"
            :loading="cancellingId === leave.id"
            @click="cancelLeave(leave.id)"
          >
            {{ t('leave.cancel') }}
          </AppButton>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '../../ui/AppButton.vue'
import { useEmployeeLeave } from '../../../composables/useEmployeeLeave'
import type { LeaveConflictPreviewResponse, LeaveType } from '../../../api/employee'

const { t } = useI18n()

const props = defineProps<{ employeeId: number }>()
const emit = defineEmits<{ 'show-conflicts': [preview: LeaveConflictPreviewResponse] }>()

const LEAVE_TYPES: LeaveType[] = ['ANNUAL', 'SICK', 'UNPAID', 'OTHER']
const leaveTypes = LEAVE_TYPES

const today = new Date().toISOString().slice(0, 10)

const { leaves, loading, conflictPreview, conflictLoading, loadLeaves, previewConflicts, createLeave, cancelLeave: doCancel } = useEmployeeLeave(props.employeeId)

const cancellingId = ref<number | null>(null)
const formError = ref<string | null>(null)

const form = reactive({
  startDate: '',
  endDate: '',
  leaveType: 'ANNUAL' as LeaveType,
  reason: '',
})

onMounted(loadLeaves)

async function checkConflicts() {
  if (!form.startDate || !form.endDate) return
  formError.value = null
  await previewConflicts({ startDate: form.startDate, endDate: form.endDate, leaveType: form.leaveType })
}

async function submit() {
  if (!form.startDate || !form.endDate) {
    formError.value = t('leave.dateRequired')
    return
  }
  formError.value = null
  const result = await createLeave({
    startDate: form.startDate,
    endDate: form.endDate,
    leaveType: form.leaveType,
    reason: form.reason || undefined,
  })
  if (result) {
    form.startDate = ''
    form.endDate = ''
    form.reason = ''
  } else {
    formError.value = t('common.error')
  }
}

async function cancelLeave(leaveId: number) {
  cancellingId.value = leaveId
  await doCancel(leaveId)
  cancellingId.value = null
}

function formatDateRange(leave: { startDate: string; endDate: string; fullDay: boolean; startTime: string | null; endTime: string | null }) {
  if (leave.startDate === leave.endDate) {
    const date = leave.startDate
    if (!leave.fullDay && leave.startTime && leave.endTime) {
      return `${date} ${leave.startTime.slice(0, 5)} – ${leave.endTime.slice(0, 5)}`
    }
    return date
  }
  return `${leave.startDate} – ${leave.endDate}`
}

function isPast(dateStr: string) {
  return dateStr < today
}
</script>

