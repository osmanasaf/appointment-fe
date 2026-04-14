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
          İki adımda hesabınızı oluşturun, hemen randevu almaya başlayın.
        </p>
        <ul class="space-y-3.5">
          <li v-for="item in REGISTER_STEPS_INFO" :key="item.label" class="flex items-center gap-3">
            <span
              class="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold"
            >
              {{ item.num }}
            </span>
            <span class="text-sm text-teal-100">{{ item.label }}</span>
          </li>
        </ul>
      </div>

      <div class="relative z-10 grid grid-cols-2 gap-3">
        <div
          v-for="stat in BRAND_STATS"
          :key="stat.label"
          class="rounded-2xl bg-white/10 p-4 backdrop-blur-sm"
        >
          <p class="text-2xl font-bold">{{ stat.value }}</p>
          <p class="mt-0.5 text-xs text-teal-200">{{ stat.label }}</p>
        </div>
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
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">
            {{ t('auth.registerTitle') }}
          </h1>
          <p class="mt-1.5 text-sm text-slate-500">{{ t('auth.registerSubtitle') }}</p>
        </div>

        <!-- Step indicator -->
        <div class="mb-8 flex items-center gap-0">
          <div class="flex flex-col items-center">
            <div
              class="flex size-8 items-center justify-center rounded-full text-sm font-bold transition-all"
              :class="
                step === 1
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-300'
                  : 'bg-teal-600 text-white'
              "
            >
              <Check v-if="step === 2" class="size-4" />
              <span v-else>1</span>
            </div>
            <span class="mt-1.5 text-xs font-medium" :class="step === 1 ? 'text-teal-600' : 'text-slate-400'">
              {{ t('auth.stepAccount') }}
            </span>
          </div>

          <div
            class="mb-4 h-px flex-1 transition-all"
            :class="step === 2 ? 'bg-teal-600' : 'bg-slate-200'"
          />

          <div class="flex flex-col items-center">
            <div
              class="flex size-8 items-center justify-center rounded-full text-sm font-bold transition-all"
              :class="
                step === 2
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-300'
                  : 'border-2 border-slate-200 bg-white text-slate-400'
              "
            >
              2
            </div>
            <span
              class="mt-1.5 text-xs font-medium"
              :class="step === 2 ? 'text-teal-600' : 'text-slate-400'"
            >
              {{ t('auth.stepBusiness') }}
            </span>
          </div>
        </div>

        <form class="space-y-4" novalidate @submit.prevent="onFormSubmit">
          <!-- Step 1 -->
          <template v-if="step === 1">
            <div>
              <label for="reg-email" class="mb-1.5 block text-sm font-medium text-slate-700">
                {{ t('auth.email') }}
              </label>
              <div class="relative">
                <Mail
                  class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="reg-email"
                  v-model="email"
                  v-bind="emailAttrs"
                  type="email"
                  autocomplete="email"
                  placeholder="ornek@sirket.com"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  :class="{
                    'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/20':
                      !!errors.email,
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

            <div>
              <label for="reg-password" class="mb-1.5 block text-sm font-medium text-slate-700">
                {{ t('auth.password') }}
              </label>
              <div class="relative">
                <Lock
                  class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="reg-password"
                  v-model="password"
                  v-bind="passwordAttrs"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
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

              <!-- Password strength bar -->
              <div v-if="password" class="mt-2.5">
                <div class="flex gap-1">
                  <div
                    v-for="i in 4"
                    :key="i"
                    class="h-1 flex-1 rounded-full transition-all"
                    :class="i <= passwordStrength ? passwordStrengthColor : 'bg-slate-200'"
                  />
                </div>
                <p class="mt-1 text-xs" :class="passwordStrengthTextColor">
                  {{ passwordStrengthLabel }}
                </p>
              </div>
            </div>

            <button
              type="submit"
              class="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 active:scale-[0.98]"
            >
              {{ t('auth.next') }}
              <ArrowRight class="size-4" />
            </button>
          </template>

          <!-- Step 2 -->
          <template v-else>
            <div>
              <label for="reg-name" class="mb-1.5 block text-sm font-medium text-slate-700">
                {{ t('auth.name') }}
              </label>
              <div class="relative">
                <User
                  class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="reg-name"
                  v-model="name"
                  v-bind="nameAttrs"
                  type="text"
                  autocomplete="name"
                  placeholder="Adınız Soyadınız"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  :class="{
                    'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/20':
                      !!errors.name,
                  }"
                />
              </div>
              <p
                v-if="errors.name"
                class="mt-1.5 flex items-center gap-1.5 text-xs text-red-600"
                role="alert"
              >
                <AlertCircle class="size-3.5 shrink-0" />
                {{ errors.name }}
              </p>
            </div>

            <div>
              <label for="reg-phone" class="mb-1.5 block text-sm font-medium text-slate-700">
                {{ t('auth.phoneOptional') }}
              </label>
              <div class="relative">
                <Phone
                  class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="reg-phone"
                  v-model="phoneNumber"
                  v-bind="phoneNumberAttrs"
                  type="tel"
                  autocomplete="tel"
                  placeholder="+90 5xx xxx xx xx"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>

            <div>
              <label for="reg-category" class="mb-1.5 block text-sm font-medium text-slate-700">
                {{ t('auth.businessCategory') }}
              </label>
              <div class="relative">
                <Tag
                  class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                />
                <select
                  id="reg-category"
                  v-model="businessCategory"
                  v-bind="businessCategoryAttrs"
                  class="app-select app-select--no-chevron w-full rounded-xl border-slate-200 bg-slate-50 py-2.5 !pl-10 pr-8 text-sm text-slate-900 transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  :class="{
                    'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/20':
                      !!errors.businessCategory,
                  }"
                  :disabled="categoriesLoading || (!!categoriesError && !categories.length)"
                  :aria-busy="categoriesLoading"
                  :aria-invalid="!!errors.businessCategory"
                >
                  <option value="">
                    {{ categoriesLoading ? t('common.loading') : t('auth.businessCategoryPlaceholder') }}
                  </option>
                  <option v-for="c in categories" :key="c.code" :value="c.code">
                    {{ c.label }}
                  </option>
                </select>
                <ChevronDown
                  class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                />
              </div>
              <p
                v-if="categoriesError"
                class="mt-1.5 flex items-center gap-1.5 text-xs text-red-600"
                role="alert"
              >
                <AlertCircle class="size-3.5 shrink-0" />
                {{ categoriesError }}
              </p>
              <p
                v-else-if="errors.businessCategory"
                class="mt-1.5 flex items-center gap-1.5 text-xs text-red-600"
                role="alert"
              >
                <AlertCircle class="size-3.5 shrink-0" />
                {{ errors.businessCategory }}
              </p>
              <button
                v-if="categoriesError"
                type="button"
                class="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 focus:outline-none"
                @click="loadCategories(true)"
              >
                <RotateCcw class="size-3.5" />
                {{ t('common.retry') }}
              </button>
            </div>

            <div>
              <label for="reg-business" class="mb-1.5 block text-sm font-medium text-slate-700">
                {{ t('auth.businessName') }}
              </label>
              <div class="relative">
                <Building2
                  class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="reg-business"
                  v-model="businessName"
                  v-bind="businessNameAttrs"
                  type="text"
                  autocomplete="organization"
                  placeholder="İşletmenizin adı"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  :class="{
                    'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/20':
                      !!errors.businessName,
                  }"
                />
              </div>
              <p
                v-if="errors.businessName"
                class="mt-1.5 flex items-center gap-1.5 text-xs text-red-600"
                role="alert"
              >
                <AlertCircle class="size-3.5 shrink-0" />
                {{ errors.businessName }}
              </p>
            </div>

            <!-- Submit error banner -->
            <div
              v-if="submitError"
              class="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              <AlertCircle class="mt-0.5 size-4 shrink-0" />
              {{ submitError }}
            </div>

            <!-- Terms & Privacy Agreement -->
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div class="flex items-start gap-2.5">
                <input
                  id="terms-agree"
                  v-model="termsAccepted"
                  type="checkbox"
                  class="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-slate-300 text-teal-600 transition focus:ring-2 focus:ring-teal-500/40"
                />
                <label for="terms-agree" class="cursor-pointer text-sm leading-relaxed text-slate-700">
                  <RouterLink
                    to="/terms"
                    target="_blank"
                    class="font-medium text-teal-600 transition hover:text-teal-700 hover:underline"
                  >
                    {{ t('auth.termsLink') }}
                  </RouterLink>
                  ve
                  <RouterLink
                    to="/privacy"
                    target="_blank"
                    class="font-medium text-teal-600 transition hover:text-teal-700 hover:underline"
                  >
                    {{ t('auth.privacyLink') }}
                  </RouterLink>
                  'nı okudum, kabul ediyorum.
                </label>
              </div>
              <p
                v-if="termsError"
                class="mt-2 flex items-center gap-1.5 text-xs text-red-600"
                role="alert"
              >
                <AlertCircle class="size-3.5 shrink-0" />
                {{ termsError }}
              </p>
            </div>

            <!-- Step 2 actions -->
            <div class="flex gap-2.5">
              <button
                type="button"
                class="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 focus:outline-none active:scale-[0.98]"
                @click="step = 1"
              >
                <ArrowLeft class="size-4" />
                {{ t('auth.back') }}
              </button>
              <button
                type="submit"
                :disabled="loading || categoriesLoading || !categories.length"
                class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span
                  v-if="loading"
                  class="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                />
                {{ loading ? t('auth.signingUp') : t('auth.signUp') }}
              </button>
            </div>
          </template>
        </form>

        <p class="mt-6 text-center text-sm text-slate-500">
          {{ t('auth.hasAccount') }}
          <RouterLink
            to="/login"
            class="font-semibold text-teal-600 transition hover:text-teal-700"
          >
            {{ t('auth.loginLink') }}
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useI18n } from 'vue-i18n'
import {
  CalendarDays,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  ArrowRight,
  ArrowLeft,
  User,
  Phone,
  Building2,
  Tag,
  ChevronDown,
  RotateCcw,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { businessApi, type BusinessCategoryResponse } from '@/api/business'

const REGISTER_STEPS_INFO = [
  { num: 1, label: 'E-posta ve şifrenizi girin' },
  { num: 2, label: 'İşletme bilgilerini ekleyin' },
]

const BRAND_STATS = [
  { value: '%40', label: 'No-show azalması' },
  { value: '7/24', label: 'Online randevu' },
  { value: '6', label: 'Desteklenen sektör' },
  { value: '14 gün', label: 'Ücretsiz deneme' },
]

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const step = ref<1 | 2>(1)

const showPassword = ref(false)
const loading = ref(false)
const submitError = ref('')
const termsAccepted = ref(false)
const termsError = ref('')

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

const passwordStrength = computed(() => {
  const val = password.value
  if (!val || val.length < 6) return 0
  let score = 0
  if (val.length >= 8) score++
  if (/[A-Z]/.test(val)) score++
  if (/[0-9]/.test(val)) score++
  if (/[^A-Za-z0-9]/.test(val)) score++
  return score
})

const passwordStrengthColor = computed(() => {
  if (passwordStrength.value <= 1) return 'bg-red-500'
  if (passwordStrength.value <= 2) return 'bg-amber-500'
  return 'bg-emerald-500'
})

const passwordStrengthTextColor = computed(() => {
  if (passwordStrength.value <= 1) return 'text-red-600'
  if (passwordStrength.value <= 2) return 'text-amber-600'
  return 'text-emerald-600'
})

const passwordStrengthLabel = computed(() => {
  if (passwordStrength.value === 0) return ''
  if (passwordStrength.value <= 1) return 'Zayıf şifre'
  if (passwordStrength.value <= 2) return 'Orta şifre'
  if (passwordStrength.value <= 3) return 'İyi şifre'
  return 'Güçlü şifre'
})

async function loadCategories(force = false) {
  if (categoriesLoading.value) return
  if (!force && categories.value.length > 0) return
  if (force) categories.value = []
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
    const [r1, r2] = await Promise.all([validateField('email'), validateField('password')])
    if (r1.valid && r2.valid) step.value = 2
    return
  }
  
  termsError.value = ''
  if (!termsAccepted.value) {
    termsError.value = t('auth.termsRequired')
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
    await router.push({
      path: '/auth/pending-verification',
      query: { email: values.email.trim() },
    })
  } catch (e: unknown) {
    submitError.value = e instanceof Error ? e.message : t('auth.registerFailed')
  } finally {
    loading.value = false
  }
})
</script>
