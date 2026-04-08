<template>
  <div class="space-y-6">
    <!-- Header -->
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="page-title">Hizmetler</h1>
        <p class="mt-1 text-sm text-slate-500">Sunduğunuz hizmetleri tanımlayın; süre, fiyat ve kuralları ayarlayın.</p>
      </div>
      <AppButton v-if="businessId" variant="primary" @click="openCreate">
        <Plus class="size-4" aria-hidden="true" />
        Yeni hizmet
      </AppButton>
    </header>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div v-for="i in 4" :key="i" class="h-44 animate-pulse rounded-xl bg-slate-100" />
    </div>

    <!-- Error -->
    <div
      v-else-if="listError"
      class="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      role="alert"
    >
      <span>{{ listError }}</span>
      <AppButton variant="secondary" size="sm" @click="loadList">Tekrar dene</AppButton>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="services.length === 0"
      class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-16 text-center"
    >
      <Scissors class="mx-auto mb-3 size-10 text-slate-300" aria-hidden="true" />
      <p class="font-semibold text-slate-600">Henüz hizmet yok</p>
      <p class="mt-1 text-sm text-slate-400">İlk hizmetinizi ekleyerek başlayın.</p>
      <AppButton class="mt-4" variant="primary" @click="openCreate">
        <Plus class="size-4" aria-hidden="true" />
        İlk hizmeti ekle
      </AppButton>
    </div>

    <!-- Service grid -->
    <ul v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <li
        v-for="s in services"
        :key="s.id"
        class="group flex flex-col rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
        :class="s.active ? 'border-slate-200' : 'border-slate-200 opacity-70'"
      >
        <div class="h-1 w-full rounded-t-xl" :class="s.active ? 'bg-indigo-500' : 'bg-slate-300'" />

        <div class="flex flex-1 flex-col gap-3 p-5">
          <!-- Head -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <div
                class="flex size-9 shrink-0 items-center justify-center rounded-lg"
                :class="s.active ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'"
              >
                <Scissors class="size-5" aria-hidden="true" />
              </div>
              <div>
                <p class="font-semibold leading-tight text-slate-900">{{ s.name }}</p>
                <p v-if="s.description" class="mt-0.5 text-xs text-slate-400 line-clamp-1">{{ s.description }}</p>
              </div>
            </div>
            <div class="flex shrink-0 flex-col items-end gap-1">
              <span
                class="rounded-full px-2 py-0.5 text-[0.7rem] font-semibold"
                :class="s.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
              >{{ s.active ? 'Aktif' : 'Pasif' }}</span>
              <span v-if="s.packageEligible" class="rounded-full bg-violet-100 px-2 py-0.5 text-[0.7rem] font-semibold text-violet-700">Paketli</span>
            </div>
          </div>

          <!-- Meta -->
          <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span class="flex items-center gap-1">
              <Clock class="size-3.5 shrink-0" aria-hidden="true" />
              {{ s.durationMinutes }} dk
            </span>
            <span class="flex items-center gap-1 font-semibold text-slate-700">
              <BadgeDollarSign class="size-3.5 shrink-0" aria-hidden="true" />
              {{ formatPrice(s.price) }} {{ s.currency }}
            </span>
            <span v-if="s.requiresConfirmation" class="flex items-center gap-1 text-amber-600">
              <ShieldCheck class="size-3.5 shrink-0" aria-hidden="true" />
              Onay gerekli
            </span>
          </div>

          <!-- Capable employee chips -->
          <div class="min-h-[1.75rem]">
            <div v-if="capableEmployeesMap.get(s.id)?.length" class="flex flex-wrap gap-1">
              <span
                v-for="emp in capableEmployeesMap.get(s.id)"
                :key="emp.id"
                class="rounded-full bg-indigo-50 px-2 py-0.5 text-[0.7rem] font-medium text-indigo-700"
              >{{ emp.name }}</span>
            </div>
            <p v-else class="text-xs italic text-slate-300">Henüz çalışan atanmamış</p>
          </div>

          <!-- Actions -->
          <div class="mt-auto flex flex-wrap gap-1.5 border-t border-slate-50 pt-3">
            <AppButton variant="secondary" size="sm" @click="openEdit(s)">
              <Pencil class="size-3.5" aria-hidden="true" />
              Düzenle
            </AppButton>
            <AppButton variant="secondary" size="sm" @click="openEmployeesModal(s)">
              <Users class="size-3.5" aria-hidden="true" />
              Çalışanlar<span v-if="capableEmployeesMap.get(s.id)?.length" class="ml-1 text-indigo-500">({{ capableEmployeesMap.get(s.id)!.length }})</span>
            </AppButton>
            <AppButton
              v-if="s.active"
              variant="secondary"
              size="sm"
              :loading="togglingId === s.id"
              @click="deactivate(s.id)"
            >
              <EyeOff class="size-3.5" aria-hidden="true" />
              Pasifleştir
            </AppButton>
            <AppButton
              v-else
              variant="primary"
              size="sm"
              :loading="togglingId === s.id"
              @click="activate(s.id)"
            >
              <Eye class="size-3.5" aria-hidden="true" />
              Aktifleştir
            </AppButton>
            <AppButton variant="danger" size="sm" @click="confirmDelete(s)">
              <Trash2 class="size-3.5" aria-hidden="true" />
              Sil
            </AppButton>
          </div>
        </div>
      </li>
    </ul>

    <!-- ── Create / Edit Modal ──────────────────────────────────────────────── -->
    <AppModal
      v-model:visible="showFormModal"
      :title="editingId ? 'Hizmeti düzenle' : 'Yeni hizmet'"
      :style="{ width: 'min(36rem, 95vw)' }"
    >
      <form class="space-y-5" @submit.prevent="submitService">
        <fieldset class="space-y-3">
          <legend class="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
            <span class="flex size-5 items-center justify-center rounded-full bg-indigo-600 text-[0.6rem] font-bold text-white">1</span>
            Temel bilgiler
          </legend>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Hizmet adı <span class="text-red-500">*</span></span>
            <input
              v-model="form.name"
              type="text"
              required
              minlength="2"
              maxlength="100"
              placeholder="Örn. Saç Kesimi"
              class="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              :class="formErrors.name ? 'border-red-400 focus:ring-red-100' : ''"
            />
            <span v-if="formErrors.name" class="mt-1 block text-xs text-red-600">{{ formErrors.name }}</span>
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Açıklama <span class="font-normal text-slate-400">(isteğe bağlı)</span></span>
            <textarea
              v-model="form.description"
              rows="2"
              maxlength="500"
              placeholder="Kısa bir açıklama ekleyin…"
              class="mt-1 block w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </label>
        </fieldset>

        <hr class="border-slate-100" />

        <fieldset class="space-y-3">
          <legend class="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
            <span class="flex size-5 items-center justify-center rounded-full bg-indigo-600 text-[0.6rem] font-bold text-white">2</span>
            Süre & Fiyat
          </legend>
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="text-sm font-medium text-slate-700">Süre (dk) <span class="text-red-500">*</span></span>
              <div class="relative mt-1">
                <input
                  v-model.number="form.durationMinutes"
                  type="number"
                  min="15"
                  max="360"
                  step="5"
                  required
                  class="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-900 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  :class="formErrors.durationMinutes ? 'border-red-400' : ''"
                />
                <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">dk</span>
              </div>
              <span v-if="formErrors.durationMinutes" class="mt-1 block text-xs text-red-600">{{ formErrors.durationMinutes }}</span>
            </label>
            <label class="block">
              <span class="text-sm font-medium text-slate-700">Fiyat</span>
              <div class="relative mt-1">
                <input
                  v-model.number="form.price"
                  type="number"
                  min="0"
                  step="0.01"
                  class="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-900 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">₺</span>
              </div>
            </label>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="text-sm font-medium text-slate-700">Hazırlık süresi (dk)</span>
              <input v-model.number="form.bufferBeforeMinutes" type="number" min="0" max="120" class="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </label>
            <label class="block">
              <span class="text-sm font-medium text-slate-700">Sonrası bekleme (dk)</span>
              <input v-model.number="form.bufferAfterMinutes" type="number" min="0" max="120" class="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </label>
          </div>
        </fieldset>

        <hr class="border-slate-100" />

        <fieldset class="space-y-3">
          <legend class="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
            <span class="flex size-5 items-center justify-center rounded-full bg-indigo-600 text-[0.6rem] font-bold text-white">3</span>
            Ayarlar
          </legend>
          <div class="space-y-2.5 rounded-xl bg-slate-50 p-4">
            <AppCheckbox v-model="form.requiresConfirmation" label="Onay gerekli" description="Randevu oluşturulduğunda manuel onay bekler." />
            <AppCheckbox v-model="form.sameDayBookingAllowed" label="Aynı gün randevuya açık" description="Müşteri bugün için randevu alabilir." />
            <AppCheckbox v-model="form.packageEligible" label="Paket hizmeti" description="Bu hizmet için seanslı paket şablonu oluşturulabilir." />
          </div>
        </fieldset>

        <p v-if="formSubmitError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{{ formSubmitError }}</p>

        <div class="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <AppButton variant="secondary" @click="showFormModal = false">İptal</AppButton>
          <AppButton variant="primary" native-type="submit" :loading="formSaving">
            {{ editingId ? 'Güncelle' : 'Hizmet ekle' }}
          </AppButton>
        </div>
      </form>
    </AppModal>

    <!-- ── Employee Management Modal ────────────────────────────────────────── -->
    <AppModal
      v-model:visible="showEmployeesModal"
      :title="`Çalışanlar — ${employeesModalService?.name ?? ''}`"
      :style="{ width: 'min(38rem, 95vw)' }"
    >
      <div class="space-y-5">
        <!-- Capable employees -->
        <div>
          <h3 class="mb-2 text-sm font-semibold text-slate-700">Bu hizmeti yapabilenler</h3>
          <p v-if="modalCapableEmployees.length === 0" class="text-sm italic text-slate-400">
            Henüz çalışan atanmamış.
          </p>
          <ul v-else class="divide-y divide-slate-100 rounded-xl border border-slate-200">
            <li
              v-for="emp in modalCapableEmployees"
              :key="emp.id"
              class="flex items-center justify-between gap-3 px-4 py-2.5"
            >
              <div class="flex items-center gap-2">
                <div
                  class="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  :class="avatarColor(emp.id)"
                >{{ initials(emp.name) }}</div>
                <div>
                  <span class="text-sm font-medium text-slate-800">{{ emp.name }}</span>
                  <span v-if="emp.title" class="ml-1.5 text-xs text-slate-400">{{ emp.title }}</span>
                </div>
              </div>
              <AppButton
                variant="danger"
                size="sm"
                :loading="removingEmployeeId === emp.id"
                @click="removeEmployee(emp.id)"
              >
                Kaldır
              </AppButton>
            </li>
          </ul>
        </div>

        <!-- Assign form -->
        <div class="space-y-3 rounded-xl border border-slate-200 p-4">
          <h3 class="text-sm font-semibold text-slate-700">Çalışan ata</h3>
          <p v-if="unassignedActiveEmployees.length === 0" class="text-sm italic text-slate-400">
            Atanabilecek başka aktif çalışan yok.
          </p>
          <template v-else>
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="space-y-1">
                <label class="block text-sm font-medium text-slate-700">Çalışan</label>
                <select v-model.number="assignForm.employeeId" class="form-select">
                  <option :value="0">Seçin</option>
                  <option v-for="emp in unassignedActiveEmployees" :key="emp.id" :value="emp.id">{{ emp.name }}</option>
                </select>
              </div>
              <div class="space-y-1">
                <label class="block text-sm font-medium text-slate-700">Yetkinlik seviyesi</label>
                <select v-model="assignForm.skillLevel" class="form-select">
                  <option v-for="sl in SKILL_LEVELS" :key="sl" :value="sl">{{ SKILL_LEVEL_LABELS[sl] }}</option>
                </select>
              </div>
            </div>
            <div class="flex justify-end">
              <AppButton
                variant="primary"
                size="sm"
                :disabled="!assignForm.employeeId"
                :loading="assigning"
                @click="assignEmployee"
              >
                Ata
              </AppButton>
            </div>
          </template>
          <p v-if="assignError" class="text-sm text-red-500" role="alert">{{ assignError }}</p>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showEmployeesModal = false">Kapat</AppButton>
      </template>
    </AppModal>

    <!-- ── Delete Modal ──────────────────────────────────────────────────────── -->
    <AppModal v-model:visible="showDeleteModal" title="Hizmeti sil">
      <p class="text-sm text-slate-600">
        <span class="font-semibold">«{{ toDelete?.name }}»</span> hizmeti kalıcı olarak silinecek. Bu işlem geri alınamaz.
      </p>
      <template #footer>
        <AppButton variant="secondary" @click="showDeleteModal = false">Vazgeç</AppButton>
        <AppButton variant="danger" :loading="deleting" @click="doDelete">Sil</AppButton>
      </template>
    </AppModal>

    <!-- ── Package prompt Modal ──────────────────────────────────────────────── -->
    <AppModal v-model:visible="showPackagePrompt" title="Paket şablonu oluşturun">
      <div class="flex items-start gap-3">
        <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">
          <PackageCheck class="size-5 text-violet-600" aria-hidden="true" />
        </div>
        <div>
          <p class="font-semibold text-slate-800">«{{ createdServiceName }}» paket şablonu ister misiniz?</p>
          <p class="mt-1 text-sm text-slate-500">Bu hizmeti pakete ekleyebilirsiniz. Şimdi paket şablonu oluşturmak ister misiniz?</p>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showPackagePrompt = false">Sonra</AppButton>
        <AppButton variant="primary" @click="goToCreatePackage">
          <PackageCheck class="size-4" aria-hidden="true" />
          Paket oluştur
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { serviceApi, type ServiceResponse, type CreateServiceRequest, type UpdateServiceRequest } from '@/api/service'
import { employeeApi, type EmployeeResponse, type SkillLevel } from '@/api/employee'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import {
  Plus, Pencil, Trash2, Eye, EyeOff,
  Clock, BadgeDollarSign, ShieldCheck, Scissors, PackageCheck, Users,
} from 'lucide-vue-next'

