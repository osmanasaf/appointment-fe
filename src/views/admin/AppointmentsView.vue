<template>
  <div class="appointments-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Randevular</h1>
        <p class="page-desc">Randevuları görüntüleyin, onaylayın veya iptal edin.</p>
      </div>
    </div>

    <div v-if="!businessId" class="empty-state">İşletme bilgisi bulunamadı.</div>

    <template v-else>
      <div v-if="loading" class="loading-state" aria-busy="true">
        <div class="skeleton-card" v-for="i in 4" :key="i" />
      </div>
      <div v-else-if="listError" class="error-state" role="alert">
        <p>{{ listError }}</p>
        <button type="button" class="btn primary" @click="loadList">Tekrar dene</button>
      </div>
      <template v-else>
        <div class="toolbar card">
          <div class="toolbar-filters">
            <fieldset class="view-toggle" aria-label="Görünüm">
              <button
                type="button"
                class="toggle-btn"
                :class="{ active: viewMode === 'calendar' }"
                @click="viewMode = 'calendar'"
              >
                Takvim
              </button>
              <button
                type="button"
                class="toggle-btn"
                :class="{ active: viewMode === 'list' }"
                @click="viewMode = 'list'"
              >
                Liste
              </button>
            </fieldset>
            <template v-if="viewMode === 'calendar'">
              <button type="button" class="btn small" @click="goPrevWeek" aria-label="Önceki hafta">←</button>
              <button type="button" class="btn small" @click="goToToday" aria-label="Bu hafta">Bugün</button>
              <button type="button" class="btn small" @click="goNextWeek" aria-label="Sonraki hafta">→</button>
              <span class="week-label">{{ weekRangeLabel }}</span>
            </template>
            <template v-else>
              <label class="filter">
                <span class="filter-label">Başlangıç</span>
                <input v-model="filterStart" type="date" class="filter-input" />
              </label>
              <label class="filter">
                <span class="filter-label">Bitiş</span>
                <input v-model="filterEnd" type="date" class="filter-input" />
              </label>
            </template>
            <label class="filter">
              <span class="filter-label">Durum</span>
              <select v-model="filterStatus" class="filter-input">
                <option value="">Tümü</option>
                <option value="PENDING">Beklemede</option>
                <option value="CONFIRMED">Onaylı</option>
                <option value="RISKY">Riskli</option>
                <option value="COMPLETED">Tamamlandı</option>
                <option value="CANCELLED">İptal</option>
                <option value="NO_SHOW">Gelmedi</option>
              </select>
            </label>
            <label class="filter">
              <span class="filter-label">Çalışan</span>
              <select v-model="filterEmployee" class="filter-input">
                <option value="">Tümü</option>
                <option v-for="emp in employees" :key="emp.id" :value="emp.id">{{ emp.name }}</option>
              </select>
            </label>
          </div>
          <div class="toolbar-actions">
            <button type="button" class="btn primary" @click="openCreate" aria-label="Yeni randevu">
              + Yeni randevu
            </button>
            <button type="button" class="btn small" @click="loadList" aria-label="Listeyi yenile">
              Yenile
            </button>
          </div>
        </div>

        <!-- Takvim görünümü -->
        <section v-if="viewMode === 'calendar'" class="calendar-section">
          <h2 class="sr-only">Haftalık takvim</h2>
          <div class="calendar-grid">
            <div class="calendar-header">
              <div class="calendar-corner"></div>
              <div
                v-for="day in calendarDays"
                :key="day.date"
                class="calendar-day-head"
                :class="{ today: day.isToday }"
              >
                <span class="day-weekday">{{ day.weekday }}</span>
                <span class="day-num">{{ day.day }}</span>
                <span class="day-month">{{ day.month }}</span>
              </div>
            </div>
            <div class="calendar-body">
              <div
                v-for="day in calendarDays"
                :key="day.date"
                class="calendar-day-col"
                :class="{ today: day.isToday }"
              >
                <div
                  v-for="a in appointmentsByDay.get(day.date) ?? []"
                  :key="a.id"
                  class="calendar-appt"
                  :class="[a.status.toLowerCase(), { risky: a.risky, 'customer-noshow': customerNoShowMap.get(a.customerId) }]"
                  @click="focusAppointment(a)"
                >
                  <span class="calendar-appt-time">{{ formatTime(a.scheduledAt) }}–{{ formatTime(a.endAt) }}</span>
                  <span class="calendar-appt-customer">{{ resolveCustomerName(a.customerId) }}</span>
                  <span v-if="customerNoShowMap.get(a.customerId)" class="calendar-appt-noshow" title="Bu müşteri daha önce gelmedi; sonraki randevular onaya düşer">⚠</span>
                  <span class="calendar-appt-service">{{ resolveServiceName(a.serviceId) }}</span>
                  <span class="calendar-appt-badge" :class="statusClass(a.status)">{{ statusLabel(a.status) }}</span>
                </div>
                <p v-if="(appointmentsByDay.get(day.date) ?? []).length === 0" class="calendar-day-empty">—</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Liste görünümü -->
        <template v-if="viewMode === 'list'">
          <div v-if="filteredAppointments.length === 0" class="empty-state empty-state-cta">
            <p class="empty-title">Bu aralıkta randevu yok</p>
            <p class="empty-desc">Tarih aralığını veya filtreleri değiştirin.</p>
          </div>
          <ul v-else class="list">
          <li v-for="a in filteredAppointments" :key="a.id" class="card" :class="[a.status.toLowerCase(), { 'customer-noshow': customerNoShowMap.get(a.customerId) }]">
            <div class="card-head">
              <span class="date">{{ formatDateTime(a.scheduledAt) }}</span>
              <span class="badge" :class="statusClass(a.status)">{{ statusLabel(a.status) }}</span>
              <span v-if="a.risky" class="badge risky">Riskli</span>
              <span v-if="customerNoShowMap.get(a.customerId)" class="badge noshow" title="Bu müşteri daha önce gelmedi; sonraki randevular onaya düşer">Onay zorunlu</span>
            </div>
            <p class="meta">
              <span class="meta-customer">{{ resolveCustomerName(a.customerId) }}</span>
              <span class="meta-sep">·</span>
              <span>{{ resolveEmployeeName(a.employeeId) }}</span>
              <span class="meta-sep">·</span>
              <span>{{ resolveServiceName(a.serviceId) }}</span>
              <span class="meta-sep">·</span>
              <span>{{ a.durationMinutes }} dk</span>
            </p>
            <p v-if="a.notes" class="notes">{{ a.notes }}</p>
            <div v-if="canAct(a)" class="actions">
              <template v-if="a.status === 'PENDING' || a.status === 'RISKY'">
                <button type="button" class="btn small primary" @click="confirm(a.id)" aria-label="Onayla">
                  Onayla
                </button>
              </template>
              <template v-if="a.status === 'PENDING' || a.status === 'CONFIRMED' || a.status === 'RISKY'">
                <button type="button" class="btn small" @click="openCancel(a)" aria-label="İptal et">
                  İptal
                </button>
                <button type="button" class="btn small primary" @click="complete(a.id)" aria-label="Tamamla">
                  Tamamla
                </button>
                <button type="button" class="btn small danger" @click="noShow(a.id)" aria-label="Gelmedi">
                  Gelmedi
                </button>
              </template>
            </div>
          </li>
        </ul>
        </template>

        <dialog ref="cancelDialogRef" class="modal" @cancel="closeCancel">
          <div class="modal-inner">
          <h2 class="modal-title">Randevuyu iptal et</h2>
          <p v-if="cancelTarget">«{{ formatDateTime(cancelTarget.scheduledAt) }}» randevusu iptal edilsin mi?</p>
          <div class="field">
            <label for="cancel-reason">İptal nedeni (isteğe bağlı)</label>
            <input id="cancel-reason" v-model="cancelReason" type="text" name="reason" />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn" @click="closeCancel">Vazgeç</button>
            <button type="button" class="btn danger" @click="doCancel" :disabled="cancelling">
              {{ cancelling ? 'İptal ediliyor…' : 'İptal et' }}
            </button>
          </div>
          </div>
        </dialog>

        <dialog ref="createDialogRef" class="modal modal-wide" @cancel="closeCreate">
          <div class="modal-inner">
            <h2 class="modal-title">Yeni randevu</h2>
            <form @submit.prevent="submitCreate" class="form">
              <div class="field">
                <label for="create-employee">Çalışan</label>
                <select id="create-employee" v-model="createForm.employeeId" required :aria-invalid="!!createErrors.employeeId">
                  <option value="">Seçin…</option>
                  <option v-for="emp in employees" :key="emp.id" :value="emp.id">{{ emp.name }}</option>
                </select>
                <span v-if="createErrors.employeeId" class="error">{{ createErrors.employeeId }}</span>
              </div>
              <div class="field">
                <label for="create-service">Hizmet</label>
                <select id="create-service" v-model="createForm.serviceId" required :aria-invalid="!!createErrors.serviceId">
                  <option value="">Seçin…</option>
                  <option v-for="svc in services" :key="svc.id" :value="svc.id">{{ svc.name }} ({{ svc.durationMinutes }} dk)</option>
                </select>
                <span v-if="createErrors.serviceId" class="error">{{ createErrors.serviceId }}</span>
              </div>
              <div class="field-row">
                <div class="field">
                  <label for="create-date">Tarih</label>
                  <input id="create-date" v-model="createForm.date" type="date" required :aria-invalid="!!createErrors.scheduledAt" />
                </div>
                <div class="field">
                  <label for="create-time">Saat</label>
                  <input id="create-time" v-model="createForm.time" type="time" required :aria-invalid="!!createErrors.scheduledAt" />
                </div>
              </div>
              <span v-if="createErrors.scheduledAt" class="error">{{ createErrors.scheduledAt }}</span>
              <div class="field">
                <label for="create-customer-name">Müşteri adı</label>
                <input id="create-customer-name" v-model="createForm.customerName" type="text" required placeholder="Ad soyad…" :aria-invalid="!!createErrors.customerName" />
                <span v-if="createErrors.customerName" class="error">{{ createErrors.customerName }}</span>
              </div>
              <div class="field">
                <label for="create-phone">Telefon</label>
                <input id="create-phone" v-model="createForm.phoneNumber" type="tel" required placeholder="5XX XXX XX XX…" :aria-invalid="!!createErrors.phoneNumber" />
                <span v-if="createErrors.phoneNumber" class="error">{{ createErrors.phoneNumber }}</span>
              </div>
              <div class="field">
                <label for="create-source">Kaynak</label>
                <select id="create-source" v-model="createForm.source">
                  <option value="PHONE">Telefon</option>
                  <option value="WALK_IN">Yerinde</option>
                </select>
              </div>
              <div class="field">
                <label for="create-notes">Not (isteğe bağlı)</label>
                <textarea id="create-notes" v-model="createForm.notes" name="notes" rows="2" maxlength="500" placeholder="Varsa not…" />
              </div>
              <p v-if="createSubmitError" class="submit-error" role="alert">{{ createSubmitError }}</p>
              <div class="modal-actions">
                <button type="button" class="btn" @click="closeCreate">Vazgeç</button>
                <button type="submit" class="btn primary" :disabled="createSaving">
                  {{ createSaving ? 'Kaydediliyor…' : 'Randevu oluştur' }}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { appointmentApi, type AppointmentResponse, type AppointmentStatus } from '@/api/appointment'
