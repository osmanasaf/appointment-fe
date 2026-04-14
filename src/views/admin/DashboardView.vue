<template>
  <div class="space-y-6">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="page-title">{{ welcomeTitle }}</h1>
        <p class="mt-1 text-sm text-slate-500">{{ periodLead }}</p>
      </div>

      <div
        v-if="businessId"
        class="flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
        role="tablist"
        :aria-label="t('dashboard.period.label')"
      >
        <button
          v-for="p in PERIODS"
          :key="p.value"
          role="tab"
          :aria-selected="period === p.value"
          class="rounded-lg px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          :class="
            period === p.value
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          "
          @click="selectPeriod(p.value)"
        >
          {{ t(p.labelKey) }}
        </button>
      </div>
    </header>

    <div
      v-if="!businessId"
      class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-center text-sm text-amber-900"
    >
      {{ t('dashboard.noBusiness') }}
      <RouterLink to="/admin/settings" class="font-semibold text-indigo-600 underline">{{
        t('nav.settings')
      }}</RouterLink>
      — {{ t('dashboard.checkBusiness') }}
    </div>

    <template v-else>
      <div
        v-if="loadError"
        class="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
        role="alert"
      >
        <p class="text-sm text-red-800">{{ t('dashboard.loadError') }}</p>
        <AppButton variant="secondary" size="sm" @click="reload">{{ t('common.retry') }}</AppButton>
      </div>

      <section
        class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        :aria-busy="statsLoading"
        :class="{ 'opacity-60 transition-opacity': statsLoading && !initialLoad }"
      >
        <template v-if="statsLoading && initialLoad">
          <div
            v-for="i in 4"
            :key="i"
            class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <AppSkeleton variant="line" width="40%" height="0.75rem" class="mb-3" />
            <AppSkeleton variant="line" width="55%" height="2rem" />
          </div>
        </template>

        <template v-else>
          <RouterLink
            to="/admin/appointments"
            class="group relative block rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
          >
            <div class="mb-3 flex items-center justify-between">
              <span class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-500">
                <CalendarCheck class="size-4" aria-hidden="true" />
                {{ t('dashboard.kpi.total') }}
              </span>
              <span
                v-if="periodStats.pendingCount > 0"
                class="rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-semibold text-amber-800"
              >
                {{ t('dashboard.kpi.pendingBadge', { count: periodStats.pendingCount }) }}
              </span>
            </div>
            <p class="text-3xl font-bold tabular-nums text-indigo-700">
              {{ periodStats.totalAppointments }}
            </p>
          </RouterLink>

          <div class="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
            <div class="mb-3 flex items-center gap-1.5">
              <Clock class="size-4 text-amber-500" aria-hidden="true" />
              <span class="text-xs font-semibold uppercase tracking-wide text-amber-600">
                {{ t('dashboard.kpi.pending') }}
              </span>
            </div>
            <p class="text-3xl font-bold tabular-nums text-amber-700">
              {{ periodStats.pendingCount }}
            </p>
          </div>

          <div class="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
            <div class="mb-3 flex items-center gap-1.5">
              <CheckCircle class="size-4 text-emerald-500" aria-hidden="true" />
              <span class="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                {{ t('dashboard.kpi.completed') }}
              </span>
            </div>
            <p class="text-3xl font-bold tabular-nums text-emerald-700">
              {{ periodStats.completedCount }}
            </p>
          </div>

          <div class="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm">
            <div class="mb-3 flex items-center gap-1.5">
              <UserX class="size-4 text-rose-500" aria-hidden="true" />
              <span class="text-xs font-semibold uppercase tracking-wide text-rose-600">
                {{ t('dashboard.kpi.noShowRate') }}
              </span>
            </div>
            <p class="text-3xl font-bold tabular-nums text-rose-700">
              {{ noShowDisplay }}
            </p>
          </div>
        </template>
      </section>

      <section v-if="!statsLoading || !initialLoad" class="grid gap-4 sm:grid-cols-3">
        <RouterLink
          to="/admin/services"
          class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300"
        >
          <p class="text-2xl font-bold text-slate-900">{{ baseStats.services }}</p>
          <p class="text-sm text-slate-500">{{ t('dashboard.stats.services') }}</p>
        </RouterLink>
        <RouterLink
          to="/admin/customers"
          class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300"
        >
          <p class="text-2xl font-bold text-slate-900">{{ baseStats.customers }}</p>
          <p class="text-sm text-slate-500">{{ t('dashboard.stats.customers') }}</p>
        </RouterLink>
        <RouterLink
          to="/admin/employees"
          class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300"
        >
          <p class="text-2xl font-bold text-slate-900">{{ baseStats.employees }}</p>
          <p class="text-sm text-slate-500">{{ t('dashboard.stats.employees') }}</p>
        </RouterLink>
      </section>

      <div class="grid gap-6 lg:grid-cols-2">
        <AppCard>
          <template #title>
            <div class="flex w-full items-center justify-between gap-2">
              <span>{{ t('dashboard.todaySection') }}</span>
              <RouterLink
                to="/admin/appointments"
                class="text-sm font-medium text-indigo-600 hover:underline"
              >{{ t('common.all') }}</RouterLink>
            </div>
          </template>
          <div v-if="baseLoading" class="space-y-2">
            <AppSkeleton v-for="i in 3" :key="i" variant="line" height="2.25rem" />
          </div>
          <AppEmptyState
            v-else-if="todayAppointments.length === 0"
            :title="t('dashboard.noAppointmentsToday')"
            class="border-0 bg-slate-50"
          >
            <template #action>
              <RouterLink to="/admin/appointments" class="btn small primary">{{
                t('dashboard.createAppointment')
              }}</RouterLink>
            </template>
          </AppEmptyState>
          <ul v-else class="divide-y divide-slate-100">
            <li
              v-for="a in todayAppointments.slice(0, 7)"
              :key="a.id"
              class="flex flex-wrap items-center gap-2 py-2.5"
            >
              <span class="w-14 shrink-0 text-sm font-semibold tabular-nums text-slate-900">{{
                formatTime(a.scheduledAt)
              }}</span>
              <span class="min-w-0 flex-1 truncate text-sm text-slate-800">{{
                resolveCustomerName(a.customerId)
              }}</span>
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
              <RouterLink
                to="/admin/services"
                class="text-sm font-medium text-indigo-600 hover:underline"
              >{{ t('common.edit') }}</RouterLink>
            </div>
          </template>
          <div v-if="baseLoading" class="space-y-2">
            <AppSkeleton v-for="i in 3" :key="i" variant="line" height="2.25rem" />
          </div>
          <AppEmptyState
            v-else-if="activeServices.length === 0"
            :title="t('dashboard.noActiveServices')"
            class="border-0 bg-slate-50"
          >
            <template #action>
              <RouterLink to="/admin/services" class="btn small primary">{{
                t('dashboard.addService')
              }}</RouterLink>
            </template>
          </AppEmptyState>
          <ul v-else class="divide-y divide-slate-100">
            <li
              v-for="s in activeServices"
              :key="s.id"
              class="flex items-start justify-between gap-2 py-2.5"
            >
              <div class="min-w-0">
                <p class="truncate font-medium text-slate-900">{{ s.name }}</p>
                <p class="text-xs text-slate-500">
                  {{ t('dashboard.minutesShort', { n: s.durationMinutes }) }}
                </p>
              </div>
              <span class="shrink-0 font-semibold tabular-nums text-indigo-600"
                >{{ formatPrice(s.price) }} {{ s.currency }}</span
              >
            </li>
          </ul>
        </AppCard>
      </div>

      <AppCard
        v-if="businessSlug && !baseLoading"
        :title="t('dashboard.bookingPageTitle')"
        :subtitle="t('dashboard.bookingPageDesc')"
      >
        <div
          class="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center"
        >
          <code class="min-w-0 flex-1 truncate text-xs text-slate-600">{{ publicUrl }}</code>
          <div class="flex flex-wrap gap-2">
            <a :href="publicUrl" target="_blank" rel="noopener" class="btn small">{{
              t('common.preview')
            }}</a>
            <button
              type="button"
              class="btn small primary"
              :aria-label="copyAria"
              @click="copyLink"
            >
              {{ copyLabel }}
            </button>
          </div>
        </div>
      </AppCard>

      <section v-if="businessId && !(statsLoading && initialLoad)" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900">{{ t('dashboard.chartsTitle') }}</h2>
          <span class="text-sm text-slate-400">{{ periodLead }}</span>
        </div>
        <div class="grid gap-4 lg:grid-cols-2">
          <AppCard :title="t('dashboard.chartTrend')">
            <ApexChart
              type="area"
              height="280"
              :options="trendChartOptions"
              :series="trendChartSeries"
            />
          </AppCard>
          <AppCard :title="t('dashboard.chartServices')">
            <template v-if="serviceDonutHasData">
              <ApexChart
                type="donut"
                height="280"
                :options="serviceDonutOptions"
                :series="serviceDonutSeries"
              />
            </template>
            <AppEmptyState
              v-else
              :title="t('dashboard.noServiceData')"
              class="border-0 bg-slate-50"
            />
          </AppCard>
          <AppCard class="lg:col-span-2" :title="t('dashboard.chartHours')">
            <ApexChart
              type="bar"
              height="260"
              :options="hourBarOptions"
              :series="hourBarSeries"
            />
          </AppCard>
        </div>
      </section>

      <!-- ── En Çok Talep Gören Hizmetler + Müşteri İstatistikleri ── -->
      <div
        v-if="businessId && !(extendedLoading && initialLoad)"
        class="grid gap-4 lg:grid-cols-2"
      >
        <!-- Top Services -->
        <AppCard title="En Çok Randevu Alan Hizmetler">
          <div v-if="extendedLoading && !topServices" class="space-y-2">
            <AppSkeleton v-for="i in 4" :key="i" variant="line" height="2.25rem" />
          </div>
          <AppEmptyState
            v-else-if="!topServices?.services?.length"
            title="Bu dönemde veri yok"
            class="border-0 bg-slate-50"
          />
          <ul v-else class="divide-y divide-slate-100">
            <li
              v-for="(svc, idx) in topServices.services"
              :key="svc.serviceId"
              class="flex items-center gap-3 py-2.5"
            >
              <span
                class="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                :class="idx === 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'"
              >{{ idx + 1 }}</span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-slate-900">{{ svc.serviceName }}</p>
                <div class="mt-0.5 flex items-center gap-2">
                  <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      class="h-full rounded-full bg-indigo-400 transition-all"
                      :style="{ width: `${svc.completionRate}%` }"
                    />
                  </div>
                  <span class="shrink-0 text-xs text-slate-400">{{ svc.completionRate }}%</span>
                </div>
              </div>
              <div class="shrink-0 text-right">
                <p class="text-sm font-semibold tabular-nums text-slate-900">{{ svc.totalAppointments }} randevu</p>
                <p class="text-xs text-emerald-600">+{{ formatPrice(svc.totalRevenue) }} ₺</p>
              </div>
            </li>
          </ul>
        </AppCard>

        <!-- Customer Stats -->
        <AppCard title="Müşteri İstatistikleri">
          <div v-if="extendedLoading && !customerStats" class="space-y-2">
            <AppSkeleton v-for="i in 4" :key="i" variant="line" height="2.25rem" />
          </div>
          <template v-else-if="customerStats">
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-lg bg-indigo-50 p-3 text-center">
                <p class="text-2xl font-bold tabular-nums text-indigo-700">{{ customerStats.totalCustomers }}</p>
                <p class="text-xs text-indigo-500">Toplam Müşteri</p>
              </div>
              <div class="rounded-lg bg-emerald-50 p-3 text-center">
                <p class="text-2xl font-bold tabular-nums text-emerald-700">{{ customerStats.newCustomersInPeriod }}</p>
                <p class="text-xs text-emerald-500">{{ periodLead }} Yeni</p>
              </div>
              <div class="rounded-lg bg-violet-50 p-3 text-center">
                <p class="text-2xl font-bold tabular-nums text-violet-700">{{ Math.round(customerStats.returnRate) }}%</p>
                <p class="text-xs text-violet-500">Geri Dönüş Oranı</p>
              </div>
              <div class="rounded-lg bg-rose-50 p-3 text-center">
                <p class="text-2xl font-bold tabular-nums text-rose-700">{{ customerStats.blacklistedCount }}</p>
                <p class="text-xs text-rose-500">Kara Liste</p>
              </div>
            </div>
            <div v-if="customerStats.topCustomers?.length" class="mt-4">
              <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">En Sık Gelenler</p>
              <ul class="divide-y divide-slate-100">
                <li
                  v-for="c in customerStats.topCustomers"
                  :key="c.customerId"
                  class="flex items-center justify-between gap-2 py-2"
                >
                  <RouterLink
                    :to="`/admin/customers`"
                    class="min-w-0 truncate text-sm text-slate-800 hover:text-indigo-600"
                  >{{ c.name }}</RouterLink>
                  <span class="shrink-0 text-xs tabular-nums text-slate-500">{{ c.appointmentCount }} randevu</span>
                </li>
              </ul>
            </div>
          </template>
          <AppEmptyState v-else title="Veri bulunamadı" class="border-0 bg-slate-50" />
        </AppCard>
      </div>

      <!-- ── Paket Kullanım Durumu ── -->
      <AppCard
        v-if="businessId && packageUsage && (packageUsage.lowSessionPackages > 0 || packageUsage.expiringPackages > 0)"
        title="Dikkat Gerektiren Paketler"
      >
        <div class="mb-4 flex flex-wrap gap-3">
          <div class="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
            <span class="text-lg font-bold tabular-nums text-amber-700">{{ packageUsage.lowSessionPackages }}</span>
            <span class="text-xs text-amber-600">Düşük Seans</span>
          </div>
          <div class="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2">
            <span class="text-lg font-bold tabular-nums text-rose-700">{{ packageUsage.expiringPackages }}</span>
            <span class="text-xs text-rose-600">7 Günde Bitiyor</span>
          </div>
          <div class="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
            <span class="text-lg font-bold tabular-nums text-slate-700">{{ packageUsage.totalActivePackages }}</span>
            <span class="text-xs text-slate-500">Aktif Paket</span>
          </div>
        </div>
        <ul class="divide-y divide-slate-100">
          <li
            v-for="pkg in packageUsage.packages.filter(p => p.isLow || p.isExpiring).slice(0, 6)"
            :key="pkg.packageId"
            class="flex flex-wrap items-center gap-2 py-2.5"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-slate-900">{{ pkg.customerName }}</p>
              <p class="text-xs text-slate-500">{{ pkg.serviceName }}</p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <span class="tabular-nums text-sm text-slate-700">{{ pkg.remainingSessions }}/{{ pkg.totalSessions }} seans</span>
              <span
                v-if="pkg.isExpiring"
                class="rounded-full bg-rose-100 px-2 py-0.5 text-[0.65rem] font-semibold text-rose-700"
              >Bitiyor</span>
              <span
                v-else-if="pkg.isLow"
                class="rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-semibold text-amber-700"
              >Düşük</span>
            </div>
          </li>
        </ul>
        <RouterLink
          to="/admin/packages"
          class="mt-3 block text-sm font-medium text-indigo-600 hover:underline"
        >Tüm paketleri gör →</RouterLink>
      </AppCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import ApexChart from 'vue3-apexcharts'
