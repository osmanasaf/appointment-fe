<template>
  <form class="space-y-4" @submit.prevent="submit">
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="space-y-1 sm:col-span-2">
        <label class="form-label" for="pf-name">{{ t('employees.name') }} *</label>
        <input
          id="pf-name"
          v-model="form.name"
          class="form-input"
          :class="{ 'form-input-error': fieldErrors.name }"
          type="text"
          required
          minlength="2"
          maxlength="100"
        />
        <p v-if="fieldErrors.name" class="form-error">{{ fieldErrors.name }}</p>
      </div>

      <div class="space-y-1">
        <label class="form-label" for="pf-title">{{ t('employees.titleLabel') }}</label>
        <input
          id="pf-title"
          v-model="form.title"
          class="form-input"
          type="text"
          maxlength="120"
        />
      </div>

      <div class="space-y-1">
        <label class="form-label" for="pf-exp">{{ t('employees.experienceYears') }}</label>
        <input
          id="pf-exp"
          v-model.number="form.experienceYears"
          class="form-input"
          type="number"
          min="0"
          max="80"
        />
      </div>

      <div class="space-y-1">
        <label class="form-label" for="pf-phone">{{ t('employees.phone') }}</label>
        <input
          id="pf-phone"
          v-model="form.phoneNumber"
          class="form-input"
          :class="{ 'form-input-error': fieldErrors.phoneNumber }"
          type="tel"
          inputmode="numeric"
          autocomplete="tel-national"
          maxlength="10"
          @input="onPhoneInput"
          @paste="onPhonePaste"
        />
        <p v-if="fieldErrors.phoneNumber" class="form-error">{{ fieldErrors.phoneNumber }}</p>
      </div>

      <div class="space-y-1">
        <label class="form-label" for="pf-email">{{ t('employees.email') }}</label>
        <input
          id="pf-email"
          v-model="form.email"
          class="form-input"
          :class="{ 'form-input-error': fieldErrors.email }"
          type="email"
          inputmode="email"
          autocomplete="email"
          @blur="touchEmail"
          @input="onEmailInput"
        />
        <p v-if="fieldErrors.email" class="form-error">{{ fieldErrors.email }}</p>
      </div>

      <div class="space-y-1 sm:col-span-2">
        <label class="form-label" for="pf-bio">{{ t('employees.bio') }}</label>
        <textarea
          id="pf-bio"
          v-model="form.bio"
          class="form-input"
          rows="3"
          maxlength="500"
        />
      </div>

      <div class="space-y-1 sm:col-span-2">
        <label class="form-label" for="pf-img">{{ t('employees.profileImageUrl') }}</label>
        <input
          id="pf-img"
          v-model="form.profileImageUrl"
          class="form-input"
          type="url"
        />
      </div>
    </div>

    <div class="flex flex-col gap-3 pt-1">
      <AppCheckbox v-model="form.acceptsOnlineBooking" :label="t('employees.acceptsOnlineBooking')" />
      <AppCheckbox v-if="isCreate" v-model="form.owner" :label="t('employees.ownerCheck')" />
    </div>

    <p v-if="error" class="text-sm" :style="{ color: 'var(--danger)' }" role="alert">{{ error }}</p>

    <div class="flex justify-end gap-2 pt-2">
      <AppButton variant="primary" native-type="submit" :loading="saving">
        {{ t('common.save') }}
      </AppButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '../../ui/AppButton.vue'
import AppCheckbox from '../../ui/AppCheckbox.vue'
import { employeeApi, type EmployeeResponse } from '../../../api/employee'
import { createEmployeeSchema, updateEmployeeSchema } from '../../../validation/schemas'
import {
  validatePhoneField,
  validateEmailField,
  fieldErrorI18nKey,
  sanitizeLocalPhoneInput,
  applyPhoneInputMask,
} from '../../../utils/fieldValidators'

const { t } = useI18n()

const props = defineProps<{
  employee?: EmployeeResponse
  businessId: number
  isCreate?: boolean
}>()

const emit = defineEmits<{
  saved: [employee: EmployeeResponse]
}>()

const saving = ref(false)
const error = ref<string | null>(null)