const router = useRouter()
const auth = useAuthStore()
const businessId = computed(() => auth.user?.businessId ?? null)

// ── Service list ─────────────────────────────────────────────────────────────
const services = ref<ServiceResponse[]>([])
const capableEmployeesMap = ref<Map<number, EmployeeResponse[]>>(new Map())
const allEmployees = ref<EmployeeResponse[]>([])
const loading = ref(true)
const listError = ref('')
const togglingId = ref<number | null>(null)

// ── Create / Edit form ───────────────────────────────────────────────────────
const showFormModal = ref(false)
const showDeleteModal = ref(false)
const showPackagePrompt = ref(false)
const editingId = ref<number | null>(null)
const formSaving = ref(false)
const formSubmitError = ref('')
const toDelete = ref<ServiceResponse | null>(null)
const deleting = ref(false)
const createdServiceId = ref<number | null>(null)
const createdServiceName = ref('')

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

// ── Employee management modal ────────────────────────────────────────────────
const showEmployeesModal = ref(false)
const employeesModalService = ref<ServiceResponse | null>(null)
const removingEmployeeId = ref<number | null>(null)
const assigning = ref(false)
const assignError = ref('')
const assignForm = reactive({ employeeId: 0, skillLevel: 'INTERMEDIATE' as SkillLevel })

