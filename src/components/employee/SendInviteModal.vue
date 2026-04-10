<template>
  <AppModal
    v-model:visible="localVisible"
    :title="t('employees.sendInviteTitle')"
    max-width="500px"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="form-group">
        <label class="label">{{ t('employees.employeeName') }}</label>
        <input
          type="text"
          :value="employee?.name"
          disabled
          class="input-disabled"
        />
      </div>

      <div class="form-group">
        <label for="email" class="label">{{ t('auth.email') }}</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          class="input"
          :placeholder="t('auth.email')"
          required
        />
        <span v-if="errors.email" class="error">{{ errors.email }}</span>
      </div>

      <p v-if="submitError" class="error-box">{{ submitError }}</p>
      <p v-if="successMessage" class="success-box">{{ successMessage }}</p>

      <div class="flex justify-end gap-2">
        <button
          type="button"
          @click="localVisible = false"
          class="btn-secondary"
          :disabled="loading"
        >
          {{ t('common.cancel') }}
        </button>
        <button
          type="submit"
          :disabled="loading"
          class="btn-primary"
        >
          {{ loading ? t('employees.sendingInvite') : t('employees.sendInvite') }}
        </button>
      </div>
    </form>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '../ui/AppModal.vue'
import { employeeInviteApi } from '@/api/employeeInvite'
import type { EmployeeResponse } from '@/api/employee'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  employee: EmployeeResponse | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  invited: []
}>()

const localVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const form = ref({
  email: '',
})

const errors = ref<Record<string, string>>({})
const loading = ref(false)
const submitError = ref<string | null>(null)
const successMessage = ref<string | null>(null)

watch(() => props.visible, (visible) => {
  if (visible && props.employee) {
    form.value.email = props.employee.email || ''
    errors.value = {}
    submitError.value = null
    successMessage.value = null
  }
})

function validateForm(): boolean {
  errors.value = {}
  
  if (!form.value.email || !/\S+@\S+\.\S+/.test(form.value.email)) {
    errors.value.email = t('auth.emailInvalid')
  }
  
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validateForm() || !props.employee) return
  
  loading.value = true
  submitError.value = null
  successMessage.value = null
  
  try {
    const { data } = await employeeInviteApi.create({
      employeeId: props.employee.id,
      email: form.value.email,
    })
    
    if (data.success) {
      successMessage.value = t('employees.inviteSent')
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
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.input,
.input-disabled {
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.input-disabled {
  background: #f3f4f6;
  color: #6b7280;
  cursor: not-allowed;
}

.error {
  font-size: 0.75rem;
  color: #ef4444;
}

.error-box {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.success-box {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #6366f1;
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: #4f46e5;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background: #f9fafb;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
