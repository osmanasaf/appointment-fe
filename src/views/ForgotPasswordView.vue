<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-16">
    <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <!-- Step 1: Email girişi -->
      <template v-if="currentStep === 'email'">
        <div class="mb-6 flex justify-center">
          <div class="flex size-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-600">
            <KeyRound class="size-7" />
          </div>
        </div>
        <h1 class="text-center text-2xl font-bold tracking-tight text-slate-900">
          Şifremi Unuttum
        </h1>
        <p class="mt-3 text-center text-sm leading-relaxed text-slate-600">
          Email adresinizi girin, size şifre sıfırlama kodu göndereceğiz.
        </p>

        <form class="mt-8" @submit.prevent="onSendOtp">
          <div>
            <label for="email" class="mb-1.5 block text-sm font-medium text-slate-700">
              Email Adresi
            </label>
            <div class="relative">
              <Mail class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="ornek@sirket.com"
                class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                :class="{ 'border-red-400': emailError }"
              />
            </div>
            <p v-if="emailError" class="mt-1.5 text-xs text-red-600">{{ emailError }}</p>
          </div>

          <div v-if="banner" class="mt-4 rounded-xl border px-4 py-3 text-sm"
            :class="bannerOk ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-red-100 bg-red-50 text-red-700'">
            {{ banner }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span v-if="loading" class="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            {{ loading ? 'Gönderiliyor...' : 'Kod Gönder' }}
          </button>
        </form>
      </template>

      <!-- Step 2: OTP girişi -->
      <template v-else-if="currentStep === 'otp'">
        <div class="mb-6 flex justify-center">
          <div class="flex size-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-600">
            <ShieldCheck class="size-7" />
          </div>
        </div>
        <h1 class="text-center text-2xl font-bold tracking-tight text-slate-900">
          Doğrulama Kodu
        </h1>
        <p class="mt-3 text-center text-sm leading-relaxed text-slate-600">
          <span class="font-medium text-teal-700">{{ email }}</span> adresine gönderilen 6 haneli kodu girin.
        </p>

        <div class="mt-8">
          <OtpInput
            ref="otpInputRef"
            v-model="otpCode"
            :error="!!otpError"
            :disabled="loading"
            @complete="onVerifyOtp"
          />
          <p v-if="otpError" class="mt-3 text-center text-sm text-red-600">{{ otpError }}</p>
        </div>

        <div class="mt-6 text-center">
          <p v-if="countdown > 0" class="text-sm text-slate-500">
            Kod gelmedi mi? <span class="font-medium text-slate-700">{{ countdown }}s</span> sonra tekrar gönderebilirsiniz
          </p>
          <button
            v-else
            type="button"
            :disabled="loading"
            class="text-sm font-medium text-teal-600 hover:text-teal-700 disabled:opacity-50"
            @click="onResendOtp"
          >
            Kodu tekrar gönder
          </button>
        </div>

        <button
          type="button"
          :disabled="loading || otpCode.length !== 6"
          class="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 disabled:cursor-not-allowed disabled:opacity-60"
          @click="onVerifyOtp"
        >
          <span v-if="loading" class="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          {{ loading ? 'Doğrulanıyor...' : 'Doğrula' }}
        </button>

        <button
          type="button"
          class="mt-3 w-full text-center text-sm text-slate-500 hover:text-slate-700"
          @click="currentStep = 'email'"
        >
          ← Farklı email kullan
        </button>
      </template>

      <!-- Step 3: Yeni şifre -->
      <template v-else-if="currentStep === 'password'">
        <div class="mb-6 flex justify-center">
          <div class="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <Lock class="size-7" />
          </div>
        </div>
        <h1 class="text-center text-2xl font-bold tracking-tight text-slate-900">
          Yeni Şifre Belirle
        </h1>
        <p class="mt-3 text-center text-sm leading-relaxed text-slate-600">
          Hesabınız için yeni bir şifre oluşturun.
        </p>

        <form class="mt-8 space-y-4" @submit.prevent="onResetPassword">
          <div>
            <label for="new-password" class="mb-1.5 block text-sm font-medium text-slate-700">
              Yeni Şifre
            </label>
            <div class="relative">
              <Lock class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                id="new-password"
                v-model="newPassword"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="••••••••"
                class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                :class="{ 'border-red-400': passwordError }"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="size-4" />
                <Eye v-else class="size-4" />
              </button>
            </div>
          </div>

          <div>
            <label for="confirm-password" class="mb-1.5 block text-sm font-medium text-slate-700">
              Şifre Tekrar
            </label>
            <div class="relative">
              <Lock class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                id="confirm-password"
                v-model="confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="••••••••"
                class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                :class="{ 'border-red-400': passwordError }"
              />
            </div>
            <p v-if="passwordError" class="mt-1.5 text-xs text-red-600">{{ passwordError }}</p>
          </div>

          <div v-if="banner" class="rounded-xl border px-4 py-3 text-sm"
            :class="bannerOk ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-red-100 bg-red-50 text-red-700'">
            {{ banner }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span v-if="loading" class="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            {{ loading ? 'Kaydediliyor...' : 'Şifreyi Değiştir' }}
          </button>
        </form>
      </template>

      <!-- Step 4: Başarılı -->
      <template v-else-if="currentStep === 'success'">
        <div class="mb-6 flex justify-center">
          <div class="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CircleCheck class="size-7" />
          </div>
        </div>
        <h1 class="text-center text-2xl font-bold tracking-tight text-slate-900">
          Şifreniz Değiştirildi
        </h1>
        <p class="mt-3 text-center text-sm leading-relaxed text-slate-600">
          Yeni şifrenizle giriş yapabilirsiniz.
        </p>
        <RouterLink
          to="/login"
          class="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
        >
          Giriş Yap
        </RouterLink>
      </template>

      <RouterLink
        v-if="currentStep !== 'success'"
        to="/login"
        class="mt-6 block text-center text-sm font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
      >
        ← Giriş sayfasına dön
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { Mail, KeyRound, ShieldCheck, Lock, Eye, EyeOff, CircleCheck } from 'lucide-vue-next'
import { authApi } from '@/api/auth'
import OtpInput from '@/components/auth/OtpInput.vue'
import { extractApiError } from '@/utils/apiError'

type Step = 'email' | 'otp' | 'password' | 'success'

const currentStep = ref<Step>('email')
const loading = ref(false)

// Email step
const email = ref('')
const emailError = ref('')
const banner = ref('')
const bannerOk = ref(false)

// OTP step
const otpCode = ref('')
const otpError = ref('')
const otpInputRef = ref<InstanceType<typeof OtpInput> | null>(null)
const resetToken = ref('')

// Password step
const newPassword = ref('')
const confirmPassword = ref('')
const passwordError = ref('')
const showPassword = ref(false)

// Countdown
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
    emailError.value = 'Email adresi gerekli'
    return false
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    emailError.value = 'Geçerli bir email adresi girin'
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
    // Güvenlik: Email var olup olmadığını açığa çıkarmıyoruz
  } finally {
    // Her durumda OTP sayfasına geç
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
  
  if (newPassword.value.length < 6) {
    passwordError.value = 'Şifre en az 6 karakter olmalı'
    return
  }
  
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'Şifreler eşleşmiyor'
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
    banner.value = extractApiError(e, 'Şifre değiştirilemedi')
  } finally {
    loading.value = false
  }
}
</script>
