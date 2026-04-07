<template>
  <div class="space-y-6">
    <header>
      <h1 class="page-title">{{ welcomeTitle }}</h1>
      <p class="mt-1 text-sm text-slate-600 sm:text-base">{{ t('dashboard.lead') }}</p>
    </header>

    <div v-if="!businessId" class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-center text-sm text-amber-900">
      {{ t('dashboard.noBusiness') }}
      <RouterLink to="/admin/settings" class="font-semibold text-indigo-600 underline">{{ t('nav.settings') }}</RouterLink>
      — {{ t('dashboard.checkBusiness') }}
    </div>

    <template v-else>
      <div
        v-if="loadError"
        class="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
        role="alert"
      >
        <p class="text-sm text-red-800">{{ t('dashboard.loadError') }}</p>
        <AppButton variant="secondary" size="sm" @click="loadDashboard">{{ t('common.retry') }}</AppButton>
      </div>

      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" :aria-busy="statsLoading">
        <template v-if="statsLoading">
          <div v-for="i in 4" :key="i" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <AppSkeleton variant="line" width="40%" height="0.75rem" class="mb-3" />
            <AppSkeleton variant="line" width="55%" height="2rem" />
          </div>
        </template>
        <template v-else>
          <RouterLink
            to="/admin/appointments"
            class="group relative block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
          >
            <div class="mb-2 flex items-center gap-2 text-indigo-600">
              <CalendarCheck class="size-5" aria-hidden="true" />
              <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{
                t('dashboard.kpi.todayAppointments')
              }}</span>
            </div>
            <p class="text-3xl font-bold tabular-nums text-slate-900">{{ stats.todayTotal }}</p>
            <span
              v-if="stats.pendingCount > 0"
              class="absolute right-4 top-4 rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-semibold text-amber-900"
            >
              {{ t('dashboard.kpi.pendingBadge', { count: stats.pendingCount }) }}
            </span>
          </RouterLink>

          <RouterLink
            to="/admin/appointments"
            class="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
          >
            <div class="mb-2 flex items-center gap-2 text-indigo-600">
              <TrendingUp class="size-5" aria-hidden="true" />
              <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{
                t('dashboard.kpi.monthAppointments')
              }}</span>
            </div>
            <p class="text-3xl font-bold tabular-nums text-slate-900">{{ monthTotal }}</p>
          </RouterLink>

          <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-2 flex items-center gap-2 text-slate-500">
              <Percent class="size-5 text-indigo-600" aria-hidden="true" />
              <span class="text-xs font-semibold uppercase tracking-wide">{{ t('dashboard.kpi.occupancy') }}</span>
            </div>
            <p class="text-3xl font-bold tabular-nums text-slate-400">—</p>
            <p class="mt-1 text-xs text-slate-500">{{ t('dashboard.kpi.occupancyHint') }}</p>
          </div>

          <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-2 flex items-center gap-2 text-slate-500">
              <UserX class="size-5 text-red-500" aria-hidden="true" />
              <span class="text-xs font-semibold uppercase tracking-wide">{{ t('dashboard.kpi.noShowRate') }}</span>
            </div>
            <p class="text-3xl font-bold tabular-nums text-slate-900">{{ noShowDisplay }}</p>
          </div>
        </template>
      </section>

      <section v-if="!statsLoading" class="grid gap-4 sm:grid-cols-3">
        <RouterLink
          to="/admin/services"
          class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300"
        >
          <p class="text-2xl font-bold text-slate-900">{{ stats.services }}</p>
          <p class="text-sm text-slate-600">{{ t('dashboard.stats.services') }}</p>
        </RouterLink>
        <RouterLink
          to="/admin/customers"
          class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300"
        >
          <p class="text-2xl font-bold text-slate-900">{{ stats.customers }}</p>
          <p class="text-sm text-slate-600">{{ t('dashboard.stats.customers') }}</p>
        </RouterLink>
        <RouterLink
          to="/admin/employees"
          class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300"
        >
          <p class="text-2xl font-bold text-slate-900">{{ stats.employees }}</p>
          <p class="text-sm text-slate-600">{{ t('dashboard.stats.employees') }}</p>
        </RouterLink>
      </section>

      <div class="grid gap-6 lg:grid-cols-2">
        <AppCard>
          <template #title>
            <div class="flex w-full items-center justify-between gap-2">
              <span>{{ t('dashboard.todaySection') }}</span>
              <RouterLink to="/admin/appointments" class="text-sm font-medium text-indigo-600 hover:underline">{{
                t('common.all')
              }}</RouterLink>
            </div>
          </template>
          <div v-if="statsLoading" class="space-y-2">
            <AppSkeleton v-for="i in 3" :key="i" variant="line" height="2.25rem" />
          </div>
          <AppEmptyState
            v-else-if="todayAppointments.length === 0"
            :title="t('dashboard.noAppointmentsToday')"
            class="border-0 bg-slate-50"
          >
            <template #action>
              <RouterLink to="/admin/appointments" class="btn small primary">{{ t('dashboard.createAppointment') }}</RouterLink>
            </template>
          </AppEmptyState>
          <ul v-else class="divide-y divide-slate-100">
            <li v-for="a in todayAppointments.slice(0, 7)" :key="a.id" class="flex flex-wrap items-center gap-2 py-2.5">
              <span class="w-14 shrink-0 text-sm font-semibold tabular-nums text-slate-900">{{ formatTime(a.scheduledAt) }}</span>
              <span class="min-w-0 flex-1 truncate text-sm text-slate-800">{{ resolveCustomerName(a.customerId) }}</span>
              <AppBadge :status="a.status" />
            </li>
          </ul>
          <p v-if="todayAppointments.length > 7" class="mt-2 text-sm text-slate-500">
            {{ t('dashboard.moreAppointments', { count: todayAppointments.length - 7 }) }}
            <RouterLink to="/admin/appointments" class="font-medium text-indigo-600 hover:underline">{{
              t('dashboard.seeAll')
            }}</RouterLink>
          </p>
        </AppCard>

        <AppCard>
          <template #title>
            <div class="flex w-full items-center justify-between gap-2">
              <span>{{ t('dashboard.priceList') }}</span>
              <RouterLink to="/admin/services" class="text-sm font-medium text-indigo-600 hover:underline">{{
                t('common.edit')
              }}</RouterLink>
            </div>
          </template>
          <div v-if="statsLoading" class="space-y-2">
            <AppSkeleton v-for="i in 3" :key="i" variant="line" height="2.25rem" />
          </div>
          <AppEmptyState
            v-else-if="activeServices.length === 0"
            :title="t('dashboard.noActiveServices')"
            class="border-0 bg-slate-50"
          >
            <template #action>
              <RouterLink to="/admin/services" class="btn small primary">{{ t('dashboard.addService') }}</RouterLink>
            </template>
          </AppEmptyState>
          <ul v-else class="divide-y divide-slate-100">
            <li v-for="s in activeServices" :key="s.id" class="flex items-start justify-between gap-2 py-2.5">
              <div class="min-w-0">
                <p class="truncate font-medium text-slate-900">{{ s.name }}</p>
                <p class="text-xs text-slate-500">{{ t('dashboard.minutesShort', { n: s.durationMinutes }) }}</p>
              </div>
              <span class="shrink-0 font-semibold tabular-nums text-indigo-600">{{ formatPrice(s.price) }} {{ s.currency }}</span>
            </li>
          </ul>
        </AppCard>
      </div>

      <AppCard v-if="businessSlug && !statsLoading" :title="t('dashboard.bookingPageTitle')" :subtitle="t('dashboard.bookingPageDesc')">
        <div class="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
          <code class="min-w-0 flex-1 truncate text-xs text-slate-600">{{ publicUrl }}</code>
          <div class="flex flex-wrap gap-2">
            <a :href="publicUrl" target="_blank" rel="noopener" class="btn small">{{ t('common.preview') }}</a>
            <button type="button" class="btn small primary" :aria-label="copyAria" @click="copyLink">
              {{ copyLabel }}
            </button>
          </div>
        </div>
      </AppCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { CalendarCheck, TrendingUp, Percent, UserX } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { businessApi } from '@/api/business'
