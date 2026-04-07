<template>
  <div class="packages-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Paketler</h1>
        <p class="page-desc">Paket şablonlarını yönetin ve müşteri paketlerini görüntüleyin. Yeni paket atamak için müşteri detayına gidin.</p>
      </div>
      <router-link to="/admin/customers" class="btn primary">+ Paket ata →</router-link>
    </div>

    <div v-if="!businessId" class="empty-state">İşletme bilgisi bulunamadı.</div>

    <template v-else>
      <div v-if="loading" class="loading-state" aria-busy="true">
        <div class="skeleton-card" v-for="i in 4" :key="i" />
      </div>
      <div v-else-if="error" class="error-state" role="alert">
        <p>{{ error }}</p>
        <button type="button" class="btn primary" @click="load">Tekrar dene</button>
      </div>
      <template v-else>
        <!-- Paket şablonları -->
        <section class="section" aria-labelledby="templates-heading">
          <div class="section-head">
            <h2 id="templates-heading" class="section-title">Paket şablonları</h2>
            <button type="button" class="btn primary" @click="openTemplateModal()" aria-label="Yeni paket şablonu ekle">
              + Yeni şablon
            </button>
          </div>
          <p class="section-desc">Müşteriye paket atarken kullanacağınız şablonlar (örn. Saç Kesim 8'li).</p>
          <div v-if="templates.length === 0" class="empty-inline">Henüz şablon yok. Yeni şablon ekleyin.</div>
          <ul v-else class="template-list">
            <li v-for="t in templates" :key="t.id" class="template-card">
              <div class="template-info">
                <span class="template-name">{{ t.name }}</span>
                <span class="template-meta">{{ resolveServiceName(t.serviceId) }} · {{ t.totalSessions }} seans</span>
                <span v-if="t.price != null" class="template-price">{{ formatPrice(t.price) }}</span>
              </div>
              <div class="template-actions">
                <button type="button" class="btn small" aria-label="Düzenle" @click="openTemplateModal(t)">Düzenle</button>
                <button type="button" class="btn small danger" aria-label="Devre dışı bırak" @click="deactivateTemplate(t.id)">Devre dışı</button>
              </div>
            </li>
          </ul>
        </section>

        <!-- Müşteri paketleri -->
        <section class="section" aria-labelledby="customer-packages-heading">
          <h2 id="customer-packages-heading" class="section-title">Müşteri paketleri</h2>
        <!-- Özet bantları -->
        <div class="summary-row">
          <div class="summary-card">
            <span class="summary-value">{{ allPackages.length }}</span>
            <span class="summary-label">Toplam paket</span>
          </div>
          <div class="summary-card">
            <span class="summary-value active-val">{{ activePackages.length }}</span>
            <span class="summary-label">Aktif</span>
          </div>
          <div class="summary-card">
            <span class="summary-value warn-val">{{ lowPackages.length }}</span>
            <span class="summary-label">Az kalan</span>
          </div>
          <div class="summary-card">
            <span class="summary-value muted-val">{{ expiredPackages.length }}</span>
            <span class="summary-label">Süresi dolan</span>
          </div>
        </div>

        <!-- Filtre -->
        <div class="filter-bar">
          <button
            v-for="f in filters"
            :key="f.value"
            type="button"
            class="filter-btn"
            :class="{ active: activeFilter === f.value }"
            @click="activeFilter = f.value"
          >
            {{ f.label }}
          </button>
        </div>

        <div v-if="displayedPackages.length === 0" class="empty-state">
          <p>Bu filtrede paket yok.</p>
        </div>
        <ul v-else class="list">
          <li v-for="p in displayedPackages" :key="p.id" class="card" :class="{ expired: p.expired, low: p.lowOnSessions && !p.expired }">
            <div class="card-head">
              <span class="pkg-name">{{ p.name }}</span>
              <span v-if="p.expired" class="badge inactive">Süresi doldu</span>
              <span v-else-if="p.lowOnSessions" class="badge warning">Az kaldı</span>
              <span v-else class="badge active">Aktif</span>
            </div>
            <p class="customer-name">{{ resolveCustomerName(p.customerId) }}</p>
            <div class="pkg-meta">
              <span class="pkg-service">{{ resolveServiceName(p.serviceId) }}</span>
              <span class="pkg-sessions">
                <span class="sessions-bar">
                  <span class="sessions-fill" :style="{ width: sessionsPercent(p) + '%' }" />
                </span>
                {{ p.remainingSessions }}/{{ p.totalSessions }} seans
              </span>
              <span class="pkg-expires">{{ formatDate(p.expiresAt) }}'e kadar</span>
            </div>
          </li>
        </ul>
        </section>
      </template>
    </template>

    <!-- Şablon modal -->
    <dialog ref="templateDialogRef" class="modal" @close="templateFormError = ''">
      <form @submit.prevent="saveTemplate" class="modal-form">
        <h3 class="modal-title">{{ editingTemplate ? 'Şablonu düzenle' : 'Yeni paket şablonu' }}</h3>
        <div class="field">
          <label for="template-name">Şablon adı <span class="req">*</span></label>
          <input id="template-name" v-model="templateForm.name" type="text" required minlength="2" maxlength="100" placeholder="Örn. Saç Kesim 8'li" />
        </div>
        <div class="field">
          <label for="template-service">Hizmet <span class="req">*</span></label>
          <select id="template-service" v-model.number="templateForm.serviceId" required :disabled="!!editingTemplate">
            <option value="">Seçin</option>
            <option v-for="s in packageEligibleServices" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div class="field">
          <label for="template-sessions">Seans sayısı <span class="req">*</span></label>
          <input id="template-sessions" v-model.number="templateForm.totalSessions" type="number" min="1" max="99" required />
        </div>
        <div class="field">
          <label for="template-price">Paket fiyatı (opsiyonel)</label>
          <input id="template-price" v-model.number="templateForm.price" type="number" min="0" step="0.01" placeholder="Boş bırakılabilir" />
        </div>
        <p v-if="templateFormError" class="field-error" role="alert">{{ templateFormError }}</p>
        <div class="modal-actions">
          <button type="button" class="btn" @click="closeTemplateModal">İptal</button>
          <button type="submit" class="btn primary">{{ templateSaving ? 'Kaydediliyor…' : 'Kaydet' }}</button>
        </div>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { customerApi, type CustomerResponse, type PackageResponse } from '@/api/customer'
import { serviceApi, type ServiceResponse } from '@/api/service'
import { packageTemplateApi, type PackageTemplateResponse } from '@/api/packageTemplate'

const auth = useAuthStore()
const businessId = computed(() => auth.user?.businessId ?? null)

const allPackages = ref<PackageResponse[]>([])
const customers = ref<CustomerResponse[]>([])
const services = ref<ServiceResponse[]>([])
const templates = ref<PackageTemplateResponse[]>([])
const loading = ref(true)
const error = ref('')
const activeFilter = ref<'all' | 'active' | 'low' | 'expired'>('all')

const templateDialogRef = ref<HTMLDialogElement | null>(null)
const editingTemplate = ref<PackageTemplateResponse | null>(null)
const templateForm = ref({ name: '', serviceId: '' as number | '', totalSessions: 8, price: null as number | null })
const templateFormError = ref('')
const templateSaving = ref(false)

const packageEligibleServices = computed(() =>
  services.value.filter(s => s.packageEligible && s.active)
)

const filters = [
  { value: 'all' as const, label: 'Tümü' },
  { value: 'active' as const, label: 'Aktif' },
  { value: 'low' as const, label: 'Az kalan' },
  { value: 'expired' as const, label: 'Süresi dolan' },
]

const activePackages = computed(() => allPackages.value.filter(p => !p.expired && p.remainingSessions > 0))
const lowPackages = computed(() => allPackages.value.filter(p => p.lowOnSessions && !p.expired))
const expiredPackages = computed(() => allPackages.value.filter(p => p.expired))

const displayedPackages = computed(() => {
  if (activeFilter.value === 'active') return activePackages.value
  if (activeFilter.value === 'low') return lowPackages.value
  if (activeFilter.value === 'expired') return expiredPackages.value
  return allPackages.value
})

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

function openTemplateModal(t?: PackageTemplateResponse) {
  editingTemplate.value = t ?? null
  templateForm.value = {
    name: t?.name ?? '',
    serviceId: t?.serviceId ?? '',
    totalSessions: t?.totalSessions ?? 8,
    price: t?.price ?? null,
  }
  templateFormError.value = ''
  templateDialogRef.value?.showModal()
}

function closeTemplateModal() {
  templateDialogRef.value?.close()
}

async function saveTemplate() {
  if (!businessId.value) return
  templateFormError.value = ''
  const name = templateForm.value.name.trim()
  const totalSessions = templateForm.value.totalSessions
  const serviceId = templateForm.value.serviceId
  if (!name || name.length < 2) {
    templateFormError.value = 'Şablon adı en az 2 karakter olmalıdır'
    return
  }
  if (typeof serviceId !== 'number') {
    templateFormError.value = 'Hizmet seçin'
    return
  }
  if (!totalSessions || totalSessions < 1) {
    templateFormError.value = 'Seans sayısı en az 1 olmalıdır'
    return
  }
  templateSaving.value = true
  try {
    if (editingTemplate.value) {
      await packageTemplateApi.update(editingTemplate.value.id, {
        name: name,
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
    closeTemplateModal()
    await loadTemplates()
  } catch (e: unknown) {
    templateFormError.value = e instanceof Error ? e.message : 'Kayıt başarısız'
  } finally {
    templateSaving.value = false
  }
}

async function deactivateTemplate(id: number) {
  if (!confirm('Bu şablonu devre dışı bırakmak istediğinize emin misiniz?')) return
  try {
    await packageTemplateApi.deactivate(id)
    await loadTemplates()
  } catch {
    error.value = 'Şablon devre dışı bırakılamadı.'
  }
}

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
  error.value = ''
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
        customers.value.map(c => customerApi.getPackages(c.id).then(r => r.data.data ?? []))
      )
      allPackages.value = pkgResults.flat()
    }
  } catch {
    error.value = 'Paketler yüklenemedi.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (businessId.value) load()
  else loading.value = false
})
</script>

