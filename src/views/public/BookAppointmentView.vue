<template>
  <div class="public-page">
    <a href="#main-content" class="skip-link">İçeriğe atla</a>

    <!-- Gradient Header -->
    <header class="header">
      <div class="header-inner">
        <div class="header-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <h1 class="title">{{ business?.name ?? 'Randevu Al' }}</h1>
        <p v-if="business?.description" class="desc">{{ business.description }}</p>
      </div>
    </header>

    <!-- Steps Bar -->
    <div v-if="business && !success" class="steps-bar" role="navigation" aria-label="Adımlar">
      <div class="steps-track">
        <template v-for="(step, i) in [{ label: 'Hizmet' }, { label: 'Tarih' }, { label: 'Saat' }, { label: 'Bilgiler' }]" :key="i">
          <div class="step-item" :class="{ active: currentStep >= i + 1, done: currentStep > i + 1 }">
            <div class="step-dot" :aria-current="currentStep === i + 1 ? 'step' : undefined">
              <svg v-if="currentStep > i + 1" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span class="step-label">{{ step.label }}</span>
          </div>
          <div v-if="i < 3" class="step-connector" :class="{ done: currentStep > i + 1 }" aria-hidden="true" />
        </template>
      </div>
    </div>

    <!-- Mobil sticky CTA — saat seçilince scroll yerine hızlı gönderim -->
    <Teleport to="body">
      <div
        v-if="selectedSlot && !success"
        class="mobile-sticky-cta"
        aria-hidden="true"
      >
        <div class="mobile-sticky-inner">
          <div class="mobile-sticky-summary">
            <p v-if="selectedService" class="mobile-sticky-service">{{ selectedService.name }}</p>
            <p v-if="selectedDate && selectedSlotInfo" class="mobile-sticky-time">
              {{ formatDateLong(selectedDate) }}, {{ formatSlotTime(selectedSlotInfo.startTime) }}
            </p>
          </div>
          <button
            type="button"
            class="mobile-sticky-btn"
            :disabled="submitting"
            @click="() => { document.getElementById('step4-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }"
          >Randevu Al</button>
        </div>
      </div>
    </Teleport>

    <!-- Scrollable Content -->
    <main id="main-content" class="scroll-area" tabindex="-1">
      <div class="container">

        <!-- Loading -->
        <div v-if="loading && !business" class="state-card" aria-busy="true">
          <div class="spinner" aria-hidden="true" />
          <p>Yükleniyor…</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="state-card state-error" role="alert">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p>{{ error }}</p>
        </div>

        <template v-else-if="business">

          <!-- ── Adım 1: Hizmet & Çalışan ── -->
          <section class="section" aria-labelledby="step1-heading">
            <h2 id="step1-heading" class="section-title">
              <span class="section-num">1</span>
              Hizmet ve Çalışan Seçin
            </h2>

            <p class="field-label">Hizmet</p>
            <div
              class="card-grid"
              role="radiogroup"
              aria-label="Hizmet seçin"
              :aria-invalid="!!errors.serviceId"
            >
              <button
                v-for="s in services"
                :key="s.id"
                type="button"
                class="select-card"
                :class="{ selected: selectedServiceId === s.id }"
                :aria-pressed="selectedServiceId === s.id"
                @click="selectedServiceId = s.id; onServiceOrEmployeeChange()"
              >
                <div class="card-check" aria-hidden="true">
                  <svg v-if="selectedServiceId === s.id" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div class="service-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/><path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/><path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/><path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/><path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/><path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"/></svg>
                </div>
                <div class="card-body">
                  <span class="card-name">{{ s.name }}</span>
                  <div class="card-meta">
                    <span class="pill pill-gray">{{ s.durationMinutes }} dk</span>
                    <span v-if="s.price" class="pill pill-green">{{ s.price }} {{ s.currency }}</span>
                  </div>
                </div>
              </button>
            </div>
            <p v-if="errors.serviceId" class="error-msg" role="alert">{{ errors.serviceId }}</p>

            <p class="field-label" style="margin-top: 1.25rem;">Çalışan</p>
            <div
              class="card-grid"
              role="radiogroup"
              aria-label="Çalışan seçin"
              :aria-invalid="!!errors.employeeId"
            >
              <button
                v-for="e in employees"
                :key="e.id"
                type="button"
                class="select-card employee-card"
                :class="{ selected: selectedEmployeeId === e.id }"
                :aria-pressed="selectedEmployeeId === e.id"
                @click="selectedEmployeeId = e.id; onServiceOrEmployeeChange()"
              >
                <div class="card-check" aria-hidden="true">
                  <svg v-if="selectedEmployeeId === e.id" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div class="avatar" :style="{ background: avatarColor(e.name) }" aria-hidden="true">{{ getInitials(e.name) }}</div>
                <span class="card-name">{{ e.name }}</span>
              </button>
            </div>
            <p v-if="errors.employeeId" class="error-msg" role="alert">{{ errors.employeeId }}</p>
          </section>

          <!-- ── Adım 2: Tarih ── -->
          <section v-if="selectedServiceId && selectedEmployeeId" class="section" aria-labelledby="step2-heading">
            <h2 id="step2-heading" class="section-title">
              <span class="section-num">2</span>
              Tarih Seçin
            </h2>

            <div v-if="datesLoading" class="calendar-skeleton" aria-busy="true" aria-label="Müsait günler yükleniyor">
              <div v-for="n in 14" :key="n" class="skeleton-cell" />
            </div>
            <div v-else class="calendar-wrap">
              <div class="calendar-weekdays" aria-hidden="true">
                <span v-for="wd in ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']" :key="wd">{{ wd }}</span>
              </div>
              <div class="calendar-grid" :aria-label="`Rezervasyon takvimi, ${twoWeeks.length} gün`">
                <div
                  v-for="i in calendarLeadingEmptyCount"
                  :key="'cal-pad-' + i"
                  class="calendar-grid-pad"
                  aria-hidden="true"
                />
                <button
                  v-for="day in twoWeeks"
                  :key="day.date"
                  type="button"
                  class="day-cell"
                  :class="{
                    available: day.available,
                    selected: selectedDate === day.date,
                    today: day.date === todayStr,
                  }"
                  :disabled="!day.available"
                  :aria-pressed="selectedDate === day.date"
                  :aria-label="`${day.date === todayStr ? 'Bugün, ' : ''}${day.weekday} ${day.day} ${day.month}${day.available ? ', müsait' : ', müsait değil'}`"
                  @click="day.available ? selectDate(day.date) : undefined"
                >
                  <span class="day-num">{{ day.day }}</span>
                  <span class="day-month">{{ day.month }}</span>
                  <span v-if="day.date === todayStr" class="today-dot" aria-hidden="true" />
                  <span v-else-if="day.available" class="avail-dot" aria-hidden="true" />
                </button>
              </div>
            </div>
          </section>

          <!-- ── Adım 3: Saat ── -->
          <section v-if="selectedDate" class="section" aria-labelledby="step3-heading">
            <h2 id="step3-heading" class="section-title">
              <span class="section-num">3</span>
              Saat Seçin
              <span class="title-date">{{ formatDateLong(selectedDate) }}</span>
            </h2>

            <div v-if="slotsLoading" class="slots-skeleton" aria-busy="true" aria-label="Saatler yükleniyor">
              <div v-for="n in 6" :key="n" class="slot-skeleton" />
            </div>
            <div v-else-if="slots.length === 0" class="empty-slots">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <p>Bu gün için müsait saat bulunmuyor.</p>
            </div>
            <div v-else class="slot-groups">
              <div v-for="group in slotGroups" :key="group.label" class="slot-group">
                <p class="group-label">
                  <span aria-hidden="true">{{ group.icon }}</span>
                  {{ group.label }}
                </p>
                <div class="slots">
                  <button
                    v-for="slot in group.slots"
                    :key="slot.startTime"
                    type="button"
                    class="slot-btn"
                    :class="{ selected: selectedSlot === slot.startTime }"
                    :aria-pressed="selectedSlot === slot.startTime"
                    @click="selectSlot(slot.startTime)"
                  >
                    <span class="slot-start">{{ formatSlotTime(slot.startTime) }}</span>
                    <span class="slot-end">{{ formatSlotTime(slot.endTime) }}</span>
                    <span v-if="!slot.instantConfirmation" class="slot-pending-pill">Onay Beklenir</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- ── Adım 4: İletişim ── -->
          <section v-if="selectedSlot" class="section form-section" aria-labelledby="step4-heading">
            <h2 id="step4-heading" class="section-title">
              <span class="section-num">4</span>
              İletişim Bilgileri
            </h2>

            <!-- Booking Summary -->
            <div class="booking-summary" aria-label="Randevu özeti">
              <div class="summary-row" v-if="selectedService">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/><path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/><path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/><path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/><path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/><path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"/></svg>
                <span>{{ selectedService.name }}</span>
                <span class="summary-pill">{{ selectedService.durationMinutes }} dk</span>
              </div>
              <div class="summary-row" v-if="selectedEmployee">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>{{ selectedEmployee.name }}</span>
              </div>
              <div class="summary-row" v-if="selectedDate && selectedSlotInfo">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span>{{ formatDateLong(selectedDate) }}, {{ formatSlotTime(selectedSlotInfo.startTime) }}</span>
              </div>
            </div>

            <!-- Form -->
            <form @submit.prevent="submitBooking" class="form">
              <div class="field">
                <label for="cust-name">Ad Soyad</label>
                <div class="input-wrap" :class="{ invalid: !!errors.customerName }">
                  <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <input
                    id="cust-name"
                    v-model="form.customerName"
                    type="text"
                    name="customerName"
                    autocomplete="name"
                    required
                    placeholder="Adınız soyadınız"
                    :aria-invalid="!!errors.customerName"
                  />
                </div>
                <span v-if="errors.customerName" class="error-msg" role="alert">{{ errors.customerName }}</span>
              </div>

              <div class="field">
                <label for="cust-phone">Telefon</label>
                <div class="input-wrap" :class="{ invalid: !!errors.phoneNumber }">
                  <span class="phone-prefix" aria-hidden="true">+90</span>
                  <input
                    id="cust-phone"
                    v-model="form.phoneNumber"
                    type="tel"
                    name="phone"
                    autocomplete="tel"
                    inputmode="tel"
                    spellcheck="false"
                    required
                    placeholder="5XX XXX XX XX"
                    :aria-invalid="!!errors.phoneNumber"
                    aria-describedby="cust-phone-error"
                    @blur="validatePhoneField()"
                  />
                </div>
                <span id="cust-phone-error" v-if="errors.phoneNumber" class="error-msg" role="alert">{{ errors.phoneNumber }}</span>
              </div>

              <div class="field">
                <label for="cust-notes">Not <span class="optional">(isteğe bağlı)</span></label>
                <div class="input-wrap textarea-wrap">
                  <svg class="input-icon input-icon-top" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  <textarea
                    id="cust-notes"
                    v-model="form.notes"
                    name="notes"
                    rows="3"
                    maxlength="500"
                    placeholder="Eklemek istediğiniz bir not varsa buraya yazabilirsiniz…"
                  />
                </div>
              </div>

              <p v-if="submitError" class="submit-error" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {{ submitError }}
              </p>

              <button type="submit" class="submit-btn" :disabled="submitting" :aria-busy="submitting">
                <span v-if="submitting" class="btn-spinner" aria-hidden="true" />
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                {{ submitting ? 'Gönderiliyor…' : 'Randevu Talep Et' }}
              </button>
            </form>
          </section>

          <!-- ── Başarı ── -->
          <section v-if="success" id="success-message" class="section success-section" aria-live="polite">
            <div class="success-checkmark" aria-hidden="true">
              <svg viewBox="0 0 52 52" class="check-svg">
                <circle class="check-circle" cx="26" cy="26" r="25" fill="none"/>
                <path class="check-path" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
            </div>
            <h2 class="success-title">Talebiniz Alındı!</h2>
            <p class="success-text">En kısa sürede sizinle iletişime geçilecektir. İyi günler dileriz.</p>

            <div v-if="selectedService || selectedEmployee || selectedDate" class="success-summary">
              <div v-if="selectedService" class="success-summary-row">
                <span class="success-summary-label">Hizmet</span>
                <span>{{ selectedService.name }}</span>
              </div>
              <div v-if="selectedEmployee" class="success-summary-row">
                <span class="success-summary-label">Çalışan</span>
                <span>{{ selectedEmployee.name }}</span>
              </div>
              <div v-if="selectedDate && selectedSlotInfo" class="success-summary-row">
                <span class="success-summary-label">Tarih & Saat</span>
                <span>{{ formatDateLong(selectedDate) }}, {{ formatSlotTime(selectedSlotInfo.startTime) }}</span>
              </div>
            </div>
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
import { usePageMeta, setPageMeta } from '@/composables/usePageMeta'
import { publicBookingCustomerSchema } from '@/validation/schemas'

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
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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

