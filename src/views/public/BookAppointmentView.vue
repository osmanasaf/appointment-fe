<template>
  <div class="public-page">
    <a href="#main-content" class="skip-link">İçeriğe atla</a>
    <!-- Sabit üst başlık -->
    <header class="header">
      <div class="header-inner">
        <h1 class="title">{{ business?.name ?? 'Randevu' }}</h1>
        <p v-if="business?.description" class="desc">{{ business.description }}</p>
      </div>
    </header>

    <!-- Adım göstergesi -->
    <div v-if="business && !success" class="steps-bar">
      <span class="step-dot" :class="{ active: currentStep >= 1, done: currentStep > 1 }">1</span>
      <span class="step-line" :class="{ done: currentStep > 1 }" />
      <span class="step-dot" :class="{ active: currentStep >= 2, done: currentStep > 2 }">2</span>
      <span class="step-line" :class="{ done: currentStep > 2 }" />
      <span class="step-dot" :class="{ active: currentStep >= 3, done: currentStep > 3 }">3</span>
      <span class="step-line" :class="{ done: currentStep > 3 }" />
      <span class="step-dot" :class="{ active: currentStep >= 4, done: success }">4</span>
    </div>

    <!-- Tek kaydırılabilir alan -->
    <main id="main-content" class="scroll-area" tabindex="-1">
      <div class="container">
        <div v-if="loading && !business" class="state" aria-busy="true">Yükleniyor…</div>
        <div v-else-if="error" class="state state-error" role="alert">{{ error }}</div>

        <template v-else-if="business">
          <!-- Adım 1 -->
          <section class="section" aria-labelledby="step1-heading">
            <h2 id="step1-heading" class="section-title">Hizmet ve çalışan</h2>
            <div class="row">
              <div class="field">
                <label for="sel-service">Hizmet</label>
                <select
                  id="sel-service"
                  v-model="selectedServiceId"
                  name="service"
                  required
                  :aria-invalid="!!errors.serviceId"
                  @change="onServiceOrEmployeeChange"
                >
                  <option value="">Seçin…</option>
                  <option v-for="s in services" :key="s.id" :value="s.id">
                    {{ s.name }} ({{ s.durationMinutes }} dk)
                  </option>
                </select>
                <span v-if="errors.serviceId" class="error">{{ errors.serviceId }}</span>
              </div>
              <div class="field">
                <label for="sel-employee">Çalışan</label>
                <select
                  id="sel-employee"
                  v-model="selectedEmployeeId"
                  name="employee"
                  required
                  :aria-invalid="!!errors.employeeId"
                  @change="onServiceOrEmployeeChange"
                >
                  <option value="">Seçin…</option>
                  <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }}</option>
                </select>
                <span v-if="errors.employeeId" class="error">{{ errors.employeeId }}</span>
              </div>
            </div>
          </section>

          <!-- Adım 2 -->
          <section v-if="selectedServiceId && selectedEmployeeId" class="section" aria-labelledby="step2-heading">
            <h2 id="step2-heading" class="section-title">Tarih seçin</h2>
            <div v-if="datesLoading" class="state" aria-busy="true">Müsait günler yükleniyor…</div>
            <div v-else class="calendar-wrap">
              <div class="calendar-grid" aria-label="2 haftalık takvim">
                <button
                  v-for="day in twoWeeks"
                  :key="day.date"
                  type="button"
                  :class="['day-cell', { available: day.available, selected: selectedDate === day.date }]"
                  :disabled="!day.available"
                  :aria-pressed="selectedDate === day.date"
                  @click="day.available ? selectDate(day.date) : null"
                >
                  <span class="day-weekday">{{ day.weekday }}</span>
                  <span class="day-num">{{ day.day }}</span>
                  <span class="day-month">{{ day.month }}</span>
                  <span v-if="day.available" class="day-badge">Müsait</span>
                </button>
              </div>
            </div>
          </section>

          <!-- Adım 3 -->
          <section v-if="selectedDate" class="section" aria-labelledby="step3-heading">
            <h2 id="step3-heading" class="section-title">Saat — {{ formatDateLong(selectedDate) }}</h2>
            <div v-if="slotsLoading" class="state" aria-busy="true">Saatler yükleniyor…</div>
            <div v-else-if="slots.length === 0" class="state">Bu gün müsait saat yok.</div>
            <div v-else class="slots">
              <button
                v-for="slot in slots"
                :key="slot.startTime"
                type="button"
                class="slot-btn"
                :class="{ selected: selectedSlot === slot.startTime }"
                :aria-pressed="selectedSlot === slot.startTime"
                @click="selectSlot(slot.startTime)"
              >
                <span class="slot-time">{{ formatSlotRange(slot.startTime, slot.endTime) }}</span>
              </button>
            </div>
          </section>

          <!-- Adım 4 -->
          <section v-if="selectedSlot" class="section form-section" aria-labelledby="step4-heading">
            <h2 id="step4-heading" class="section-title">İletişim bilgileri</h2>
            <form @submit.prevent="submitBooking" class="form">
              <div class="field">
                <label for="cust-name">Ad soyad</label>
                <input
                  id="cust-name"
                  v-model="form.customerName"
                  type="text"
                  name="customerName"
                  autocomplete="name"
                  required
                  placeholder="Adınız soyadınız…"
                  :aria-invalid="!!errors.customerName"
                />
                <span v-if="errors.customerName" class="error">{{ errors.customerName }}</span>
              </div>
              <div class="field">
                <label for="cust-phone">Telefon</label>
                <input
                  id="cust-phone"
                  v-model="form.phoneNumber"
                  type="tel"
                  name="phone"
                  autocomplete="tel"
                  inputmode="tel"
                  spellcheck="false"
                  required
                  placeholder="5XX XXX XX XX…"
                  :aria-invalid="!!errors.phoneNumber"
                  aria-describedby="cust-phone-error"
                  @blur="validatePhoneField()"
                />
                <span id="cust-phone-error" v-if="errors.phoneNumber" class="error" role="alert">{{ errors.phoneNumber }}</span>
              </div>
              <div class="field">
                <label for="cust-notes">Not (isteğe bağlı)</label>
                <textarea id="cust-notes" v-model="form.notes" name="notes" rows="2" maxlength="500" placeholder="Varsa eklemek istediğiniz not…" />
              </div>
              <p v-if="submitError" class="submit-error" role="alert">{{ submitError }}</p>
              <button type="submit" class="btn primary" :disabled="submitting">
                {{ submitting ? 'Gönderiliyor…' : 'Randevu talebini gönder' }}
              </button>
            </form>
          </section>

          <!-- Başarı -->
          <section v-if="success" id="success-message" class="section success-box" aria-live="polite">
            <div class="success-icon" aria-hidden="true">✓</div>
            <h2 class="success-title">Randevu talebiniz alındı</h2>
            <p class="success-text">En kısa sürede sizinle iletişime geçilecektir. İyi günler dileriz.</p>
          </section>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { publicApi, type BusinessResponse, type ServiceResponse, type EmployeeResponse } from '@/api/public'