import { employeeApi, type EmployeeResponse } from '@/api/employee'
import { serviceApi, type ServiceResponse } from '@/api/service'
import { customerApi, type CustomerResponse } from '@/api/customer'

const auth = useAuthStore()
const businessId = computed(() => auth.user?.businessId ?? null)

const appointments = ref<AppointmentResponse[]>([])
const loading = ref(true)
const listError = ref('')
const viewMode = ref<'calendar' | 'list'>('calendar')
const weekStart = ref('') // YYYY-MM-DD, Pazartesi
const filterStart = ref('')
const filterEnd = ref('')
const filterStatus = ref<AppointmentStatus | ''>('')
const filterEmployee = ref<number | ''>('')

function setDefaultDateRange() {
  const today = new Date()
  setWeekStartFromDate(today)
  const { start, end } = getWeekRangeFromWeekStart(weekStart.value)
  filterStart.value = start
  filterEnd.value = end
}

function setWeekStartFromDate(d: Date) {
  const day = new Date(d)
  const dow = day.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  day.setDate(day.getDate() + diff)
  weekStart.value = day.toISOString().slice(0, 10)
}

function getWeekRangeFromWeekStart(start: string): { start: string; end: string } {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(s)
  e.setDate(e.getDate() + 6)
  return { start, end: e.toISOString().slice(0, 10) }
}

