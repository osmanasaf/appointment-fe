<template>
  <div class="verification-view">
    <div class="verification-card">
      <div class="icon-container">
        <Mail class="icon" aria-hidden="true" />
      </div>
      <h1 class="display-md">{{ t('auth.emailVerificationPending.title') }}</h1>
      <p class="body">{{ t('auth.emailVerificationPending.subtitle') }}</p>
      <p v-if="emailDisplay" class="email-display">{{ emailDisplay }}</p>

      <div v-if="showEmailField" class="email-field">
        <label :for="`pending-email-${uid}`" class="field-label">{{ t('auth.email') }}</label>
        <input
          :id="`pending-email-${uid}`"
          v-model="emailInput"
          type="email"
          autocomplete="email"
          class="field-input"
          :placeholder="t('auth.email')"
        />
      </div>

      <div class="otp-section">
        <label class="otp-label">{{ t('auth.emailVerificationPending.otpLabel') }}</label>
        <OtpInput
          ref="otpInputRef"
          v-model="otpCode"
          :error="!!otpError"
          :disabled="verifying"
          @complete="onOtpComplete"
        />
        <p v-if="otpError" class="field-error-center" role="alert">{{ otpError }}</p>
      </div>

      <div class="countdown-section">
        <p v-if="countdown > 0" class="countdown-text">
          {{ t('auth.emailVerificationPending.resendCountdown', { seconds: countdown }) }}
        </p>
        <button
          v-else
          type="button"
          :disabled="resendLoading || !canResend"
          class="resend-btn"
          @click="onResend"
        >
          <span v-if="resendLoading">{{ t('common.sending') }}</span>
          <span v-else>{{ t('auth.emailVerificationPending.resendButton') }}</span>
        </button>
      </div>

      <div v-if="banner" class="banner" :class="bannerOk ? 'banner--success' : 'banner--error'" role="status">
        {{ banner }}
      </div>

      <AppButton
        type="button"
        variant="primary"
        size="lg"
        :loading="verifying"
        :disabled="otpCode.length !== 6"
        class="submit-btn"
        @click="onVerify"
      >
        {{ verifying ? t('auth.emailVerificationPending.verifying') : t('auth.emailVerificationPending.verifyButton') }}
      </AppButton>

      <RouterLink to="/login" class="footer-link">
        {{ t('auth.backToLogin') }}
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Mail } from 'lucide-vue-next'
import axios from 'axios'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import type { ApiResponse } from '@/api/client'
import OtpInput from '@/components/auth/OtpInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const uid = Math.random().toString(36).slice(2, 9)

const emailFromQuery = computed(() => {
  const q = route.query.email
  return typeof q === 'string' ? q.trim() : ''
})

const emailInput = ref('')
watch(
  emailFromQuery,
  v => {
    if (v) emailInput.value = v
  },
  { immediate: true },
)

const showEmailField = computed(() => !emailFromQuery.value)

const effectiveEmail = computed(() => {
  const q = emailFromQuery.value
  if (q) return q
  return emailInput.value.trim()
})

const emailDisplay = computed(() => emailFromQuery.value || '')

const canResend = computed(() => {
  const e = effectiveEmail.value
  return e.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
})

const otpCode = ref('')
const otpError = ref('')
const otpInputRef = ref<InstanceType<typeof OtpInput> | null>(null)
const verifying = ref(false)

const resendLoading = ref(false)
const banner = ref('')
const bannerOk = ref(false)

const countdown = ref(60)
let countdownInterval: ReturnType<typeof setInterval> | null = null

const startCountdown = () => {
  countdown.value = 60
  if (countdownInterval) clearInterval(countdownInterval)
  countdownInterval = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0 && countdownInterval) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }
  }, 1000)
}

onMounted(() => {
  startCountdown()
})

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})

const onOtpComplete = (code: string) => {
  if (code.length === 6) {
    onVerify()
  }
}

