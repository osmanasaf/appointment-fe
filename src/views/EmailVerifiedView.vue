<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-16">
    <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div v-if="state === 'loading'" class="flex flex-col items-center py-8">
        <span
          class="size-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"
          aria-hidden="true"
        />
        <p class="mt-4 text-sm text-slate-600">{{ t('auth.verifyEmailWorking') }}</p>
      </div>

      <template v-else-if="state === 'success'">
        <div class="mb-6 flex justify-center">
          <div class="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CheckCircle class="size-7" />
          </div>
        </div>
        <h1 class="text-center text-2xl font-bold tracking-tight text-slate-900">
          {{ t('auth.verifySuccessTitle') }}
        </h1>
        <p class="mt-3 text-center text-sm text-slate-600">
          {{ t('auth.verifySuccessBody') }}
        </p>
        <RouterLink
          to="/login"
          class="mt-8 flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        >
          {{ t('auth.signIn') }}
        </RouterLink>
      </template>

      <template v-else>
        <div class="mb-6 flex justify-center">
          <div class="flex size-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <AlertCircle class="size-7" />
          </div>
        </div>
        <h1 class="text-center text-2xl font-bold tracking-tight text-slate-900">
          {{ t('auth.verifyErrorTitle') }}
        </h1>
        <p class="mt-3 text-center text-sm text-red-700">
          {{ errorMessage }}
        </p>
        <div class="mt-8 flex flex-col gap-3">
          <RouterLink
            to="/register"
            class="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            {{ t('auth.registerLink') }}
          </RouterLink>
          <RouterLink
            to="/login"
            class="text-center text-sm font-medium text-slate-600 underline-offset-2 hover:underline"
          >
            {{ t('auth.backToLogin') }}
          </RouterLink>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { CheckCircle, AlertCircle } from 'lucide-vue-next'
import axios from 'axios'
import { authApi } from '@/api/auth'
import type { ApiResponse } from '@/api/client'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

type VerifyState = 'loading' | 'success' | 'error'
const state = ref<VerifyState>('loading')
const errorMessage = ref('')

onMounted(async () => {
  if (route.path === '/auth/verified') {
    state.value = 'success'
    return
  }
  const tokenParam = route.query.token
  const token = typeof tokenParam === 'string' ? tokenParam.trim() : ''
  if (!token) {
    state.value = 'error'
    errorMessage.value = t('auth.verifyMissingToken')
    return
  }
  try {
    const { data } = await authApi.verifyEmail(token)
    if (data.success) {
      await router.replace('/auth/verified')
      return
    } else {
      state.value = 'error'
      errorMessage.value = data.error?.message ?? t('auth.verifyErrorGeneric')
    }
  } catch (e: unknown) {
    state.value = 'error'
    if (axios.isAxiosError(e)) {
      const body = e.response?.data as ApiResponse<unknown> | undefined
      errorMessage.value = body?.error?.message ?? t('auth.verifyErrorGeneric')
    } else {
      errorMessage.value = t('auth.verifyErrorGeneric')
    }
  }
})
</script>
