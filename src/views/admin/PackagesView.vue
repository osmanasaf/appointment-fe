<template>
  <div class="space-y-6 p-4 sm:p-6">
    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Paketler</h1>
        <p class="mt-1 text-sm text-slate-500">Paket şablonlarını yönetin ve müşteri paketlerini görüntüleyin.</p>
      </div>
    </div>

    <div v-if="!businessId" class="rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
      İşletme bilgisi bulunamadı.
    </div>

    <template v-else>
      <!-- Loading -->
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 4" :key="i" class="h-16 animate-pulse rounded-xl bg-slate-100" />
      </div>

      <!-- Error -->
      <div v-else-if="pageError" class="rounded-xl border border-red-200 bg-red-50 p-6 text-center" role="alert">
        <p class="text-sm text-red-600">{{ pageError }}</p>
        <AppButton variant="secondary" size="sm" class="mt-3" @click="load">Tekrar dene</AppButton>
      </div>

      <template v-else>
        <!-- ── Package Templates ─────────────────────────────────────────── -->
        <section class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-slate-800">Paket şablonları</h2>
              <p class="text-sm text-slate-500">Müşteriye atarken kullanacağınız şablonlar (ör. Saç Kesim 8'li).</p>
            </div>
            <AppButton variant="primary" @click="openTemplateModal()">
              + Yeni şablon
            </AppButton>
          </div>

          <div v-if="templates.length === 0" class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-400">
            Henüz şablon yok. Yeni şablon ekleyin.
          </div>

          <ul v-else class="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            <li
              v-for="t in templates"
              :key="t.id"
              class="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-slate-800">{{ t.name }}</span>
                  <span v-if="!t.active" class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">Pasif</span>
                </div>
                <div class="flex items-center gap-3 text-xs text-slate-500">
                  <span>{{ resolveServiceName(t.serviceId) }}</span>
                  <span>{{ t.totalSessions }} seans</span>
                  <span v-if="t.price != null" class="font-medium text-indigo-600">{{ formatPrice(t.price) }}</span>
                </div>
              </div>
              <div class="flex gap-2">
                <AppButton variant="secondary" size="sm" @click="openTemplateModal(t)">Düzenle</AppButton>
                <AppButton variant="danger" size="sm" @click="confirmDeactivate(t)">Devre dışı</AppButton>
              </div>
            </li>
          </ul>
        </section>

        <!-- ── Customer Packages ────────────────────────────────────────── -->
        <section class="space-y-4">
          <h2 class="text-lg font-semibold text-slate-800">Müşteri paketleri</h2>

          <!-- Summary stats -->
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div class="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <p class="text-2xl font-bold text-slate-800">{{ allPackages.length }}</p>
              <p class="text-xs text-slate-500">Toplam</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <p class="text-2xl font-bold text-emerald-600">{{ activePackages.length }}</p>
              <p class="text-xs text-slate-500">Aktif</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <p class="text-2xl font-bold text-amber-500">{{ lowPackages.length }}</p>
              <p class="text-xs text-slate-500">Az kalan</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <p class="text-2xl font-bold text-slate-400">{{ expiredPackages.length }}</p>
              <p class="text-xs text-slate-500">Süresi dolan</p>
            </div>
          </div>

          <!-- Filter tabs -->
          <div class="flex gap-0.5 rounded-lg border border-slate-200 bg-slate-100 p-1 w-fit">
            <button
              v-for="f in FILTERS"
              :key="f.value"
              type="button"
              class="rounded-md px-3 py-1.5 text-sm font-medium transition"
              :class="activeFilter === f.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'"
              @click="activeFilter = f.value"
            >
              {{ f.label }}
            </button>
          </div>

          <!-- Empty filter -->
          <div v-if="allPackages.length === 0" class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-400">
            Henüz müşteri paketi yok. Müşteri detayından paket atayabilirsiniz.
          </div>
          <div v-else-if="displayedPackages.length === 0" class="py-8 text-center text-sm text-slate-400">
            Bu filtrede paket yok.
          </div>

          <!-- Package list -->
          <ul v-else class="space-y-2">
            <li
              v-for="p in displayedPackages"
              :key="p.id"
              class="rounded-xl border bg-white px-4 py-3"
              :class="p.expired ? 'border-slate-200 opacity-60' : p.lowOnSessions ? 'border-amber-200' : 'border-slate-200'"
            >
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div class="space-y-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="font-semibold text-slate-800">{{ p.name }}</span>
                    <span
                      class="rounded-full px-2 py-0.5 text-xs font-medium"
                      :class="p.expired
                        ? 'bg-slate-100 text-slate-500'
                        : p.lowOnSessions
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'"
                    >
                      {{ p.expired ? 'Süresi doldu' : p.lowOnSessions ? 'Az kaldı' : 'Aktif' }}
                    </span>
                  </div>
                  <p class="text-sm font-medium text-indigo-600">{{ resolveCustomerName(p.customerId) }}</p>
                  <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>{{ resolveServiceName(p.serviceId) }}</span>
                    <span>{{ formatDate(p.expiresAt) }}'e kadar</span>
                  </div>
                </div>

                <!-- Session progress -->
                <div class="flex items-center gap-2 text-sm">
                  <div class="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
                    <div
                      class="h-full rounded-full transition-all"
                      :class="p.expired ? 'bg-slate-400' : p.lowOnSessions ? 'bg-amber-400' : 'bg-emerald-500'"
                      :style="{ width: sessionsPercent(p) + '%' }"
                    />
                  </div>
                  <span class="font-medium text-slate-700 tabular-nums">{{ p.remainingSessions }}/{{ p.totalSessions }}</span>
                  <span class="text-slate-400">seans</span>
                </div>
              </div>
            </li>
          </ul>
        </section>
      </template>
    </template>

    <!-- ── Template Create/Edit Modal ──────────────────────────────────────── -->
    <AppModal
      v-model:visible="showTemplateModal"
      :title="editingTemplate ? 'Şablonu düzenle' : 'Yeni paket şablonu'"
      :style="{ width: 'min(32rem, 95vw)' }"
    >
      <form class="space-y-4" @submit.prevent="saveTemplate">
        <div class="space-y-1">
          <label class="block text-sm font-medium text-slate-700" for="tpl-name">
            Şablon adı <span class="text-red-500">*</span>
          </label>
          <input
            id="tpl-name"
            v-model="templateForm.name"
            type="text"
            required
            minlength="2"
            maxlength="100"
            placeholder="Örn. Saç Kesim 8'li"
            class="form-input"
          />
        </div>

        <div class="space-y-1">
          <label class="block text-sm font-medium text-slate-700" for="tpl-service">
            Hizmet <span class="text-red-500">*</span>
          </label>
          <select
            id="tpl-service"
            v-model.number="templateForm.serviceId"
            required
            :disabled="!!editingTemplate"
            class="form-select"
          >
            <option value="">Seçin</option>
            <option v-for="s in packageEligibleServices" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="block text-sm font-medium text-slate-700" for="tpl-sessions">
              Seans sayısı <span class="text-red-500">*</span>
            </label>
            <input
              id="tpl-sessions"
              v-model.number="templateForm.totalSessions"
              type="number"
              min="1"
              max="99"
              required
              class="form-input"
            />
          </div>
          <div class="space-y-1">
            <label class="block text-sm font-medium text-slate-700" for="tpl-price">
              Paket fiyatı <span class="font-normal text-slate-400">(opsiyonel)</span>
            </label>
            <div class="relative">
              <input
                id="tpl-price"
                v-model.number="templateForm.price"
                type="number"
                min="0"
                step="0.01"
                placeholder="—"
                class="form-input pr-8"
              />
              <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">₺</span>
            </div>
          </div>
        </div>

        <p v-if="templateFormError" class="text-sm text-red-500" role="alert">{{ templateFormError }}</p>

        <div class="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <AppButton variant="secondary" @click="showTemplateModal = false">İptal</AppButton>
          <AppButton variant="primary" native-type="submit" :loading="templateSaving">
            {{ editingTemplate ? 'Güncelle' : 'Şablon ekle' }}
          </AppButton>
        </div>
      </form>
    </AppModal>

    <!-- ── Deactivate confirm ────────────────────────────────────────────────── -->
    <AppModal v-model:visible="showDeactivateModal" title="Şablonu devre dışı bırak">
      <p class="text-sm text-slate-700">
        <span class="font-semibold">«{{ toDeactivate?.name }}»</span> şablonu devre dışı bırakılacak.
        Mevcut müşteri paketleri etkilenmez.
      </p>
      <template #footer>
        <AppButton variant="secondary" @click="showDeactivateModal = false">Vazgeç</AppButton>
        <AppButton variant="danger" :loading="deactivating" @click="doDeactivate">Devre dışı bırak</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { customerApi, type CustomerResponse, type PackageResponse } from '@/api/customer'
import { serviceApi, type ServiceResponse } from '@/api/service'
import { packageTemplateApi, type PackageTemplateResponse } from '@/api/packageTemplate'

const auth = useAuthStore()
const route = useRoute()
const businessId = computed(() => auth.user?.businessId ?? null)

// ── Data ──────────────────────────────────────────────────────────────────────
const allPackages = ref<PackageResponse[]>([])
const customers = ref<CustomerResponse[]>([])
const services = ref<ServiceResponse[]>([])
const templates = ref<PackageTemplateResponse[]>([])
const loading = ref(true)
const pageError = ref('')

// ── Filter ────────────────────────────────────────────────────────────────────
type FilterValue = 'all' | 'active' | 'low' | 'expired'
const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'Tümü' },
  { value: 'active', label: 'Aktif' },
  { value: 'low', label: 'Az kalan' },
  { value: 'expired', label: 'Süresi dolan' },
]
const activeFilter = ref<FilterValue>('all')