import { CalendarCheck, UserX, Clock, CheckCircle } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { businessApi } from '@/api/business'
import { serviceApi, type ServiceResponse } from '@/api/service'
import { customerApi, type CustomerResponse } from '@/api/customer'
import { employeeApi } from '@/api/employee'
import { appointmentApi, type AppointmentResponse } from '@/api/appointment'
import {
  dashboardApi,
  type DashboardStatsResponse,
  type DashboardPeriod,
  type TopServicesResponse,
  type CustomerStatsResponse,
  type PackageUsageResponse,
} from '@/api/dashboard'
import { fetchAllPageContent } from '@/api/client'
import { buildPublicBookingUrl } from '@/utils/publicBookingUrl'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppButton from '@/components/ui/AppButton.vue'

const { t } = useI18n()
const auth = useAuthStore()
const businessId = computed(() => auth.user?.businessId ?? null)

const PERIODS: { value: DashboardPeriod; labelKey: string }[] = [
  { value: 'DAILY', labelKey: 'dashboard.period.daily' },
  { value: 'WEEKLY', labelKey: 'dashboard.period.weekly' },
  { value: 'MONTHLY', labelKey: 'dashboard.period.monthly' },
]

const period = ref<DashboardPeriod>('DAILY')
const businessSlug = ref<string | null>(auth.user?.businessSlug ?? null)
const baseStats = ref({ services: 0, customers: 0, employees: 0 })
const baseLoading = ref(true)
const statsLoading = ref(true)
const initialLoad = ref(true)
const loadError = ref(false)
const copyDone = ref(false)

