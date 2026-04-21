<template>
  <AuthSplitLayout>
    <template #hero-subtitle>
      {{ t('auth.register.subtitle') }}
    </template>

    <template #hero-features>
      <li v-for="item in REGISTER_STEPS_INFO" :key="item.num" class="hero-step">
        <span class="step-num">{{ item.num }}</span>
        <span class="step-text">{{ item.label }}</span>
      </li>
    </template>

    <template #hero-footer-title>
      {{ BRAND_STATS_TEXT.title }}
    </template>

    <template #hero-footer-subtitle>
      {{ BRAND_STATS_TEXT.subtitle }}
    </template>

    <div class="register-form-header">
      <h1 class="display-md">{{ t('auth.register.title') }}</h1>
      <p class="body">{{ t('auth.register.subtitle') }}</p>
    </div>

    <!-- Step indicator -->
    <div class="step-indicator">
      <div
        class="step-item"
        :class="{ 'step-item--active': step === 1, 'step-item--done': step === 2 }"
        :aria-current="step === 1 ? 'step' : undefined"
      >
        <div class="step-circle">
          <Check v-if="step === 2" class="size-4" />
          <span v-else>1</span>
        </div>
        <span class="step-label">{{ t('auth.register.steps.account') }}</span>
      </div>

      <div class="step-line" :class="{ 'step-line--active': step === 2 }" />

      <div
        class="step-item"
        :class="{ 'step-item--active': step === 2 }"
        :aria-current="step === 2 ? 'step' : undefined"
      >
        <div class="step-circle">2</div>
        <span class="step-label">{{ t('auth.register.steps.business') }}</span>
      </div>
    </div>

    <form class="auth-form" novalidate @submit.prevent="onFormSubmit">
      <!-- Step 1 -->
      <template v-if="step === 1">
        <div class="form-field">
          <label :for="`reg-email-${uid}`" class="field-label">{{ t('auth.register.emailLabel') }}</label>
          <div class="field-input-wrapper">
            <Mail class="field-icon" aria-hidden="true" />
            <input
              :id="`reg-email-${uid}`"
              v-model="email"
              v-bind="emailAttrs"
              type="email"
              autocomplete="email"
              placeholder="ornek@sirket.com"
              class="field-input"
              :class="{ 'field-input--error': !!errors.email }"
            />
          </div>
          <p v-if="errors.email" class="field-error" role="alert">
            <AlertCircle class="size-3.5" aria-hidden="true" />
            {{ errors.email }}
          </p>
        </div>

        <div class="form-field">
          <label :for="`reg-password-${uid}`" class="field-label">{{ t('auth.register.passwordLabel') }}</label>
          <div class="field-input-wrapper">
            <Lock class="field-icon" aria-hidden="true" />
            <input
              :id="`reg-password-${uid}`"
              v-model="password"
              v-bind="passwordAttrs"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="••••••••"
              class="field-input"
              :class="{ 'field-input--error': !!errors.password }"
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
          <p v-if="errors.password" class="field-error" role="alert">
            <AlertCircle class="size-3.5" aria-hidden="true" />
            {{ errors.password }}
          </p>

          <div v-if="password" class="password-strength">
            <div class="strength-bars">
              <div
                v-for="i in 4"
                :key="i"
                class="strength-bar"
                :class="{ 'strength-bar--active': i <= passwordStrength, [`strength-bar--${passwordStrengthLevel}`]: i <= passwordStrength }"
              />
            </div>
            <p class="strength-label" :class="`strength-label--${passwordStrengthLevel}`">
              {{ passwordStrengthLabel }}
            </p>
          </div>
        </div>

        <div class="form-field">
          <label :for="`reg-confirm-password-${uid}`" class="field-label">
            {{ t('auth.register.confirmPasswordLabel') }}
          </label>
          <div class="field-input-wrapper">
            <Lock class="field-icon" aria-hidden="true" />
            <input
              :id="`reg-confirm-password-${uid}`"
              v-model="confirmPassword"
              v-bind="confirmPasswordAttrs"
              :type="showConfirmPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="••••••••"
              class="field-input"
              :class="{ 'field-input--error': !!errors.confirmPassword }"
            />
            <button
              type="button"
              class="field-toggle-btn"
              :aria-label="showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <EyeOff v-if="showConfirmPassword" class="size-4" />
              <Eye v-else class="size-4" />
            </button>
          </div>
          <p v-if="errors.confirmPassword" class="field-error" role="alert">
            <AlertCircle class="size-3.5" aria-hidden="true" />
            {{ errors.confirmPassword }}
          </p>
        </div>

        <AppButton type="submit" variant="primary" size="lg" class="submit-btn">
          {{ t('auth.next') }}
          <ArrowRight class="size-4" />
        </AppButton>
      </template>

      <!-- Step 2 -->
      <template v-else>
        <div class="form-field">
          <label :for="`reg-name-${uid}`" class="field-label">{{ t('auth.register.nameLabel') }}</label>
          <div class="field-input-wrapper">
            <User class="field-icon" aria-hidden="true" />
            <input
              :id="`reg-name-${uid}`"
              v-model="name"
              v-bind="nameAttrs"
              type="text"
              autocomplete="name"
              placeholder="Adınız Soyadınız"
              class="field-input"
              :class="{ 'field-input--error': !!errors.name }"
            />
          </div>
          <p v-if="errors.name" class="field-error" role="alert">
            <AlertCircle class="size-3.5" aria-hidden="true" />
            {{ errors.name }}
          </p>
        </div>

        <div class="form-field">
          <label :for="`reg-phone-${uid}`" class="field-label">{{ t('auth.register.phoneLabel') }}</label>
          <div class="field-input-wrapper">
            <Phone class="field-icon" aria-hidden="true" />
            <input
              :id="`reg-phone-${uid}`"
              v-model="phoneNumber"
              v-bind="phoneNumberAttrs"
              type="tel"
              inputmode="numeric"
              autocomplete="tel-national"
              maxlength="10"
              placeholder="5XX XXX XX XX"
              class="field-input"
              @input="onPhoneInput"
              @paste="onPhonePaste"
            />
          </div>
          <p v-if="errors.phoneNumber" class="field-error" role="alert">
            <AlertCircle class="size-3.5" aria-hidden="true" />
            {{ errors.phoneNumber }}
          </p>
        </div>

        <div class="form-field">
          <label :for="`reg-category-${uid}`" class="field-label">{{ t('auth.register.categoryLabel') }}</label>
          <div class="field-input-wrapper">
            <Tag class="field-icon" aria-hidden="true" />
            <select
              :id="`reg-category-${uid}`"
              v-model="businessCategory"
              v-bind="businessCategoryAttrs"
              class="field-select"
              :class="{ 'field-input--error': !!errors.businessCategory }"
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
            <ChevronDown class="select-icon" aria-hidden="true" />
          </div>
          <p v-if="categoriesError" class="field-error" role="alert">
            <AlertCircle class="size-3.5" aria-hidden="true" />
            {{ categoriesError }}
          </p>
          <p v-else-if="errors.businessCategory" class="field-error" role="alert">
            <AlertCircle class="size-3.5" aria-hidden="true" />
            {{ errors.businessCategory }}
          </p>
          <button
            v-if="categoriesError"
            type="button"
            class="retry-btn"
            @click="loadCategories(true)"
          >
            <RotateCcw class="size-3.5" />
            {{ t('common.retry') }}
          </button>
        </div>

        <div class="form-field">
          <label :for="`reg-business-${uid}`" class="field-label">{{ t('auth.register.businessNameLabel') }}</label>
          <div class="field-input-wrapper">
            <Building2 class="field-icon" aria-hidden="true" />
            <input
              :id="`reg-business-${uid}`"
              v-model="businessName"
              v-bind="businessNameAttrs"
              type="text"
              autocomplete="organization"
              :placeholder="t('auth.register.businessNamePlaceholder')"
              class="field-input"
              :class="{ 'field-input--error': !!errors.businessName }"
            />
          </div>
          <p v-if="errors.businessName" class="field-error" role="alert">
            <AlertCircle class="size-3.5" aria-hidden="true" />
            {{ errors.businessName }}
          </p>
        </div>

        <div v-if="submitError" class="submit-error" role="alert">
          <AlertCircle class="size-4" aria-hidden="true" />
          {{ submitError }}
        </div>

        <div class="terms-box">
          <div class="terms-content">
            <input
              :id="`terms-${uid}`"
              v-model="termsAccepted"
              type="checkbox"
              class="terms-checkbox"
            />
            <label :for="`terms-${uid}`" class="terms-label">
              <i18n-t keypath="auth.termsAgreementFull" tag="span">
                <template #terms>
                  <RouterLink to="/terms" target="_blank" class="terms-link">{{ t('auth.termsLink') }}</RouterLink>
                </template>
                <template #privacy>
                  <RouterLink to="/privacy" target="_blank" class="terms-link">{{ t('auth.privacyLink') }}</RouterLink>
                </template>
              </i18n-t>
            </label>
          </div>
          <p v-if="termsError" class="field-error" role="alert">
            <AlertCircle class="size-3.5" aria-hidden="true" />
            {{ termsError }}
          </p>
        </div>

        <div class="step2-actions">
          <AppButton type="button" variant="secondary" size="lg" @click="step = 1">
            <ArrowLeft class="size-4" />
            {{ t('auth.back') }}
          </AppButton>
          <AppButton
            type="submit"
            variant="primary"
            size="lg"
            :loading="loading"
            :disabled="categoriesLoading || !categories.length"
            class="flex-1"
          >
            {{ loading ? t('auth.signingUp') : t('auth.register.submit') }}
          </AppButton>
        </div>
      </template>
    </form>

    <p class="footer-text">
      {{ t('auth.register.haveAccount') }}
      <RouterLink to="/login" class="footer-link">
        {{ t('auth.register.loginLink') }}
      </RouterLink>
    </p>
  </AuthSplitLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useI18n } from 'vue-i18n'
