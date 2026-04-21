<template>
  <div class="employee-register-view">
    <div class="register-card">
      <div class="card-header">
        <h1 class="display-md">{{ t('auth.registerEmployee.title') }}</h1>
        <p class="body">{{ t('auth.registerEmployee.subtitle') }}</p>
        <p v-if="businessName" class="business-hint">
          {{ t('auth.inviteBusinessLabel', { name: businessName }) }}
        </p>
      </div>

      <div v-if="inviteToken && invitePreviewLoading" class="status-message">
        <span class="spinner" aria-hidden="true" />
        <p>{{ t('auth.loadingInvite') }}</p>
      </div>

      <div v-else-if="inviteToken && invitePreviewError" class="error-message" role="alert">
        <AlertCircle class="size-5" aria-hidden="true" />
        <p>{{ invitePreviewError }}</p>
      </div>

      <div v-else-if="!inviteToken && submitError" class="error-message" role="alert">
        <AlertCircle class="size-5" aria-hidden="true" />
        <p>{{ submitError }}</p>
      </div>

      <form
        v-else-if="inviteToken && invitePreviewReady"
        class="register-form"
        @submit.prevent="handleSubmit"
      >
        <div class="form-field">
          <label :for="`emp-name-${uid}`" class="field-label">{{ t('auth.name') }}</label>
          <input
            :id="`emp-name-${uid}`"
            v-model="form.name"
            type="text"
            :placeholder="t('auth.name')"
            readonly
            required
            class="field-input field-input--readonly"
            autocomplete="name"
          />
          <p class="field-hint">{{ t('auth.inviteFieldsReadOnly') }}</p>
          <span v-if="errors.name" class="field-error" role="alert">{{ errors.name }}</span>
        </div>

        <div class="form-field">
          <label :for="`emp-email-${uid}`" class="field-label">{{ t('auth.email') }}</label>
          <input
            :id="`emp-email-${uid}`"
            v-model="form.email"
            type="email"
            :placeholder="t('auth.email')"
            readonly
            required
            class="field-input field-input--readonly"
            autocomplete="email"
          />
          <span v-if="errors.email" class="field-error" role="alert">{{ errors.email }}</span>
        </div>

        <div class="form-field">
          <label :for="`emp-password-${uid}`" class="field-label">{{ t('auth.password') }}</label>
          <input
            :id="`emp-password-${uid}`"
            v-model="form.password"
            type="password"
            :placeholder="t('auth.password')"
            required
            class="field-input"
            autocomplete="new-password"
          />
          <p class="field-hint">{{ t('auth.passwordHelp') }}</p>
          <span v-if="errors.password" class="field-error" role="alert">{{ errors.password }}</span>
        </div>

        <div class="form-field">
          <label :for="`emp-confirm-password-${uid}`" class="field-label">
            {{ t('auth.register.confirmPasswordLabel') }}
          </label>
          <input
            :id="`emp-confirm-password-${uid}`"
            v-model="form.confirmPassword"
            type="password"
            :placeholder="t('auth.register.confirmPasswordLabel')"
            required
            class="field-input"
            autocomplete="new-password"
          />
          <span v-if="errors.confirmPassword" class="field-error" role="alert">
            {{ errors.confirmPassword }}
          </span>
        </div>

        <div class="form-field">
          <label :for="`emp-phone-${uid}`" class="field-label">{{ t('auth.phoneOptional') }}</label>
          <input
            :id="`emp-phone-${uid}`"
            v-model="form.phoneNumber"
            type="tel"
            :placeholder="t('auth.phoneOptional')"
            class="field-input"
            autocomplete="tel"
          />
          <span v-if="errors.phoneNumber" class="field-error" role="alert">
            {{ errors.phoneNumber }}
          </span>
        </div>

        <div v-if="submitError" class="submit-error" role="alert">
          <AlertCircle class="size-4" aria-hidden="true" />
          {{ submitError }}
        </div>

        <div class="terms-box">
          <div class="terms-content">
            <input
              :id="`emp-terms-${uid}`"
              v-model="termsAccepted"
              type="checkbox"
              class="terms-checkbox"
            />
            <label :for="`emp-terms-${uid}`" class="terms-label">
              <i18n-t keypath="auth.termsAgreementFull" tag="span">
                <template #terms>
                  <RouterLink to="/terms" target="_blank" class="terms-link">{{ t('auth.termsLink') }}</RouterLink>
                </template>
                <template #privacy>
                  <RouterLink to="/privacy" target="_blank" class="terms-link">{{ t('auth.privacyLink') }}</RouterLink>
                </template>
              </i18n-t>
            </label>
          </div>
          <p v-if="termsError" class="field-error" role="alert">{{ termsError }}</p>
        </div>

        <AppButton type="submit" variant="primary" size="lg" :loading="loading" class="submit-btn">
          {{ loading ? t('auth.signingUp') : t('auth.signUp') }}
        </AppButton>
      </form>

      <div class="footer-text">
        {{ t('auth.hasAccount') }}
        <RouterLink to="/login" class="footer-link">{{ t('auth.loginLink') }}</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AlertCircle } from 'lucide-vue-next'
import { authApi } from '@/api/auth'
import AppButton from '@/components/ui/AppButton.vue'
import { extractApiError } from '@/utils/apiError'
import { registerEmployeeSchema } from '@/validation/schemas'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const uid = Math.random().toString(36).slice(2, 9)