const form = reactive({
  name: props.employee?.name ?? '',
  title: props.employee?.title ?? '',
  phoneNumber: sanitizeLocalPhoneInput(props.employee?.phoneNumber ?? ''),
  email: props.employee?.email ?? '',
  bio: props.employee?.bio ?? '',
  profileImageUrl: props.employee?.profileImageUrl ?? '',
  experienceYears: props.employee?.experienceYears ?? undefined as number | undefined,
  acceptsOnlineBooking: props.employee?.acceptsOnlineBooking ?? true,
  owner: props.employee?.owner ?? false,
})

watch(() => props.employee, (e) => {
  if (!e) return
  Object.assign(form, {
    name: e.name,
    title: e.title ?? '',
    phoneNumber: sanitizeLocalPhoneInput(e.phoneNumber ?? ''),
    email: e.email ?? '',
    bio: e.bio ?? '',
    profileImageUrl: e.profileImageUrl ?? '',
    experienceYears: e.experienceYears ?? undefined,
    acceptsOnlineBooking: e.acceptsOnlineBooking,
    owner: e.owner,
  })
})

const fieldErrors = reactive<Record<string, string>>({})
const touched = reactive<Record<string, boolean>>({})

function checkPhone(): boolean {
  if (!form.phoneNumber) {
    fieldErrors.phoneNumber = ''
    return true
  }
  const r = validatePhoneField(form.phoneNumber, { required: false })
  fieldErrors.phoneNumber = r.errorKey ? t(fieldErrorI18nKey('phone', r.errorKey)) : ''
  return r.valid
}

function checkEmail(): boolean {
  const r = validateEmailField(form.email, { required: false })
  fieldErrors.email = r.errorKey ? t(fieldErrorI18nKey('email', r.errorKey)) : ''
  return r.valid
}

function onPhoneInput(event: Event) {
  form.phoneNumber = applyPhoneInputMask(event)
  checkPhone()
}

function onPhonePaste(event: ClipboardEvent) {
  const pasted = event.clipboardData?.getData('text') ?? ''
  if (!pasted) return
  event.preventDefault()
  const sanitized = sanitizeLocalPhoneInput(pasted)
  form.phoneNumber = sanitized
  const target = event.target as HTMLInputElement | null
  if (target) target.value = sanitized
  checkPhone()
}

function touchEmail() {
  touched.email = true
  checkEmail()
}

function onEmailInput() {
  if (touched.email) checkEmail()
}

function validate(): boolean {
  Object.keys(fieldErrors).forEach((key) => { fieldErrors[key] = '' })
  const schema = props.isCreate ? createEmployeeSchema : updateEmployeeSchema
  const phoneDigits = form.phoneNumber.replaceAll(/\D/g, '')
  const result = schema.safeParse({
    name: form.name,
    title: form.title || undefined,
    phoneNumber: phoneDigits || undefined,
    email: form.email || undefined,
    bio: form.bio || undefined,
    experienceYears: form.experienceYears,
    acceptsOnlineBooking: form.acceptsOnlineBooking,
    owner: form.owner,
  })
  if (result.success) return true
  for (const issue of result.error.issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !fieldErrors[key]) {
      fieldErrors[key] = issue.message
    }
  }
  return false
}

async function submit() {
  error.value = null
  if (!validate()) {
    error.value = Object.values(fieldErrors).find(Boolean) ?? null
    return
  }
  saving.value = true
  try {
    let result: EmployeeResponse
    if (props.isCreate) {
      const res = await employeeApi.create({
        name: form.name,
        title: form.title || undefined,
        phoneNumber: form.phoneNumber || undefined,
        email: form.email || undefined,
        bio: form.bio || undefined,
        owner: form.owner,
      })
      result = res.data.data!
    } else {
      const res = await employeeApi.update(props.employee!.id, {
        name: form.name,
        title: form.title || undefined,
        phoneNumber: form.phoneNumber || undefined,
        email: form.email || undefined,
        bio: form.bio || undefined,
        profileImageUrl: form.profileImageUrl || undefined,
        experienceYears: form.experienceYears,
        acceptsOnlineBooking: form.acceptsOnlineBooking,
      })
      result = res.data.data!
    }
    emit('saved', result)
  } catch {
    error.value = t('common.error')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
/* Form styling */
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

textarea.form-input {
  resize: vertical;
  min-height: 4rem;
}
</style>