const SKILL_LEVELS: SkillLevel[] = ['JUNIOR', 'INTERMEDIATE', 'SENIOR', 'EXPERT']
const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  JUNIOR: 'Junior', INTERMEDIATE: 'Orta', SENIOR: 'Kıdemli', EXPERT: 'Uzman',
}

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-pink-500', 'bg-teal-500',
  'bg-orange-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-rose-500',
]

const modalCapableEmployees = computed(() =>
  employeesModalService.value
    ? (capableEmployeesMap.value.get(employeesModalService.value.id) ?? [])
    : [],
)

const unassignedActiveEmployees = computed(() => {
  const capableIds = new Set(modalCapableEmployees.value.map((e) => e.id))
  return allEmployees.value.filter((e) => e.status === 'ACTIVE' && !capableIds.has(e.id))
})

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

function avatarColor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length]
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatPrice(p: number | string): string {
  const n = typeof p === 'string' ? Number.parseFloat(p) : p
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)
}

function resetForm() {
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
}

function openCreate() {
  editingId.value = null
  resetForm()
  showFormModal.value = true
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
  showFormModal.value = true
}

function openEmployeesModal(s: ServiceResponse) {
  employeesModalService.value = s
  assignForm.employeeId = 0
  assignForm.skillLevel = 'INTERMEDIATE'
  assignError.value = ''
  showEmployeesModal.value = true
}