const calendarDays = computed(() => {
  if (!weekStart.value) return []
  const start = new Date(weekStart.value + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days: { date: string; weekday: string; day: number; month: string; isToday: boolean }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    const isToday = d.getTime() === today.getTime()
    days.push({
      date: dateStr,
      weekday: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][(d.getDay() + 6) % 7],
      day: d.getDate(),
      month: d.toLocaleDateString('tr-TR', { month: 'short' }),
      isToday,
    })
  }
  return days
})

const weekRangeLabel = computed(() => {
  if (!weekStart.value) return ''
  const s = new Date(weekStart.value + 'T00:00:00')
  const e = new Date(s)
  e.setDate(e.getDate() + 6)
  return `${s.getDate()} ${s.toLocaleDateString('tr-TR', { month: 'short' })} – ${e.getDate()} ${e.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}`
})

const appointmentsByDay = computed(() => {
  const map = new Map<string, AppointmentResponse[]>()
  for (const day of calendarDays.value) {
    map.set(day.date, [])
  }
  let list = appointments.value
  if (filterStatus.value) list = list.filter(a => a.status === filterStatus.value)
  if (filterEmployee.value !== '') list = list.filter(a => a.employeeId === filterEmployee.value)
  for (const a of list) {
    const dateStr = a.scheduledAt.slice(0, 10)
    if (!map.has(dateStr)) continue
    map.get(dateStr)!.push(a)
  }
  for (const arr of map.values()) {
    arr.sort((x, y) => new Date(x.scheduledAt).getTime() - new Date(y.scheduledAt).getTime())
  }
  return map
})

