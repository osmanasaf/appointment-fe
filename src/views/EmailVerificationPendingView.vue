<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-16">
    <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div class="mb-6 flex justify-center">
        <div class="flex size-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-600">
          <Mail class="size-7" />
        </div>
      </div>
      <h1 class="text-center text-2xl font-bold tracking-tight text-slate-900">
        {{ t('auth.verifyPendingTitle') }}
      </h1>
      <p class="mt-3 text-center text-sm leading-relaxed text-slate-600">
        {{ t('auth.verifyPendingBody') }}
      </p>
      <p v-if="emailDisplay" class="mt-2 text-center text-sm font-medium text-teal-700">
        {{ emailDisplay }}
      </p>

      <!-- Email girişi (query'de yoksa) -->
      <div v-if="showEmailField" class="mt-6">
        <label for="pending-email" class="mb-1.5 block text-sm font-medium text-slate-700">
          {{ t('auth.email') }}
        </label>
        <input
          id="pending-email"
          v-model="emailInput"
          type="email"
          autocomplete="email"
          class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          :placeholder="t('auth.email')"
        />
      </div>

      <!-- OTP Girişi -->
      <div class="mt-8">
        <label class="mb-3 block text-center text-sm font-medium text-slate-700">
          Doğrulama kodunu girin
        </label>
        <OtpInput
          ref="otpInputRef"
          v-model="otpCode"
          :error="!!otpError"
          :disabled="verifying"
          @complete="onOtpComplete"
        />
        <p v-if="otpError" class="mt-3 text-center text-sm text-red-600">
          {{ otpError }}
        </p>
      </div>

      <!-- Geri sayım ve tekrar gönder -->
      <div class="mt-6 text-center">
        <p v-if="countdown > 0" class="text-sm text-slate-500">
          Kod gelmedi mi? <span class="font-medium text-slate-700">{{ countdown }}s</span> sonra tekrar gönderebilirsiniz
        </p>
        <button
          v-else
          type="button"
          :disabled="resendLoading || !canResend"
          class="text-sm font-medium text-teal-600 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          @click="onResend"
        >
          <span v-if="resendLoading">Gönderiliyor...</span>
          <span v-else>Kodu tekrar gönder</span>
        </button>
      </div>

      <!-- Banner -->
      <div
        v-if="banner"
        class="mt-6 rounded-xl border px-4 py-3 text-sm"
        :class="
          bannerOk
            ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
            : 'border-red-100 bg-red-50 text-red-700'
        "
        role="status"
      >
        {{ banner }}
      </div>

      <!-- Doğrula butonu -->
      <button
        type="button"
        :disabled="verifying || otpCode.length !== 6"
        class="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 disabled:cursor-not-allowed disabled:opacity-60"
        @click="onVerify"
      >
        <span
          v-if="verifying"
          class="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
        />
        {{ verifying ? 'Doğrulanıyor...' : 'Doğrula ve Giriş Yap' }}
      </button>

      <RouterLink
        to="/login"
        class="mt-4 block text-center text-sm font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
      >
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

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

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

// OTP state
const otpCode = ref('')
const otpError = ref('')
const otpInputRef = ref<InstanceType<typeof OtpInput> | null>(null)
const verifying = ref(false)

// Resend state
const resendLoading = ref(false)
const banner = ref('')
const bannerOk = ref(false)

// Countdown
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
      // Login işlemi
      auth.setAuth(data.data)
      await router.push('/admin')
    } else {
      otpError.value = data.error?.message || 'Doğrulama başarısız'
      otpInputRef.value?.clear()
    }
  } catch (e: unknown) {
    if (axios.isAxiosError(e)) {
      const body = e.response?.data as ApiResponse<unknown> | undefined
      otpError.value = body?.error?.message || 'Doğrulama kodu geçersiz'
    } else {
      otpError.value = 'Bir hata oluştu'
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
      banner.value = data.message ?? 'Yeni doğrulama kodu gönderildi'
      startCountdown()
      otpInputRef.value?.clear()
    } else {
      bannerOk.value = false
      banner.value = data.error?.message ?? 'Kod gönderilemedi'
    }
  } catch (e: unknown) {
    bannerOk.value = false
    if (axios.isAxiosError(e)) {
      const body = e.response?.data as ApiResponse<unknown> | undefined
      banner.value = body?.error?.message ?? 'Kod gönderilemedi'
    } else {
      banner.value = 'Kod gönderilemedi'
    }
  } finally {
    resendLoading.value = false
  }
}
</script>
