<template>
  <div class="flex min-h-screen">
    <!-- Left: Brand Panel -->
    <div
      class="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800 p-12 text-white lg:flex lg:w-[46%]"
    >
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute -left-24 -top-24 size-[28rem] rounded-full bg-white/5 blur-3xl" />
        <div class="absolute -bottom-24 -right-24 size-[28rem] rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div class="relative z-10 flex items-center gap-3">
        <div class="flex size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
          <CalendarDays class="size-5" />
        </div>
        <span class="text-xl font-bold tracking-tight">{{ t('admin.brand') }}</span>
      </div>

      <div class="relative z-10">
        <h2 class="mb-4 text-4xl font-bold leading-tight tracking-tight">
          Randevunu ayarla,<br />işine odaklan
        </h2>
        <p class="mb-10 text-base leading-relaxed text-teal-100">
          Randevularınızı, personelinizi ve müşterilerinizi tek panelden kolayca yönetin.
        </p>
        <ul class="space-y-3.5">
          <li v-for="feature in BRAND_FEATURES" :key="feature" class="flex items-center gap-3 text-sm text-teal-100">
            <span class="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/15">
              <Check class="size-3" />
            </span>
            {{ feature }}
          </li>
        </ul>
      </div>

      <div class="relative z-10 border-t border-white/10 pt-8">
        <div class="mb-4 flex size-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
          <CalendarDays class="size-7" />
        </div>
        <p class="text-lg font-semibold leading-snug">
          Zamanınızı akıllıca yönetin,<br />işinizi büyütün.
        </p>
        <p class="mt-2 text-sm text-teal-200">Her randevu, bir fırsat.</p>
      </div>

    </div>

    <!-- Right: Form Panel -->
    <div class="flex flex-1 flex-col items-center justify-center bg-white px-6 py-16 sm:px-10">
      <!-- Mobile logo -->
      <div class="mb-10 flex items-center gap-2.5 lg:hidden">
        <div class="flex size-9 items-center justify-center rounded-xl bg-teal-600">
          <CalendarDays class="size-4 text-white" />
        </div>
        <span class="text-lg font-bold text-slate-900">{{ t('admin.brand') }}</span>
      </div>

      <div class="w-full max-w-[22rem]">
        <div class="mb-8">
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">
            {{ t('auth.loginTitle') }}
          </h1>
          <p class="mt-1.5 text-sm text-slate-500">{{ t('auth.loginSubtitle') }}</p>
        </div>

        <form class="space-y-4" novalidate @submit.prevent="onSubmit">
          <!-- Email -->
          <div>
            <label for="login-email" class="mb-1.5 block text-sm font-medium text-slate-700">
              {{ t('auth.email') }}
            </label>
            <div class="relative">
              <Mail
                class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              />
              <input
                id="login-email"
                v-model="email"
                v-bind="emailAttrs"
                type="email"
                autocomplete="email"
                placeholder="ornek@sirket.com"
                class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                :class="{
                  'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/20': !!errors.email,
                }"
              />
            </div>
            <p
              v-if="errors.email"
              class="mt-1.5 flex items-center gap-1.5 text-xs text-red-600"
              role="alert"
            >
              <AlertCircle class="size-3.5 shrink-0" />
              {{ errors.email }}
            </p>
          </div>

          <!-- Password -->
          <div>
            <label for="login-password" class="mb-1.5 block text-sm font-medium text-slate-700">
              {{ t('auth.password') }}
            </label>
            <div class="relative">
              <Lock
                class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              />
              <input
                id="login-password"
                v-model="password"
                v-bind="passwordAttrs"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                :class="{
                  'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/20':
                    !!errors.password,
                }"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition hover:text-slate-600 focus:outline-none"
                :aria-label="showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="size-4" />
                <Eye v-else class="size-4" />
              </button>
            </div>
            <p
              v-if="errors.password"
              class="mt-1.5 flex items-center gap-1.5 text-xs text-red-600"
              role="alert"
            >
              <AlertCircle class="size-3.5 shrink-0" />
              {{ errors.password }}
            </p>
          </div>

          <!-- Submit error banner -->
          <div
            v-if="submitError"
            class="flex flex-col gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            <div class="flex items-start gap-2.5">
              <AlertCircle class="mt-0.5 size-4 shrink-0" />
              {{ submitError }}
            </div>
            <RouterLink
              v-if="emailNotVerified"
              :to="{ path: '/auth/pending-verification', query: { email: lastAttemptEmail } }"
              class="ml-6 text-sm font-semibold text-teal-700 underline-offset-2 hover:underline"
            >
              {{ t('auth.resendVerificationLink') }}
            </RouterLink>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading"
            class="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span
              v-if="loading"
              class="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
            />
            {{ loading ? t('auth.signingIn') : t('auth.signIn') }}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-slate-500">
          {{ t('auth.noAccount') }}
          <RouterLink
            to="/register"
            class="font-semibold text-teal-600 transition hover:text-teal-700"
          >
            {{ t('auth.registerLink') }}
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import { CalendarDays, Mail, Lock, Eye, EyeOff, AlertCircle, Check } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import type { ApiResponse } from '@/api/client'

const BRAND_FEATURES = [
  'Online randevu ve takvim yönetimi',
  'Müşteri ve personel takibi',
  'Hizmet & paket yönetimi',
  'Anlık bildirimler ve hatırlatmalar',
]

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

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
    if (axios.isAxiosError(e) && e.response?.status === 403) {
      const body = e.response.data as ApiResponse<unknown> | undefined
      if (body?.error?.code === 'EMAIL_NOT_VERIFIED') {
        emailNotVerified.value = true
        submitError.value = body.error.message || t('auth.emailNotVerifiedMessage')
        return
      }
    }
    submitError.value = e instanceof Error ? e.message : t('auth.loginFailed')
  } finally {
    loading.value = false
  }
})
</script>
