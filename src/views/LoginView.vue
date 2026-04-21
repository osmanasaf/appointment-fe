<template>
  <AuthSplitLayout>
    <div class="login-form-header">
      <h1 class="display-md">{{ t('auth.loginTitle') }}</h1>
      <p class="body">{{ t('auth.loginSubtitle') }}</p>
    </div>

    <form class="auth-form" novalidate @submit.prevent="onSubmit">
      <div class="form-field">
        <label :for="`login-email-${uid}`" class="field-label">{{ t('auth.login.emailLabel') }}</label>
        <div class="field-input-wrapper">
          <Mail class="field-icon" aria-hidden="true" />
          <input
            :id="`login-email-${uid}`"
            v-model="email"
            v-bind="emailAttrs"
            type="email"
            autocomplete="email"
            placeholder="ornek@sirket.com"
            class="field-input"
            :class="{ 'field-input--error': !!errors.email }"
          />
        </div>
        <p v-if="errors.email" class="field-error" role="alert">
          <AlertCircle class="size-3.5" aria-hidden="true" />
          {{ errors.email }}
        </p>
      </div>

      <div class="form-field">
        <label :for="`login-password-${uid}`" class="field-label">{{ t('auth.login.passwordLabel') }}</label>
        <div class="field-input-wrapper">
          <Lock class="field-icon" aria-hidden="true" />
          <input
            :id="`login-password-${uid}`"
            v-model="password"
            v-bind="passwordAttrs"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="••••••••"
            class="field-input"
            :class="{ 'field-input--error': !!errors.password }"
          />
          <button
            type="button"
            class="field-toggle-btn"
            :aria-label="showPassword ? t('auth.hidePassword') : t('auth.showPassword')"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" class="size-4" />
            <Eye v-else class="size-4" />
          </button>
        </div>
        <p v-if="errors.password" class="field-error" role="alert">
          <AlertCircle class="size-3.5" aria-hidden="true" />
          {{ errors.password }}
        </p>
      </div>

      <div class="form-actions">
        <RouterLink to="/forgot-password" class="forgot-link">
          {{ t('auth.login.forgot') }}
        </RouterLink>
      </div>

      <div v-if="submitError" class="submit-error" role="alert">
        <div class="submit-error-content">
          <AlertCircle class="size-4" aria-hidden="true" />
          {{ submitError }}
        </div>
        <RouterLink
          v-if="emailNotVerified"
          :to="{ path: '/auth/pending-verification', query: { email: lastAttemptEmail } }"
          class="submit-error-link"
        >
          {{ t('auth.resendVerificationLink') }}
        </RouterLink>
      </div>

      <AppButton type="submit" variant="primary" size="lg" :loading="loading" class="submit-btn">
        {{ loading ? t('auth.signingIn') : t('auth.login.submit') }}
      </AppButton>
    </form>

    <div class="divider" role="separator" aria-orientation="horizontal">
      <span class="divider-text">{{ t('auth.login.orDivider') }}</span>
    </div>

    <AppButton variant="ghost" size="lg" class="invite-btn">
      <QrCode class="size-4" aria-hidden="true" />
      {{ t('auth.login.inviteSignIn') }}
    </AppButton>

    <p class="footer-text">
      {{ t('auth.login.noAccount') }}
      <RouterLink to="/register" class="footer-link">
        {{ t('auth.login.signupLink') }}
      </RouterLink>
    </p>
  </AuthSplitLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import { Mail, Lock, Eye, EyeOff, AlertCircle, QrCode } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import type { ApiResponse } from '@/api/client'
import { normalizeApiError } from '@/utils/apiError'
import AuthSplitLayout from '@/components/auth/AuthSplitLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const uid = Math.random().toString(36).slice(2, 9)

const showPassword = ref(false)
const loading = ref(false)
const submitError = ref('')
const emailNotVerified = ref(false)
const lastAttemptEmail = ref('')

const validationSchema = computed(() =>
  toTypedSchema(
    z.object({
      email: z.string().min(1, t('auth.emailRequired')).email(t('auth.emailInvalid')),
      password: z.string().min(1, t('auth.passwordRequired')),
    }),
  ),
)

const { handleSubmit, errors, defineField } = useForm({
  validationSchema,
  initialValues: { email: '', password: '' },
})

const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')

const onSubmit = handleSubmit(async values => {
  loading.value = true
  submitError.value = ''
  emailNotVerified.value = false
  lastAttemptEmail.value = values.email.trim()
  try {
    await auth.login({ email: values.email.trim(), password: values.password })
    const redirect = (route.query.redirect as string) || '/admin'
    await router.push(redirect)
  } catch (e: unknown) {
    const normalized = normalizeApiError(e, t('auth.loginFailed'))
    
    if (normalized.code === 'EMAIL_NOT_VERIFIED') {
      emailNotVerified.value = true
      submitError.value = normalized.message
      return
    }
    
    submitError.value = normalized.message
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.login-form-header {
  margin-bottom: 2rem;
}

.login-form-header .display-md {
  color: var(--ink-1);
  margin-bottom: 0.375rem;
}

.login-form-header .body {
  color: var(--ink-3);
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ink-2);
}

.field-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.field-icon {
  position: absolute;
  left: 0.875rem;
  width: 1rem;
  height: 1rem;
  color: var(--ink-4);
  pointer-events: none;
}

.field-input {
  width: 100%;
  padding: 0.625rem 0.875rem 0.625rem 2.5rem;
  border: 1px solid var(--hairline-strong);
  border-radius: var(--r-md);
  background: var(--surface);
  font-size: 0.875rem;
  color: var(--ink-1);
  transition: border-color 0.15s, box-shadow 0.15s, background-color 0.15s;
}

.field-input::placeholder {
  color: var(--ink-4);
}

.field-input:hover:not(:disabled) {
  background: var(--bg);
}

.field-input:focus {
  outline: none;
  border-color: var(--primary);
  background: var(--surface);
  box-shadow: 0 0 0 3px var(--primary-tint);
}

.field-input--error {
  border-color: var(--danger);
  background: var(--danger-tint);
}

.field-input--error:focus {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--danger) 20%, transparent);
}

.field-toggle-btn {
  position: absolute;
  right: 0.75rem;
  padding: 0.25rem;
  border: none;
  background: none;
  color: var(--ink-4);
  cursor: pointer;
  border-radius: var(--r-sm);
  transition: color 0.15s;
}

.field-toggle-btn:hover {
  color: var(--ink-2);
}

.field-error {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--danger);
  margin: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.forgot-link {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--primary);
  text-decoration: none;
  transition: color 0.15s;
}

.forgot-link:hover {
  color: var(--primary-pressed);
}

.submit-error {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid color-mix(in srgb, var(--danger) 15%, transparent);
  border-radius: var(--r-md);
  background: var(--danger-tint);
  font-size: 0.875rem;
  color: color-mix(in srgb, var(--danger) 90%, var(--ink-1));
}

.submit-error-content {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
}

.submit-error-link {
  margin-left: 1.625rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: color-mix(in srgb, var(--primary) 85%, var(--danger));
  text-decoration: none;
  text-decoration-skip-ink: auto;
}

.submit-error-link:hover {
  text-decoration: underline;
}

.submit-btn {
  width: 100%;
}

.divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1.25rem 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--hairline);
}

.divider-text {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--ink-4);
}

.invite-btn {
  width: 100%;
}

.footer-text {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--ink-3);
}

.footer-link {
  font-weight: 600;
  color: var(--primary);
  text-decoration: none;
  transition: color 0.15s;
}

.footer-link:hover {
  color: var(--primary-pressed);
}
</style>