<style scoped>
.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.page-desc {
  margin: 0.25rem 0 0;
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  max-width: 40rem;
}

/* Summary row */
.summary-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.25rem;
}

@media (max-width: 640px) {
  .summary-row { grid-template-columns: repeat(2, 1fr); }
}

.summary-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  text-align: center;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}

.summary-value.active-val { color: var(--color-success); }
.summary-value.warn-val { color: var(--color-warning); }
.summary-value.muted-val { color: var(--color-text-muted); }

.summary-label {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

/* Filter bar */
.filter-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.375rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 9999px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  font-family: inherit;
}

.filter-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.filter-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.filter-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* States */
.empty-state, .error-state {
  padding: 2rem;
  text-align: center;
  background: var(--color-background-alt);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
}

.error-state p { margin: 0 0 1rem; }

.loading-state { display: flex; flex-direction: column; gap: 0.75rem; }
.skeleton-card {
  height: 5rem;
  background: linear-gradient(90deg, var(--color-background-alt) 25%, var(--color-border-light) 50%, var(--color-background-alt) 75%);
  background-size: 200% 100%;
  animation: skeleton 1.2s ease-in-out infinite;
  border-radius: var(--radius-lg);
}
@keyframes skeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* List */
.list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem; }

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
}

.card.expired {
  opacity: 0.7;
  border-left: 3px solid var(--color-text-subtle);
}

