<template>
  <section id="pricing" class="bg-slate-50 px-6 py-20 lg:px-8">
    <div class="mx-auto max-w-6xl">
      <div class="text-center">
        <p class="text-sm font-semibold uppercase tracking-wider text-teal-600">
          {{ t('landing.pricing.eyebrow') }}
        </p>
        <h2 class="landing-heading mt-2 text-3xl text-slate-900 sm:text-4xl">
          {{ t('landing.pricing.title') }}
        </h2>
        <p class="mx-auto mt-4 max-w-2xl text-slate-600">
          {{ t('landing.pricing.subtitle') }}
        </p>
      </div>

      <div class="mt-10 flex justify-center">
        <div
          class="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
          role="tablist"
          :aria-label="t('landing.pricing.title')"
        >
          <button
            type="button"
            role="tab"
            :aria-selected="billing === 'monthly'"
            class="rounded-lg px-4 py-2 text-sm font-medium transition"
            :class="
              billing === 'monthly'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            "
            @click="billing = 'monthly'"
          >
            {{ t('landing.pricing.billingMonthly') }}
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="billing === 'yearly'"
            class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
            :class="
              billing === 'yearly'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            "
            @click="billing = 'yearly'"
          >
            {{ t('landing.pricing.billingYearly') }}
            <span
              class="rounded-full px-2 py-0.5 text-xs font-semibold"
              :class="
                billing === 'yearly'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 text-emerald-700'
              "
            >
              {{ t('landing.pricing.yearlySavings') }}
            </span>
          </button>
        </div>
      </div>

      <div v-if="loading" class="mt-14 grid gap-6 lg:grid-cols-3">
        <div
          v-for="i in 3"
          :key="i"
          class="h-[28rem] animate-pulse rounded-2xl border border-slate-200 bg-white"
        />
      </div>

      <div
        v-else-if="errorMessage"
        class="mt-14 rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center"
        role="alert"
      >
        <p class="text-sm font-medium text-rose-700">{{ errorMessage }}</p>
        <button
          type="button"
          class="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
          @click="loadPlans"
        >
          {{ t('landing.pricing.retry') }}
        </button>
      </div>

      <div v-else-if="plans.length > 0" class="mt-14 grid gap-6 lg:grid-cols-3">
        <article
          v-for="plan in plans"
          :key="plan.code"
          class="relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition"
          :class="
            isPopular(plan.code)
              ? 'border-teal-500 shadow-lg ring-1 ring-teal-500/20 lg:scale-[1.02]'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
          "
        >
          <span
            v-if="isPopular(plan.code)"
            class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow-sm"
          >
            {{ t('landing.pricing.popular') }}
          </span>

          <header>
            <h3 class="text-xl font-semibold text-slate-900">
              {{ planName(plan.code) }}
            </h3>
            <p class="mt-1 text-sm text-slate-600">{{ planTagline(plan.code) }}</p>
          </header>

          <div class="mt-6">
            <div class="flex items-baseline gap-2">
              <span class="text-4xl font-bold tracking-tight text-slate-900">
                {{ formatPrice(displayedPrice(plan)) }}
              </span>
              <span class="text-sm font-medium text-slate-500">
                {{ t('landing.pricing.perMonth') }}
              </span>
            </div>
            <p
              v-if="billing === 'yearly'"
              class="mt-1 text-xs text-slate-500"
            >
              {{ t('landing.pricing.monthlyEquivalentBilledYearly', { price: formatPrice(toNumber(plan.yearlyPrice)) }) }}
            </p>
          </div>

          <a
            :href="ctaHref(plan.code)"
            class="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition"
            :class="
              isPopular(plan.code)
                ? 'bg-teal-600 text-white shadow-sm hover:bg-teal-700'
                : 'border border-slate-300 bg-white text-slate-900 hover:border-teal-500 hover:text-teal-700'
            "
          >
            {{ ctaLabel(plan.code) }}
          </a>

          <div class="mt-8 border-t border-slate-200 pt-6">
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {{ t('landing.pricing.featuresTitle') }}
            </p>
            <ul class="mt-4 space-y-3">
              <li
                v-for="(item, idx) in planHighlights(plan)"
                :key="idx"
                class="flex items-start gap-3 text-sm text-slate-700"
              >
                <Check class="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden="true" />
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check } from 'lucide-vue-next'
import { planApi, type PlanCode, type PublicPlanResponse } from '@/api/plan'
import { useAppPublicUrl } from '@/composables/useAppPublicUrl'
import { extractApiError } from '@/utils/apiError'