const activePackages = computed(() => allPackages.value.filter((p) => !p.expired && p.remainingSessions > 0))
const lowPackages = computed(() => allPackages.value.filter((p) => p.lowOnSessions && !p.expired))
const expiredPackages = computed(() => allPackages.value.filter((p) => p.expired))
const displayedPackages = computed(() => {
  if (activeFilter.value === 'active') return activePackages.value
  if (activeFilter.value === 'low') return lowPackages.value
  if (activeFilter.value === 'expired') return expiredPackages.value
  return allPackages.value
})

// ── Template form ─────────────────────────────────────────────────────────────
const showTemplateModal = ref(false)
const editingTemplate = ref<PackageTemplateResponse | null>(null)
const templateForm = ref({ name: '', serviceId: '' as number | '', totalSessions: 8, price: null as number | null })
const templateFormError = ref('')
const templateSaving = ref(false)

const showDeactivateModal = ref(false)
const toDeactivate = ref<PackageTemplateResponse | null>(null)
const deactivating = ref(false)

const packageEligibleServices = computed(() => services.value.filter((s) => s.packageEligible && s.active))

// ── Lookups ───────────────────────────────────────────────────────────────────
const customerMap = computed(() => {
  const m = new Map<number, string>()
  for (const c of customers.value) m.set(c.id, c.name)
  return m
})
const serviceMap = computed(() => {
  const m = new Map<number, string>()
  for (const s of services.value) m.set(s.id, s.name)
  return m
})