function columnIndexMondayFirst(y: number, monthIndex: number, day: number): number {
  const d = new Date(y, monthIndex, day)
  return (d.getDay() + 6) % 7
}

const calendarLeadingEmptyCount = computed(() => {
  const first = twoWeeks.value[0]
  if (!first) return 0
  const [y, m, day] = first.date.split('-').map(Number)
  return columnIndexMondayFirst(y, m - 1, day)
})

function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long' }).format(new Date(y, m - 1, d))
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
      Number(selectedServiceId.value),
      business.value.maxAdvanceBookingDays ?? 30,
      Number(selectedEmployeeId.value),
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
      Number(selectedServiceId.value),
      date,
      Number(selectedEmployeeId.value),
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

function normalizePhoneDigits(value: string): string {
  return value.replaceAll(/\D/g, '')
}

/** Türkiye numarasını normalize eder: başında 0 veya +90 varsa temizler. */
function normalizeToLocalPhone(value: string): string {
  const digits = normalizePhoneDigits(value)
  if (digits.startsWith('90') && digits.length === 12) return digits.slice(2)
  if (digits.startsWith('0') && digits.length === 11) return digits.slice(1)
  return digits
}

function validatePhoneField(): void {
  const phone = normalizeToLocalPhone(form.value.phoneNumber)
  const result = publicBookingCustomerSchema.shape.customerPhone.safeParse(phone)
  if (!result.success) {
    errors.value = { ...errors.value, phoneNumber: result.error.issues[0]?.message ?? 'Geçersiz telefon' }
  } else {
    const { phoneNumber: _, ...rest } = errors.value
    errors.value = rest
  }
}

