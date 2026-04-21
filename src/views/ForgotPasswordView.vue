<template>
  <div class="forgot-password-view">
    <div class="forgot-card">
      <!-- Step 1: Email girişi -->
      <template v-if="currentStep === 'email'">
        <div class="icon-container">
          <KeyRound class="icon" aria-hidden="true" />
        </div>
        <h1 class="display-md">{{ t('auth.forgot.title') }}</h1>
        <p class="body">{{ t('auth.forgot.subtitle') }}</p>

        <form class="forgot-form" @submit.prevent="onSendOtp">
          <div class="form-field">
            <label :for="`forgot-email-${uid}`" class="field-label">{{ t('auth.forgot.emailLabel') }}</label>
            <div class="field-input-wrapper">
              <Mail class="field-icon" aria-hidden="true" />
              <input
                :id="`forgot-email-${uid}`"
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="ornek@sirket.com"
                class="field-input"
                :class="{ 'field-input--error': emailError }"
              />
            </div>
            <p v-if="emailError" class="field-error" role="alert">{{ emailError }}</p>
          </div>

          <div v-if="banner" class="banner" :class="bannerOk ? 'banner--success' : 'banner--error'" role="status">
            {{ banner }}
          </div>

          <AppButton type="submit" variant="primary" size="lg" :loading="loading" class="submit-btn">
            {{ loading ? t('common.sending') : t('auth.forgot.submit') }}
          </AppButton>
        </form>
      </template>

      <!-- Step 2: OTP girişi -->
      <template v-else-if="currentStep === 'otp'">
        <div class="icon-container">
          <ShieldCheck class="icon" aria-hidden="true" />
        </div>
        <h1 class="display-md">{{ t('auth.forgot.otpTitle') }}</h1>
        <p class="body">
          <span class="email-highlight">{{ t('auth.forgot.otpSubtitle', { email }) }}</span>
        </p>

        <div class="otp-section">
          <OtpInput
            ref="otpInputRef"
            v-model="otpCode"
            :error="!!otpError"
            :disabled="loading"
            @complete="onVerifyOtp"
          />
          <p v-if="otpError" class="field-error-center" role="alert">{{ otpError }}</p>
        </div>

        <div class="countdown-section">
          <p v-if="countdown > 0" class="countdown-text">
            {{ t('auth.forgot.resendCountdown', { seconds: countdown }) }}
          </p>
          <button
            v-else
            type="button"
            :disabled="loading"
            class="resend-btn"
            @click="onResendOtp"
          >
            {{ t('auth.forgot.resendButton') }}
          </button>
        </div>

        <AppButton
          type="button"
          variant="primary"
          size="lg"
          :loading="loading"
          :disabled="otpCode.length !== 6"
          class="submit-btn"
          @click="onVerifyOtp"
        >
          {{ loading ? t('auth.forgot.verifying') : t('auth.forgot.verifyButton') }}
        </AppButton>

        <button type="button" class="back-link" @click="currentStep = 'email'">
          {{ t('auth.forgot.backButton') }}
        </button>
      </template>

      <!-- Step 3: Yeni şifre -->
      <template v-else-if="currentStep === 'password'">
        <div class="icon-container icon-container--success">
          <Lock class="icon" aria-hidden="true" />
        </div>
        <h1 class="display-md">{{ t('auth.forgot.resetTitle') }}</h1>
        <p class="body">{{ t('auth.forgot.resetSubtitle') }}</p>

        <form class="forgot-form" @submit.prevent="onResetPassword">
          <div class="form-field">
            <label :for="`new-password-${uid}`" class="field-label">{{ t('auth.forgot.passwordLabel') }}</label>
            <div class="field-input-wrapper">
              <Lock class="field-icon" aria-hidden="true" />
              <input
                :id="`new-password-${uid}`"
                v-model="newPassword"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="••••••••"
                class="field-input"
                :class="{ 'field-input--error': passwordError }"
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
            <p class="field-hint">{{ t('auth.passwordHint') }}</p>
          </div>

          <div class="form-field">
            <label :for="`confirm-password-${uid}`" class="field-label">{{ t('auth.forgot.confirmPasswordLabel') }}</label>
            <div class="field-input-wrapper">
              <Lock class="field-icon" aria-hidden="true" />
              <input
                :id="`confirm-password-${uid}`"
                v-model="confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="••••••••"
                class="field-input"
                :class="{ 'field-input--error': passwordError }"
              />
            </div>
            <p v-if="passwordError" class="field-error" role="alert">{{ passwordError }}</p>
          </div>

          <div v-if="banner" class="banner" :class="bannerOk ? 'banner--success' : 'banner--error'" role="status">
            {{ banner }}
          </div>

          <AppButton type="submit" variant="primary" size="lg" :loading="loading" class="submit-btn">
            {{ loading ? t('auth.forgot.saving') : t('auth.forgot.resetButton') }}
          </AppButton>
        </form>
      </template>

      <!-- Step 4: Başarılı -->
      <template v-else-if="currentStep === 'success'">
        <div class="icon-container icon-container--success">
          <CircleCheck class="icon" aria-hidden="true" />
        </div>
        <h1 class="display-md">{{ t('auth.forgot.successTitle') }}</h1>
        <p class="body">{{ t('auth.forgot.successSubtitle') }}</p>
        <RouterLink to="/login" class="success-btn">
          {{ t('auth.forgot.successButton') }}
        </RouterLink>
      </template>

      <RouterLink
        v-if="currentStep !== 'success'"
        to="/login"
        class="footer-link"
      >
        ← {{ t('auth.forgot.backToLogin') }}
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { Mail, KeyRound, ShieldCheck, Lock, Eye, EyeOff, CircleCheck } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { authApi } from '@/api/auth'
import OtpInput from '@/components/auth/OtpInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { extractApiError } from '@/utils/apiError'
import { resetPasswordSchema } from '@/validation/schemas'