function resolveCustomerName(id: number): string {
  return customerMap.value.get(id) ?? `Müşteri #${id}`
}
function resolveServiceName(id: number): string {
  return serviceMap.value.get(id) ?? `Hizmet #${id}`
}

function sessionsPercent(p: PackageResponse): number {
  if (p.totalSessions === 0) return 0
  return Math.round((p.remainingSessions / p.totalSessions) * 100)
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short' }).format(new Date(iso))
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(price)
}

// ── Template CRUD ─────────────────────────────────────────────────────────────
function openTemplateModal(t?: PackageTemplateResponse) {
  editingTemplate.value = t ?? null
  templateForm.value = {
    name: t?.name ?? '',
    serviceId: t?.serviceId ?? '',
    totalSessions: t?.totalSessions ?? 8,
    price: t?.price ?? null,
  }
  templateFormError.value = ''
  showTemplateModal.value = true
}

async function saveTemplate() {
  if (!businessId.value) return
  templateFormError.value = ''
  const name = templateForm.value.name.trim()
  const totalSessions = templateForm.value.totalSessions
  const serviceId = templateForm.value.serviceId
  if (!name || name.length < 2) { templateFormError.value = 'Şablon adı en az 2 karakter olmalıdır'; return }
  if (typeof serviceId !== 'number') { templateFormError.value = 'Hizmet seçin'; return }
  if (!totalSessions || totalSessions < 1) { templateFormError.value = 'Seans sayısı en az 1 olmalıdır'; return }
  templateSaving.value = true
  try {
    if (editingTemplate.value) {
      await packageTemplateApi.update(editingTemplate.value.id, {
        name,
        totalSessions,
        price: templateForm.value.price ?? undefined,
      })
    } else {
      await packageTemplateApi.create({
        businessId: businessId.value,
        serviceId,
        name,
        totalSessions,
        price: templateForm.value.price ?? undefined,
      })
    }
    showTemplateModal.value = false
    await loadTemplates()
  } catch (e: unknown) {
    templateFormError.value = e instanceof Error ? e.message : 'Kayıt başarısız'
  } finally {
    templateSaving.value = false
  }
}

