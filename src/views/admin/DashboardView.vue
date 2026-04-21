<template>
  <div class="space-y-6">
    <SetupProgressBanner />

    <!-- Header with period toggle -->
    <SectionHeader :title="welcomeTitle" :subtitle="periodLead">
      <template #actions>
        <div
          v-if="businessId"
          class="period-toggle"
          role="radiogroup"
          :aria-label="t('dashboard.period.label')"
        >
          <button
            v-for="p in PERIODS"
            :key="p.value"
            type="button"
            role="radio"
            :aria-checked="period === p.value"
            class="period-toggle__item"
            :class="{ 'period-toggle__item--active': period === p.value }"
            @click="selectPeriod(p.value)"
          >
            {{ t(p.labelKey) }}
          </button>
        </div>

        <AppButton
          v-if="businessId"
          variant="secondary"
          size="sm"
          :disabled="baseLoading || (statsLoading && initialLoad)"
          @click="downloadReport"
        >
          <Download :size="14" aria-hidden="true" />
          <span>{{ t('dashboard.downloadReport') }}</span>
        </AppButton>

        <RouterLink v-if="businessId" v-slot="{ navigate }" custom to="/admin/appointments">
          <AppButton variant="primary" size="sm" @click="navigate">
            <Plus :size="14" aria-hidden="true" />
            <span>{{ t('dashboard.newAppointment') }}</span>
          </AppButton>
        </RouterLink>
      </template>
    </SectionHeader>

    <!-- No business warning -->
    <div
      v-if="!businessId"
      class="card"
      style="background: var(--warning-tint); border-color: var(--warning)"
    >
      <div class="flex items-start gap-3">
        <div
          class="flex size-10 shrink-0 items-center justify-center rounded-full"
          style="background: var(--warning)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div class="flex-1 text-sm" style="color: var(--warning)">
          <p class="font-semibold">{{ t('dashboard.noBusiness') }}</p>
          <p class="mt-1">
            <RouterLink to="/admin/settings" class="underline">{{ t('nav.settings') }}</RouterLink>
            {{ t('dashboard.checkBusiness') }}
          </p>
        </div>
      </div>
    </div>

    <template v-else>
      <!-- Load error -->
      <div
        v-if="loadError"
        class="card"
        style="background: var(--danger-tint); border-color: var(--danger)"
        role="alert"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-sm font-medium" style="color: var(--danger)">
            {{ t('dashboard.loadError') }}
          </p>
          <AppButton variant="secondary" size="sm" @click="reload">{{
            t('common.retry')
          }}</AppButton>
        </div>
      </div>

      <!-- Hero Banner - Next appointment -->
      <HeroBanner
        v-if="!baseLoading"
        tone="teal"
        :eyebrow="t('dashboard.heroNext.title')"
        :title="
          todayAppointments.length > 0
            ? `${formatTime(todayAppointments[0].scheduledAt)} · ${resolveCustomerName(todayAppointments[0].customerId)}`
            : t('dashboard.heroNext.empty')
        "
        :subtitle="
          todayAppointments.length > 0
            ? activeServices.find((s) => s.id === todayAppointments[0].serviceId)?.name ?? ''
            : ''
        "
      />

      <!-- 6x KPI Cards -->
      <section
        class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        :aria-busy="statsLoading"
      >
        <KpiCard
          :icon="CalendarCheck"
          :label="t('dashboard.kpi.total')"
          :value="periodStats.totalAppointments"
          tint="primary"
          :loading="statsLoading && initialLoad"
          :aria-label="`${periodStats.totalAppointments} ${t('dashboard.kpi.total')}`"
        />

        <KpiCard
          :icon="Clock"
          :label="t('dashboard.kpi.pending')"
          :value="periodStats.pendingCount"
          tint="warning"
          :loading="statsLoading && initialLoad"
          :aria-label="`${periodStats.pendingCount} ${t('dashboard.kpi.pending')}`"
        />

        <KpiCard
          :icon="CheckCircle"
          :label="t('dashboard.kpi.completed')"
          :value="periodStats.completedCount"
          tint="success"
          :loading="statsLoading && initialLoad"
          :aria-label="`${periodStats.completedCount} ${t('dashboard.kpi.completed')}`"
        />

        <KpiCard
          :icon="UserX"
          :label="t('dashboard.kpi.noShowRate')"
          :value="noShowDisplay"
          tint="danger"
          :loading="statsLoading && initialLoad"
          :aria-label="`${noShowDisplay} ${t('dashboard.kpi.noShowRate')}`"
        />

        <KpiCard
          :icon="List"
          :label="t('dashboard.kpi.servicesActive')"
          :value="baseStats.services"
          tint="info"
          :loading="baseLoading"
          :aria-label="`${baseStats.services} ${t('dashboard.kpi.servicesActive')}`"
        />

        <KpiCard
          :icon="Users"
          :label="t('dashboard.kpi.activeCustomers')"
          :value="baseStats.customers"
          tint="violet"
          :loading="baseLoading"
          :aria-label="`${baseStats.customers} ${t('dashboard.kpi.activeCustomers')}`"
        />
      </section>

      <!-- Today's flow & Price list -->
      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Today's flow -->
        <div class="section">
          <SectionHeader :title="t('dashboard.todaySection')" :subtitle="todayMetaText">
            <template #actions>
              <RouterLink to="/admin/calendar" class="btn small">
                {{ t('dashboard.gotoCalendar') }}
              </RouterLink>
            </template>
          </SectionHeader>

          <div class="card today-flow-card">
            <div v-if="baseLoading" class="space-y-2 p-4">
              <AppSkeleton v-for="i in 3" :key="i" variant="line" height="3.5rem" />
            </div>

            <AppEmptyState
              v-else-if="todayAppointments.length === 0"
              :title="t('dashboard.noAppointmentsToday')"
              class="border-0"
              style="background: var(--surface-2)"
            >
              <template #action>
                <RouterLink to="/admin/appointments" class="btn small primary">
                  {{ t('dashboard.createAppointment') }}
                </RouterLink>
              </template>
            </AppEmptyState>

            <ul v-else class="today-flow-list">
              <li
                v-for="a in todayAppointments.slice(0, TODAY_FLOW_VISIBLE)"
                :key="a.id"
                class="today-flow-item"
              >
                <div class="today-flow-time">
                  <span class="mono today-flow-time-main">{{ formatTime(a.scheduledAt) }}</span>
                  <span class="today-flow-time-dur">
                    {{ formatDuration(getAppointmentDurationMinutes(a)) }}
                  </span>
                </div>

                <span
                  class="today-flow-accent"
                  :style="{ background: statusAccent(a.status) }"
                  aria-hidden="true"
                />

                <span
                  class="today-flow-avatar"
                  aria-hidden="true"
                  :title="resolveCustomerName(a.customerId)"
                >
                  {{ getInitials(resolveCustomerName(a.customerId)) }}
                </span>

                <div class="today-flow-info">
                  <p class="today-flow-name">{{ resolveCustomerName(a.customerId) }}</p>
                  <p class="today-flow-sub">
                    {{ resolveServiceName(a.serviceId) }}
                    <span class="today-flow-employee"> · {{ resolveEmployeeName(a.employeeId) }}</span>
                  </p>
                </div>

                <StatusPill :status="a.status" :label="statusLabel(a.status)" size="xs" />

                <RouterLink
                  :to="`/admin/appointments?id=${a.id}`"
                  class="today-flow-chevron"
                  :aria-label="t('dashboard.openAppointment')"
                >
                  <ChevronRight :size="16" />
                </RouterLink>
              </li>

              <li v-if="todayAppointments.length > TODAY_FLOW_VISIBLE" class="today-flow-more">
                {{
                  t('dashboard.moreAppointments', {
                    count: todayAppointments.length - TODAY_FLOW_VISIBLE,
                  })
                }}
                <RouterLink
                  to="/admin/appointments"
                  class="font-medium hover:underline"
                  style="color: var(--primary)"
                >
                  {{ t('dashboard.seeAll') }}
                </RouterLink>
              </li>
            </ul>
          </div>
        </div>

        <!-- Price list -->
        <div class="section">
          <SectionHeader :title="t('dashboard.priceList')">
            <template #actions>
              <RouterLink
                to="/admin/services"
                class="text-sm font-medium hover:underline"
                style="color: var(--primary)"
              >
                {{ t('common.edit') }}
              </RouterLink>
            </template>
          </SectionHeader>

          <div class="card">
            <div v-if="baseLoading" class="space-y-2">
              <AppSkeleton v-for="i in 3" :key="i" variant="line" height="2.25rem" />
            </div>

            <AppEmptyState
              v-else-if="activeServices.length === 0"
              :title="t('dashboard.noActiveServices')"
              class="border-0"
              style="background: var(--surface-2)"
            >
              <template #action>
                <RouterLink to="/admin/services" class="btn small primary">
                  {{ t('dashboard.addService') }}
                </RouterLink>
              </template>
            </AppEmptyState>

            <ul v-else class="divide-y" style="border-color: var(--hairline)">
              <li
                v-for="s in activeServices"
                :key="s.id"
                class="flex items-start justify-between gap-2 py-2.5"
              >
                <div class="min-w-0">
                  <p class="truncate font-medium" style="color: var(--ink-1)">{{ s.name }}</p>
                  <p class="text-xs" style="color: var(--ink-4)">
                    {{ t('dashboard.minutesShort', { n: s.durationMinutes }) }}
                  </p>
                </div>
                <span class="mono shrink-0 font-semibold" style="color: var(--primary)">
                  {{ formatPrice(s.price) }} {{ s.currency }}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <section v-if="businessId && !(statsLoading && initialLoad)" class="section">
        <SectionHeader :title="t('dashboard.chartsTitle')">
          <template #actions>
            <span class="text-sm" style="color: var(--ink-4)">{{ periodLead }}</span>
          </template>
        </SectionHeader>

        <div class="grid gap-4 lg:grid-cols-2">
          <div class="card">
            <h3 class="title mb-4" style="color: var(--ink-1)">{{ t('dashboard.chartTrend') }}</h3>
            <ApexChart
              type="area"
              height="280"
              :options="trendChartOptions"
              :series="trendChartSeries"
            />
          </div>

          <div class="card">
            <h3 class="title mb-4" style="color: var(--ink-1)">{{ t('dashboard.chartServices') }}</h3>
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
              class="border-0"
              style="background: var(--surface-2)"
            />
          </div>

          <div class="card lg:col-span-2">
            <h3 class="title mb-4" style="color: var(--ink-1)">{{ t('dashboard.chartHours') }}</h3>
            <ApexChart
              type="bar"
              height="260"
              :options="hourBarOptions"
              :series="hourBarSeries"
            />
          </div>
        </div>
      </section>

      <!-- Top Services + Customer Stats -->
      <div
        v-if="businessId && !(extendedLoading && initialLoad)"
        class="grid gap-4 lg:grid-cols-2"
      >
        <!-- Top Services -->
        <div class="section">
          <SectionHeader :title="t('dashboard.topServices.title')" />
          <div class="card">
            <div v-if="extendedLoading && !topServices" class="space-y-2">
              <AppSkeleton v-for="i in 4" :key="i" variant="line" height="2.25rem" />
            </div>

            <AppEmptyState
              v-else-if="!topServices?.services?.length"
              :title="t('dashboard.topServices.empty')"
              class="border-0"
              style="background: var(--surface-2)"
            />

            <ul v-else class="divide-y" style="border-color: var(--hairline)">
              <li
                v-for="(svc, idx) in topServices.services"
                :key="svc.serviceId"
                class="flex items-center gap-3 py-2.5"
              >
                <span
                  class="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  :style="
                    idx === 0
                      ? { background: 'var(--primary-tint)', color: 'var(--primary)' }
                      : { background: 'var(--surface-2)', color: 'var(--ink-4)' }
                  "
                >
                  {{ idx + 1 }}
                </span>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium" style="color: var(--ink-1)">
                    {{ svc.serviceName }}
                  </p>
                  <div class="mt-0.5 flex items-center gap-2">
                    <div
                      class="h-1.5 flex-1 overflow-hidden rounded-full"
                      style="background: var(--surface-2)"
                    >
                      <div
                        class="h-full rounded-full transition-all"
                        :style="{
                          width: `${svc.completionRate}%`,
                          background: 'var(--primary)'
                        }"
                      />
                    </div>
                    <span class="shrink-0 text-xs" style="color: var(--ink-4)">
                      {{ svc.completionRate }}%
                    </span>
                  </div>
                </div>
                <div class="shrink-0 text-right">
                  <p class="mono text-sm font-semibold" style="color: var(--ink-1)">
                    {{ t('dashboard.appointmentCount', { n: svc.totalAppointments }) }}
                  </p>
                  <p class="text-xs" style="color: var(--success)">
                    +{{ formatPrice(svc.totalRevenue) }} ₺
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <!-- Customer Stats -->
        <div class="section">
          <SectionHeader :title="t('dashboard.customerStats.title')" />
          <div class="card">
            <div v-if="extendedLoading && !customerStats" class="space-y-2">
              <AppSkeleton v-for="i in 4" :key="i" variant="line" height="2.25rem" />
            </div>

            <template v-else-if="customerStats">
              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-lg p-3 text-center" style="background: var(--primary-tint)">
                  <p class="mono text-2xl font-bold" style="color: var(--primary)">
                    {{ customerStats.totalCustomers }}
                  </p>
                  <p class="text-xs" style="color: var(--primary)">
                    {{ t('dashboard.customerStats.total') }}
                  </p>
                </div>
                <div class="rounded-lg p-3 text-center" style="background: var(--success-tint)">
                  <p class="mono text-2xl font-bold" style="color: var(--success)">
                    {{ customerStats.newCustomersInPeriod }}
                  </p>
                  <p class="text-xs" style="color: var(--success)">
                    {{ t('dashboard.customerStats.newInPeriod', { lead: periodLead }) }}
                  </p>
                </div>
                <div
                  class="rounded-lg p-3 text-center"
                  style="background: color-mix(in oklab, var(--niche-tattoo) 12%, transparent)"
                >
                  <p class="mono text-2xl font-bold" style="color: var(--niche-tattoo)">
                    {{ Math.round(customerStats.returnRate) }}%
                  </p>
                  <p class="text-xs" style="color: var(--niche-tattoo)">
                    {{ t('dashboard.customerStats.returnRate') }}
                  </p>
                </div>
                <div class="rounded-lg p-3 text-center" style="background: var(--danger-tint)">
                  <p class="mono text-2xl font-bold" style="color: var(--danger)">
                    {{ customerStats.blacklistedCount }}
                  </p>
                  <p class="text-xs" style="color: var(--danger)">
                    {{ t('dashboard.customerStats.blacklisted') }}
                  </p>
                </div>
              </div>

              <div v-if="customerStats.topCustomers?.length" class="mt-4">
                <p class="caption mb-2" style="color: var(--ink-4)">
                  {{ t('dashboard.customerStats.topCustomers') }}
                </p>
                <ul class="divide-y" style="border-color: var(--hairline)">
                  <li
                    v-for="c in customerStats.topCustomers"
                    :key="c.customerId"
                    class="flex items-center justify-between gap-2 py-2"
                  >
                    <RouterLink
                      :to="`/admin/customers`"
                      class="min-w-0 truncate text-sm hover:underline"
                      style="color: var(--ink-2)"
                    >
                      {{ c.name }}
                    </RouterLink>
                    <span class="mono shrink-0 text-xs" style="color: var(--ink-4)">
                      {{ t('dashboard.appointmentCount', { n: c.appointmentCount }) }}
                    </span>
                  </li>
                </ul>
              </div>
            </template>

            <AppEmptyState
              v-else
              :title="t('dashboard.customerStats.empty')"
              class="border-0"
              style="background: var(--surface-2)"
            />
          </div>
        </div>
      </div>

      <!-- Package Usage Alerts -->
      <div
        v-if="
          businessId &&
          packageUsage &&
          (packageUsage.lowSessionPackages > 0 || packageUsage.expiringPackages > 0)
        "
        class="section"
      >
        <SectionHeader :title="t('dashboard.packageAlerts.title')" />
        <div class="card">
          <div class="mb-4 flex flex-wrap gap-3">
            <div class="flex items-center gap-2 rounded-lg px-3 py-2" style="background: var(--warning-tint)">
              <span class="mono text-lg font-bold" style="color: var(--warning)">
                {{ packageUsage.lowSessionPackages }}
              </span>
              <span class="text-xs" style="color: var(--warning)">
                {{ t('dashboard.packageAlerts.lowSession') }}
              </span>
            </div>
            <div class="flex items-center gap-2 rounded-lg px-3 py-2" style="background: var(--danger-tint)">
              <span class="mono text-lg font-bold" style="color: var(--danger)">
                {{ packageUsage.expiringPackages }}
              </span>
              <span class="text-xs" style="color: var(--danger)">
                {{ t('dashboard.packageAlerts.expiring') }}
              </span>
            </div>
            <div class="flex items-center gap-2 rounded-lg px-3 py-2" style="background: var(--surface-2)">
              <span class="mono text-lg font-bold" style="color: var(--ink-2)">
                {{ packageUsage.totalActivePackages }}
              </span>
              <span class="text-xs" style="color: var(--ink-3)">
                {{ t('dashboard.packageAlerts.activeTotal') }}
              </span>
            </div>
          </div>

          <ul class="divide-y" style="border-color: var(--hairline)">
            <li
              v-for="pkg in packageUsage.packages.filter((p) => p.isLow || p.isExpiring).slice(0, 6)"
              :key="pkg.packageId"
              class="flex flex-wrap items-center gap-2 py-2.5"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium" style="color: var(--ink-1)">
                  {{ pkg.customerName }}
                </p>
                <p class="text-xs" style="color: var(--ink-4)">{{ pkg.serviceName }}</p>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <span class="mono text-sm" style="color: var(--ink-2)">
                  {{
                    t('dashboard.packageAlerts.sessionsShort', {
                      remaining: pkg.remainingSessions,
                      total: pkg.totalSessions,
                    })
                  }}
                </span>
                <span
                  v-if="pkg.isExpiring"
                  class="rounded-full px-2 py-0.5 text-[0.65rem] font-semibold"
                  style="background: var(--danger-tint); color: var(--danger)"
                >
                  {{ t('dashboard.packageAlerts.expiringTag') }}
                </span>
                <span
                  v-else-if="pkg.isLow"
                  class="rounded-full px-2 py-0.5 text-[0.65rem] font-semibold"
                  style="background: var(--warning-tint); color: var(--warning)"
                >
                  {{ t('dashboard.packageAlerts.lowTag') }}
                </span>
              </div>
            </li>
          </ul>

          <RouterLink
            to="/admin/packages"
            class="mt-3 block text-sm font-medium hover:underline"
            style="color: var(--primary)"
          >
            {{ t('dashboard.packageAlerts.viewAll') }}
          </RouterLink>
        </div>
      </div>

      <!-- Public Booking Link -->
      <div v-if="businessSlug && !baseLoading" class="section">
        <SectionHeader
          :title="t('dashboard.bookingPageTitle')"
          :subtitle="t('dashboard.bookingPageDesc')"
        />
        <div class="card">
          <div
            class="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
            style="border-color: var(--hairline); background: var(--surface-2)"
          >
            <code class="mono min-w-0 flex-1 truncate text-xs" style="color: var(--ink-2)">
              {{ publicUrl }}
            </code>
            <div class="flex flex-wrap gap-2">
              <a :href="publicUrl" target="_blank" rel="noopener" class="btn small">
                {{ t('common.preview') }}
              </a>
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
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import ApexChart from 'vue3-apexcharts'
import {
  CalendarCheck,
  UserX,
  Clock,
  CheckCircle,
  List,
  Users,
  ChevronRight,
  Download,
  Plus,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { getInitials, getAppointmentDurationMinutes } from '@/composables/useCalendarUtils'
import { downloadCsv, buildSectionedCsv, type CsvCell } from '@/utils/csvExport'
import { businessApi } from '@/api/business'
import { serviceApi, type ServiceResponse } from '@/api/service'
import { customerApi, type CustomerResponse } from '@/api/customer'
import { employeeApi, type EmployeeResponse } from '@/api/employee'
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
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppButton from '@/components/ui/AppButton.vue'
import SetupProgressBanner from '@/components/setup/SetupProgressBanner.vue'
import KpiCard from '@/components/ui/KpiCard.vue'
import HeroBanner from '@/components/ui/HeroBanner.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import StatusPill from '@/components/ui/StatusPill.vue'

const { t } = useI18n()
const auth = useAuthStore()
const businessId = computed(() => auth.user?.businessId ?? null)

const PERIODS: { value: DashboardPeriod; labelKey: string }[] = [
  { value: 'DAILY', labelKey: 'dashboard.period.daily' },
  { value: 'WEEKLY', labelKey: 'dashboard.period.weekly' },
  { value: 'MONTHLY', labelKey: 'dashboard.period.monthly' },
]

const MINUTES_PER_HOUR = 60
const TODAY_FLOW_VISIBLE = 7

const STATUS_ACCENT: Record<string, string> = {
  CONFIRMED: 'var(--success)',
  PENDING: 'var(--warning)',
  COMPLETED: 'var(--primary)',
  NO_SHOW: 'var(--danger)',
  CANCELLED: 'var(--ink-4)',
}

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
const employeeMap = ref<Map<number, string>>(new Map())

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
const copyAria = computed(() => copyLabel.value)

const PERIOD_LEAD_KEY: Record<DashboardPeriod, string> = {
  DAILY: 'dashboard.period.lead.daily',
  WEEKLY: 'dashboard.period.lead.weekly',
  MONTHLY: 'dashboard.period.lead.monthly',
}

const periodLead = computed(() => t(PERIOD_LEAD_KEY[period.value]))

function statusLabel(status: AppointmentResponse['status']): string {
  return t(`appointmentStatus.${status}`)
}

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
  colors: ['#0D7A8F'], // var(--primary)
  xaxis: {
    categories:
      periodStats.value.trendData.length > 0
        ? periodStats.value.trendData.map((p) => formatDateLabel(p.date))
        : ['—'],
    labels: { style: { fontSize: '11px' } },
  },
  yaxis: { min: 0, labels: { formatter: (v: number) => String(Math.round(v)) } },
  grid: { strokeDashArray: 4, borderColor: '#E5E2DA' }, // var(--hairline) approx
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
    colors: ['#0D7A8F', '#8B5CF6', '#EC4899', '#22C55E', '#F59E0B', '#3B82F6'], // primary, violet, pink, green, orange, blue
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
  colors: ['#14B8A6'], // teal-500
  xaxis: {
    categories: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    labels: { style: { fontSize: '10px' } },
  },
  yaxis: { min: 0, labels: { formatter: (v: number) => String(Math.round(v)) } },
  grid: { strokeDashArray: 4, borderColor: '#E5E2DA' },
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

function resolveEmployeeName(id: number): string {
  return employeeMap.value.get(id) ?? t('dashboard.employeeFallback', { id })
}

function resolveServiceName(id: number): string {
  return allServices.value.find((s) => s.id === id)?.name ?? t('dashboard.serviceFallback', { id })
}

function formatDuration(minutes: number): string {
  if (minutes < MINUTES_PER_HOUR) {
    return t('dashboard.appointmentDuration', { minutes })
  }
  const hours = Math.floor(minutes / MINUTES_PER_HOUR)
  const remaining = minutes % MINUTES_PER_HOUR
  return t('dashboard.appointmentDurationHours', { hours, minutes: remaining })
}

function statusAccent(status: AppointmentResponse['status']): string {
  return STATUS_ACCENT[status] ?? 'var(--primary)'
}

const todayActiveEmployeeCount = computed(() => {
  const ids = new Set(todayAppointments.value.map((a) => a.employeeId))
  return ids.size
})

const todayMetaText = computed(() =>
  t('dashboard.todayMeta', {
    count: todayAppointments.value.length,
    employees: todayActiveEmployeeCount.value,
  }),
)

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

function buildKpiSection(): CsvCell[][] {
  const h = t('dashboard.report.headers.metric')
  const v = t('dashboard.report.headers.value')
  return [
    [h, v],
    [t('dashboard.kpi.total'), periodStats.value.totalAppointments],
    [t('dashboard.kpi.pending'), periodStats.value.pendingCount],
    [t('dashboard.kpi.completed'), periodStats.value.completedCount],
    [t('dashboard.kpi.noShowRate'), noShowDisplay.value],
    [t('dashboard.kpi.servicesActive'), baseStats.value.services],
    [t('dashboard.kpi.activeCustomers'), baseStats.value.customers],
  ]
}

function buildTodaySection(): CsvCell[][] {
  const headers = [
    t('dashboard.report.headers.time'),
    t('dashboard.report.headers.customer'),
    t('dashboard.report.headers.service'),
    t('dashboard.report.headers.employee'),
    t('dashboard.report.headers.status'),
  ]
  const rows: CsvCell[][] = todayAppointments.value.map((a) => [
    formatTime(a.scheduledAt),
    resolveCustomerName(a.customerId),
    resolveServiceName(a.serviceId),
    resolveEmployeeName(a.employeeId),
    statusLabel(a.status),
  ])
  return [headers, ...rows]
}

function buildTopServicesSection(): CsvCell[][] {
  const headers = [
    t('dashboard.report.headers.rank'),
    t('dashboard.report.headers.service'),
    t('dashboard.report.headers.appointments'),
    t('dashboard.report.headers.completionRate'),
    t('dashboard.report.headers.revenue'),
  ]
  const services = topServices.value?.services ?? []
  const rows: CsvCell[][] = services.map((s, idx) => [
    idx + 1,
    s.serviceName,
    s.totalAppointments,
    `${s.completionRate}%`,
    formatPrice(s.totalRevenue),
  ])
  return [headers, ...rows]
}

function buildCustomerStatsSection(): CsvCell[][] {
  const stats = customerStats.value
  if (!stats) return []
  return [
    [t('dashboard.report.headers.metric'), t('dashboard.report.headers.value')],
    [t('dashboard.customerStats.total'), stats.totalCustomers],
    [t('dashboard.customerStats.newInPeriod', { lead: periodLead.value }), stats.newCustomersInPeriod],
    [t('dashboard.customerStats.returnRate'), `${Math.round(stats.returnRate)}%`],
    [t('dashboard.customerStats.blacklisted'), stats.blacklistedCount],
  ]
}

function buildReportFilename(): string {
  const today = new Date()
  const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return `${t('dashboard.report.filenamePrefix')}_${period.value.toLowerCase()}_${ymd}.csv`
}

function downloadReport() {
  const sections = [
    { title: t('dashboard.report.kpiSection'), rows: buildKpiSection() },
    { title: t('dashboard.report.todaySection'), rows: buildTodaySection() },
  ]
  if (topServices.value?.services?.length) {
    sections.push({
      title: t('dashboard.report.topServicesSection'),
      rows: buildTopServicesSection(),
    })
  }
  const customerRows = buildCustomerStatsSection()
  if (customerRows.length > 0) {
    sections.push({
      title: t('dashboard.report.customerStatsSection'),
      rows: customerRows,
    })
  }
  downloadCsv(buildReportFilename(), buildSectionedCsv(sections))
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
    const empMap = new Map<number, string>()
    for (const e of employeesList as EmployeeResponse[]) empMap.set(e.id, e.name)
    employeeMap.value = empMap
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

<style scoped>
.period-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: var(--r-md);
  border: 1px solid var(--hairline);
  background: var(--surface);
  box-shadow: var(--shadow-1);
  flex-shrink: 0;
}

.period-toggle__item {
  border: 0;
  background: transparent;
  color: var(--ink-3);
  font-size: 13px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: var(--r-sm);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.period-toggle__item:hover {
  background: var(--surface-2);
  color: var(--ink-1);
}

.period-toggle__item:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 1px;
}

.period-toggle__item--active,
.period-toggle__item--active:hover {
  background: var(--primary);
  color: #fff;
}

.today-flow-card {
  padding: 0;
  overflow: hidden;
}

.today-flow-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.today-flow-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--hairline);
}