const cancelDialogRef = ref<HTMLDialogElement | null>(null)
const cancelTarget = ref<AppointmentResponse | null>(null)
const cancelReason = ref('')
const cancelling = ref(false)

const createDialogRef = ref<HTMLDialogElement | null>(null)
const employees = ref<EmployeeResponse[]>([])
const services = ref<ServiceResponse[]>([])
const customers = ref<CustomerResponse[]>([])

// Name resolution maps
const employeeMap = computed(() => {
  const m = new Map<number, string>()
  for (const e of employees.value) m.set(e.id, e.name)
  return m
})
const serviceMap = computed(() => {
  const m = new Map<number, string>()
  for (const s of services.value) m.set(s.id, s.name)
  return m
})
const customerMap = computed(() => {
  const m = new Map<number, string>()
  for (const c of customers.value) m.set(c.id, c.name)
  return m
})
const customerNoShowMap = computed(() => {
  const m = new Map<number, boolean>()
  for (const c of customers.value) {
    if (c.noShowForcesManualApproval) m.set(c.id, true)
  }
  return m
})

function resolveEmployeeName(id: number): string {
  return employeeMap.value.get(id) ?? `Çalışan #${id}`
}
function resolveServiceName(id: number): string {
  return serviceMap.value.get(id) ?? `Hizmet #${id}`
}
function resolveCustomerName(id: number): string {
  return customerMap.value.get(id) ?? `Müşteri #${id}`
}