const allServices = ref<ServiceResponse[]>([])
const todayAppointments = ref<AppointmentResponse[]>([])
const customerMap = ref<Map<number, string>>(new Map())

const topServices = ref<TopServicesResponse | null>(null)
const customerStats = ref<CustomerStatsResponse | null>(null)
const packageUsage = ref<PackageUsageResponse | null>(null)
const extendedLoading = ref(true)

const EMPTY_STATS: DashboardStatsResponse = {
  totalAppointments: 0,
  pendingCount: 0,
  confirmedCount: 0,
  completedCount: 0,
  cancelledCount: 0,
  noShowCount: 0,
  noShowRate: 0,
  trendData: [],
  serviceDistribution: [],
  hourDistribution: Array.from({ length: 24 }, () => 0),
}
const periodStats = ref<DashboardStatsResponse>({ ...EMPTY_STATS })

const activeServices = computed(() => allServices.value.filter((s) => s.active))

const publicUrl = computed(() => {
  if (!businessSlug.value) return ''
  return buildPublicBookingUrl(businessSlug.value)
})

const copyLabel = computed(() => (copyDone.value ? t('common.copied') : t('common.copyLink')))
const copyAria = computed(() => t('common.copyLink'))

const periodLead = computed(() => {
  const map: Record<DashboardPeriod, string> = {
    DAILY: 'Bugün',
    WEEKLY: 'Bu hafta',
    MONTHLY: 'Bu ay',
  }
  return map[period.value]
})