const { t } = useI18n()
const uid = Math.random().toString(36).slice(2, 9)

type Step = 'email' | 'otp' | 'password' | 'success'

const currentStep = ref<Step>('email')
const loading = ref(false)

const email = ref('')
const emailError = ref('')
const banner = ref('')
const bannerOk = ref(false)

const otpCode = ref('')
const otpError = ref('')
const otpInputRef = ref<InstanceType<typeof OtpInput> | null>(null)
const resetToken = ref('')

const newPassword = ref('')
const confirmPassword = ref('')
const passwordError = ref('')
const showPassword = ref(false)

const countdown = ref(0)
let countdownInterval: ReturnType<typeof setInterval> | null = null

function startCountdown() {
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

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})

const validateEmail = () => {
  emailError.value = ''
  if (!email.value.trim()) {
    emailError.value = t('auth.emailRequired')
    return false
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    emailError.value = t('auth.emailInvalid')
    return false
  }
  return true
}

async function onSendOtp() {
  if (!validateEmail()) return
  
  loading.value = true
  banner.value = ''
  
  try {
    await authApi.forgotPassword({ email: email.value.trim() })
  } catch {
    // Security: Don't reveal if email exists
  } finally {
    currentStep.value = 'otp'
    startCountdown()
    loading.value = false
  }
}

async function onResendOtp() {
  if (countdown.value > 0) return
  
  loading.value = true
  try {
    await authApi.forgotPassword({ email: email.value.trim() })
    startCountdown()
    otpInputRef.value?.clear()
    otpError.value = ''
  } catch {
    // Ignore
  } finally {
    loading.value = false
  }
}

async function onVerifyOtp() {
  if (otpCode.value.length !== 6) return
  
  loading.value = true
  otpError.value = ''
  
  try {
    const { data } = await authApi.verifyResetOtp({
      email: email.value.trim(),
      otp: otpCode.value,
    })
    
    resetToken.value = data.data!.resetToken
    currentStep.value = 'password'
  } catch (e: unknown) {
    const msg = extractApiError(e, 'Geçersiz veya süresi dolmuş kod')
    otpInputRef.value?.clear()
    otpError.value = msg
  } finally {
    loading.value = false
  }
}

async function onResetPassword() {
  passwordError.value = ''
  banner.value = ''

  const result = resetPasswordSchema.safeParse({
    newPassword: newPassword.value,
    confirmPassword: confirmPassword.value,
  })
  if (!result.success) {
    const first = result.error.issues[0]
    passwordError.value = first?.message ?? t('auth.forgot.passwordMinError')
    return
  }

  loading.value = true

  try {
    await authApi.resetPassword({
      resetToken: resetToken.value,
      newPassword: newPassword.value,
    })
    currentStep.value = 'success'
  } catch (e: unknown) {
    bannerOk.value = false
    banner.value = extractApiError(e, t('auth.forgot.resetFailedError'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.forgot-password-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
  background: var(--bg);
}

.forgot-card {
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

.icon-container--success .icon {
  background: var(--success-tint);
  color: var(--success);
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
  margin: 0 0 2rem 0;
}

.email-highlight {
  font-weight: 600;
  color: var(--primary);
}

.forgot-form {
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
  font-size: 0.75rem;
  color: var(--danger);
}

.field-error-center {
  margin-top: 0.75rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--danger);
}

.banner {
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

.otp-section {
  margin: 2rem 0;
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

.submit-btn {
  width: 100%;
}

.back-link {
  margin-top: 0.75rem;
  width: 100%;
  text-align: center;
  font-size: 0.875rem;
  color: var(--ink-3);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s;
}

.back-link:hover {
  color: var(--ink-2);
}

.success-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 2rem;
  padding: 0.75rem 1rem;
  border-radius: var(--r-md);
  background: var(--primary);
  color: var(--surface);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  box-shadow: var(--shadow-1);
  transition: background-color 0.15s, box-shadow 0.15s;
}

.success-btn:hover {
  background: var(--primary-pressed);
  box-shadow: var(--shadow-2);
}

.footer-link {
  display: block;
  margin-top: 1.5rem;
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