function validateForm(): boolean {
  formErrors.name = ''
  formErrors.durationMinutes = ''
  if (!form.name.trim() || form.name.trim().length < 2) {
    formErrors.name = 'En az 2 karakter giriniz'
    return false
  }
  if (form.durationMinutes < 15 || form.durationMinutes > 360) {
    formErrors.durationMinutes = '15–360 dakika arasında olmalıdır'
    return false
  }
  return true
}

// ── Data loading ─────────────────────────────────────────────────────────────
async function loadCapableEmployees() {
  const map = new Map<number, EmployeeResponse[]>()
  await Promise.all(
    services.value.map(async (s) => {
      try {
        const { data } = await serviceApi.getCapableEmployees(s.id)
        if (data.success && data.data) map.set(s.id, data.data)
      } catch { /* silent */ }
    }),
  )
  capableEmployeesMap.value = map
}

async function loadAllEmployees() {
  if (!businessId.value) return
  try {
    const { data } = await employeeApi.list(businessId.value)
    if (data.success && data.data) allEmployees.value = data.data
  } catch { /* silent */ }
}

async function reloadCapableForModal() {
  if (!employeesModalService.value) return
  const sid = employeesModalService.value.id
  try {
    const { data } = await serviceApi.getCapableEmployees(sid)
    if (data.success && data.data) {
      const updated = new Map(capableEmployeesMap.value)
      updated.set(sid, data.data)
      capableEmployeesMap.value = updated
    }
  } catch { /* silent */ }
}