const noShowDisplay = computed(() => {
  if (!periodStats.value.totalAppointments) return '—'
  return `${Math.round(periodStats.value.noShowRate)}%`
})

const welcomeTitle = computed(() => {
  const name = auth.user?.name
  if (name) return t('dashboard.welcome', { suffix: t('dashboard.welcomeSuffix', { name }) })
  return t('dashboard.welcome', { suffix: '' })
})

const trendChartSeries = computed(() => [
  {
    name: t('dashboard.chartTrend'),
    data: periodStats.value.trendData.length
      ? periodStats.value.trendData.map((p) => p.count)
      : [0],
  },
])

const trendChartOptions = computed(() => ({
  chart: {
    toolbar: { show: false },
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    zoom: { enabled: false },
  },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 2 },
  fill: {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.0 },
  },
  colors: ['#6366f1'],
  xaxis: {
    categories:
      periodStats.value.trendData.length > 0
        ? periodStats.value.trendData.map((p) => formatDateLabel(p.date))
        : ['—'],
    labels: { style: { fontSize: '11px' } },
  },
  yaxis: { min: 0, labels: { formatter: (v: number) => String(Math.round(v)) } },
  grid: { strokeDashArray: 4, borderColor: '#f1f5f9' },
  tooltip: { x: { show: true } },
}))