function validateForm(): boolean {
  submitError.value = ''
  const result = publicBookingCustomerSchema.safeParse({
    customerName: form.value.customerName.trim(),
    customerPhone: normalizeToLocalPhone(form.value.phoneNumber),
    customerNotes: form.value.notes.trim() || undefined,
  })
  if (!result.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const schemaField = issue.path[0] as string
      const formField =
        schemaField === 'customerPhone' ? 'phoneNumber'
        : schemaField === 'customerNotes' ? 'notes'
        : schemaField
      if (!fieldErrors[formField]) fieldErrors[formField] = issue.message
    }
    errors.value = fieldErrors
    return false
  }
  errors.value = {}
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
      phoneNumber: normalizeToLocalPhone(form.value.phoneNumber),
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

// Başlangıç meta — işletme yüklenince watch ile güncellenecek
usePageMeta({
  title: 'Online Randevu Al',
  description: 'Kolayca online randevu alın. Hizmet, tarih ve saat seçerek randevunuzu oluşturun.',
})

watch(business, (biz) => {
  if (!biz) return
  setPageMeta({
    title: `${biz.name} — Randevu Al`,
    description: biz.description
      ? `${biz.description} — Online randevu almak için tıklayın.`
      : `${biz.name} için online randevu alın.`,
    slug: slug.value,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: biz.name,
      description: biz.description ?? undefined,
      url: `https://ayarla.com/b/${slug.value}`,
    },
  })
})

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