const filteredAppointments = computed(() => {
  let list = appointments.value
  if (filterStatus.value) list = list.filter(a => a.status === filterStatus.value)
  if (filterEmployee.value !== '') list = list.filter(a => a.employeeId === filterEmployee.value)
  return list
})

const createForm = ref({
  employeeId: '' as number | '',
  serviceId: '' as number | '',
  date: '',
  time: '',
  customerName: '',
  phoneNumber: '',
  source: 'PHONE' as 'PHONE' | 'WALK_IN',
  notes: '',
})
const createErrors = ref<Record<string, string>>({})
const createSubmitError = ref('')
const createSaving = ref(false)

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d)
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

function goPrevWeek() {
  if (!weekStart.value) return
  const d = new Date(weekStart.value + 'T00:00:00')
  d.setDate(d.getDate() - 7)
  weekStart.value = d.toISOString().slice(0, 10)
  const { start, end } = getWeekRangeFromWeekStart(weekStart.value)
  filterStart.value = start
  filterEnd.value = end
  loadList()
}

function goToToday() {
  setWeekStartFromDate(new Date())
  const { start, end } = getWeekRangeFromWeekStart(weekStart.value)
  filterStart.value = start
  filterEnd.value = end
  loadList()
}

function goNextWeek() {
  if (!weekStart.value) return
  const d = new Date(weekStart.value + 'T00:00:00')
  d.setDate(d.getDate() + 7)
  weekStart.value = d.toISOString().slice(0, 10)
  const { start, end } = getWeekRangeFromWeekStart(weekStart.value)
  filterStart.value = start
  filterEnd.value = end
  loadList()
}

function focusAppointment(a: AppointmentResponse) {
  // Opsiyonel: detay açılır veya listeye scroll. Şimdilik sadece görsel vurgu için kullanılabilir.
}

function statusLabel(s: AppointmentStatus): string {
  const map: Record<AppointmentStatus, string> = {
    PENDING: 'Beklemede',
    CONFIRMED: 'Onaylı',
    RISKY: 'Riskli',
    CANCELLED: 'İptal',
    COMPLETED: 'Tamamlandı',
    NO_SHOW: 'Gelmedi',
  }
  return map[s] ?? s
}

function statusClass(s: AppointmentStatus): string {
  const map: Record<AppointmentStatus, string> = {
    PENDING: 'pending',
    CONFIRMED: 'active',
    RISKY: 'risky',
    CANCELLED: 'inactive',
    COMPLETED: 'active',
    NO_SHOW: 'inactive',
  }
  return map[s] ?? ''
}

function canAct(a: AppointmentResponse): boolean {
  return ['PENDING', 'CONFIRMED', 'RISKY'].includes(a.status)
}

function openCancel(a: AppointmentResponse) {
  cancelTarget.value = a
  cancelReason.value = ''
  cancelDialogRef.value?.showModal()
}

function closeCancel() {
  cancelTarget.value = null
  cancelDialogRef.value?.close()
}

async function doCancel() {
  if (!cancelTarget.value) return
  cancelling.value = true
  try {
    await appointmentApi.cancel(cancelTarget.value.id, cancelReason.value || undefined)
    await loadList()
    closeCancel()
  } catch {
    listError.value = 'İptal edilemedi.'
  } finally {
    cancelling.value = false
  }
}

async function confirm(id: number) {
  try {
    await appointmentApi.confirm(id)
    await loadList()
  } catch {
    listError.value = 'Onaylanamadı.'
  }
}

async function complete(id: number) {
  try {
    await appointmentApi.complete(id)
    await loadList()
  } catch {
    listError.value = 'Tamamlanamadı.'
  }
}