const serviceDonutHasData = computed(() =>
  periodStats.value.serviceDistribution.some((s) => s.count > 0),
)

const serviceDonutSeries = computed(() =>
  periodStats.value.serviceDistribution.filter((s) => s.count > 0).map((s) => s.count),
)

const serviceDonutOptions = computed(() => {
  const items = periodStats.value.serviceDistribution.filter((s) => s.count > 0)
  const labels = items.map(
    (s) => allServices.value.find((svc) => svc.id === s.serviceId)?.name ?? `#${s.serviceId}`,
  )
  return {
    labels,
    chart: { fontFamily: 'ui-sans-serif, system-ui, sans-serif' },
    legend: { position: 'bottom' },
    colors: ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#64748b'],
    plotOptions: { pie: { donut: { size: '65%' } } },
    dataLabels: { enabled: false },
  }
})

const hourBarSeries = computed(() => [
  { name: t('dashboard.chartHours'), data: periodStats.value.hourDistribution },
])

const hourBarOptions = computed(() => ({
  chart: {
    toolbar: { show: false },
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  },
  plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
  dataLabels: { enabled: false },
  colors: ['#818cf8'],
  xaxis: {
    categories: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    labels: { style: { fontSize: '10px' } },
  },
  yaxis: { min: 0, labels: { formatter: (v: number) => String(Math.round(v)) } },
  grid: { strokeDashArray: 4, borderColor: '#f1f5f9' },
}))