async function onVerify() {
  if (otpCode.value.length !== 6 || !effectiveEmail.value) return
  
  verifying.value = true
  otpError.value = ''
  banner.value = ''
  
  try {
    const { data } = await authApi.verifyRegistrationOtp({
      email: effectiveEmail.value,
      otp: otpCode.value,
    })
    
    if (data.success && data.data) {
      auth.setAuth(data.data)
      await router.push('/admin')
    } else {
      otpError.value = data.error?.message || t('auth.emailVerificationPending.verificationFailedError')
      otpInputRef.value?.clear()
    }
  } catch (e: unknown) {
    if (axios.isAxiosError(e)) {
      const body = e.response?.data as ApiResponse<unknown> | undefined
      otpError.value = body?.error?.message || t('auth.emailVerificationPending.invalidCodeError')
    } else {
      otpError.value = t('common.errorOccurred')
    }
    otpInputRef.value?.clear()
  } finally {
    verifying.value = false
  }
}

async function onResend() {
  if (!canResend.value || countdown.value > 0) return
  
  resendLoading.value = true
  banner.value = ''
  otpError.value = ''
  
  try {
    const { data } = await authApi.resendRegistrationOtp({ email: effectiveEmail.value })
    if (data.success) {
      bannerOk.value = true
      banner.value = data.message ?? t('auth.emailVerificationPending.resendSuccess')
      startCountdown()
      otpInputRef.value?.clear()
    } else {
      bannerOk.value = false
      banner.value = data.error?.message ?? t('auth.emailVerificationPending.resendFailedError')
    }
  } catch (e: unknown) {
    bannerOk.value = false
    if (axios.isAxiosError(e)) {
      const body = e.response?.data as ApiResponse<unknown> | undefined
      banner.value = body?.error?.message ?? t('auth.emailVerificationPending.resendFailedError')
    } else {
      banner.value = t('auth.emailVerificationPending.resendFailedError')
    }
  } finally {
    resendLoading.value = false
  }
}
</script>

<style scoped>
.verification-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
  background: var(--bg);
}

.verification-card {
  width: 100%;
  max-width: 28rem;
  padding: 2rem;
  border: 0.5px solid var(--hairline);
  border-radius: var(--r-xl);
  background: var(--surface);
  box-shadow: var(--shadow-1);
}

.icon-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.icon-container .icon {
  width: 3.5rem;
  height: 3.5rem;
  padding: 1rem;
  border-radius: var(--r-lg);
  background: var(--primary-tint);
  color: var(--primary);
}

.display-md {
  text-align: center;
  color: var(--ink-1);
  margin: 0 0 0.75rem 0;
}

.body {
  text-align: center;
  color: var(--ink-3);
  line-height: 1.6;
  margin: 0 0 0.5rem 0;
}

.email-display {
  margin: 0 0 1.5rem 0;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary);
}

.email-field {
  margin: 1.5rem 0;
}

.field-label {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ink-2);
}

.field-input {
  width: 100%;
  padding: 0.625rem 1rem;
  border: 1px solid var(--hairline-strong);
  border-radius: var(--r-md);
  background: var(--surface);
  font-size: 0.875rem;
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

.otp-section {
  margin: 2rem 0;
}

.otp-label {
  display: block;
  margin-bottom: 0.75rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ink-2);
}

.field-error-center {
  margin-top: 0.75rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--danger);
}

.countdown-section {
  margin: 1.5rem 0;
  text-align: center;
}

.countdown-text {
  font-size: 0.875rem;
  color: var(--ink-3);
}

.countdown-time {
  font-weight: 500;
  color: var(--ink-2);
}

.resend-btn {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--primary);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s;
}

.resend-btn:hover:not(:disabled) {
  color: var(--primary-pressed);
}

.resend-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.banner {
  margin-bottom: 1.5rem;
  padding: 0.75rem 1rem;
  border-radius: var(--r-md);
  font-size: 0.875rem;
}

.banner--success {
  background: var(--success-tint);
  color: color-mix(in srgb, var(--success) 90%, var(--ink-1));
  border: 1px solid color-mix(in srgb, var(--success) 15%, transparent);
}

.banner--error {
  background: var(--danger-tint);
  color: color-mix(in srgb, var(--danger) 90%, var(--ink-1));
  border: 1px solid color-mix(in srgb, var(--danger) 15%, transparent);
}

.submit-btn {
  width: 100%;
}

.footer-link {
  display: block;
  margin-top: 1rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ink-3);
  text-decoration: none;
  transition: color 0.15s;
}

.footer-link:hover {
  color: var(--ink-1);
  text-decoration: underline;
  text-decoration-skip-ink: auto;
}
</style>