import { serviceApi, type ServiceResponse } from '@/api/service'
import { customerApi, type CustomerResponse } from '@/api/customer'
import { employeeApi } from '@/api/employee'
import { appointmentApi, type AppointmentResponse } from '@/api/appointment'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppButton from '@/components/ui/AppButton.vue'

const { t } = useI18n()
const auth = useAuthStore()
const businessId = computed(() => auth.user?.businessId ?? null)

const businessSlug = ref<string | null>(null)
const stats = ref({ services: 0, customers: 0, employees: 0, todayTotal: 0, pendingCount: 0 })
const statsLoading = ref(true)
const loadError = ref(false)
const copyDone = ref(false)

const allServices = ref<ServiceResponse[]>([])
const todayAppointments = ref<AppointmentResponse[]>([])
const monthAppointments = ref<AppointmentResponse[]>([])
const customerMap = ref<Map<number, string>>(new Map())

const activeServices = computed(() => allServices.value.filter(s => s.active))

const publicUrl = computed(() => {
  if (typeof globalThis.window === 'undefined' || !businessSlug.value) return ''
  return `${globalThis.window.location.origin}/b/${businessSlug.value}`
})

const copyLabel = computed(() => (copyDone.value ? t('common.copied') : t('common.copyLink')))
const copyAria = computed(() => t('common.copyLink'))