async function loadList() {
  if (!businessId.value) return
  loading.value = true
  listError.value = ''
  try {
    const { data } = await serviceApi.list(businessId.value)
    if (data.success && data.data) services.value = data.data
    await loadCapableEmployees()
  } catch {
    listError.value = 'Liste yüklenemedi.'
  } finally {
    loading.value = false
  }
}

// ── Service CRUD ─────────────────────────────────────────────────────────────
async function submitService() {
  if (!businessId.value || !validateForm()) return
  formSaving.value = true
  formSubmitError.value = ''
  const wasCreate = !editingId.value
  const wasPackageEligible = form.packageEligible
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
      const res = await serviceApi.create(body)
      if (wasCreate && wasPackageEligible && res.data.success && res.data.data) {
        createdServiceId.value = res.data.data.id
        createdServiceName.value = res.data.data.name
      }
    }
    await loadList()
    showFormModal.value = false
    if (wasCreate && wasPackageEligible) showPackagePrompt.value = true
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: { message?: string } } } }
    formSubmitError.value = err.response?.data?.error?.message ?? 'Kaydedilemedi.'
  } finally {
    formSaving.value = false
  }
}

function goToCreatePackage() {
  showPackagePrompt.value = false
  if (createdServiceId.value) {
    router.push(`/admin/packages?createFor=${createdServiceId.value}&serviceName=${encodeURIComponent(createdServiceName.value)}`)
  }
}

async function activate(id: number) {
  togglingId.value = id
  try { await serviceApi.activate(id); await loadList() }
  catch { listError.value = 'Aktifleştirilemedi.' }
  finally { togglingId.value = null }
}

async function deactivate(id: number) {
  togglingId.value = id
  try { await serviceApi.deactivate(id); await loadList() }
  catch { listError.value = 'Pasifleştirilemedi.' }
  finally { togglingId.value = null }
}

function confirmDelete(s: ServiceResponse) {
  toDelete.value = s
  showDeleteModal.value = true
}

async function doDelete() {
  if (!toDelete.value) return
  deleting.value = true
  try {
    await serviceApi.delete(toDelete.value.id)
    await loadList()
    showDeleteModal.value = false
  } catch {
    listError.value = 'Silinemedi.'
  } finally {
    deleting.value = false
  }
}

// ── Employee management ───────────────────────────────────────────────────────
async function removeEmployee(empId: number) {
  if (!employeesModalService.value) return
  removingEmployeeId.value = empId
  assignError.value = ''
  try {
    await employeeApi.removeCapability(empId, employeesModalService.value.id)
    await reloadCapableForModal()
  } catch {
    assignError.value = 'Kaldırılamadı.'
  } finally {
    removingEmployeeId.value = null
  }
}

async function assignEmployee() {
  if (!assignForm.employeeId || !employeesModalService.value) return
  assigning.value = true
  assignError.value = ''
  try {
    await employeeApi.assignCapability(assignForm.employeeId, {
      serviceId: employeesModalService.value.id,
      skillLevel: assignForm.skillLevel,
    })
    await reloadCapableForModal()
    assignForm.employeeId = 0
  } catch {
    assignError.value = 'Atama başarısız.'
  } finally {
    assigning.value = false
  }
}

// ── Mount ─────────────────────────────────────────────────────────────────────
onMounted(() => {
  if (businessId.value) {
    loadList()
    loadAllEmployees()
  }
})
</script>

<style scoped>
@import 'tailwindcss' reference;

.form-select {
  @apply w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100;
}
</style>