async function noShow(id: number) {
  const appt = appointments.value.find(a => a.id === id)
  const cust = appt ? customers.value.find(c => c.id === appt.customerId) : null
  const message = cust
    ? `«${cust.name}» gelmedi olarak işaretlensin mi? Bu müşterinin sonraki randevuları otomatik onaylanmayacak, onaya düşecek.`
    : 'Randevu gelmedi olarak işaretlensin mi?'
  if (!confirm(message)) return
  try {
    await appointmentApi.markNoShow(id)
    await loadList()
    if (businessId.value) {
      const custRes = await customerApi.list(businessId.value)
      if (custRes.data.success && custRes.data.data) customers.value = custRes.data.data
    }
  } catch {
    listError.value = 'İşaretlenemedi.'
  }
}

async function loadList() {
  if (!businessId.value) return
  loading.value = true
  listError.value = ''
  try {
    const params: { businessId: number; startDate?: string; endDate?: string } = {
      businessId: businessId.value,
    }
    if (filterStart.value) params.startDate = filterStart.value
    if (filterEnd.value) params.endDate = filterEnd.value
    const { data } = await appointmentApi.list(
      params.businessId,
      params.startDate,
      params.endDate
    )
    if (data.success && data.data) appointments.value = data.data
  } catch {
    listError.value = 'Liste yüklenemedi.'
  } finally {
    loading.value = false
  }
}

watch([filterStart, filterEnd], () => {
  if (businessId.value) loadList()
})

watch(viewMode, (mode) => {
  if (mode === 'calendar' && filterStart.value) {
    const d = new Date(filterStart.value + 'T00:00:00')
    const dow = d.getDay()
    const diff = dow === 0 ? -6 : 1 - dow
    d.setDate(d.getDate() + diff)
    weekStart.value = d.toISOString().slice(0, 10)
  }
})

async function loadEmployeesAndServices() {
  if (!businessId.value) return
  try {
    const [empRes, svcRes, custRes] = await Promise.all([
      employeeApi.list(businessId.value, true),
      serviceApi.list(businessId.value, true),
      customerApi.list(businessId.value),
    ])
    if (empRes.data.success && empRes.data.data) employees.value = empRes.data.data
    if (svcRes.data.success && svcRes.data.data) services.value = svcRes.data.data
    if (custRes.data.success && custRes.data.data) customers.value = custRes.data.data
  } catch {
    createSubmitError.value = 'Çalışan ve hizmet listesi yüklenemedi.'
  }
}

function openCreate() {
  createForm.value = {
    employeeId: '',
    serviceId: '',
    date: '',
    time: '',
    customerName: '',
    phoneNumber: '',
    source: 'PHONE',
    notes: '',
  }
  createErrors.value = {}
  createSubmitError.value = ''
  loadEmployeesAndServices()
  createDialogRef.value?.showModal()
}

function closeCreate() {
  createDialogRef.value?.close()
}

function validateCreate(): boolean {
  createErrors.value = {}
  createSubmitError.value = ''
  if (createForm.value.employeeId === '') {
    createErrors.value.employeeId = 'Çalışan seçin'
    return false
  }
  if (createForm.value.serviceId === '') {
    createErrors.value.serviceId = 'Hizmet seçin'
    return false
  }
  if (!createForm.value.date || !createForm.value.time) {
    createErrors.value.scheduledAt = 'Tarih ve saat girin'
    return false
  }
  const scheduledAt = new Date(`${createForm.value.date}T${createForm.value.time}:00`)
  if (scheduledAt.getTime() <= Date.now()) {
    createErrors.value.scheduledAt = 'Randevu gelecekte bir tarih/saat olmalıdır'
    return false
  }
  if (!createForm.value.customerName.trim()) {
    createErrors.value.customerName = 'Müşteri adı girin'
    return false
  }
  if (!createForm.value.phoneNumber.trim()) {
    createErrors.value.phoneNumber = 'Telefon girin'
    return false
  }
  const digits = createForm.value.phoneNumber.replaceAll(/\D/g, '')
  if (digits.length < 10) {
    createErrors.value.phoneNumber = 'Geçerli bir telefon numarası girin.'
    return false
  }
  return true
}

