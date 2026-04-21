<template>
  <div class="space-y-6">
    <!-- Back -->
    <button
      class="flex items-center gap-1 text-sm text-gray-400 transition hover:text-white"
      @click="router.push({ name: 'SuperAdminBusinesses' })"
    >
      <ArrowLeft class="size-4" />
      İşletmelere Dön
    </button>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="size-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
    </div>

    <template v-if="detail">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white">{{ detail.businessName }}</h1>
          <p class="mt-1 text-sm text-gray-400">{{ detail.slug }} · {{ detail.category }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
            :class="statusBadgeClass(detail.status)"
          >
            {{ detail.status }}
          </span>
          <span
            class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
            :class="subStatusBadgeClass(detail.subscriptionStatus)"
          >
            {{ subStatusLabel(detail.subscriptionStatus) }}
          </span>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <!-- Owner Info -->
        <div class="rounded-xl border border-gray-800 bg-gray-800/50 p-5">
          <h3 class="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-gray-400">
            <UserCircle class="size-4" /> Sahip Bilgisi
          </h3>
          <p class="font-medium text-white">{{ detail.ownerName }}</p>
          <p class="mt-1 text-sm text-gray-400">{{ detail.ownerEmail }}</p>
          <p class="mt-2 text-xs text-gray-500">Kayıt: {{ formatDate(detail.registeredAt) }}</p>
        </div>

        <!-- Subscription Info -->
        <div class="rounded-xl border border-gray-800 bg-gray-800/50 p-5">
          <h3 class="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-gray-400">
            <CreditCard class="size-4" /> Abonelik
          </h3>
          <div class="flex items-center gap-2">
            <span class="text-lg font-bold text-white">{{ detail.planCode }}</span>
            <span v-if="detail.manual" class="rounded bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-300">Manuel</span>
          </div>
          <p class="mt-1 text-sm text-gray-400">
            {{ detail.currentPeriodStart ? formatDate(detail.currentPeriodStart) : '—' }}
            →
            {{ detail.currentPeriodEnd ? formatDate(detail.currentPeriodEnd) : '—' }}
          </p>
          <p v-if="detail.trialEndDate" class="mt-1 text-xs text-sky-400">
            Trial bitiş: {{ formatDate(detail.trialEndDate) }}
          </p>
        </div>

        <!-- Quick Stats -->
        <div class="rounded-xl border border-gray-800 bg-gray-800/50 p-5">
          <h3 class="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-gray-400">
            <BarChart3 class="size-4" /> Bu Ay
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <p class="text-2xl font-bold text-white">{{ detail.currentMonthAppointments }}</p>
              <p class="text-xs text-gray-500">Randevu</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-white">{{ detail.currentEmployeeCount }}</p>
              <p class="text-xs text-gray-500">Çalışan</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-white">{{ detail.currentMonthSmsSent }}</p>
              <p class="text-xs text-gray-500">SMS</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-white">{{ detail.currentMonthWhatsappSent }}</p>
              <p class="text-xs text-gray-500">WhatsApp</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Usage Bars -->
      <div class="rounded-xl border border-gray-800 bg-gray-800/50 p-5">
        <h3 class="mb-4 text-sm font-semibold text-gray-300">Limit Kullanımı</h3>
        <div class="space-y-4">
          <UsageBar
            label="Çalışan"
            :current="detail.currentEmployeeCount"
            :max="detail.maxEmployees"
            :rate="detail.employeeUsageRate"
            color="indigo"
          />
          <UsageBar
            label="Randevu (Bu Ay)"
            :current="detail.currentMonthAppointments"
            :max="detail.maxAppointmentsMonthly"
            :rate="detail.appointmentUsageRate"
            color="sky"
          />
          <UsageBar
            label="Hizmet"
            :current="detail.currentServiceCount"
            :max="detail.maxServices"
            :rate="detail.serviceUsageRate"
            color="emerald"
          />
          <UsageBar
            label="SMS"
            :current="detail.currentMonthSmsSent"
            :max="detail.maxSmsMonthly"
            :rate="smsRate"
            color="amber"
          />
          <UsageBar
            label="WhatsApp"
            :current="detail.currentMonthWhatsappSent"
            :max="detail.maxWhatsappMonthly"
            :rate="whatsappRate"
            color="green"
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="rounded-xl border border-gray-800 bg-gray-800/50 p-5">
        <h3 class="mb-4 text-sm font-semibold text-gray-300">Yönetim Aksiyonları</h3>
        <div class="flex flex-wrap gap-3">
          <!-- Change Plan -->
          <div class="flex items-end gap-2">
            <div>
              <label class="mb-1 block text-xs text-gray-400">Plan Değiştir</label>
              <select
                v-model="selectedPlan"
                class="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="SOLO">SOLO</option>
                <option value="PRO">PRO</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs text-gray-400">Süre (Ay)</label>
              <input
                v-model.number="periodMonths"
                type="number"
                min="1"
                max="24"
                class="w-20 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <button
              class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
              :disabled="actionLoading"
              @click="handleChangePlan"
            >
              Uygula
            </button>
          </div>

          <div class="mx-2 hidden h-10 w-px self-end bg-gray-700 sm:block" />

          <!-- Suspend / Activate -->
          <div class="flex items-end gap-2">
            <button
              v-if="detail.status !== 'SUSPENDED'"
              class="rounded-lg bg-red-600/80 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
              :disabled="actionLoading"
              @click="handleSuspend"
            >
              <Ban class="mr-1.5 inline-block size-4" />
              Askıya Al
            </button>
            <button
              v-else
              class="rounded-lg bg-emerald-600/80 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-50"
              :disabled="actionLoading"
              @click="handleActivate"
            >
              <CheckCircle class="mr-1.5 inline-block size-4" />
              Aktifleştir
            </button>
          </div>
        </div>

        <!-- Action Feedback -->
        <p v-if="actionMessage" class="mt-3 text-sm" :class="actionError ? 'text-red-400' : 'text-emerald-400'">
          {{ actionMessage }}
        </p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h, type FunctionalComponent } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, UserCircle, CreditCard, BarChart3, Ban, CheckCircle } from 'lucide-vue-next'
