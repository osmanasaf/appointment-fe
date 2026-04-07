<template>
  <div class="services-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Hizmetler</h1>
        <p class="page-desc">Randevuda sunacağınız hizmetleri tanımlayın (süre, fiyat, onay kuralı).</p>
      </div>
      <button
        v-if="businessId && !loading && !listError"
        type="button"
        class="btn primary"
        @click="openCreate"
        aria-label="Yeni hizmet ekle"
      >
        + Yeni hizmet
      </button>
    </div>

    <div v-if="!businessId" class="empty-state">
      <p>İşletme bilgisi bulunamadı.</p>
    </div>

    <template v-else>
      <div v-if="loading" class="loading-state" aria-busy="true">
        <div class="skeleton-card" v-for="i in 3" :key="i" />
      </div>
      <div v-else-if="listError" class="error-state" role="alert">
        <p>{{ listError }}</p>
        <button type="button" class="btn primary" @click="loadList">Tekrar dene</button>
      </div>
      <template v-else>
        <div v-if="services.length === 0" class="empty-state empty-state-cta">
          <p class="empty-title">Henüz hizmet yok</p>
          <p class="empty-desc">İlk hizmetinizi ekleyerek başlayın. Müşteriler randevu alırken bu hizmetleri görebilir.</p>
          <button type="button" class="btn primary" @click="openCreate">+ Yeni hizmet ekle</button>
        </div>
        <ul v-else class="list">
          <li v-for="s in services" :key="s.id" class="card">
            <div class="card-head">
              <span class="name">{{ s.name }}</span>
              <span class="badge" :class="s.active ? 'active' : 'inactive'">{{ s.active ? 'Aktif' : 'Pasif' }}</span>
              <span class="badge" :class="s.packageEligible ? 'badge-package' : 'badge-onetime'">
                {{ s.packageEligible ? 'Paketli' : 'Tek seferlik' }}
              </span>
            </div>
            <p v-if="s.description" class="desc">{{ s.description }}</p>
            <p class="meta">{{ s.durationMinutes }} dk · {{ formatPrice(s.price) }} {{ s.currency }}</p>
            <div class="actions">
              <button type="button" class="btn small" @click="openEdit(s)" aria-label="Düzenle">
                Düzenle
              </button>
              <button
                v-if="s.active"
                type="button"
                class="btn small"
                @click="deactivate(s.id)"
                aria-label="Pasifleştir"
              >
                Pasifleştir
              </button>
              <button
                v-else
                type="button"
                class="btn small primary"
                @click="activate(s.id)"
                aria-label="Aktifleştir"
              >
                Aktifleştir
              </button>
              <button type="button" class="btn small danger" @click="confirmDelete(s)" aria-label="Sil">
                Sil
              </button>
            </div>
          </li>
        </ul>

        <dialog ref="dialogRef" class="modal" @cancel="closeModal">
          <div class="modal-inner">
            <h2 class="modal-title">{{ editingId ? 'Hizmet düzenle' : 'Yeni hizmet' }}</h2>
            <form @submit.prevent="submitService" class="form">
            <div class="field">
              <label for="svc-name">Hizmet adı</label>
              <input
                id="svc-name"
                v-model="form.name"
                type="text"
                name="name"
                required
                minlength="2"
                maxlength="100"
                :aria-invalid="!!formErrors.name"
              />
              <span v-if="formErrors.name" class="error">{{ formErrors.name }}</span>
            </div>
            <div class="field">
              <label for="svc-desc">Açıklama</label>
              <input id="svc-desc" v-model="form.description" type="text" name="description" maxlength="500" />
            </div>
            <div class="field">
              <label for="svc-duration">Süre (dakika)</label>
              <input
                id="svc-duration"
                v-model.number="form.durationMinutes"
                type="number"
                name="duration"
                min="15"
                max="360"
                required
                :aria-invalid="!!formErrors.durationMinutes"
              />
              <span v-if="formErrors.durationMinutes" class="error">{{ formErrors.durationMinutes }}</span>
            </div>
            <div class="field">
              <label for="svc-price">Fiyat</label>
              <input
                id="svc-price"
                v-model.number="form.price"
                type="number"
                name="price"
                min="0"
                step="0.01"
              />
            </div>
            <div class="field-row">
              <div class="field">
                <label for="svc-buf-before">Hazırlık süresi (dk)</label>
                <input
                  id="svc-buf-before"
                  v-model.number="form.bufferBeforeMinutes"
                  type="number"
                  name="bufferBefore"
                  min="0"
                  max="120"
                />
              </div>
              <div class="field">
                <label for="svc-buf-after">Sonrası bekleme (dk)</label>
                <input
                  id="svc-buf-after"
                  v-model.number="form.bufferAfterMinutes"
                  type="number"
                  name="bufferAfter"
                  min="0"
                  max="120"
                />
              </div>
            </div>
            <div class="field row">
              <label><input v-model="form.requiresConfirmation" type="checkbox" /> Onay gerekli</label>
            </div>
            <div class="field row">
              <label><input v-model="form.sameDayBookingAllowed" type="checkbox" /> Aynı gün randevu</label>
            </div>
            <div class="field row field-with-desc">
              <label>
                <input v-model="form.packageEligible" type="checkbox" />
                Paket hizmeti
              </label>
              <span class="field-desc">Müşteriye bu hizmet için seanslı paket atanabilir.</span>
            </div>
            <p v-if="formSubmitError" class="submit-error" role="alert">{{ formSubmitError }}</p>
            <div class="modal-actions">
              <button type="button" class="btn" @click="closeModal">İptal</button>
              <button type="submit" class="btn primary" :disabled="formSaving">
                {{ formSaving ? 'Kaydediliyor…' : 'Kaydet' }}
              </button>
            </div>
          </form>
          </div>
        </dialog>

        <dialog ref="deleteDialogRef" class="modal" @cancel="cancelDelete">
          <div class="modal-inner">
          <h2 class="modal-title">Hizmeti sil</h2>
          <p>«{{ toDelete?.name }}» silinsin mi? Bu işlem geri alınamaz.</p>
          <div class="modal-actions">
            <button type="button" class="btn" @click="cancelDelete">Vazgeç</button>
            <button type="button" class="btn danger" @click="doDelete" :disabled="deleting">
              {{ deleting ? 'Siliniyor…' : 'Sil' }}
            </button>
          </div>
          </div>
        </dialog>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { serviceApi, type ServiceResponse, type CreateServiceRequest, type UpdateServiceRequest } from '@/api/service'