async function submitCreate() {
  if (!businessId.value || !validateCreate()) return
  createSaving.value = true
  createSubmitError.value = ''
  try {
    const scheduledAt = new Date(`${createForm.value.date}T${createForm.value.time}:00`).toISOString()
    await appointmentApi.createStaff({
      businessId: businessId.value,
      employeeId: Number(createForm.value.employeeId),
      serviceId: Number(createForm.value.serviceId),
      scheduledAt,
      customerName: createForm.value.customerName.trim(),
      phoneNumber: createForm.value.phoneNumber.trim(),
      phoneCountryCode: '+90',
      notes: createForm.value.notes.trim() || undefined,
      source: createForm.value.source,
    })
    await loadList()
    closeCreate()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: { message?: string }; message?: string } } }
    const msg = err.response?.data?.error?.message ?? err.response?.data?.message ?? 'Randevu oluşturulamadı.'
    createSubmitError.value = msg
  } finally {
    createSaving.value = false
  }
}

onMounted(() => {
  if (businessId.value) {
    setDefaultDateRange()
    loadList()
    loadEmployeesAndServices()
  }
})
</script>

<style scoped>
.page-desc { margin: 0.25rem 0 1rem; font-size: 0.9375rem; color: var(--color-text-muted); }
.empty-state, .error-state { padding: 2rem; text-align: center; background: var(--color-background-alt); border-radius: var(--radius-lg); color: var(--color-text-muted); }
.error-state p { margin: 0 0 1rem; }
.empty-state-cta .empty-title { font-weight: 600; color: var(--color-text); margin: 0 0 0.25rem; }
.empty-state-cta .empty-desc { margin: 0; }
.loading-state { display: flex; flex-direction: column; gap: 0.75rem; }
.skeleton-card { height: 4.5rem; background: linear-gradient(90deg, var(--color-background-alt) 25%, var(--color-border-light) 50%, var(--color-background-alt) 75%); background-size: 200% 100%; animation: skeleton 1.2s ease-in-out infinite; border-radius: var(--radius-lg); }
@keyframes skeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.toolbar { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; padding: 1rem 1.25rem; }
.toolbar-filters { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 1rem; }
.toolbar-actions { display: flex; align-items: center; gap: 0.5rem; }
.filter { display: flex; flex-direction: column; gap: 0.25rem; }
.filter-label { font-size: 0.8125rem; font-weight: 500; color: var(--color-text-muted); }
.filter-input { padding: 0.5rem 0.75rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 0.9375rem; }
.list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem; }
.card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1.25rem; }
.card-head { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.date { font-weight: 600; font-variant-numeric: tabular-nums; }
.badge { font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 9999px; }
.badge.pending { background: var(--color-warning-bg); color: var(--color-warning); }
.badge.active { background: var(--color-success-bg); color: var(--color-success); }
.badge.risky { background: var(--color-danger-bg); color: var(--color-danger); }
.badge.inactive { background: var(--color-background-alt); color: var(--color-text-muted); }
.badge.noshow { background: #fef3c7; color: #b45309; }
.meta, .notes { margin: 0.25rem 0 0; font-size: 0.875rem; color: var(--color-text-muted); }
.meta-customer { font-weight: 500; color: var(--color-text); }
.meta-sep { margin: 0 0.125rem; opacity: 0.5; }
.actions { margin-top: 0.75rem; display: flex; gap: 0.5rem; flex-wrap: wrap; }
.modal { padding: 0; border: 1px solid var(--color-border); border-radius: var(--radius-lg); max-width: 26rem; overflow: hidden; }
.modal.modal-wide { max-width: 28rem; }
.modal::backdrop { background: rgba(15, 23, 42, 0.4); }
.modal-inner { padding: 1.5rem; }
.modal-title { margin: 0 0 1rem; font-size: 1.25rem; font-weight: 600; }
.form .field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 1rem; }
.form .field label { font-weight: 500; font-size: 0.875rem; color: var(--color-text-muted); }
.form .field input, .form .field select, .form .field textarea { padding: 0.5rem 0.75rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-family: inherit; }
.form .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem; }
.form .field-row .field { margin-bottom: 0; }
.form .error, .form .submit-error { font-size: 0.8125rem; color: var(--color-danger); margin: -0.5rem 0 0.25rem; }
.form .submit-error { margin-bottom: 0.5rem; }
.modal-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }

/* Page header */
.page-header { margin-bottom: 0.5rem; }
.page-header .page-desc { margin: 0.25rem 0 0; }

/* View toggle */
.view-toggle { display: flex; margin: 0; padding: 0; border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; }
.toggle-btn { padding: 0.4rem 0.75rem; font-size: 0.875rem; background: var(--color-surface); border: none; color: var(--color-text-muted); cursor: pointer; }
.toggle-btn:hover { background: var(--color-background-alt); color: var(--color-text); }
.toggle-btn.active { background: var(--color-primary); color: white; }
.week-label { font-size: 0.9375rem; font-weight: 500; color: var(--color-text); margin-left: 0.5rem; align-self: center; }

/* Calendar */
.calendar-section { margin-bottom: 1.5rem; }
.calendar-grid { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
.calendar-header { display: grid; grid-template-columns: 0  repeat(7, 1fr); gap: 1px; background: var(--color-border-light); padding: 0.5rem 0; }
.calendar-corner { min-width: 0; }
.calendar-day-head { padding: 0.5rem; text-align: center; background: var(--color-background-alt); font-size: 0.8125rem; }
.calendar-day-head.today { background: var(--color-primary-light); font-weight: 600; color: var(--color-primary); }
.day-weekday { display: block; color: var(--color-text-muted); }
.day-num { font-weight: 700; font-variant-numeric: tabular-nums; color: var(--color-text); }
.day-month { display: block; color: var(--color-text-muted); font-size: 0.75rem; }
.calendar-body { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: var(--color-border-light); min-height: 12rem; }
.calendar-day-col { padding: 0.5rem; background: var(--color-surface); display: flex; flex-direction: column; gap: 0.5rem; align-items: stretch; }
.calendar-day-col.today { background: var(--color-primary-light); }
.calendar-appt { text-align: left; padding: 0.5rem 0.6rem; border-radius: var(--radius-md); border-left: 3px solid var(--color-primary); background: var(--color-background-alt); cursor: pointer; transition: background 0.15s; }
.calendar-appt:hover { background: var(--color-border-light); }
.calendar-appt.pending { border-left-color: var(--color-warning); }
.calendar-appt.risky, .calendar-appt .risky { border-left-color: var(--color-danger); }
.calendar-appt.cancelled, .calendar-appt.no_show { opacity: 0.7; }
.calendar-appt.customer-noshow { border-left-color: #b45309; }
.calendar-appt-noshow { font-size: 0.875rem; color: #b45309; margin-left: 0.25rem; }
.calendar-appt-time { display: block; font-size: 0.75rem; font-variant-numeric: tabular-nums; color: var(--color-text-muted); margin-bottom: 0.2rem; }
.calendar-appt-customer { font-weight: 600; font-size: 0.875rem; color: var(--color-text); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.calendar-appt-service { font-size: 0.75rem; color: var(--color-text-muted); display: block; }
.calendar-appt-badge { font-size: 0.6875rem; margin-top: 0.25rem; display: inline-block; padding: 0.1rem 0.35rem; border-radius: 9999px; }
.calendar-day-empty { margin: 0; font-size: 0.8125rem; color: var(--color-text-subtle); text-align: center; padding: 0.5rem; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
</style>