const route = useRoute()
const slug = computed(() => route.params.slug as string)

const business = ref<BusinessResponse | null>(null)
const services = ref<ServiceResponse[]>([])
const employees = ref<EmployeeResponse[]>([])
const loading = ref(true)
const error = ref('')

const selectedServiceId = ref<number | ''>('')
const selectedEmployeeId = ref<number | ''>('')
const availableDates = ref<string[]>([])
const datesLoading = ref(false)
const selectedDate = ref('')
const slots = ref<{ startTime: string; endTime: string; durationMinutes: number; instantConfirmation: boolean; label: string }[]>([])
const slotsLoading = ref(false)
const slotsRequestId = ref(0)
const selectedSlot = ref('')

const form = ref({ customerName: '', phoneNumber: '', notes: '' })
const errors = ref<Record<string, string>>({})
const submitError = ref('')
const submitting = ref(false)
const success = ref(false)

const currentStep = computed(() => {
  if (success.value) return 4
  if (selectedSlot.value) return 4
  if (selectedDate.value) return 3
  if (selectedServiceId.value && selectedEmployeeId.value) return 2
  return 1
})

const scrollBehavior = (): ScrollBehavior =>
  globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'

const stepHeadingId: Record<number, string> = {
  1: 'step1-heading',
  2: 'step2-heading',
  3: 'step3-heading',
  4: 'step4-heading',
}

function scrollToStep(step: number) {
  nextTick(() => {
    const id = stepHeadingId[step]
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
  })
}

watch(currentStep, (step) => {
  if (step >= 2) scrollToStep(step)
})

watch(success, (isSuccess) => {
  if (isSuccess) {
    nextTick(() => {
      document.getElementById('success-message')?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
    })
  }
})

const twoWeeks = computed(() => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const days = business.value?.maxAdvanceBookingDays ?? 14
  const result: { date: string; weekday: string; day: number; month: string; available: boolean }[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    result.push({
      date: dateStr,
      weekday: new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }).format(d),
      day: d.getDate(),
      month: new Intl.DateTimeFormat('tr-TR', { month: 'short' }).format(d),
      available: availableDates.value.includes(dateStr),
    })
  }
  return result
})

