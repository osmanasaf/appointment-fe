<template>
  <div class="mx-auto max-w-2xl space-y-6">
    <header>
      <h1 class="page-title">{{ t('onboarding.title') }}</h1>
      <p class="mt-1 text-sm text-slate-600">{{ t('onboarding.subtitle') }}</p>
    </header>

    <div v-if="checkLoading" class="flex items-center justify-center py-12">
      <span class="text-sm text-slate-500">{{ t('common.loading') }}</span>
    </div>

    <template v-else>
      <ol class="space-y-3">
        <li
          v-for="s in steps"
          :key="s.key"
          class="flex items-start gap-3 rounded-xl border p-4 transition"
          :class="s.done ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'"
        >
          <span
            class="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            :class="s.done ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'"
          >
            {{ s.done ? '✓' : s.num }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="font-medium text-slate-900">{{ s.label }}</p>
            <p class="mt-0.5 text-sm text-slate-600">{{ s.desc }}</p>
            <div v-if="!s.done" class="mt-2">
              <RouterLink v-slot="{ navigate }" :to="s.link" custom>
                <AppButton variant="primary" size="sm" @click="navigate">{{ s.cta }}</AppButton>
              </RouterLink>
            </div>
          </div>
        </li>
      </ol>

      <div v-if="allDone" class="rounded-xl border border-green-300 bg-green-50 p-5 text-center">
        <p class="font-semibold text-green-800">{{ t('onboarding.allDone') }}</p>
        <p class="mt-1 text-sm text-green-700">{{ t('onboarding.allDoneDesc') }}</p>
        <RouterLink v-slot="{ navigate }" to="/admin" custom>
          <AppButton variant="primary" class="mt-3" @click="navigate">{{ t('onboarding.toDashboard') }}</AppButton>
        </RouterLink>
      </div>

      <div class="flex justify-end">
        <AppButton variant="secondary" size="sm" @click="recheckAll">{{ t('onboarding.recheck') }}</AppButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { businessApi } from '@/api/business'
import { serviceApi } from '@/api/service'
import { employeeApi } from '@/api/employee'
import AppButton from '@/components/ui/AppButton.vue'

const STORAGE_KEY = 'onboarding_checks'

const { t } = useI18n()
const auth = useAuthStore()
const businessId = computed(() => auth.user?.businessId ?? null)

const checkLoading = ref(true)
const hasBusiness = ref(false)
const hasServices = ref(false)
const hasEmployees = ref(false)
const hasActiveEmployee = ref(false)
const hasBookingSlug = ref(false)

interface StepDef {
  key: string
  num: number
  label: string
  desc: string
  cta: string
  link: string
  done: boolean
}

const steps = computed<StepDef[]>(() => [
  {
    key: 'business',
    num: 1,
    label: t('onboarding.steps.s1'),
    desc: t('onboarding.step1'),
    cta: t('onboarding.openSettings'),
    link: '/admin/settings',
    done: hasBusiness.value,
  },
  {
    key: 'services',
    num: 2,
    label: t('onboarding.steps.s2'),
    desc: t('onboarding.step2Desc'),
    cta: t('onboarding.openServices'),
    link: '/admin/services',
    done: hasServices.value,
  },
  {
    key: 'employees',
    num: 3,
    label: t('onboarding.steps.s3'),
    desc: t('onboarding.step3Desc'),
    cta: t('onboarding.openEmployees'),
    link: '/admin/employees',
    done: hasEmployees.value,
  },
  {
    key: 'active',
    num: 4,
    label: t('onboarding.steps.s4'),
    desc: t('onboarding.step4Desc'),
    cta: t('onboarding.openEmployees'),
    link: '/admin/employees',
    done: hasActiveEmployee.value,
  },
  {
    key: 'slug',
    num: 5,
    label: t('onboarding.steps.s5'),
    desc: t('onboarding.step5Desc'),
    cta: t('onboarding.openSettings'),
    link: '/admin/settings',
    done: hasBookingSlug.value,
  },
])

const allDone = computed(() => steps.value.every(s => s.done))

function saveToStorage() {
  try {
    const obj: Record<string, boolean> = {}
    for (const s of steps.value) obj[s.key] = s.done
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
  } catch { /* ignore */ }
}

async function runChecks() {
  if (!businessId.value) {
    hasBusiness.value = false
    hasServices.value = false
    hasEmployees.value = false
    hasActiveEmployee.value = false
    hasBookingSlug.value = false
    saveToStorage()
    return
  }
  try {
    const [bRes, sRes, eRes] = await Promise.all([
      businessApi.getById(businessId.value),
      serviceApi.list(),
      employeeApi.list({ page: 0, size: 20 }),
    ])
    if (bRes.data.success && bRes.data.data) {
      hasBusiness.value = !!bRes.data.data.name?.trim()
      hasBookingSlug.value = !!bRes.data.data.slug?.trim()
    }
    if (sRes.data.success && sRes.data.data) {
      hasServices.value = sRes.data.data.length > 0
    }
    if (eRes.data.success && eRes.data.data) {
      const emps = eRes.data.data.content ?? []
      hasEmployees.value = emps.length > 0
      hasActiveEmployee.value = emps.some((e) => e.status === 'ACTIVE')
    }
  } catch { /* partial checks may fail */ }
  saveToStorage()
}

async function recheckAll() {
  checkLoading.value = true
  await runChecks()
  checkLoading.value = false
}

onMounted(async () => {
  await runChecks()
  checkLoading.value = false
})
</script>