.card.low {
  border-left: 3px solid var(--color-warning);
}

.card-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.25rem;
}

.pkg-name {
  font-weight: 600;
  font-size: 1rem;
  flex: 1;
  min-width: 0;
}

.badge { font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 9999px; font-weight: 500; white-space: nowrap; }
.badge.active { background: var(--color-success-bg); color: var(--color-success); }
.badge.warning { background: var(--color-warning-bg); color: var(--color-warning); }
.badge.inactive { background: var(--color-background-alt); color: var(--color-text-muted); }

.customer-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.pkg-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.pkg-service {
  font-weight: 500;
  color: var(--color-text);
}

.pkg-sessions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-variant-numeric: tabular-nums;
}

.sessions-bar {
  width: 4rem;
  height: 0.375rem;
  background: var(--color-border);
  border-radius: 9999px;
  overflow: hidden;
  flex-shrink: 0;
}

.sessions-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 9999px;
  transition: width 0.3s;
}

.pkg-expires {
  white-space: nowrap;
}

/* Section & templates */
.section {
  margin-bottom: 2rem;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.25rem;
}

.section-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
}

.section-desc {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.empty-inline {
  padding: 1rem;
  background: var(--color-background-alt);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.template-list {
  list-style: none;
  padding: 0;
  margin: 0 0 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.template-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  flex-wrap: wrap;
}

.template-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.template-name {
  font-weight: 600;
  color: var(--color-text);
}

.template-meta {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.template-price {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-primary);
  font-variant-numeric: tabular-nums;
}

.template-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* Modal */
.modal {
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  max-width: 24rem;
  background: var(--color-surface);
}

.modal::backdrop {
  background: rgba(15, 23, 42, 0.4);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
}

.modal .field label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  margin-bottom: 0.25rem;
}

.modal .field input,
.modal .field select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-family: inherit;
}

.modal .field input:focus,
.modal .field select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.modal .req { color: var(--color-danger); }

.modal .field-error {
  font-size: 0.875rem;
  color: var(--color-danger);
  margin: 0;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}
</style>
