<template>
  <div class="employees-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Çalışanlar</h1>
        <p class="page-desc">Randevu alabilecek ekip üyelerinizi tanımlayın.</p>
      </div>
      <button
        v-if="businessId && !loading && !listError"
        type="button"
        class="btn primary"
        @click="openCreate"
        aria-label="Yeni çalışan ekle"
      >
        + Yeni çalışan
      </button>
    </div>

    <div v-if="!businessId" class="empty-state">İşletme bilgisi bulunamadı.</div>

    <template v-else>
      <div v-if="loading" class="loading-state" aria-busy="true">
        <div class="skeleton-card" v-for="i in 3" :key="i" />
      </div>
      <div v-else-if="listError" class="error-state" role="alert">
        <p>{{ listError }}</p>
        <button type="button" class="btn primary" @click="loadList">Tekrar dene</button>
      </div>
      <template v-else>
        <div v-if="employees.length === 0" class="empty-state empty-state-cta">
          <p class="empty-title">Henüz çalışan yok</p>
          <p class="empty-desc">Müşteriler randevu alırken çalışan seçebilir. En az bir çalışan ekleyin.</p>
          <button type="button" class="btn primary" @click="openCreate">+ Yeni çalışan ekle</button>
        </div>
        <ul v-else class="list">
          <li v-for="e in employees" :key="e.id" class="card">
            <div class="card-head">
              <span class="name">{{ e.name }}</span>
              <span class="badge" :class="e.status === 'ACTIVE' ? 'active' : 'inactive'">
                {{ e.status === 'ACTIVE' ? 'Aktif' : 'Pasif' }}
              </span>
              <span v-if="e.owner" class="badge owner">Sahip</span>
            </div>
            <p class="meta">
              <span v-if="e.phoneNumber">{{ e.phoneNumber }}</span>
              <span v-if="e.email"> · {{ e.email }}</span>
            </p>
            <div class="actions">
              <button type="button" class="btn small" @click="openEdit(e)" aria-label="Düzenle">
                Düzenle
              </button>
              <button
                v-if="e.status === 'ACTIVE'"
                type="button"
                class="btn small"
                @click="deactivate(e.id)"
                aria-label="Pasifleştir"
              >
                Pasifleştir
              </button>
              <button
                v-else
                type="button"
                class="btn small primary"
                @click="activate(e.id)"
                aria-label="Aktifleştir"
              >
                Aktifleştir
              </button>
              <button type="button" class="btn small danger" @click="confirmDelete(e)" aria-label="Sil">
                Sil
              </button>
            </div>
          </li>
        </ul>

        <dialog ref="dialogRef" class="modal" @cancel="closeModal">
          <h2 class="modal-title">{{ editingId ? 'Çalışanı düzenle' : 'Yeni çalışan' }}</h2>
          <form @submit.prevent="submitEmployee" class="form">
            <div class="field">
              <label for="emp-name">Ad soyad</label>
              <input
                id="emp-name"
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
              <label for="emp-phone">Telefon</label>
              <input id="emp-phone" v-model="form.phoneNumber" type="tel" name="phone" />
            </div>
            <div class="field">
              <label for="emp-email">E-posta</label>
              <input
                id="emp-email"
                v-model="form.email"
                type="email"
                name="email"
                :aria-invalid="!!formErrors.email"
              />
              <span v-if="formErrors.email" class="error">{{ formErrors.email }}</span>
            </div>
            <div class="field">
              <label for="emp-bio">Biyografi</label>
              <textarea id="emp-bio" v-model="form.bio" name="bio" rows="2" maxlength="500" />
            </div>
            <div class="field row">
              <label><input v-model="form.owner" type="checkbox" /> İşletme sahibi</label>
            </div>
            <p v-if="formSubmitError" class="submit-error" role="alert">{{ formSubmitError }}</p>
            <div class="modal-actions">
              <button type="button" class="btn" @click="closeModal">İptal</button>
              <button type="submit" class="btn primary" :disabled="formSaving">
                {{ formSaving ? 'Kaydediliyor…' : 'Kaydet' }}
              </button>
            </div>
          </form>
        </dialog>

        <dialog ref="deleteDialogRef" class="modal" @cancel="cancelDelete">
          <h2 class="modal-title">Çalışanı sil</h2>
          <p>«{{ toDelete?.name }}» silinsin mi? Bu işlem geri alınamaz.</p>
          <div class="modal-actions">
            <button type="button" class="btn" @click="cancelDelete">Vazgeç</button>
            <button type="button" class="btn danger" @click="doDelete" :disabled="deleting">
              {{ deleting ? 'Siliniyor…' : 'Sil' }}
            </button>
          </div>
        </dialog>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { employeeApi, type EmployeeResponse, type CreateEmployeeRequest, type UpdateEmployeeRequest } from '@/api/employee'

const auth = useAuthStore()
const businessId = computed(() => auth.user?.businessId ?? null)

const employees = ref<EmployeeResponse[]>([])
const loading = ref(true)
const listError = ref('')
const dialogRef = ref<HTMLDialogElement | null>(null)
const deleteDialogRef = ref<HTMLDialogElement | null>(null)
const editingId = ref<number | null>(null)
const formSaving = ref(false)
const formSubmitError = ref('')
const toDelete = ref<EmployeeResponse | null>(null)
const deleting = ref(false)

