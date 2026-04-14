<template>
  <div class="space-y-6">
    <!-- Page Title -->
    <div>
      <h1 class="text-2xl font-bold text-white">Platform Dashboard</h1>
      <p class="mt-1 text-sm text-gray-400">Tüm işletmelerin genel durumu</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="size-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
    </div>

    <template v-else>
      <!-- Overview Stats Cards -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="stat in overviewCards"
          :key="stat.label"
          class="rounded-xl border border-gray-800 bg-gray-800/50 p-5 backdrop-blur"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex size-10 items-center justify-center rounded-lg"
              :class="stat.iconBg"
            >
              <component :is="stat.icon" class="size-5 text-white" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-medium text-gray-400">{{ stat.label }}</p>
              <p class="text-2xl font-bold text-white">{{ stat.value }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Subscription Breakdown -->
        <div class="rounded-xl border border-gray-800 bg-gray-800/50 p-5">
          <h2 class="mb-4 text-sm font-semibold text-gray-300">Abonelik Dağılımı</h2>
          <div v-if="overview" class="flex items-center gap-6">
            <div class="w-48 shrink-0">
              <apexchart
                type="donut"
                height="200"
                :options="subscriptionChartOptions"
                :series="subscriptionChartSeries"
              />
            </div>
            <div class="space-y-3 text-sm">
              <div v-for="item in subscriptionLegend" :key="item.label" class="flex items-center gap-2">
                <div class="size-3 rounded-full" :class="item.dotClass" />
                <span class="text-gray-400">{{ item.label }}</span>
                <span class="ml-auto font-semibold text-white">{{ item.value }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Revenue by Plan -->
        <div class="rounded-xl border border-gray-800 bg-gray-800/50 p-5">
          <h2 class="mb-4 text-sm font-semibold text-gray-300">Plan Bazlı Gelir (Aylık)</h2>
          <div v-if="revenue">
            <apexchart
              type="bar"
              height="200"
              :options="revenueChartOptions"
              :series="revenueChartSeries"
            />
            <div class="mt-3 flex items-center justify-between border-t border-gray-700 pt-3">
              <span class="text-sm text-gray-400">Toplam Potansiyel</span>
              <span class="text-lg font-bold text-emerald-400">₺{{ formatNumber(revenue.totalMonthlyPotential) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Registration Trend -->
      <div class="rounded-xl border border-gray-800 bg-gray-800/50 p-5">
        <h2 class="mb-4 text-sm font-semibold text-gray-300">Son 30 Gün — Yeni Kayıtlar</h2>
        <apexchart
          v-if="overview"
          type="area"
          height="250"
          :options="trendChartOptions"
          :series="trendChartSeries"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Building2, Users, UserCircle, CreditCard } from 'lucide-vue-next'
import { superadminApi, type SuperAdminOverviewResponse, type SuperAdminRevenueResponse } from '@/api/superadmin'

const loading = ref(true)
const overview = ref<SuperAdminOverviewResponse | null>(null)
const revenue = ref<SuperAdminRevenueResponse | null>(null)

onMounted(async () => {
  try {
    const [overviewRes, revenueRes] = await Promise.all([
      superadminApi.getOverview(),
      superadminApi.getRevenue(),
    ])
    if (overviewRes.data.success) overview.value = overviewRes.data.data!
    if (revenueRes.data.success) revenue.value = revenueRes.data.data!
  } finally {
    loading.value = false
  }
})

function formatNumber(val: number): string {
  return new Intl.NumberFormat('tr-TR').format(val)
}

const overviewCards = computed(() => {
  if (!overview.value) return []
  const o = overview.value
  return [
    { label: 'Toplam İşletme', value: formatNumber(o.totalBusinesses), icon: Building2, iconBg: 'bg-indigo-600' },
    { label: 'Aktif İşletme', value: formatNumber(o.activeBusinesses), icon: Building2, iconBg: 'bg-emerald-600' },
    { label: 'Toplam Kullanıcı', value: formatNumber(o.totalUsers), icon: Users, iconBg: 'bg-sky-600' },
    { label: 'Toplam Çalışan', value: formatNumber(o.totalEmployees), icon: UserCircle, iconBg: 'bg-amber-600' },
  ]
})

const subscriptionLegend = computed(() => {
  if (!overview.value) return []
  const s = overview.value.subscriptionBreakdown
  return [
    { label: 'Trial', value: s.trialCount, dotClass: 'bg-sky-400' },
    { label: 'Aktif', value: s.activeCount, dotClass: 'bg-emerald-400' },
    { label: 'Süresi Dolmuş', value: s.expiredCount, dotClass: 'bg-gray-500' },
    { label: 'Askıda', value: s.suspendedCount, dotClass: 'bg-red-400' },
  ]
})

const subscriptionChartSeries = computed(() => {
  if (!overview.value) return []
  const s = overview.value.subscriptionBreakdown
  return [s.trialCount, s.activeCount, s.expiredCount, s.suspendedCount]
})

const subscriptionChartOptions = computed(() => ({
  chart: { type: 'donut' as const, background: 'transparent' },
  labels: ['Trial', 'Aktif', 'Süresi Dolmuş', 'Askıda'],
  colors: ['#38bdf8', '#34d399', '#6b7280', '#f87171'],
  stroke: { width: 0 },
  dataLabels: { enabled: false },
  legend: { show: false },
  plotOptions: {
    pie: {
      donut: {
        size: '70%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Toplam',
            color: '#9ca3af',
            formatter: () => String(overview.value?.totalBusinesses ?? 0),
          },
        },
      },
    },
  },
  tooltip: { theme: 'dark' },
}))

const revenueChartSeries = computed(() => {
  if (!revenue.value) return []
  return [{
    name: 'Aylık Gelir (₺)',
    data: revenue.value.planBreakdown.map(p => p.totalRevenue),
  }]
})

const revenueChartOptions = computed(() => ({
  chart: { type: 'bar' as const, background: 'transparent', toolbar: { show: false } },
  xaxis: {
    categories: revenue.value?.planBreakdown.map(p => p.planCode) ?? [],
    labels: { style: { colors: '#9ca3af' } },
  },
  yaxis: {
    labels: {
      style: { colors: '#9ca3af' },
      formatter: (v: number) => `₺${formatNumber(v)}`,
    },
  },
  colors: ['#818cf8'],
  plotOptions: {
    bar: { borderRadius: 6, columnWidth: '50%' },
  },
  dataLabels: { enabled: false },
  grid: { borderColor: '#374151', strokeDashArray: 4 },
  tooltip: { theme: 'dark' },
}))

const trendChartSeries = computed(() => {
  if (!overview.value) return []
  return [{
    name: 'Yeni Kayıt',
    data: overview.value.registrationTrend.map(t => t.count),
  }]
})

const trendChartOptions = computed(() => ({
  chart: { type: 'area' as const, background: 'transparent', toolbar: { show: false }, sparkline: { enabled: false } },
  xaxis: {
    categories: overview.value?.registrationTrend.map(t => t.date.slice(5)) ?? [],
    labels: { style: { colors: '#6b7280', fontSize: '10px' }, rotate: -45 },
    tickAmount: 10,
  },
  yaxis: {
    labels: { style: { colors: '#9ca3af' } },
    min: 0,
  },
  colors: ['#818cf8'],
  fill: {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] },
  },
  stroke: { curve: 'smooth' as const, width: 2 },
  dataLabels: { enabled: false },
  grid: { borderColor: '#374151', strokeDashArray: 4 },
  tooltip: { theme: 'dark' },
}))
</script>
