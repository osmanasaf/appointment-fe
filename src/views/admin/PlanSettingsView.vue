<template>
  <div class="space-y-6">
    <header>
      <h1 class="page-title">{{ t('plan.title') }}</h1>
      <p class="mt-1 text-sm text-slate-600">{{ t('plan.subtitle') }}</p>
    </header>

    <div
      v-if="usage"
      class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4"
    >
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ t('plan.currentUsage') }}</p>
        <p class="mt-1 text-lg font-semibold text-slate-900">
          {{ t('plan.usageAppointments', { n: usage.appointmentsCount, max: usage.maxAppointmentsMonthly }) }}
        </p>
        <p class="text-sm text-slate-600">{{ usage.month }}/{{ usage.year }}</p>
      </div>
      <div v-if="subscription" class="text-sm text-slate-600">
        <span class="font-medium text-slate-800">{{ subscription.planCode }}</span>
        · {{ subscription.status }}
        <span v-if="subscription.trialEndDate" class="block text-xs text-slate-500">
          {{ t('plan.trialUntil', { date: subscription.trialEndDate }) }}
        </span>
      </div>
    </div>

    <div v-if="loadError" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
      {{ t('plan.loadError') }}
      <AppButton class="ml-2" size="sm" variant="secondary" @click="load">{{ t('common.retry') }}</AppButton>
    </div>

    <div v-else-if="loading" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div v-for="i in 4" :key="i" class="h-40 animate-pulse rounded-xl bg-slate-200" />
    </div>

    <template v-else>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AppCard
          v-for="p in plans"
          :key="p.id"
          :class="p.code === subscription?.planCode ? 'ring-2 ring-indigo-500' : ''"
        >
          <template #title>
            <h2 class="text-base font-semibold text-slate-900">{{ p.code }}</h2>
            <p class="mt-0.5 text-sm text-slate-600">{{ formatMoney(p.monthlyPrice) }} / {{ t('plan.month') }}</p>
          </template>
          <ul class="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
            <li>{{ t('plan.limitEmployees', { n: p.maxEmployees }) }}</li>
            <li>{{ t('plan.limitServices', { n: p.maxServices }) }}</li>
            <li>{{ t('plan.limitAppts', { n: p.maxAppointmentsMonthly }) }}</li>
          </ul>
          <p v-if="p.features?.length" class="mt-3 text-xs font-medium text-slate-500">{{ t('plan.features') }}</p>
          <ul class="mt-1 space-y-0.5 text-xs text-slate-600">
            <li v-for="(f, idx) in p.features" :key="idx">{{ f }}</li>
          </ul>
        </AppCard>
      </div>

      <AppCard v-if="matrixFeatures.length" :title="t('plan.matrixTitle')">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead>
              <tr class="border-b border-slate-200">
                <th class="py-2 pr-4 font-semibold text-slate-700">{{ t('plan.featureCol') }}</th>
                <th v-for="p in plans" :key="p.id" class="px-2 py-2 text-center font-semibold text-slate-700">
                  {{ p.code }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in matrixFeatures" :key="row.label" class="border-b border-slate-100">
                <td class="py-2 pr-4 text-slate-700">{{ row.label }}</td>
                <td v-for="p in plans" :key="p.id" class="px-2 py-2 text-center text-slate-600">
                  {{ row.byPlan.get(p.code) ? '✓' : '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-3 text-xs text-slate-500">{{ t('plan.matrixHint') }}</p>
      </AppCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { planApi, type PlanResponse, type BusinessSubscriptionResponse, type PlanUsageResponse, type PlanCode } from '@/api/plan'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'

const { t } = useI18n()

const plans = ref<PlanResponse[]>([])
const subscription = ref<BusinessSubscriptionResponse | null>(null)
const usage = ref<PlanUsageResponse | null>(null)
const loading = ref(true)
const loadError = ref(false)

const matrixFeatures = computed(() => {
  const labels = new Set<string>()
  for (const p of plans.value) for (const f of p.features ?? []) labels.add(f)
  const sorted = [...labels].sort()
  return sorted.map((label) => {
    const byPlan = new Map<PlanCode, boolean>()
    for (const p of plans.value) {
      byPlan.set(p.code, Boolean(p.features?.includes(label)))
    }
    return { label, byPlan }
  })
})

function formatMoney(v: number | string): string {
  const n = typeof v === 'string' ? Number.parseFloat(v) : v
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)
}

async function load() {
  loading.value = true
  loadError.value = false
  try {
    const [pl, sub, us] = await Promise.all([
      planApi.listPlans(),
      planApi.getMySubscription(),
      planApi.getMyUsage(),
    ])
    if (pl.data.success && pl.data.data) plans.value = pl.data.data
    if (sub.data.success && sub.data.data) subscription.value = sub.data.data
    if (us.data.success && us.data.data) usage.value = us.data.data
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => void load())
</script>