function formatDateLong(dateStr: string): string {
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long' }).format(new Date(dateStr))
}

const timeFmt = new Intl.DateTimeFormat('tr-TR', { timeStyle: 'short' })

function formatSlotTime(iso: string): string {
  return timeFmt.format(new Date(iso))
}

function formatSlotRange(startIso: string, endIso: string): string {
  return `${timeFmt.format(new Date(startIso))}–${timeFmt.format(new Date(endIso))}`
}

function resetFormAndErrors() {
  form.value = { customerName: '', phoneNumber: '', notes: '' }
  errors.value = {}
  submitError.value = ''
  success.value = false
}

function onServiceOrEmployeeChange() {
  selectedDate.value = ''
  selectedSlot.value = ''
  slots.value = []
  resetFormAndErrors()
  if (selectedServiceId.value && selectedEmployeeId.value) loadAvailableDates()
}

function selectDate(date: string) {
  selectedDate.value = date
  selectedSlot.value = ''
  slots.value = []
  resetFormAndErrors()
  loadSlots(date)
}

function selectSlot(slotStartTime: string) {
  selectedSlot.value = slotStartTime
  resetFormAndErrors()
}

async function loadAvailableDates() {
  if (!business.value || !selectedServiceId.value || !selectedEmployeeId.value) return
  datesLoading.value = true
  availableDates.value = []
  try {
    const { data } = await publicApi.getAvailableDates(
      business.value.id,
      Number(selectedEmployeeId.value),
      Number(selectedServiceId.value),
      business.value.maxAdvanceBookingDays ?? 30
    )
    if (data.success && data.data) availableDates.value = data.data
  } catch {
    availableDates.value = []
  } finally {
    datesLoading.value = false
  }
}

async function loadSlots(date: string) {
  if (!business.value || !selectedServiceId.value || !selectedEmployeeId.value) return
  const myId = slotsRequestId.value + 1
  slotsRequestId.value = myId
  slotsLoading.value = true
  slots.value = []
  try {
    const { data } = await publicApi.getAvailableSlots(
      business.value.id,
      Number(selectedEmployeeId.value),
      Number(selectedServiceId.value),
      date
    )
    if (myId !== slotsRequestId.value) return
    if (data.success && data.data) slots.value = data.data
    else slots.value = []
  } catch {
    if (myId !== slotsRequestId.value) return
    slots.value = []
  } finally {
    if (myId === slotsRequestId.value) slotsLoading.value = false
  }
}

const MIN_NAME_LENGTH = 2
const MAX_NAME_LENGTH = 100
const MIN_PHONE_DIGITS = 10
const MAX_PHONE_DIGITS = 15

function normalizePhoneDigits(value: string): string {
  return value.replaceAll(/\D/g, '')
}

function validatePhoneField(): boolean {
  const phone = form.value.phoneNumber.trim()
  if (!phone) {
    errors.value = { ...errors.value, phoneNumber: 'Telefon giriniz' }
    return false
  }
  const digits = normalizePhoneDigits(phone)
  if (digits.length < MIN_PHONE_DIGITS) {
    errors.value = { ...errors.value, phoneNumber: 'Geçerli bir telefon numarası girin (en az 10 rakam).' }
    return false
  }
  if (digits.length > MAX_PHONE_DIGITS) {
    errors.value = { ...errors.value, phoneNumber: 'Telefon numarası çok uzun.' }
    return false
  }
  const { phoneNumber: _, ...rest } = errors.value
  errors.value = rest
  return true
}

function validateForm(): boolean {
  submitError.value = ''
  errors.value = {}
  const name = form.value.customerName.trim()
  if (!name) {
    errors.value.customerName = 'Ad soyad giriniz'
    return false
  }
  if (name.length < MIN_NAME_LENGTH) {
    errors.value.customerName = `Ad soyad en az ${MIN_NAME_LENGTH} karakter olmalıdır`
    return false
  }
  if (name.length > MAX_NAME_LENGTH) {
    errors.value.customerName = `Ad soyad en fazla ${MAX_NAME_LENGTH} karakter olabilir`
    return false
  }
  const phone = form.value.phoneNumber.trim()
  if (!phone) {
    errors.value.phoneNumber = 'Telefon giriniz'
    return false
  }
  const digits = normalizePhoneDigits(phone)
  if (digits.length < MIN_PHONE_DIGITS) {
    errors.value.phoneNumber = 'Geçerli bir telefon numarası girin (en az 10 rakam).'
    return false
  }
  if (digits.length > MAX_PHONE_DIGITS) {
    errors.value.phoneNumber = 'Telefon numarası çok uzun.'
    return false
  }
  return true
}