function formatDateLabel(isoDate: string): string {
  if (period.value === 'MONTHLY') return isoDate.slice(8, 10)
  return new Intl.DateTimeFormat('tr-TR', { weekday: 'short', month: 'numeric', day: 'numeric' })
    .format(new Date(isoDate))
    .replace('.', '/')
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('tr-TR', { timeStyle: 'short' }).format(new Date(iso))
}

function formatPrice(p: number | string): string {
  const n = typeof p === 'string' ? Number.parseFloat(p) : p
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
}

function resolveCustomerName(id: number): string {
  return customerMap.value.get(id) ?? t('dashboard.customerFallback', { id })
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

function selectPeriod(p: DashboardPeriod) {
  if (p === period.value) return
  period.value = p
}

async function loadPeriodStats() {
  if (!businessId.value) return
  statsLoading.value = true
  extendedLoading.value = true
  try {
    const [statsRes, topSvcRes, custRes] = await Promise.all([
      dashboardApi.getStats(period.value),
      dashboardApi.getTopServices(period.value, 5),
      dashboardApi.getCustomerStats(period.value),
    ])
    if (statsRes.data.success && statsRes.data.data) periodStats.value = statsRes.data.data
    if (topSvcRes.data.success && topSvcRes.data.data) topServices.value = topSvcRes.data.data
    if (custRes.data.success && custRes.data.data) customerStats.value = custRes.data.data
  } catch {
    loadError.value = true
  } finally {
    statsLoading.value = false
    extendedLoading.value = false
  }
}

async function loadBaseData() {
  if (!businessId.value) {
    baseLoading.value = false
    return
  }
  const today = new Date().toISOString().slice(0, 10)
  try {
    const [bRes, svcRes, customersList, employeesList, todayList, pkgRes] = await Promise.all([
      businessApi.getById(businessId.value),
      serviceApi.list(),
      fetchAllPageContent((page, size) => customerApi.list({ page, size })),
      fetchAllPageContent((page, size) => employeeApi.list({ page, size })),
      fetchAllPageContent((page, size) =>
        appointmentApi.list({ startDate: today, endDate: today, page, size }),
      ),
      dashboardApi.getPackageUsage(),
    ])
    if (pkgRes.data.success && pkgRes.data.data) packageUsage.value = pkgRes.data.data
    if (bRes.data.success && bRes.data.data) businessSlug.value = bRes.data.data.slug
    const servicesList = svcRes.data.success && svcRes.data.data ? svcRes.data.data : []
    allServices.value = servicesList
    baseStats.value.services = servicesList.length
    baseStats.value.customers = customersList.length
    const map = new Map<number, string>()
    for (const c of customersList as CustomerResponse[]) map.set(c.id, c.name)
    customerMap.value = map
    baseStats.value.employees = employeesList.length
    todayAppointments.value = todayList as AppointmentResponse[]
  } catch {
    loadError.value = true
  } finally {
    baseLoading.value = false
  }
}

async function reload() {
  loadError.value = false
  await Promise.all([loadBaseData(), loadPeriodStats()])
}

watch(period, async () => {
  await loadPeriodStats()
})

onMounted(async () => {
  if (!businessId.value) {
    baseLoading.value = false
    statsLoading.value = false
    return
  }
  await Promise.all([loadBaseData(), loadPeriodStats()])
  initialLoad.value = false
})
</script>