import { validationPatterns } from '@/validation/schemas'
import { sanitizeLocalPhoneInput, applyPhoneInputMask } from '@/utils/fieldValidators'
import {
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
import { normalizeApiError } from '@/utils/apiError'
import AuthSplitLayout from '@/components/auth/AuthSplitLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'

const { t, tm } = useI18n()

const REGISTER_STEPS_INFO = computed(() => {
  const labels = tm('auth.register.steps.labels') as string[]
  return [
    { num: 1, label: labels[0] ?? '' },
    { num: 2, label: labels[1] ?? '' },
  ]
})

const BRAND_STATS_TEXT = computed(() => ({
  title: t('auth.hero.trialTitle'),
  subtitle: t('auth.hero.trialSubtitleNoCreditCard'),
}))
const router = useRouter()
const auth = useAuthStore()
const uid = Math.random().toString(36).slice(2, 9)
const step = ref<1 | 2>(1)

const showPassword = ref(false)
const loading = ref(false)
const submitError = ref('')
const termsAccepted = ref(false)
const termsError = ref('')

const validationSchema = computed(() =>
  toTypedSchema(
    z
      .object({
        email: z
          .string()
          .min(1, t('auth.emailRequired'))
          .max(validationPatterns.emailMax, t('auth.emailTooLong'))
          .email(t('auth.emailInvalid')),
        password: z
          .string()
          .min(validationPatterns.passwordMin, t('auth.passwordMin'))
          .regex(/[A-Z]/, t('auth.passwordUppercase'))
          .regex(/[0-9]/, t('auth.passwordDigit')),
        confirmPassword: z.string().min(1, t('auth.confirmPasswordRequired')),
        name: z.string().min(2, t('auth.nameMin')).max(100, t('auth.nameMax')),
        phoneNumber: z
          .string()
          .optional()
          .or(z.literal(''))
          .refine((v) => !v || validationPatterns.phoneFlexible.test(v), {
            message: t('auth.phoneInvalid'),
          }),
        businessName: z.string().min(2, t('auth.businessRequired')).max(100, t('auth.businessMax')),
        businessCategory: z.string().min(1, t('auth.businessCategoryRequired')),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: t('auth.passwordMismatch'),
        path: ['confirmPassword'],
      }),
  ),
)

const { handleSubmit, errors, defineField, validateField } = useForm({
  validationSchema,
  initialValues: {
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phoneNumber: '',
    businessCategory: '',
    businessName: '',
  },
})

const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')
const [confirmPassword, confirmPasswordAttrs] = defineField('confirmPassword')
const [name, nameAttrs] = defineField('name')
const [phoneNumber, phoneNumberAttrs] = defineField('phoneNumber')
const [businessCategory, businessCategoryAttrs] = defineField('businessCategory')
const [businessName, businessNameAttrs] = defineField('businessName')

function onPhoneInput(event: Event) {
  const sanitized = applyPhoneInputMask(event)
  phoneNumber.value = sanitized
  if (sanitized) validateField('phoneNumber')
}

function onPhonePaste(event: ClipboardEvent) {
  const pasted = event.clipboardData?.getData('text') ?? ''
  if (!pasted) return
  event.preventDefault()
  const sanitized = sanitizeLocalPhoneInput(pasted)
  phoneNumber.value = sanitized
  const target = event.target as HTMLInputElement | null
  if (target) target.value = sanitized
  if (sanitized) validateField('phoneNumber')
}

const showConfirmPassword = ref(false)

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

const passwordStrengthLevel = computed(() => {
  if (passwordStrength.value <= 1) return 'weak'
  if (passwordStrength.value <= 2) return 'medium'
  return 'strong'
})

const passwordStrengthLabel = computed(() => {
  const level = passwordStrength.value
  if (level === 0) return ''
  if (level <= 1) return t('auth.register.passwordStrength.weak')
  if (level <= 2) return t('auth.register.passwordStrength.medium')
  if (level <= 3) return t('auth.register.passwordStrength.good')
  return t('auth.register.passwordStrength.strong')
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
    const [r1, r2, r3] = await Promise.all([
      validateField('email'),
      validateField('password'),
      validateField('confirmPassword'),
    ])
    if (r1.valid && r2.valid && r3.valid) step.value = 2
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
    const normalized = normalizeApiError(e, t('auth.registerFailed'))
    submitError.value = normalized.message
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.hero-step {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: color-mix(in srgb, var(--surface) 85%, var(--primary));
}

.step-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--surface) 15%, transparent);
  font-size: 0.75rem;
  font-weight: 700;
}