const welcomeTitle = computed(() => {
  const name = auth.user?.name
  if (name) return t('dashboard.welcome', { suffix: t('dashboard.welcomeSuffix', { name }) })
  return t('dashboard.welcome', { suffix: '' })
})

const monthTotal = computed(() => monthAppointments.value.length)

const noShowDisplay = computed(() => {
  const list = monthAppointments.value
  if (!list.length) return '—'
  const ns = list.filter(a => a.status === 'NO_SHOW').length
  return `${Math.round((ns / list.length) * 100)}%`
})

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('tr-TR', { timeStyle: 'short' }).format(new Date(iso))
}

function formatPrice(p: number | string): string {
  const n = typeof p === 'string' ? Number.parseFloat(p) : p
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)
}

function resolveCustomerName(id: number): string {
  return customerMap.value.get(id) ?? t('dashboard.customerFallback', { id })
}

function monthRangeIso(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

async function copyLink() {
  if (!publicUrl.value) return
  try {
    await navigator.clipboard.writeText(publicUrl.value)
    copyDone.value = true
    setTimeout(() => {
      copyDone.value = false
    }, 2000)
  } catch {
    copyDone.value = false
  }
}

async function loadDashboard() {
  if (!businessId.value) {
    statsLoading.value = false
    return
  }
  loadError.value = false
  statsLoading.value = true
  try {
    const today = new Date().toISOString().slice(0, 10)
    const { start, end } = monthRangeIso()
    const [bRes, sRes, cRes, eRes, aToday, aMonth] = await Promise.all([
      businessApi.getById(businessId.value),
      serviceApi.list(businessId.value),
      customerApi.list(businessId.value),
      employeeApi.list(businessId.value),
      appointmentApi.list(businessId.value, today, today),
      appointmentApi.list(businessId.value, start, end),
    ])
    if (bRes.data.success && bRes.data.data) businessSlug.value = bRes.data.data.slug
    if (sRes.data.success && sRes.data.data) {
      allServices.value = sRes.data.data
      stats.value.services = sRes.data.data.length
    }
    if (cRes.data.success && cRes.data.data) {
      stats.value.customers = cRes.data.data.length
      const map = new Map<number, string>()
      for (const c of cRes.data.data as CustomerResponse[]) map.set(c.id, c.name)
      customerMap.value = map
    }
    if (eRes.data.success && eRes.data.data) stats.value.employees = eRes.data.data.length
    if (aToday.data.success && aToday.data.data) {
      todayAppointments.value = aToday.data.data
      stats.value.todayTotal = aToday.data.data.length
      stats.value.pendingCount = aToday.data.data.filter(a => a.status === 'PENDING' || a.status === 'RISKY').length
    }
    if (aMonth.data.success && aMonth.data.data) {
      monthAppointments.value = aMonth.data.data
    }
  } catch {
    loadError.value = true
  } finally {
    statsLoading.value = false
  }
}

onMounted(() => {
  void loadDashboard()
})
</script>