async function submitBooking() {
  if (submitting.value) return
  if (!slug.value || !selectedSlot.value || !validateForm()) return
  submitting.value = true
  submitError.value = ''
  try {
    await publicApi.createAppointment(slug.value, {
      employeeId: Number(selectedEmployeeId.value),
      serviceId: Number(selectedServiceId.value),
      scheduledAt: selectedSlot.value,
      customerName: form.value.customerName.trim(),
      phoneNumber: form.value.phoneNumber.trim(),
      phoneCountryCode: '+90',
      notes: form.value.notes.trim() || undefined,
    })
    success.value = true
    if (selectedDate.value) await loadSlots(selectedDate.value)
  } catch (e: unknown) {
    const err = e as { response?: { status?: number; data?: { error?: { message?: string }; message?: string } }; message?: string }
    const msg = err.response?.data?.error?.message ?? err.response?.data?.message ?? (err instanceof Error ? err.message : null)
    submitError.value = msg ?? 'Randevu gönderilemedi. Tekrar deneyin.'
    const status = err.response?.status
    const msgLower = (msg ?? '').toLowerCase()
    const isSlotConflict = status === 409 || /saat|slot|mevcut|dolu/.test(msgLower)
    if (isSlotConflict && selectedDate.value) loadSlots(selectedDate.value)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  if (!slug.value) {
    loading.value = false
    return
  }
  try {
    const [bRes, sRes, eRes] = await Promise.all([
      publicApi.getBusiness(slug.value),
      publicApi.getServices(slug.value),
      publicApi.getEmployees(slug.value),
    ])
    if (bRes.data.success && bRes.data.data) business.value = bRes.data.data
    else error.value = 'İşletme bulunamadı.'
    if (sRes.data.success && sRes.data.data) services.value = sRes.data.data
    if (eRes.data.success && eRes.data.data) employees.value = eRes.data.data
  } catch {
    error.value = 'Sayfa yüklenemedi.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.public-page {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--color-background, #f8fafc);
}

.skip-link {
  position: absolute;
  top: -100px;
  left: 0.75rem;
  z-index: 100;
  padding: 0.5rem 0.75rem;
  background: var(--color-primary, #4f46e5);
  color: #fff;
  font-weight: 600;
  border-radius: 0.5rem;
  text-decoration: none;
  transition: top 0.2s ease-out;
}

.skip-link:focus {
  top: 0.75rem;
  outline: 2px solid var(--color-primary, #6366f1);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .skip-link {
    transition: none;
  }
}

.header {
  flex-shrink: 0;
  padding: 1rem 1rem 0.75rem;
  background: var(--color-surface, #fff);
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.header-inner {
  max-width: 28rem;
  margin: 0 auto;
  text-align: center;
}

.title {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-text, #0f172a);
  letter-spacing: -0.02em;
  text-wrap: balance;
  overflow-wrap: break-word;
  word-break: break-word;
}

.desc {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary, #475569);
  line-height: 1.4;
  overflow-wrap: break-word;
  word-break: break-word;
}

.steps-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  background: var(--color-surface, #fff);
}

.step-dot {
  width: 1.75rem;
  height: 1.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 50%;
  background: var(--color-border, #e2e8f0);
  color: var(--color-text-muted, #64748b);
  transition: background 0.2s ease, color 0.2s ease;
}

@media (prefers-reduced-motion: reduce) {
  .step-dot,
  .step-line {
    transition: none;
  }
}

.step-dot.active {
  background: var(--color-primary, #4f46e5);
  color: #fff;
}

.step-dot.done {
  background: var(--color-primary, #4f46e5);
  color: #fff;
}

.step-line {
  width: 1.5rem;
  height: 2px;
  background: var(--color-border, #e2e8f0);
  transition: background 0.2s ease;
}

.step-line.done {
  background: var(--color-primary, #4f46e5);
}

.scroll-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  scroll-margin-top: 0.5rem;
}

.container {
  max-width: 28rem;
  margin: 0 auto;
  padding: 1rem 1rem 2rem;
}

.state {
  padding: 1.5rem;
  text-align: center;
  font-size: 0.9375rem;
  color: var(--color-text-secondary, #475569);
}

.state-error {
  color: var(--color-danger, #dc2626);
  background: var(--color-danger-bg, #fef2f2);
  border-radius: 0.5rem;
}

.section {
  background: var(--color-surface, #fff);
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
}

.section-title {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text, #0f172a);
  text-wrap: balance;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

@media (max-width: 380px) {
  .row {
    grid-template-columns: 1fr;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field label {
  font-weight: 500;
  font-size: 0.8125rem;
  color: var(--color-text-secondary, #475569);
}

.field select,
.field input,
.field textarea {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 0.5rem;
  font-size: 1rem;
  background: #fff;
  font-family: inherit;
}

.field select:focus-visible,
.field input:focus-visible,
.field textarea:focus-visible {
  outline: none;
  border-color: var(--color-primary, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
}

.field select[aria-invalid="true"],
.field input[aria-invalid="true"] {
  border-color: var(--color-danger, #dc2626);
}

.error {
  font-size: 0.8125rem;
  color: var(--color-danger, #dc2626);
}

.calendar-wrap {
  overflow-x: auto;
  margin: 0 -0.25rem;
  padding-bottom: 0.25rem;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.375rem;
  min-width: 18rem;
}

.day-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 0.25rem;
  border: 2px solid var(--color-border, #e2e8f0);
  border-radius: 0.5rem;
  background: var(--color-background-alt, #f1f5f9);
  cursor: default;
  min-height: 3.5rem;
  font: inherit;
  text-align: center;
  touch-action: manipulation;
  -webkit-tap-highlight-color: rgba(99, 102, 241, 0.2);
}

.day-cell:disabled {
  cursor: not-allowed;
  opacity: 0.8;
}

.day-cell.available {
  background: #eef2ff;
  border-color: #a5b4fc;
  cursor: pointer;
}

.day-cell.available:hover {
  background: #e0e7ff;
  border-color: var(--color-primary, #6366f1);
}

.day-cell.selected {
  background: var(--color-primary, #4f46e5);
  border-color: var(--color-primary, #4f46e5);
  color: #fff;
}

.day-cell.selected .day-weekday,
.day-cell.selected .day-month,
.day-cell.selected .day-badge {
  color: rgba(255, 255, 255, 0.95);
}

.day-cell:focus-visible {
  outline: 2px solid var(--color-primary, #6366f1);
  outline-offset: 2px;
}

.day-weekday {
  font-size: 0.625rem;
  text-transform: uppercase;
  color: var(--color-text-secondary, #475569);
}

.day-num {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0.0625rem 0;
  font-variant-numeric: tabular-nums;
}

.day-month {
  font-size: 0.6875rem;
  color: var(--color-text-secondary, #475569);
}

.day-badge {
  font-size: 0.5625rem;
  margin-top: 0.125rem;
  color: var(--color-primary, #6366f1);
}

.slots {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

@media (max-width: 480px) {
  .slots {
    flex-direction: column;
  }
}

.slot-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.875rem;
  border: 2px solid var(--color-border, #e2e8f0);
  border-radius: 0.5rem;
  background: #fff;
  cursor: pointer;
  font-size: 0.9375rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  min-width: 4.5rem;
  touch-action: manipulation;
  -webkit-tap-highlight-color: rgba(99, 102, 241, 0.2);
}

@media (max-width: 480px) {
  .slot-btn {
    width: 100%;
    min-width: unset;
    padding: 0.75rem 1rem;
    font-size: 1rem;
  }
}

.slot-btn:hover {
  border-color: #a5b4fc;
  background: #eef2ff;
}

.slot-btn:focus-visible {
  outline: 2px solid var(--color-primary, #6366f1);
  outline-offset: 2px;
}

.slot-btn.selected {
  border-color: var(--color-primary, #4f46e5);
  background: var(--color-primary, #4f46e5);
  color: #fff;
}

.form-section .form {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.submit-error {
  color: var(--color-danger, #dc2626);
  font-size: 0.875rem;
  margin: 0;
}

.btn {
  padding: 0.75rem 1.25rem;
  font-weight: 600;
  font-size: 1rem;
  font-family: inherit;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  background: var(--color-primary, #4f46e5);
  color: #fff;
}

.btn:hover:not(:disabled) {
  filter: brightness(1.05);
}

.btn:focus-visible {
  outline: 2px solid var(--color-primary, #6366f1);
  outline-offset: 2px;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.success-box {
  text-align: center;
  padding: 1.5rem 1.25rem;
  background: #d1fae5;
  border: 1px solid #34d399;
}

.success-icon {
  width: 2.5rem;
  height: 2.5rem;
  margin: 0 auto 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #047857;
  color: #fff;
  border-radius: 50%;
  font-size: 1.25rem;
  font-weight: 700;
}

.success-title {
  margin: 0 0 0.25rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #064e3b;
}

.success-text {
  margin: 0;
  font-size: 0.9375rem;
  color: #065f46;
}
</style>
