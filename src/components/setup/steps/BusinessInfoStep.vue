<template>
  <SetupStepShell
    :step-index="stepIndex"
    :total-steps="totalSteps"
    :title="t('setup.steps.business.title')"
    :description="t('setup.steps.business.description')"
    :busy="saving"
    :error-message="errorMessage"
    :hide-back="true"
    :next-disabled="!canSubmit"
    @back="$emit('back')"
    @next="onNext"
    @dismiss="$emit('dismiss')"
  >
    <form class="flex flex-col gap-5" @submit.prevent="onNext">
      <div class="grid gap-4 md:grid-cols-2">
        <div class="space-y-1.5 md:col-span-2">
          <label for="setup-biz-name" class="block text-sm font-medium text-slate-700">
            {{ t('auth.businessName') }} *
          </label>
          <input
            id="setup-biz-name"
            v-model="form.name"
            type="text"
            class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            :class="{ 'border-red-400': fieldErrors.name }"
            required
            minlength="2"
            maxlength="100"
            autocomplete="organization"
            @blur="validateField('name')"
          />
          <p v-if="fieldErrors.name" class="text-xs text-red-600">{{ fieldErrors.name }}</p>
        </div>

        <div class="space-y-1.5">
          <label for="setup-biz-category" class="block text-sm font-medium text-slate-700">
            {{ t('auth.businessCategory') }} *
          </label>
          <select
            id="setup-biz-category"
            v-model="form.category"
            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            :class="{ 'border-red-400': fieldErrors.category }"
            :disabled="categoriesLoading"
            required
            @change="validateField('category')"
          >
            <option value="">{{ categoriesLoading ? t('common.loading') : t('auth.businessCategoryPlaceholder') }}</option>
            <option v-for="c in categoryOptions" :key="c.code" :value="c.code">{{ c.label }}</option>
          </select>
          <p v-if="categoriesLoadError" class="text-xs text-red-600">{{ categoriesLoadError }}</p>
          <p v-else-if="fieldErrors.category" class="text-xs text-red-600">{{ fieldErrors.category }}</p>
        </div>

        <div class="space-y-1.5">
          <label for="setup-biz-phone" class="block text-sm font-medium text-slate-700">
            {{ t('employees.phone') }} *
          </label>
          <input
            id="setup-biz-phone"
            v-model="form.phoneNumber"
            type="tel"
            inputmode="numeric"
            autocomplete="tel-national"
            maxlength="10"
            class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            :class="{ 'border-red-400': fieldErrors.phoneNumber }"
            required
            @input="onPhoneInput"
            @paste="onPhonePaste"
          />
          <p v-if="fieldErrors.phoneNumber" class="text-xs text-red-600">{{ fieldErrors.phoneNumber }}</p>
        </div>

        <div class="space-y-1.5 md:col-span-2">
          <label for="setup-biz-email" class="block text-sm font-medium text-slate-700">
            {{ t('employees.email') }}
          </label>
          <input
            id="setup-biz-email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            :class="{ 'border-red-400': fieldErrors.email }"
            @blur="validateField('email')"
          />
          <p v-if="fieldErrors.email" class="text-xs text-red-600">{{ fieldErrors.email }}</p>
        </div>

        <div class="space-y-1.5 md:col-span-2">
          <label for="setup-biz-address" class="block text-sm font-medium text-slate-700">
            {{ t('setup.steps.business.addressLabel') }}
          </label>
          <textarea
            id="setup-biz-address"
            v-model="form.address"
            rows="2"
            maxlength="500"
            autocomplete="street-address"
            class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div class="space-y-1.5 md:col-span-2">
          <label for="setup-biz-desc" class="block text-sm font-medium text-slate-700">
            {{ t('setup.steps.business.descriptionLabel') }}
          </label>
          <textarea
            id="setup-biz-desc"
            v-model="form.description"
            rows="3"
            maxlength="500"
            class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      <div v-if="bookingUrlPreview" class="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p class="text-xs font-semibold uppercase tracking-widest text-slate-500">
          {{ t('setup.steps.share.linkLabel') }}
        </p>
        <p class="mt-1 break-all font-mono text-sm text-slate-700">{{ bookingUrlPreview }}</p>
      </div>
    </form>
  </SetupStepShell>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SetupStepShell from '@/components/setup/SetupStepShell.vue'
import { useAuthStore } from '@/stores/auth'
import { useSetupStore } from '@/stores/setup'
import { useToast } from '@/composables/useToast'
import { businessApi, type BusinessCategoryResponse, type UpdateBusinessRequest } from '@/api/business'
import { buildPublicBookingUrl } from '@/utils/publicBookingUrl'
import { validationPatterns } from '@/validation/schemas'
import { sanitizeLocalPhoneInput, applyPhoneInputMask } from '@/utils/fieldValidators'
import { z } from 'zod'

defineProps<{ stepIndex: number; totalSteps: number; isFinal?: boolean }>()