function confirmDeactivate(t: PackageTemplateResponse) {
  toDeactivate.value = t
  showDeactivateModal.value = true
}

async function doDeactivate() {
  if (!toDeactivate.value) return
  deactivating.value = true
  try {
    await packageTemplateApi.deactivate(toDeactivate.value.id)
    showDeactivateModal.value = false
    await loadTemplates()
  } catch {
    pageError.value = 'Şablon devre dışı bırakılamadı.'
  } finally {
    deactivating.value = false
  }
}

// ── Data loading ──────────────────────────────────────────────────────────────
async function loadTemplates() {
  if (!businessId.value) return
  try {
    const res = await packageTemplateApi.listByBusiness(businessId.value)
    if (res.data.success && res.data.data) templates.value = res.data.data
  } catch {
    templates.value = []
  }
}

async function load() {
  if (!businessId.value) return
  loading.value = true
  pageError.value = ''
  try {
    const [custRes, svcRes, tmplRes] = await Promise.all([
      customerApi.list(businessId.value),
      serviceApi.list(businessId.value),
      packageTemplateApi.listByBusiness(businessId.value),
    ])
    if (custRes.data.success && custRes.data.data) customers.value = custRes.data.data
    if (svcRes.data.success && svcRes.data.data) services.value = svcRes.data.data
    if (tmplRes.data.success && tmplRes.data.data) templates.value = tmplRes.data.data

    if (customers.value.length > 0) {
      const pkgResults = await Promise.all(
        customers.value.map((c) => customerApi.getPackages(c.id).then((r) => r.data.data ?? [])),
      )
      allPackages.value = pkgResults.flat()
    }
  } catch {
    pageError.value = 'Paketler yüklenemedi.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (businessId.value) load()
  else loading.value = false

  const createFor = route.query.createFor
  const serviceName = route.query.serviceName
  if (createFor && typeof createFor === 'string') {
    const sid = Number.parseInt(createFor, 10)
    if (!Number.isNaN(sid)) {
      openTemplateModal()
      templateForm.value.serviceId = sid
      templateForm.value.name = typeof serviceName === 'string' ? `${serviceName} Paketi` : ''
    }
  }
})
</script>

<style scoped>
.form-input {
  @apply w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100;
}
.form-select {
  @apply w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100;
}
</style>