const auth = useAuthStore()
const businessId = computed(() => auth.user?.businessId ?? null)

const services = ref<ServiceResponse[]>([])
const loading = ref(true)
const listError = ref('')
const dialogRef = ref<HTMLDialogElement | null>(null)
const deleteDialogRef = ref<HTMLDialogElement | null>(null)
const editingId = ref<number | null>(null)
const formSaving = ref(false)
const formSubmitError = ref('')
const toDelete = ref<ServiceResponse | null>(null)
const deleting = ref(false)

const form = reactive({
  name: '',
  description: '',
  durationMinutes: 60,
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 0,
  price: 0,
  requiresConfirmation: false,
  sameDayBookingAllowed: true,
  packageEligible: true,
})

const formErrors = reactive<Record<string, string>>({})

function formatPrice(p: number | string): string {
  const n = typeof p === 'string' ? Number.parseFloat(p) : p
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)
}

function openCreate() {
  editingId.value = null
  form.name = ''
  form.description = ''
  form.durationMinutes = 60
  form.bufferBeforeMinutes = 0
  form.bufferAfterMinutes = 0
  form.price = 0
  form.requiresConfirmation = false
  form.sameDayBookingAllowed = true
  form.packageEligible = true
  formErrors.name = ''
  formErrors.durationMinutes = ''
  formSubmitError.value = ''
  dialogRef.value?.showModal()
}

function openEdit(s: ServiceResponse) {
  editingId.value = s.id
  form.name = s.name
  form.description = s.description ?? ''
  form.durationMinutes = s.durationMinutes
  form.bufferBeforeMinutes = s.bufferBeforeMinutes
  form.bufferAfterMinutes = s.bufferAfterMinutes
  form.price = typeof s.price === 'string' ? Number.parseFloat(s.price) : s.price
  form.requiresConfirmation = s.requiresConfirmation
  form.sameDayBookingAllowed = s.sameDayBookingAllowed
  form.packageEligible = s.packageEligible
  formErrors.name = ''
  formErrors.durationMinutes = ''
  formSubmitError.value = ''
  dialogRef.value?.showModal()
}

function closeModal() {
  dialogRef.value?.close()
}

function validateForm(): boolean {
  formErrors.name = ''
  formErrors.durationMinutes = ''
  if (!form.name.trim()) {
    formErrors.name = 'Hizmet adı giriniz'
    return false
  }
  if (form.name.trim().length < 2) {
    formErrors.name = 'En az 2 karakter olmalıdır'
    return false
  }
  if (form.durationMinutes < 15 || form.durationMinutes > 360) {
    formErrors.durationMinutes = 'Süre 15–360 dakika arasında olmalıdır'
    return false
  }
  return true
}

