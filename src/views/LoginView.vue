<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-50 p-6">
    <AppCard class="w-full max-w-md shadow-lg" :padded="true">
      <template #title>
        <div class="w-full text-center">
          <span
            class="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-indigo-600 text-xl text-white"
            aria-hidden="true"
            >◇</span
          >
          <h1 class="text-xl font-bold tracking-tight text-slate-900">{{ t('auth.loginTitle') }}</h1>
          <p class="mt-1 text-sm text-slate-600">{{ t('auth.loginSubtitle') }}</p>
        </div>
      </template>

      <form class="flex flex-col gap-4" novalidate @submit.prevent="onSubmit">
        <div>
          <label for="login-email" class="mb-1 block text-sm font-medium text-slate-600">{{ t('auth.email') }}</label>
          <input
            id="login-email"
            v-model="email"
            v-bind="emailAttrs"
            type="email"
            autocomplete="email"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            :class="{ 'border-red-400': !!errors.email }"
          />
          <p v-if="errors.email" class="mt-1 text-sm text-red-600" role="alert">{{ errors.email }}</p>
        </div>
        <div>
          <label for="login-password" class="mb-1 block text-sm font-medium text-slate-600">{{ t('auth.password') }}</label>
          <input
            id="login-password"
            v-model="password"
            v-bind="passwordAttrs"
            type="password"
            autocomplete="current-password"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            :class="{ 'border-red-400': !!errors.password }"
          />
          <p v-if="errors.password" class="mt-1 text-sm text-red-600" role="alert">{{ errors.password }}</p>
        </div>
        <p v-if="submitError" class="text-sm text-red-600" role="alert">{{ submitError }}</p>
        <AppButton type="submit" class="w-full justify-center" :loading="loading" :disabled="loading">
          {{ loading ? t('auth.signingIn') : t('auth.signIn') }}
        </AppButton>
      </form>

      <template #footer>
        <p class="text-center text-sm text-slate-600">
          {{ t('auth.noAccount') }}
          <RouterLink to="/register" class="font-medium text-indigo-600 hover:underline">{{ t('auth.registerLink') }}</RouterLink>
        </p>
      </template>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

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

const loading = ref(false)
const submitError = ref('')

const onSubmit = handleSubmit(async values => {
  loading.value = true
  submitError.value = ''
  try {
    await auth.login({ email: values.email.trim(), password: values.password })
    const redirect = (route.query.redirect as string) || '/admin'
    await router.push(redirect)
  } catch (e: unknown) {
    submitError.value = e instanceof Error ? e.message : t('auth.loginFailed')
  } finally {
    loading.value = false
  }
})
</script>