.step-text {
  flex: 1;
}

.register-form-header {
  margin-bottom: 2rem;
}

.register-form-header .display-md {
  color: var(--ink-1);
  margin-bottom: 0.375rem;
}

.register-form-header .body {
  color: var(--ink-3);
  margin: 0;
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 2rem;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 700;
  transition: all 0.2s;
  border: 2px solid var(--hairline);
  background: var(--surface);
  color: var(--ink-4);
}

.step-item--active .step-circle,
.step-item--done .step-circle {
  background: var(--primary);
  color: var(--surface);
  border-color: var(--primary);
  box-shadow: var(--shadow-1);
}

.step-label {
  margin-top: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--ink-4);
}

.step-item--active .step-label {
  color: var(--primary);
}

.step-line {
  flex: 1;
  height: 1px;
  background: var(--hairline);
  margin: 0 0 1rem 0;
  transition: background 0.2s;
}

.step-line--active {
  background: var(--primary);
}

.auth-form {
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

.field-input,
.field-select {
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

.field-input:hover:not(:disabled),
.field-select:hover:not(:disabled) {
  background: var(--bg);
}

.field-input:focus,
.field-select:focus {
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

.field-select {
  appearance: none;
  padding-right: 2.5rem;
  cursor: pointer;
}

.field-select:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  background: var(--bg-subtle);
}

.select-icon {
  position: absolute;
  right: 0.75rem;
  width: 1rem;
  height: 1rem;
  color: var(--ink-4);
  pointer-events: none;
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
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--danger);
  margin: 0;
}

.retry-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  width: 100%;
  padding: 0.5rem;
  margin-top: 0.5rem;
  border: 1px solid var(--hairline-strong);
  border-radius: var(--r-md);
  background: var(--surface);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--ink-2);
  cursor: pointer;
  transition: background-color 0.15s;
}