async function submitService() {
  if (!businessId.value || !validateForm()) return
  formSaving.value = true
  formSubmitError.value = ''
  try {
    if (editingId.value) {
      const body: UpdateServiceRequest = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        durationMinutes: form.durationMinutes,
        bufferBeforeMinutes: form.bufferBeforeMinutes,
        bufferAfterMinutes: form.bufferAfterMinutes,
        price: form.price,
        requiresConfirmation: form.requiresConfirmation,
        sameDayBookingAllowed: form.sameDayBookingAllowed,
        packageEligible: form.packageEligible,
      }
      await serviceApi.update(editingId.value, body)
    } else {
      const body: CreateServiceRequest = {
        businessId: businessId.value,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        durationMinutes: form.durationMinutes,
        bufferBeforeMinutes: form.bufferBeforeMinutes,
        bufferAfterMinutes: form.bufferAfterMinutes,
        price: form.price,
        requiresConfirmation: form.requiresConfirmation,
        sameDayBookingAllowed: form.sameDayBookingAllowed,
        packageEligible: form.packageEligible,
      }
      await serviceApi.create(body)
    }
    await loadList()
    closeModal()
  } catch (e: unknown) {
    formSubmitError.value = e instanceof Error ? e.message : 'Kaydedilemedi.'
  } finally {
    formSaving.value = false
  }
}

async function loadList() {
  if (!businessId.value) return
  loading.value = true
  listError.value = ''
  try {
    const { data } = await serviceApi.list(businessId.value)
    if (data.success && data.data) services.value = data.data
  } catch {
    listError.value = 'Liste yüklenemedi.'
  } finally {
    loading.value = false
  }
}

async function activate(id: number) {
  try {
    await serviceApi.activate(id)
    await loadList()
  } catch {
    listError.value = 'Aktifleştirilemedi.'
  }
}

async function deactivate(id: number) {
  try {
    await serviceApi.deactivate(id)
    await loadList()
  } catch {
    listError.value = 'Pasifleştirilemedi.'
  }
}

function confirmDelete(s: ServiceResponse) {
  toDelete.value = s
  deleteDialogRef.value?.showModal()
}

function cancelDelete() {
  toDelete.value = null
  deleteDialogRef.value?.close()
}

async function doDelete() {
  if (!toDelete.value) return
  deleting.value = true
  try {
    await serviceApi.delete(toDelete.value.id)
    await loadList()
    cancelDelete()
  } catch {
    listError.value = 'Silinemedi.'
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  if (businessId.value) loadList()
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
}

.empty-state,
.error-state {
  padding: 2rem;
  text-align: center;
  background: var(--color-background-alt);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
}

.error-state p { margin: 0 0 1rem; }

.empty-state-cta .empty-title {
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.25rem;
}

.empty-state-cta .empty-desc {
  margin: 0 0 1.25rem;
  max-width: 28rem;
  margin-left: auto;
  margin-right: auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-card {
  height: 5rem;
  background: linear-gradient(90deg, var(--color-background-alt) 25%, var(--color-border-light) 50%, var(--color-background-alt) 75%);
  background-size: 200% 100%;
  animation: skeleton 1.2s ease-in-out infinite;
  border-radius: var(--radius-lg);
}

@keyframes skeleton {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem; }
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
}
.card-head { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.name { font-weight: 600; font-size: 1rem; }
.badge { font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 9999px; }
.badge.active { background: var(--color-success-bg); color: var(--color-success); }
.badge.inactive { background: var(--color-background-alt); color: var(--color-text-muted); }
.badge.badge-package { background: var(--color-success-bg); color: var(--color-success); }
.badge.badge-onetime { background: var(--color-background-alt); color: var(--color-text-muted); }
.desc { margin: 0.5rem 0 0; font-size: 0.875rem; color: var(--color-text-muted); }
.meta { margin: 0.25rem 0 0; font-size: 0.875rem; color: var(--color-text-muted); font-variant-numeric: tabular-nums; }
.actions { margin-top: 0.75rem; display: flex; gap: 0.5rem; flex-wrap: wrap; }

.modal { padding: 0; border: 1px solid var(--color-border); border-radius: var(--radius-lg); max-width: 26rem; overflow: hidden; }
.modal::backdrop { background: rgba(15, 23, 42, 0.4); }
.modal-inner { padding: 1.5rem; }
.modal-title { margin: 0 0 1.25rem; font-size: 1.25rem; font-weight: 600; color: var(--color-text); }
.form { display: flex; flex-direction: column; gap: 1rem; }
.field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0; }
.field.row { flex-direction: row; align-items: center; gap: 0.5rem; }
.field.row.field-with-desc { flex-direction: column; align-items: flex-start; gap: 0.25rem; }
.field-desc { font-size: 0.8125rem; color: var(--color-text-subtle); }
.field label { font-weight: 500; font-size: 0.875rem; color: var(--color-text-muted); }
.field input { padding: 0.5rem 0.75rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 1rem; }
.field input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-light); }
.error, .submit-error { font-size: 0.875rem; color: var(--color-danger); }
.modal-actions { margin-top: 1.25rem; display: flex; gap: 0.5rem; justify-content: flex-end; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.field-row .field { margin-bottom: 0; }
</style>
