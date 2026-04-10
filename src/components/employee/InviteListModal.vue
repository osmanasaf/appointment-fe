<template>
  <AppModal
    v-model:visible="localVisible"
    :title="t('employees.inviteListTitle')"
    max-width="800px"
  >
    <div v-if="loading" class="py-8 text-center">
      <p class="text-sm text-slate-500">{{ t('common.loading') }}...</p>
    </div>

    <div v-else-if="error" class="py-8 text-center">
      <p class="text-sm text-red-600">{{ error }}</p>
      <button @click="loadInvites" class="mt-3 text-sm text-indigo-600 hover:underline">
        {{ t('common.retry') }}
      </button>
    </div>

    <div v-else-if="invites.length === 0" class="py-8 text-center">
      <p class="text-sm text-slate-500">{{ t('employees.noInvites') }}</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="invite in invites"
        :key="invite.id"
        class="rounded-lg border p-4"
        :class="invite.status === 'PENDING' ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-white'"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-slate-900">{{ invite.employeeName }}</span>
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="statusClass(invite.status)"
              >
                {{ statusLabel(invite.status) }}
              </span>
            </div>
            <p class="mt-1 text-sm text-slate-600">{{ invite.email }}</p>
            <div class="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
              <span>{{ t('employees.createdAt') }}: {{ formatDate(invite.createdAt) }}</span>
              <span v-if="invite.status === 'PENDING'">
                {{ t('employees.expiresAt') }}: {{ formatDate(invite.expiresAt) }}
              </span>
              <span v-if="invite.usedAt">
                {{ t('employees.usedAt') }}: {{ formatDate(invite.usedAt) }}
              </span>
            </div>
            <div v-if="invite.status === 'PENDING'" class="mt-2">
              <button
                @click="copyInviteLink(invite.token)"
                class="text-xs text-indigo-600 hover:underline"
              >
                {{ t('employees.copyInviteLink') }}
              </button>
            </div>
          </div>

          <button
            v-if="invite.status === 'PENDING'"
            @click="confirmCancel(invite)"
            :disabled="cancelling === invite.id"
            class="text-sm text-red-600 hover:underline disabled:opacity-50"
          >
            {{ cancelling === invite.id ? t('common.cancelling') : t('common.cancel') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="cancelError" class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
      {{ cancelError }}
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '../ui/AppModal.vue'
import { employeeInviteApi, type EmployeeInviteResponse, type InviteStatus } from '@/api/employeeInvite'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const localVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const loading = ref(false)
const error = ref<string | null>(null)
const invites = ref<EmployeeInviteResponse[]>([])
const cancelling = ref<number | null>(null)
const cancelError = ref<string | null>(null)

watch(() => props.visible, (visible) => {
  if (visible) {
    loadInvites()
  }
})

async function loadInvites() {
  loading.value = true
  error.value = null
  
  try {
    const { data } = await employeeInviteApi.list()
    if (data.success && data.data) {
      invites.value = data.data
    }
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || t('common.errorOccurred')
  } finally {
    loading.value = false
  }
}

function statusClass(status: InviteStatus): string {
  switch (status) {
    case 'PENDING':
      return 'bg-indigo-100 text-indigo-700'
    case 'USED':
      return 'bg-emerald-100 text-emerald-700'
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-600'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

function statusLabel(status: InviteStatus): string {
  return t(`employees.inviteStatus.${status}`)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function copyInviteLink(token: string) {
  const url = `${window.location.origin}/register-employee?token=${token}`
  navigator.clipboard.writeText(url)
    .then(() => alert(t('employees.linkCopied')))
    .catch(() => alert(t('employees.linkCopyFailed')))
}

async function confirmCancel(invite: EmployeeInviteResponse) {
  if (!confirm(t('employees.cancelInviteConfirm', { email: invite.email }))) return
  
  cancelling.value = invite.id
  cancelError.value = null
  
  try {
    const { data } = await employeeInviteApi.cancel(invite.id)
    if (data.success) {
      await loadInvites()
    }
  } catch (err: any) {
    cancelError.value = err.response?.data?.error?.message || t('common.errorOccurred')
  } finally {
    cancelling.value = null
  }
}
</script>