.today-flow-item:last-child {
  border-bottom: 0;
}

.today-flow-time {
  display: flex;
  flex-direction: column;
  min-width: 56px;
  flex-shrink: 0;
}

.today-flow-time-main {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink-1);
  line-height: 1.2;
}

.today-flow-time-dur {
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-4);
  margin-top: 2px;
}

.today-flow-accent {
  width: 3px;
  height: 36px;
  border-radius: 2px;
  flex-shrink: 0;
}

.today-flow-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--primary-tint);
  color: var(--primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
  text-transform: uppercase;
}

.today-flow-info {
  flex: 1;
  min-width: 0;
}

.today-flow-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-1);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.today-flow-sub {
  font-size: 12px;
  color: var(--ink-3);
  margin: 2px 0 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.today-flow-employee {
  color: var(--ink-4);
}

.today-flow-chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--r-sm);
  color: var(--ink-3);
  flex-shrink: 0;
  transition: background 0.15s ease, color 0.15s ease;
}

.today-flow-chevron:hover {
  background: var(--surface-2);
  color: var(--ink-1);
}

.today-flow-chevron:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 1px;
}

.today-flow-more {
  padding: 12px 16px;
  font-size: 13px;
  color: var(--ink-3);
  display: flex;
  align-items: center;
  gap: 6px;
}

@media (max-width: 480px) {
  .today-flow-item {
    flex-wrap: wrap;
    row-gap: 8px;
  }
  .today-flow-info {
    flex-basis: 100%;
    order: 5;
  }
}
</style>