.retry-btn:hover {
  background: var(--bg);
}

.password-strength {
  margin-top: 0.625rem;
}

.strength-bars {
  display: flex;
  gap: 0.25rem;
}

.strength-bar {
  flex: 1;
  height: 4px;
  border-radius: 9999px;
  background: var(--hairline);
  transition: background 0.2s;
}

.strength-bar--active.strength-bar--weak {
  background: var(--danger);
}

.strength-bar--active.strength-bar--medium {
  background: var(--warning);
}

.strength-bar--active.strength-bar--strong {
  background: var(--success);
}

.strength-label {
  margin-top: 0.25rem;
  font-size: 0.75rem;
}

.strength-label--weak {
  color: var(--danger);
}

.strength-label--medium {
  color: var(--warning);
}

.strength-label--strong {
  color: var(--success);
}

.submit-error {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  border: 1px solid color-mix(in srgb, var(--danger) 15%, transparent);
  border-radius: var(--r-md);
  background: var(--danger-tint);
  font-size: 0.875rem;
  color: color-mix(in srgb, var(--danger) 90%, var(--ink-1));
}

.terms-box {
  padding: 1rem;
  border: 1px solid var(--hairline);
  border-radius: var(--r-md);
  background: var(--surface-2);
}

.terms-content {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
}

.terms-checkbox {
  margin-top: 0.125rem;
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  cursor: pointer;
  border-radius: var(--r-sm);
  accent-color: var(--primary);
}

.terms-label {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--ink-2);
  cursor: pointer;
}

.terms-link {
  font-weight: 500;
  color: var(--primary);
  text-decoration: none;
  transition: color 0.15s;
}

.terms-link:hover {
  color: var(--primary-pressed);
  text-decoration: underline;
}

.submit-btn {
  width: 100%;
}

.step2-actions {
  display: flex;
  gap: 0.625rem;
}

.footer-text {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--ink-3);
}

.footer-link {
  font-weight: 600;
  color: var(--primary);
  text-decoration: none;
  transition: color 0.15s;
}

.footer-link:hover {
  color: var(--primary-pressed);
}
</style>