const loading = ref(false)
const submitError = ref<string | null>(null)
const inviteToken = ref<string>('')
const invitePreviewLoading = ref(false)
const invitePreviewError = ref<string | null>(null)
const invitePreviewReady = ref(false)
const businessName = ref<string | null>(null)
const termsAccepted = ref(false)
const termsError = ref<string>('')

const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phoneNumber: '',
})

const errors = ref<Record<string, string>>({})

onMounted(async () => {
  inviteToken.value = (route.query.token as string) || ''
  if (!inviteToken.value) {
    submitError.value = t('auth.inviteTokenMissing')
    return
  }
  invitePreviewLoading.value = true
  invitePreviewError.value = null
  try {
    const { data } = await authApi.getEmployeeInvitePreview(inviteToken.value)
    if (data.success && data.data) {
      form.value.name = data.data.employeeName
      form.value.email = data.data.email
      businessName.value = data.data.businessName
      invitePreviewReady.value = true
    } else {
      invitePreviewError.value = t('auth.invitePreviewFailed')
    }
  } catch (err: unknown) {
    const msg =
      (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
        ?.message
    invitePreviewError.value = msg || t('auth.invitePreviewFailed')
  } finally {
    invitePreviewLoading.value = false
  }
})

function validateForm(): boolean {
  errors.value = {}
  const result = registerEmployeeSchema.safeParse({
    ...form.value,
    inviteToken: inviteToken.value,
  })
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path[0]
      if (typeof key === 'string') {
        errors.value[key] = issue.message
      }
    }
    return false
  }
  return true
}

async function handleSubmit() {
  if (!invitePreviewReady.value && inviteToken.value) {
    submitError.value = t('auth.invitePreviewFailed')
    return
  }
  if (!validateForm()) return
  
  termsError.value = ''
  if (!termsAccepted.value) {
    termsError.value = t('auth.termsRequired')
    return
  }
  
  if (!inviteToken.value) {
    submitError.value = t('auth.inviteTokenMissing')
    return
  }
  
  loading.value = true
  submitError.value = null
  
  try {
    const { data } = await authApi.registerEmployee({
      name: form.value.name,
      email: form.value.email,
      password: form.value.password,
      phoneNumber: form.value.phoneNumber || undefined,
      inviteToken: inviteToken.value,
    })
    
    if (data.success) {
      router.push({ name: 'Login', query: { registered: '1' } })
    }
  } catch (err: unknown) {
    submitError.value = extractApiError(err, t('auth.registerFailed'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.employee-register-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: var(--bg);
}

.register-card {
  width: 100%;
  max-width: 480px;
  background: var(--surface);
  border: 0.5px solid var(--hairline);
  border-radius: var(--r-xl);
  padding: 2.5rem;
  box-shadow: var(--shadow-2);
}

.card-header {
  margin-bottom: 2rem;
}

.card-header .display-md {
  color: var(--ink-1);
  margin: 0 0 0.5rem 0;
  text-align: center;
}

.card-header .body {
  color: var(--ink-3);
  text-align: center;
  margin: 0 0 1rem 0;
}

.business-hint {
  text-align: center;
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ink-2);
}

.status-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
  color: var(--ink-3);
  font-size: 0.875rem;
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid var(--primary-tint);
  border-top-color: var(--primary);
  border-radius: 9999px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  border: 1px solid color-mix(in srgb, var(--danger) 15%, transparent);
  border-radius: var(--r-md);
  background: var(--danger-tint);
  text-align: center;
  color: color-mix(in srgb, var(--danger) 90%, var(--ink-1));
  font-size: 0.875rem;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ink-2);
}

.field-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--hairline-strong);
  border-radius: var(--r-md);
  background: var(--surface);
  font-size: 1rem;
  color: var(--ink-1);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field-input::placeholder {
  color: var(--ink-4);
}

.field-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-tint);
}

.field-input--readonly {
  background: var(--bg-subtle);
  color: var(--ink-2);
  cursor: default;
}

.field-hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--ink-4);
}

.field-error {
  font-size: 0.75rem;
  color: var(--danger);
}

.submit-error {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  border: 1px solid color-mix(in srgb, var(--danger) 15%, transparent);
  border-radius: var(--r-md);
  background: var(--danger-tint);
  font-size: 0.875rem;
  color: color-mix(in srgb, var(--danger) 90%, var(--ink-1));
}

.terms-box {
  padding: 1rem;
  border: 1px solid var(--hairline);
  border-radius: var(--r-md);
  background: var(--surface-2);
}

.terms-content {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
}

.terms-checkbox {
  margin-top: 0.125rem;
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  cursor: pointer;
  accent-color: var(--primary);
}

.terms-label {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--ink-2);
  cursor: pointer;
}

.terms-link {
  font-weight: 500;
  color: var(--primary);
  text-decoration: none;
  transition: color 0.15s;
}

.terms-link:hover {
  color: var(--primary-pressed);
  text-decoration: underline;
}

.submit-btn {
  width: 100%;
}

.footer-text {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.875rem;
  color: var(--ink-3);
}

.footer-link {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.15s;
}

.footer-link:hover {
  color: var(--primary-pressed);
  text-decoration: underline;
}
</style>
