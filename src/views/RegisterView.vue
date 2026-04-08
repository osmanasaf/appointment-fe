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
          <h1 class="text-xl font-bold tracking-tight text-slate-900">{{ t('auth.registerTitle') }}</h1>
          <p class="mt-1 text-sm text-slate-600">{{ t('auth.registerSubtitle') }}</p>
          <div class="mt-4 flex justify-center gap-2 text-xs font-medium text-slate-500">
            <span :class="step === 1 ? 'text-indigo-600' : ''">1. {{ t('auth.stepAccount') }}</span>
            <span aria-hidden="true">→</span>
            <span :class="step === 2 ? 'text-indigo-600' : ''">2. {{ t('auth.stepBusiness') }}</span>
          </div>
        </div>
      </template>

      <form class="flex flex-col gap-4" novalidate @submit.prevent="onFormSubmit">
        <template v-if="step === 1">
          <div>
            <label for="reg-email" class="mb-1 block text-sm font-medium text-slate-600">{{ t('auth.email') }}</label>
            <input
              id="reg-email"
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
            <label for="reg-password" class="mb-1 block text-sm font-medium text-slate-600">{{ t('auth.password') }}</label>
            <input
              id="reg-password"
              v-model="password"
              v-bind="passwordAttrs"
              type="password"
              autocomplete="new-password"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              :class="{ 'border-red-400': !!errors.password }"
            />
            <p v-if="errors.password" class="mt-1 text-sm text-red-600" role="alert">{{ errors.password }}</p>
          </div>
          <AppButton type="submit" class="w-full justify-center">{{ t('auth.next') }}</AppButton>
        </template>

        <template v-else>
          <div>
            <label for="reg-name" class="mb-1 block text-sm font-medium text-slate-600">{{ t('auth.name') }}</label>
            <input
              id="reg-name"
              v-model="name"
              v-bind="nameAttrs"
              type="text"
              autocomplete="name"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              :class="{ 'border-red-400': !!errors.name }"
            />
            <p v-if="errors.name" class="mt-1 text-sm text-red-600" role="alert">{{ errors.name }}</p>
          </div>
          <div>
            <label for="reg-phone" class="mb-1 block text-sm font-medium text-slate-600">{{ t('auth.phoneOptional') }}</label>
            <input
              id="reg-phone"
              v-model="phoneNumber"
              v-bind="phoneNumberAttrs"
              type="tel"
              autocomplete="tel"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label for="reg-category" class="mb-1 block text-sm font-medium text-slate-600">{{ t('auth.businessCategory') }}</label>
            <select
              id="reg-category"
              v-model="businessCategory"
              v-bind="businessCategoryAttrs"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              :class="{ 'border-red-400': !!errors.businessCategory }"
              :disabled="categoriesLoading || (!!categoriesError && !categories.length)"
              :aria-busy="categoriesLoading"
              :aria-invalid="!!errors.businessCategory"
            >
              <option value="">{{ categoriesLoading ? t('common.loading') : t('auth.businessCategoryPlaceholder') }}</option>
              <option v-for="c in categories" :key="c.code" :value="c.code">{{ c.label }}</option>
            </select>
            <p v-if="categoriesError" class="mt-1 text-sm text-red-600" role="alert">{{ categoriesError }}</p>
            <p v-else-if="errors.businessCategory" class="mt-1 text-sm text-red-600" role="alert">{{ errors.businessCategory }}</p>
            <AppButton
              v-if="categoriesError"
              type="button"
              variant="secondary"
              class="mt-2 w-full justify-center"
              @click="loadCategories(true)"
            >
              {{ t('common.retry') }}
            </AppButton>
          </div>
          <div>
            <label for="reg-business" class="mb-1 block text-sm font-medium text-slate-600">{{ t('auth.businessName') }}</label>
            <input
              id="reg-business"
              v-model="businessName"
              v-bind="businessNameAttrs"
              type="text"
              autocomplete="organization"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              :class="{ 'border-red-400': !!errors.businessName }"
            />
            <p v-if="errors.businessName" class="mt-1 text-sm text-red-600" role="alert">{{ errors.businessName }}</p>
          </div>
          <p v-if="submitError" class="text-sm text-red-600" role="alert">{{ submitError }}</p>
          <div class="flex flex-wrap gap-2">
            <AppButton type="button" variant="secondary" class="flex-1 justify-center" @click="step = 1">{{ t('auth.back') }}</AppButton>
            <AppButton
              type="submit"
              class="flex-1 justify-center"
              :loading="loading"
              :disabled="loading || categoriesLoading || !categories.length"
            >
              {{ loading ? t('auth.signingUp') : t('auth.signUp') }}
            </AppButton>
          </div>
        </template>
      </form>

      <template #footer>
        <p class="text-center text-sm text-slate-600">
          {{ t('auth.hasAccount') }}
          <RouterLink to="/login" class="font-medium text-indigo-600 hover:underline">{{ t('auth.loginLink') }}</RouterLink>
        </p>
      </template>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { businessApi, type BusinessCategoryResponse } from '@/api/business'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const step = ref<1 | 2>(1)