const emit = defineEmits<{
  next: []
  back: []
  dismiss: []
}>()

const { t } = useI18n()
const auth = useAuthStore()
const setup = useSetupStore()
const toast = useToast()

const saving = ref(false)
const errorMessage = ref<string | null>(null)

const categories = ref<BusinessCategoryResponse[]>([])
const categoriesLoading = ref(false)
const categoriesLoadError = ref('')

const form = reactive({
  name: '',
  category: '',
  phoneNumber: '',
  email: '',
  address: '',
  description: '',
})

const fieldErrors = reactive<Record<string, string>>({})

const categoryOptions = computed(() => {
  const list = [...categories.value]
  if (form.category && !list.some((c) => c.code === form.category)) {
    list.unshift({ code: form.category, label: form.category })
  }
  return list
})

const bookingUrlPreview = computed(() => {
  const slug = setup.business?.slug?.trim()
  return slug ? buildPublicBookingUrl(slug) : ''
})

const canSubmit = computed(
  () =>
    !!form.name.trim() &&
    form.name.trim().length >= 2 &&
    !!form.category.trim() &&
    !!form.phoneNumber.trim(),
)

function fillFromStore() {
  const b = setup.business
  if (!b) return
  form.name = b.name ?? ''
  form.category = b.category ?? ''
  form.phoneNumber = sanitizeLocalPhoneInput(b.phoneNumber ?? '')
  form.email = b.email ?? ''
  form.address = b.address ?? ''
  form.description = b.description ?? ''
}

function onPhoneInput(event: Event) {
  form.phoneNumber = applyPhoneInputMask(event)
  if (form.phoneNumber) {
    validateField('phoneNumber')
  } else {
    fieldErrors.phoneNumber = ''
  }
}

function onPhonePaste(event: ClipboardEvent) {
  const pasted = event.clipboardData?.getData('text') ?? ''
  if (!pasted) return
  event.preventDefault()
  const sanitized = sanitizeLocalPhoneInput(pasted)
  form.phoneNumber = sanitized
  const target = event.target as HTMLInputElement | null
  if (target) target.value = sanitized
  if (sanitized) {
    validateField('phoneNumber')
  } else {
    fieldErrors.phoneNumber = ''
  }
}

function validateField(field: keyof typeof form): boolean {
  fieldErrors[field] = ''
  if (field === 'name') {
    const v = form.name.trim()
    if (!v) {
      fieldErrors.name = t('auth.nameRequired')
      return false
    }
    if (v.length < 2) {
      fieldErrors.name = t('auth.nameMin')
      return false
    }
  }
  if (field === 'category') {
    if (!form.category.trim()) {
      fieldErrors.category = t('auth.businessCategoryRequired')
      return false
    }
  }
  if (field === 'phoneNumber') {
    const phoneDigits = form.phoneNumber.replaceAll(/\D/g, '')
    if (!phoneDigits) {
      fieldErrors.phoneNumber = t('setup.steps.business.phoneRequired')
      return false
    }
    if (!validationPatterns.phoneFlexible.test(phoneDigits)) {
      fieldErrors.phoneNumber = t('auth.phoneInvalid')
      return false
    }
  }
  if (field === 'email' && form.email.trim()) {
    const emailResult = z.string().email().max(validationPatterns.emailMax).safeParse(form.email.trim())
    if (!emailResult.success) {
      fieldErrors.email = t('auth.emailInvalid')
      return false
    }
  }
  return true
}

function validateAll(): boolean {
  const checks = (['name', 'category', 'phoneNumber', 'email'] as const).map((f) =>
    validateField(f),
  )
  return checks.every(Boolean)
}

async function loadCategories() {
  categoriesLoading.value = true
  categoriesLoadError.value = ''
  try {
    const { data } = await businessApi.getCategories()
    if (data.success && data.data?.length) {
      categories.value = data.data
    } else {
      categoriesLoadError.value = t('auth.categoriesLoadError')
    }
  } catch {
    categoriesLoadError.value = t('auth.categoriesLoadError')
  } finally {
    categoriesLoading.value = false
  }
}

async function onNext() {
  errorMessage.value = null
  if (!validateAll()) return
  const businessId = auth.user?.businessId ?? null
  if (!businessId) {
    errorMessage.value = t('dashboard.noBusiness')
    return
  }
  saving.value = true
  try {
    const body: UpdateBusinessRequest = {
      name: form.name.trim(),
      category: form.category.trim(),
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      description: form.description.trim() || undefined,
    }
    const { data } = await businessApi.update(businessId, body)
    if (data.success && data.data) {
      setup.setBusiness(data.data)
      toast.success(t('setup.steps.assignments.savedShort'))
      emit('next')
    } else {
      errorMessage.value = data.error?.message ?? t('common.error')
    }
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await setup.ensureLoaded()
  fillFromStore()
  await loadCategories()
})
</script>