import { superadminApi, type SuperAdminBusinessDetail } from '@/api/superadmin'

const router = useRouter()
const route = useRoute()
const loading = ref(true)
const detail = ref<SuperAdminBusinessDetail | null>(null)
const actionLoading = ref(false)
const actionMessage = ref('')
const actionError = ref(false)
const selectedPlan = ref('PRO')
const periodMonths = ref(1)

const businessId = computed(() => Number(route.params.id))

onMounted(() => fetchDetail())

async function fetchDetail() {
  loading.value = true
  try {
    const res = await superadminApi.getBusinessDetail(businessId.value)
    if (res.data.success && res.data.data) {
      detail.value = res.data.data
      selectedPlan.value = detail.value.planCode !== '—' ? detail.value.planCode : 'PRO'
    }
  } finally {
    loading.value = false
  }
}

const smsRate = computed(() => {
  if (!detail.value || detail.value.maxSmsMonthly <= 0) return 0
  return Math.min(100, (detail.value.currentMonthSmsSent / detail.value.maxSmsMonthly) * 100)
})

const whatsappRate = computed(() => {
  if (!detail.value || detail.value.maxWhatsappMonthly <= 0) return 0
  return Math.min(100, (detail.value.currentMonthWhatsappSent / detail.value.maxWhatsappMonthly) * 100)
})

async function handleChangePlan() {
  actionLoading.value = true
  actionMessage.value = ''
  actionError.value = false
  try {
    const res = await superadminApi.changePlan(businessId.value, {
      planCode: selectedPlan.value,
      periodMonths: periodMonths.value,
    })
    actionMessage.value = res.data.message ?? 'Plan başarıyla değiştirildi'
    await fetchDetail()
  } catch {
    actionMessage.value = 'Plan değiştirilemedi'
    actionError.value = true
  } finally {
    actionLoading.value = false
  }
}

async function handleSuspend() {
  if (!confirm('Bu işletmeyi askıya almak istediğinize emin misiniz?')) return
  actionLoading.value = true
  actionMessage.value = ''
  actionError.value = false
  try {
    const res = await superadminApi.suspendBusiness(businessId.value)
    actionMessage.value = res.data.message ?? 'İşletme askıya alındı'
    await fetchDetail()
  } catch {
    actionMessage.value = 'İşletme askıya alınamadı'
    actionError.value = true
  } finally {
    actionLoading.value = false
  }
}

async function handleActivate() {
  actionLoading.value = true
  actionMessage.value = ''
  actionError.value = false
  try {
    const res = await superadminApi.activateBusiness(businessId.value)
    actionMessage.value = res.data.message ?? 'İşletme aktifleştirildi'
    await fetchDetail()
  } catch {
    actionMessage.value = 'İşletme aktifleştirilemedi'
    actionError.value = true
  } finally {
    actionLoading.value = false
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function statusBadgeClass(status: string): string {
  return status === 'ACTIVE'
    ? 'bg-emerald-900/40 text-emerald-300'
    : 'bg-red-900/40 text-red-300'
}

function subStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    TRIAL: 'bg-sky-900/40 text-sky-300',
    ACTIVE: 'bg-emerald-900/40 text-emerald-300',
    EXPIRED: 'bg-gray-700 text-gray-400',
    SUSPENDED: 'bg-red-900/40 text-red-300',
  }
  return map[status] ?? 'bg-gray-700 text-gray-300'
}

function subStatusLabel(status: string): string {
  const map: Record<string, string> = {
    TRIAL: 'Trial',
    ACTIVE: 'Aktif Abonelik',
    EXPIRED: 'Süresi Dolmuş',
    SUSPENDED: 'Askıda',
  }
  return map[status] ?? status
}

// ── UsageBar inline component ──────────────────────────────────────────
const colorMap: Record<string, { bar: string; text: string }> = {
  indigo: { bar: 'bg-indigo-500', text: 'text-indigo-300' },
  sky: { bar: 'bg-sky-500', text: 'text-sky-300' },
  emerald: { bar: 'bg-emerald-500', text: 'text-emerald-300' },
  amber: { bar: 'bg-amber-500', text: 'text-amber-300' },
  green: { bar: 'bg-green-500', text: 'text-green-300' },
}

const UsageBar: FunctionalComponent<{
  label: string
  current: number
  max: number
  rate: number
  color: string
}> = (props) => {
  const c = colorMap[props.color] ?? colorMap.indigo
  const isUnlimited = props.max < 0
  const displayMax = isUnlimited ? '∞' : String(props.max)
  const displayRate = isUnlimited ? 0 : Math.min(100, props.rate)

  return h('div', {}, [
    h('div', { class: 'mb-1 flex items-center justify-between' }, [
      h('span', { class: 'text-sm text-gray-300' }, props.label),
      h('span', { class: `text-sm font-medium ${c.text}` },
        `${props.current} / ${displayMax}`),
    ]),
    h('div', { class: 'h-2 rounded-full bg-gray-700' }, [
      h('div', {
        class: `h-2 rounded-full transition-all duration-500 ${c.bar}`,
        style: { width: `${displayRate}%` },
      }),
    ]),
  ])
}
UsageBar.props = ['label', 'current', 'max', 'rate', 'color']
</script>
