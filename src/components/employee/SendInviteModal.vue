<template>
  <AppModal
    v-model:visible="localVisible"
    :title="t('employees.sendInviteTitle')"
    :dialog-style="{ width: 'min(32rem, 95vw)' }"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div v-if="lockedEmployee" class="space-y-1">
        <label class="form-label">{{ t('employees.employeeName') }}</label>
        <div class="locked-employee">
          <div class="locked-employee__avatar">{{ employeeInitials }}</div>
          <div class="locked-employee__name">{{ lockedEmployee.name }}</div>
        </div>
      </div>

      <div v-else class="space-y-1">
        <label class="form-label" for="emp-select">{{ t('employees.selectEmployee') }}</label>
        <select
          id="emp-select"
          v-model="selectedEmployeeId"
          class="form-input"
          required
        >
          <option v-if="activeEmployees.length === 0" :value="null" disabled>
            {{ t('employees.noActiveEmployees') }}
          </option>
          <option
            v-for="emp in activeEmployees"
            :key="emp.id"
            :value="emp.id"
          >
            {{ emp.name }}
          </option>
        </select>
      </div>

      <div class="space-y-1">
        <label for="email" class="form-label">{{ t('employees.email') }}</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          class="form-input"
          :class="{ 'form-input-error': errors.email }"
          :placeholder="t('employees.emailPlaceholder')"
          required
          @blur="touchEmail"
          @input="onEmailInput"
        />
        <p v-if="errors.email" class="form-error">{{ errors.email }}</p>
      </div>

      <p v-if="submitError" class="text-sm" :style="{ color: 'var(--danger)' }" role="alert">
        {{ submitError }}
      </p>
      <p v-if="successMessage" class="text-sm" :style="{ color: 'var(--success)' }" role="alert">
        {{ successMessage }}
      </p>
    </form>

    <template #footer>
      <AppButton variant="secondary" @click="localVisible = false" :disabled="loading">
        {{ t('common.cancel') }}
      </AppButton>
      <AppButton variant="primary" :loading="loading" @click="handleSubmit">
        {{ t('employees.sendInvite') }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '../ui/AppModal.vue'
import AppButton from '../ui/AppButton.vue'
import { employeeInviteApi } from '@/api/employeeInvite'
import { useToast } from '@/composables/useToast'
import type { EmployeeResponse } from '@/api/employee'
import { validateEmailField, fieldErrorI18nKey } from '@/utils/fieldValidators'

const { t } = useI18n()
const toast = useToast()

const props = defineProps<{
  visible: boolean
  employee: EmployeeResponse | null
  employees?: EmployeeResponse[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  invited: []
}>()

const localVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const selectedEmployeeId = ref<number | null>(null)

const form = ref({
  email: '',
})

const errors = ref<Record<string, string>>({})
const loading = ref(false)
const submitError = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const activeEmployees = computed(() =>
  (props.employees ?? []).filter((e) => e.status === 'ACTIVE'),
)

const lockedEmployee = computed(() => props.employee)

const employeeInitials = computed(() => {
  const name = props.employee?.name?.trim() ?? ''
  if (!name) return '?'
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
})

watch([() => props.visible, () => props.employee, () => props.employees], ([visible, employee, employees]) => {
  if (visible) {
    const actives = (employees ?? []).filter((e) => e.status === 'ACTIVE')
    selectedEmployeeId.value = employee?.id ?? (actives[0]?.id ?? null)
    form.value.email = employee?.email ?? actives.find(e => e.id === selectedEmployeeId.value)?.email ?? ''
    errors.value = {}
    emailTouched.value = false
    submitError.value = null
    successMessage.value = null
  }
}, { immediate: true })

watch(selectedEmployeeId, (empId) => {
  if (!empId || !props.visible) return
  const emp = activeEmployees.value.find(e => e.id === empId)
  if (emp) {
    form.value.email = emp.email || ''
  }
})

const emailTouched = ref(false)

function checkEmail(): boolean {
  const result = validateEmailField(form.value.email, { required: true })
  if (result.errorKey) {
    errors.value = { ...errors.value, email: t(fieldErrorI18nKey('email', result.errorKey)) }
    return false
  }
  const next = { ...errors.value }
  delete next.email
  errors.value = next
  return true
}

function touchEmail() {
  emailTouched.value = true
  checkEmail()
}

function onEmailInput() {
  if (!emailTouched.value) return
  checkEmail()
}

function validateForm(): boolean {
  emailTouched.value = true
  return checkEmail()
}

async function handleSubmit() {
  if (!validateForm() || !selectedEmployeeId.value) return
  
  loading.value = true
  submitError.value = null
  successMessage.value = null
  
  try {
    const { data } = await employeeInviteApi.create({
      employeeId: selectedEmployeeId.value,
      email: form.value.email,
    })
    
    if (data.success) {
      successMessage.value = t('employees.inviteSent')
      toast.success(t('employees.inviteSent'))
      emit('invited')
      setTimeout(() => {
        localVisible.value = false
      }, 1500)
    }
  } catch (err: any) {
    submitError.value = err.response?.data?.error?.message || t('common.errorOccurred')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ink-2);
  margin-bottom: 0.25rem;
}

.form-input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--ink-1);
  font-size: 0.9375rem;
  font-family: inherit;
  transition: border-color 0.12s, box-shadow 0.12s;
}

.form-input::placeholder {
  color: var(--ink-4);
}

.form-input:hover:not(:disabled) {
  border-color: var(--ink-3);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary) 12%, transparent);
}

select.form-input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2.5rem;
}

.locked-employee {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  background: color-mix(in oklab, var(--surface) 50%, var(--surface-hover, #f8fafc));
}

.locked-employee__avatar {
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: color-mix(in oklab, var(--primary) 12%, transparent);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.8125rem;
  letter-spacing: 0.02em;
}

.locked-employee__name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--ink-1);
}

.form-input-error {
  border-color: var(--danger) !important;
}

.form-input-error:focus {
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--danger) 12%, transparent) !important;
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--surface-2);
}

.form-error {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--danger);
}
</style>