const validationSchema = computed(() =>
  toTypedSchema(
    z.object({
      email: z.string().min(1, t('auth.emailRequired')).email(t('auth.emailInvalid')),
      password: z.string().min(6, t('auth.passwordMin')),
      name: z.string().min(2, t('auth.nameMin')),
      phoneNumber: z.string().optional(),
      businessName: z.string().min(2, t('auth.businessRequired')),
      businessCategory: z.string().min(1, t('auth.businessCategoryRequired')),
    }),
  ),
)

const { handleSubmit, errors, defineField, validateField } = useForm({
  validationSchema,
  initialValues: {
    email: '',
    password: '',
    name: '',
    phoneNumber: '',
    businessCategory: '',
    businessName: '',
  },
})

const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')
const [name, nameAttrs] = defineField('name')
const [phoneNumber, phoneNumberAttrs] = defineField('phoneNumber')
const [businessCategory, businessCategoryAttrs] = defineField('businessCategory')
const [businessName, businessNameAttrs] = defineField('businessName')

const categories = ref<BusinessCategoryResponse[]>([])
const categoriesLoading = ref(false)
const categoriesError = ref('')

const loading = ref(false)
const submitError = ref('')

async function loadCategories(force = false) {
  if (categoriesLoading.value) return
  if (!force && categories.value.length > 0) return
  if (force) {
    categories.value = []
  }
  categoriesLoading.value = true
  categoriesError.value = ''
  try {
    const { data } = await businessApi.getCategories()
    if (data.success && data.data?.length) {
      categories.value = data.data
    } else {
      categories.value = []
      categoriesError.value = t('auth.categoriesLoadError')
    }
  } catch {
    categories.value = []
    categoriesError.value = t('auth.categoriesLoadError')
  } finally {
    categoriesLoading.value = false
  }
}

watch(
  () => step.value,
  s => {
    if (s === 2) void loadCategories()
  },
)

async function onFormSubmit() {
  if (step.value === 1) {
    const r1 = await validateField('email')
    const r2 = await validateField('password')
    if (r1.valid && r2.valid) step.value = 2
    return
  }
  await runRegister()
}

const runRegister = handleSubmit(async values => {
  loading.value = true
  submitError.value = ''
  try {
    await auth.register({
      email: values.email.trim(),
      password: values.password,
      name: values.name.trim(),
      phoneNumber: values.phoneNumber?.trim() || undefined,
      businessName: values.businessName.trim(),
      businessCategory: values.businessCategory,
    })
    await router.push('/admin')
  } catch (e: unknown) {
    submitError.value = e instanceof Error ? e.message : t('auth.registerFailed')
  } finally {
    loading.value = false
  }
})
</script>