// ── Yeni yardımcılar (tasarım için) ────────────────────────────────────────

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = ['#6366f1','#8b5cf6','#ec4899','#0ea5e9','#14b8a6','#f59e0b','#10b981']
function avatarColor(name: string): string {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const selectedService = computed(() => services.value.find(s => s.id === selectedServiceId.value))
const selectedEmployee = computed(() => employees.value.find(e => e.id === selectedEmployeeId.value))
const selectedSlotInfo = computed(() => slots.value.find(s => s.startTime === selectedSlot.value))

const slotGroups = computed(() => {
  const groups = [
    { label: 'Sabah', icon: '🌅', slots: slots.value.filter(s => new Date(s.startTime).getHours() < 12) },
    { label: 'Öğleden Sonra', icon: '☀️', slots: slots.value.filter(s => { const h = new Date(s.startTime).getHours(); return h >= 12 && h < 17 }) },
    { label: 'Akşam', icon: '🌙', slots: slots.value.filter(s => new Date(s.startTime).getHours() >= 17) },
  ]
  return groups.filter(g => g.slots.length > 0)
})

const today = new Date()
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
</script>

<style scoped>
/* ── Mobil sticky CTA ─────────────────────────────────────── */
.mobile-sticky-cta {
  display: none;
}
@media (max-width: 639px) {
  .mobile-sticky-cta {
    display: block;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
    background: #fff;
    border-top: 1px solid #e2e8f0;
    padding: 0.75rem 1rem;
    padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
    box-shadow: 0 -4px 16px rgba(0,0,0,0.08);
  }
}
.mobile-sticky-inner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 30rem;
  margin: 0 auto;
}
.mobile-sticky-summary {
  min-width: 0;
  flex: 1;
}
.mobile-sticky-service {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mobile-sticky-time {
  margin: 0;
  font-size: 0.75rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mobile-sticky-btn {
  flex-shrink: 0;
  padding: 0.625rem 1.125rem;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: #fff;
  border: none;
  border-radius: 0.75rem;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  touch-action: manipulation;
  box-shadow: 0 2px 8px rgba(79,70,229,0.4);
}
.mobile-sticky-btn:disabled { opacity: 0.65; cursor: not-allowed; }

/* ── Base layout ──────────────────────────────────────────── */
.public-page {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #f1f5f9;
}

.skip-link {
  position: absolute;
  top: -100px;
  left: 0.75rem;
  z-index: 100;
  padding: 0.5rem 0.75rem;
  background: #4f46e5;
  color: #fff;
  font-weight: 600;
  border-radius: 0.5rem;
  text-decoration: none;
  transition: top 0.2s ease-out;
}
.skip-link:focus { top: 0.75rem; outline: 2px solid #6366f1; outline-offset: 2px; }

/* ── Header ───────────────────────────────────────────────── */
.header {
  flex-shrink: 0;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  padding: 1.25rem 1rem 1.5rem;
}
.header-inner {
  max-width: 30rem;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
}
.header-icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  background: rgba(255,255,255,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 0.125rem;
}
.title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.025em;
  text-wrap: balance;
  overflow-wrap: break-word;
  line-height: 1.2;
}
.desc {
  margin: 0;
  font-size: 0.875rem;
  color: rgba(255,255,255,0.82);
  line-height: 1.4;
  overflow-wrap: break-word;
}

/* ── Steps bar ────────────────────────────────────────────── */
.steps-bar {
  flex-shrink: 0;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.75rem 0.5rem;
}
.steps-track {
  max-width: 30rem;
  margin: 0 auto;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}
.step-dot {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  background: #e2e8f0;
  color: #94a3b8;
  transition: background 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;
}
.step-item.active .step-dot {
  background: #4f46e5;
  color: #fff;
  box-shadow: 0 0 0 4px rgba(79,70,229,0.18);
}
.step-item.done .step-dot {
  background: #4f46e5;
  color: #fff;
  box-shadow: none;
}
.step-label {
  font-size: 0.6875rem;
  font-weight: 500;
  color: #94a3b8;
  white-space: nowrap;
  transition: color 0.25s ease;
}
.step-item.active .step-label,
.step-item.done .step-label { color: #4f46e5; }
.step-connector {
  flex: 1;
  height: 2px;
  background: #e2e8f0;
  margin: 0.9375rem 0.375rem 0;
  min-width: 1.5rem;
  max-width: 3rem;
  transition: background 0.25s ease;
}
.step-connector.done { background: #4f46e5; }

/* ── Scroll area & container ──────────────────────────────── */
.scroll-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
.container {
  max-width: 30rem;
  margin: 0 auto;
  padding: 1.25rem 1rem 3rem;
  /* Mobil sticky CTA yüksekliği kadar extra boşluk */
  padding-bottom: max(3rem, calc(3rem + env(safe-area-inset-bottom)));
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ── Loading / Error states ───────────────────────────────── */
.state-card {
  background: #fff;
  border-radius: 1rem;
  padding: 2rem 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: #64748b;
  font-size: 0.9375rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.state-error { color: #dc2626; background: #fef2f2; }
.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #e2e8f0;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Section card ─────────────────────────────────────────── */
.section {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
  padding: 1.25rem;
  animation: slideUp 0.3s ease both;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

.section-title {
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.section-num {
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  border-radius: 50%;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 0.75rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.title-date {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #64748b;
}

/* ── Field label ──────────────────────────────────────────── */
.field-label {
  margin: 0 0 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── Select cards ─────────────────────────────────────────── */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: 0.625rem;
}
.select-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 0.875rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #f8fafc;
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
.select-card:hover { border-color: #a5b4fc; background: #f5f3ff; }
.select-card.selected {
  border-color: #4f46e5;
  background: #eef2ff;
  box-shadow: 0 0 0 3px rgba(79,70,229,0.12);
}
.select-card:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}
.card-check {
  position: absolute;
  top: 0.45rem;
  right: 0.45rem;
  width: 1.125rem;
  height: 1.125rem;
  border-radius: 50%;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.select-card.selected .card-check {
  background: #4f46e5;
  color: #fff;
}
.service-icon {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4f46e5;
}
.select-card.selected .service-icon { background: #c7d2fe; }
.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}
.card-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.25;
  overflow-wrap: break-word;
}
.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}
.pill {
  display: inline-block;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1.4;
}
.pill-gray { background: #f1f5f9; color: #64748b; }
.pill-green { background: #d1fae5; color: #065f46; }

/* Employee card variant */
.employee-card { align-items: center; }
.avatar {
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.employee-card .card-name { font-size: 0.875rem; }

.error-msg {
  margin: 0.375rem 0 0;
  font-size: 0.8125rem;
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* ── Calendar ─────────────────────────────────────────────── */
.calendar-skeleton {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.375rem;
}
.skeleton-cell {
  height: 4.25rem;
  border-radius: 0.625rem;
  background: #f1f5f9;
  animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.calendar-wrap { overflow-x: auto; }
.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.375rem;
  margin-bottom: 0.375rem;
}
.calendar-weekdays span {
  text-align: center;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  padding: 0.125rem 0;
}
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.375rem;
  min-width: 18rem;
}
.calendar-grid-pad {
  min-height: 4.25rem;
  pointer-events: none;
}
.day-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.125rem 0.625rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.625rem;
  background: #f8fafc;
  cursor: default;
  min-height: 4.25rem;
  font: inherit;
  text-align: center;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: border-color 0.15s, background 0.15s;
}
.day-cell:disabled { opacity: 0.45; cursor: not-allowed; }
.day-cell.available {
  background: #f5f3ff;
  border-color: #c4b5fd;
  cursor: pointer;
}
.day-cell.available:hover { background: #ede9fe; border-color: #7c3aed; }
.day-cell.today {
  border-color: #a5b4fc;
  background: #eef2ff;
}
.day-cell.today:not(.available) { cursor: default; }
.day-cell.selected {
  background: #4f46e5;
  border-color: #4f46e5;
  color: #fff;
  box-shadow: 0 4px 12px rgba(79,70,229,0.35);
}
.day-cell:focus-visible { outline: 2px solid #4f46e5; outline-offset: 2px; }
.day-num {
  font-size: 1.125rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.day-month {
  font-size: 0.6rem;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  margin-top: 0.125rem;
}
.day-cell.selected .day-month { color: rgba(255,255,255,0.8); }
.today-dot, .avail-dot {
  position: absolute;
  bottom: 0.3rem;
  left: 50%;
  transform: translateX(-50%);
  width: 0.3rem;
  height: 0.3rem;
  border-radius: 50%;
}
.today-dot { background: #4f46e5; }
.avail-dot { background: #7c3aed; }
.day-cell.selected .today-dot,
.day-cell.selected .avail-dot { background: rgba(255,255,255,0.9); }

/* ── Time slots ───────────────────────────────────────────── */
.slots-skeleton {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.slot-skeleton {
  width: 5.5rem;
  height: 3.5rem;
  border-radius: 0.75rem;
  background: #f1f5f9;
  animation: pulse 1.4s ease-in-out infinite;
}
.empty-slots {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem;
  color: #94a3b8;
  font-size: 0.875rem;
  text-align: center;
}
.slot-groups { display: flex; flex-direction: column; gap: 1rem; }
.group-label {
  margin: 0 0 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}
.slots {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.slot-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  min-width: 5rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #f8fafc;
  cursor: pointer;
  font: inherit;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}
.slot-btn:hover { border-color: #a5b4fc; background: #f5f3ff; }
.slot-btn.selected {
  border-color: #4f46e5;
  background: #4f46e5;
  color: #fff;
  box-shadow: 0 4px 10px rgba(79,70,229,0.3);
}
.slot-btn:focus-visible { outline: 2px solid #4f46e5; outline-offset: 2px; }
.slot-start {
  font-size: 1rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.slot-end {
  font-size: 0.7rem;
  color: #94a3b8;
  font-variant-numeric: tabular-nums;
  margin-top: 0.125rem;
}
.slot-btn.selected .slot-end { color: rgba(255,255,255,0.75); }
.slot-pending-pill {
  margin-top: 0.25rem;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: #fff7ed;
  color: #c2410c;
  font-size: 0.5625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.slot-btn.selected .slot-pending-pill { background: rgba(255,255,255,0.2); color: #fde8d8; }

/* ── Booking summary ──────────────────────────────────────── */
.booking-summary {
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  border: 1px solid #c4b5fd;
  border-radius: 0.75rem;
  padding: 0.875rem 1rem;
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.summary-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #3730a3;
}
.summary-row svg { flex-shrink: 0; color: #6366f1; }
.summary-pill {
  margin-left: auto;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: #ddd6fe;
  color: #4338ca;
  font-size: 0.6875rem;
  font-weight: 600;
}

/* ── Form ─────────────────────────────────────────────────── */
.form { display: flex; flex-direction: column; gap: 1rem; }
.field { display: flex; flex-direction: column; gap: 0.375rem; }
.field label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
}
.optional { font-weight: 400; color: #9ca3af; }
.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
  overflow: hidden;
}
.input-wrap:focus-within {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.2);
}
.input-wrap.invalid { border-color: #dc2626; }
.input-wrap.invalid:focus-within { box-shadow: 0 0 0 3px rgba(220,38,38,0.15); }
.input-icon {
  flex-shrink: 0;
  margin-left: 0.75rem;
  color: #94a3b8;
  pointer-events: none;
}
.input-icon-top { align-self: flex-start; margin-top: 0.75rem; }
.textarea-wrap { align-items: flex-start; }
.phone-prefix {
  flex-shrink: 0;
  padding: 0 0.625rem 0 0.875rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #4f46e5;
  border-right: 1.5px solid #e2e8f0;
  align-self: stretch;
  display: flex;
  align-items: center;
}
.input-wrap input,
.input-wrap textarea {
  flex: 1;
  padding: 0.75rem 0.875rem;
  border: none;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 0.9375rem;
  color: #0f172a;
  resize: vertical;
}
.input-wrap input::placeholder,
.input-wrap textarea::placeholder { color: #cbd5e1; }
.submit-error {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.625rem;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  margin: 0;
}
.submit-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: #fff;
  border: none;
  border-radius: 0.875rem;
  font: inherit;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.15s, box-shadow 0.15s, opacity 0.15s;
  box-shadow: 0 4px 14px rgba(79,70,229,0.4);
  touch-action: manipulation;
}
.submit-btn:hover:not(:disabled) { filter: brightness(1.06); box-shadow: 0 6px 20px rgba(79,70,229,0.45); }
.submit-btn:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }
.submit-btn:disabled { opacity: 0.65; cursor: not-allowed; box-shadow: none; }
.btn-spinner {
  width: 1.125rem;
  height: 1.125rem;
  border: 2.5px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* ── Success screen ───────────────────────────────────────── */
.success-section {
  text-align: center;
  padding: 2rem 1.5rem;
}
.success-checkmark {
  width: 5rem;
  height: 5rem;
  margin: 0 auto 1.25rem;
}
.check-svg { width: 100%; height: 100%; }
.check-circle {
  stroke: #4f46e5;
  stroke-width: 2;
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  animation: strokeDraw 0.6s cubic-bezier(0.65, 0, 0.45, 1) 0.1s forwards;
}
.check-path {
  stroke: #4f46e5;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: strokeDraw 0.4s cubic-bezier(0.65, 0, 0.45, 1) 0.55s forwards;
}
@keyframes strokeDraw {
  to { stroke-dashoffset: 0; }
}
.success-title {
  margin: 0 0 0.375rem;
  font-size: 1.375rem;
  font-weight: 800;
  color: #0f172a;
}
.success-text {
  margin: 0 0 1.5rem;
  font-size: 0.9375rem;
  color: #64748b;
  line-height: 1.5;
}
.success-summary {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.875rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  text-align: left;
}
.success-summary-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #0f172a;
}
.success-summary-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

/* ── Reduced motion ───────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .skip-link,
  .step-dot,
  .step-connector,
  .select-card,
  .slot-btn,
  .input-wrap,
  .submit-btn { transition: none; }
  .section { animation: none; }
  .spinner,
  .btn-spinner { animation: none; border-top-color: #4f46e5; }
  .skeleton-cell { animation: none; opacity: 0.6; }
  .check-circle { animation: none; stroke-dashoffset: 0; }
  .check-path { animation: none; stroke-dashoffset: 0; }
}
</style>
