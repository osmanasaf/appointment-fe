<template>
  <AppModal
    v-model:visible="localVisible"
    :title="t('employees.inviteListTitle')"
    :dialog-style="{ width: 'min(50rem, 95vw)' }"
    :closable="true"
  >
    <!-- Header actions -->
    <template #headerActions>
      <AppButton variant="primary" size="sm" @click="showSendInvite">
        <Plus :size="14" />
        {{ t('employees.sendInvite') }}
      </AppButton>
    </template>

    <div v-if="loading" class="py-12 text-center">
      <p class="text-sm" :style="{ color: 'var(--ink-3)' }">{{ t('common.loading') }}...</p>
    </div>

    <div v-else-if="error" class="py-12 text-center">
      <p class="text-sm" :style="{ color: 'var(--danger)' }">{{ error }}</p>
      <AppButton variant="secondary" size="sm" class="mt-3" @click="loadInvites">
        {{ t('common.retry') }}
      </AppButton>
    </div>

    <div v-else-if="invites.length === 0" class="py-12 text-center">
      <p class="text-sm" :style="{ color: 'var(--ink-3)' }">{{ t('employees.noInvites') }}</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="invite in invites"
        :key="invite.id"
        class="invite-card"
        :class="{ 'invite-card--pending': invite.status === 'PENDING' }"
      >
        <div class="invite-card__header">
          <div class="invite-card__info">
            <div class="invite-card__name-row">
              <span class="invite-card__name">{{ invite.employeeName }}</span>
              <span
                class="invite-status-pill"
                :class="statusClass(invite.status)"
              >
                {{ statusLabel(invite.status) }}
              </span>
            </div>
            <p class="invite-card__email">{{ invite.email }}</p>
            <div class="invite-card__meta">
              <span>{{ t('employees.createdAt') }}: {{ formatDate(invite.createdAt) }}</span>
              <span v-if="invite.status === 'PENDING'">
                {{ t('employees.expiresAt') }}: {{ formatDate(invite.expiresAt) }}
              </span>
              <span v-if="invite.usedAt">
                {{ t('employees.usedAt') }}: {{ formatDate(invite.usedAt) }}
              </span>
            </div>
          </div>

          <div class="invite-card__actions">
            <AppButton
              v-if="invite.status === 'PENDING'"
              variant="ghost"
              size="sm"
              @click="copyInviteLink(invite.token)"
            >
              {{ t('employees.copyInviteLink') }}
            </AppButton>
            <AppButton
              v-if="invite.status === 'PENDING'"
              variant="ghost"
              size="sm"
              :loading="cancelling === invite.id"
              :disabled="cancelling === invite.id"
              @click="confirmCancel(invite)"
            >
              {{ t('common.cancel') }}
            </AppButton>
          </div>
        </div>
      </div>
    </div>

    <div v-if="cancelError" class="mt-4 error-alert">
      {{ cancelError }}
    </div>

    <!-- Send Invite Modal -->
    <SendInviteModal
      v-model:visible="sendInviteVisible"
      :employee="selectedEmployee"
      :employees="employees ?? []"
      @invited="onInviteSent"
    />
  </AppModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus } from 'lucide-vue-next'
import AppModal from '../ui/AppModal.vue'
import AppButton from '../ui/AppButton.vue'
import SendInviteModal from './SendInviteModal.vue'
import { employeeInviteApi, type EmployeeInviteResponse, type InviteStatus } from '@/api/employeeInvite'
import type { EmployeeResponse } from '@/api/employee'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const toast = useToast()

const props = defineProps<{
  visible: boolean
  employees?: EmployeeResponse[]
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
const sendInviteVisible = ref(false)
const selectedEmployee = ref<EmployeeResponse | null>(null)

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
      return 'invite-status-pill--pending'
    case 'USED':
      return 'invite-status-pill--used'
    case 'CANCELLED':
      return 'invite-status-pill--cancelled'
    default:
      return 'invite-status-pill--cancelled'
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
    .then(() => toast.success(t('employees.linkCopied')))
    .catch(() => toast.error(t('employees.linkCopyFailed')))
}

async function confirmCancel(invite: EmployeeInviteResponse) {
  if (!confirm(t('employees.cancelInviteConfirm', { email: invite.email }))) return
  
  cancelling.value = invite.id
  cancelError.value = null
  
  try {
    const { data } = await employeeInviteApi.cancel(invite.id)
    if (data.success) {
      await loadInvites()
      toast.success(t('employees.inviteCancelled'))
    }
  } catch (err: any) {
    cancelError.value = err.response?.data?.error?.message || t('common.errorOccurred')
  } finally {
    cancelling.value = null
  }
}

function showSendInvite() {
  const activeEmployees = (props.employees ?? []).filter(e => e.status === 'ACTIVE')
  if (activeEmployees.length === 0) {
    toast.error(t('employees.noActiveEmployees'))
    return
  }
  selectedEmployee.value = activeEmployees[0]
  sendInviteVisible.value = true
}

function onInviteSent() {
  loadInvites()
}
</script>

<style scoped>
.invite-card {
  padding: 1.25rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--hairline);
  background: var(--surface);
  transition: all 0.15s;
}

.invite-card--pending {
  border-color: color-mix(in oklab, var(--primary) 30%, var(--hairline));
  background: color-mix(in oklab, var(--primary) 3%, var(--surface));
}

.invite-card__header {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  align-items: flex-start;
}

.invite-card__info {
  flex: 1;
  min-width: 0;
}

.invite-card__name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.invite-card__name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--ink-1);
}

.invite-card__email {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--ink-3);
}

.invite-card__meta {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: var(--ink-4);
}

.invite-card__actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.invite-status-pill {
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.invite-status-pill--pending {
  background: color-mix(in oklab, var(--primary) 15%, transparent);
  color: var(--primary);
}

.invite-status-pill--used {
  background: var(--success-tint);
  color: var(--success);
}

.invite-status-pill--cancelled {
  background: var(--surface-2);
  color: var(--ink-4);
}

.error-alert {
  padding: 0.75rem;
  border-radius: var(--radius-md);
  background: var(--danger-tint);
  border: 1px solid color-mix(in oklab, var(--danger) 30%, transparent);
  color: var(--danger);
  font-size: 0.875rem;
}
</style>
