<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-16">
    <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div class="mb-6 flex justify-center">
        <div class="flex size-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
          <Mail class="size-7" />
        </div>
      </div>
      <h1 class="text-center text-2xl font-bold tracking-tight text-slate-900">
        {{ t('auth.verifyPendingTitle') }}
      </h1>
      <p class="mt-3 text-center text-sm leading-relaxed text-slate-600">
        {{ t('auth.verifyPendingBody') }}
      </p>
      <p v-if="emailDisplay && !showEmailField" class="mt-2 text-center text-sm font-medium text-indigo-700">
        {{ emailDisplay }}
      </p>

      <div v-else-if="showEmailField" class="mt-6">
        <label for="pending-email" class="mb-1.5 block text-sm font-medium text-slate-700">
          {{ t('auth.email') }}
        </label>
        <input
          id="pending-email"
          v-model="emailInput"
          type="email"
          autocomplete="email"
          class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          :placeholder="t('auth.email')"
        />
      </div>

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

      <div class="mt-8 flex flex-col gap-3">
        <button
          type="button"
          :disabled="resendLoading || !canResend"
          class="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60"
          @click="onResend"
        >
          <span
            v-if="resendLoading"
            class="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
          />
          {{ resendLoading ? t('common.loading') : t('auth.resendVerification') }}
        </button>
        <RouterLink
          to="/login"
          class="text-center text-sm font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
        >
          {{ t('auth.backToLogin') }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Mail } from 'lucide-vue-next'
import axios from 'axios'
import { authApi } from '@/api/auth'
import type { ApiResponse } from '@/api/client'

const { t } = useI18n()
const route = useRoute()

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

const resendLoading = ref(false)
const banner = ref('')
const bannerOk = ref(false)

async function onResend() {
  if (!canResend.value) return
  resendLoading.value = true
  banner.value = ''
  try {
    const { data } = await authApi.resendVerification({ email: effectiveEmail.value })
    if (data.success) {
      bannerOk.value = true
      banner.value = data.message ?? t('auth.resendVerificationSuccess')
    } else {
      bannerOk.value = false
      banner.value = data.error?.message ?? t('auth.resendVerificationFailed')
    }
  } catch (e: unknown) {
    bannerOk.value = false
    if (axios.isAxiosError(e)) {
      const body = e.response?.data as ApiResponse<unknown> | undefined
      banner.value = body?.error?.message ?? t('auth.resendVerificationFailed')
    } else {
      banner.value = t('auth.resendVerificationFailed')
    }
  } finally {
    resendLoading.value = false
  }
}
</script>