type Billing = 'monthly' | 'yearly'

const { t, locale } = useI18n()
const { registerUrl } = useAppPublicUrl()

const POPULAR_PLAN: PlanCode = 'PRO'

const billing = ref<Billing>('monthly')
const plans = ref<PublicPlanResponse[]>([])
const loading = ref(true)
const errorMessage = ref('')

const priceFormatter = computed(
  () =>
    new Intl.NumberFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0,
    }),
)

function toNumber(value: number | string): number {
  const num = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(num) ? num : 0
}

function formatPrice(value: number): string {
  return priceFormatter.value.format(value)
}

function isPopular(code: PlanCode): boolean {
  return code === POPULAR_PLAN
}

function planName(code: PlanCode): string {
  return t(`landing.pricing.planName.${code}`)
}

function planTagline(code: PlanCode): string {
  return t(`landing.pricing.planTagline.${code}`)
}

function displayedPrice(plan: PublicPlanResponse): number {
  if (billing.value === 'monthly') return toNumber(plan.monthlyPrice)
  const yearly = toNumber(plan.yearlyPrice)
  return Math.round(yearly / 12)
}

function ctaHref(code: PlanCode): string {
  if (code === 'ENTERPRISE') return 'mailto:hello@randevum.pro'
  const url = new URL(registerUrl.value, window.location.origin)
  url.searchParams.set('plan', code)
  return url.toString()
}

function ctaLabel(code: PlanCode): string {
  return code === 'ENTERPRISE'
    ? t('landing.pricing.ctaContactSales')
    : t('landing.pricing.ctaStart')
}

function planHighlights(plan: PublicPlanResponse): string[] {
  const items: string[] = []

  items.push(
    plan.unlimitedEmployees
      ? t('landing.pricing.limits.employeesUnlimited')
      : t('landing.pricing.limits.employees', { n: plan.maxEmployees }),
  )

  items.push(
    plan.unlimitedAppointments
      ? t('landing.pricing.limits.appointmentsUnlimited')
      : t('landing.pricing.limits.appointments', { n: plan.maxAppointmentsMonthly }),
  )

  items.push(
    plan.unlimitedServices
      ? t('landing.pricing.limits.servicesUnlimited')
      : t('landing.pricing.limits.services', { n: plan.maxServices }),
  )

  if (plan.unlimitedBranches || plan.maxBranches > 1) {
    items.push(
      plan.unlimitedBranches
        ? t('landing.pricing.limits.branchesUnlimited')
        : t('landing.pricing.limits.branches', { n: plan.maxBranches }),
    )
  }

  if (plan.maxWhatsappMonthly !== 0) {
    items.push(
      plan.unlimitedWhatsapp
        ? t('landing.pricing.limits.whatsappUnlimited')
        : t('landing.pricing.limits.whatsapp', { n: plan.maxWhatsappMonthly }),
    )
  }

  if (plan.maxSmsMonthly !== 0) {
    items.push(
      plan.unlimitedSms
        ? t('landing.pricing.limits.smsUnlimited')
        : t('landing.pricing.limits.sms', { n: plan.maxSmsMonthly }),
    )
  }

  for (const code of plan.features) {
    const name = plan.featureNames[code]
    if (name) items.push(name)
  }

  return items
}

async function loadPlans() {
  loading.value = true
  errorMessage.value = ''
  try {
    const { data } = await planApi.listPublicPlans()
    if (data.success && data.data) {
      plans.value = data.data
    } else {
      errorMessage.value = data.error?.message ?? t('landing.pricing.errorLoad')
    }
  } catch (err) {
    errorMessage.value = extractApiError(err, t('landing.pricing.errorLoad'))
  } finally {
    loading.value = false
  }
}

onMounted(loadPlans)
</script>