const form = reactive({
  name: '',
  phoneNumber: '',
  email: '',
  bio: '',
  owner: false,
})

const formErrors = reactive<Record<string, string>>({})

function openCreate() {
  editingId.value = null
  form.name = ''
  form.phoneNumber = ''
  form.email = ''
  form.bio = ''
  form.owner = false
  formErrors.name = ''
  formErrors.email = ''
  formSubmitError.value = ''
  dialogRef.value?.showModal()
}

function openEdit(e: EmployeeResponse) {
  editingId.value = e.id
  form.name = e.name
  form.phoneNumber = e.phoneNumber ?? ''
  form.email = e.email ?? ''
  form.bio = e.bio ?? ''
  form.owner = e.owner
  formErrors.name = ''
  formErrors.email = ''
  formSubmitError.value = ''
  dialogRef.value?.showModal()
}

function closeModal() {
  dialogRef.value?.close()
}

function validateForm(): boolean {
  formErrors.name = ''
  formErrors.email = ''
  if (!form.name.trim()) {
    formErrors.name = 'Çalışan adı giriniz'
    return false
  }
  if (form.name.trim().length < 2) {
    formErrors.name = 'En az 2 karakter olmalıdır'
    return false
  }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    formErrors.email = 'Geçerli bir e-posta giriniz'
    return false
  }
  return true
}

async function submitEmployee() {
  if (!businessId.value || !validateForm()) return
  formSaving.value = true
  formSubmitError.value = ''
  try {
    if (editingId.value) {
      const body: UpdateEmployeeRequest = {
        name: form.name.trim(),
        phoneNumber: form.phoneNumber.trim() || undefined,
        email: form.email.trim() || undefined,
        bio: form.bio.trim() || undefined,
        owner: form.owner,
      }
      await employeeApi.update(editingId.value, body)
    } else {
      const body: CreateEmployeeRequest = {
        businessId: businessId.value,
        name: form.name.trim(),
        phoneNumber: form.phoneNumber.trim() || undefined,
        phoneCountryCode: '+90',
        email: form.email.trim() || undefined,
        bio: form.bio.trim() || undefined,
        owner: form.owner,
      }
      await employeeApi.create(body)
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
    const { data } = await employeeApi.list(businessId.value)
    if (data.success && data.data) employees.value = data.data
  } catch {
    listError.value = 'Liste yüklenemedi.'
  } finally {
    loading.value = false
  }
}

async function activate(id: number) {
  try {
    await employeeApi.activate(id)
    await loadList()
  } catch {
    listError.value = 'Aktifleştirilemedi.'
  }
}

async function deactivate(id: number) {
  try {
    await employeeApi.deactivate(id)
    await loadList()
  } catch {
    listError.value = 'Pasifleştirilemedi.'
  }
}

function confirmDelete(e: EmployeeResponse) {
  toDelete.value = e
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
    await employeeApi.delete(toDelete.value.id)
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
.page-header { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
.page-desc { margin: 0.25rem 0 0; font-size: 0.9375rem; color: var(--color-text-muted); }
.empty-state, .error-state { padding: 2rem; text-align: center; background: var(--color-background-alt); border-radius: var(--radius-lg); color: var(--color-text-muted); }
.error-state p { margin: 0 0 1rem; }
.empty-state-cta .empty-title { font-weight: 600; color: var(--color-text); margin: 0 0 0.25rem; }
.empty-state-cta .empty-desc { margin: 0 0 1.25rem; }
.loading-state { display: flex; flex-direction: column; gap: 0.75rem; }
.skeleton-card { height: 4.5rem; background: linear-gradient(90deg, var(--color-background-alt) 25%, var(--color-border-light) 50%, var(--color-background-alt) 75%); background-size: 200% 100%; animation: skeleton 1.2s ease-in-out infinite; border-radius: var(--radius-lg); }
@keyframes skeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem; }
.card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1.25rem; }
.card-head { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.name { font-weight: 600; font-size: 1rem; }
.badge { font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 9999px; }
.badge.active { background: var(--color-success-bg); color: var(--color-success); }
.badge.inactive { background: var(--color-background-alt); color: var(--color-text-muted); }
.badge.owner { background: var(--color-primary-light); color: var(--color-primary); }
.meta { margin: 0.25rem 0 0; font-size: 0.875rem; color: var(--color-text-muted); }
.actions { margin-top: 0.75rem; display: flex; gap: 0.5rem; flex-wrap: wrap; }
.modal { padding: 1.5rem; border: 1px solid var(--color-border); border-radius: var(--radius-lg); max-width: 26rem; }
.modal::backdrop { background: rgba(15, 23, 42, 0.4); }
.modal-title { margin: 0 0 1.25rem; font-size: 1.25rem; font-weight: 600; }
.form { display: flex; flex-direction: column; gap: 1rem; }
.field { margin-bottom: 0; }
.field.row { flex-direction: row; align-items: center; gap: 0.5rem; }
.field label { font-weight: 500; font-size: 0.875rem; color: var(--color-text-muted); }
.field input, .field textarea { padding: 0.5rem 0.75rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 1rem; }
.field input:focus, .field textarea:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-light); }
.error, .submit-error { font-size: 0.875rem; color: var(--color-danger); }
.modal-actions { margin-top: 1.25rem; display: flex; gap: 0.5rem; justify-content: flex-end; }
</style>
