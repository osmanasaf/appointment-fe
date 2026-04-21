<template>
  <div class="business-page space-y-6">
    <div class="page-header">
      <div>
        <h1 class="page-title">İşletme Ayarları</h1>
        <p class="page-desc">İşletme bilgilerini ve rezervasyon kurallarını düzenleyin.</p>
      </div>
    </div>

    <div v-if="!businessId" class="empty-state">
      <p>İşletme bilgisi bulunamadı. Lütfen giriş yapın veya destek ile iletişime geçin.</p>
    </div>

    <template v-else>
      <div v-if="loading" class="loading-state" aria-busy="true">
        <div class="skeleton-col">
          <div class="skeleton-block" v-for="i in 4" :key="i" />
        </div>
        <div class="skeleton-col">
          <div class="skeleton-block" v-for="i in 3" :key="i" />
        </div>
      </div>

      <div v-else-if="error" class="error-state" role="alert">
        <p>{{ error }}</p>
        <AppButton variant="primary" @click="loadBusiness">Tekrar dene</AppButton>
      </div>

      <form v-else @submit.prevent="onSubmit" class="biz-form" novalidate>
        <div class="biz-grid">

          <!-- Sol: İşletme bilgileri -->
          <section class="biz-card" aria-labelledby="info-heading">
            <div class="biz-card-header">
              <div class="biz-card-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="1.5" y="7.5" width="15" height="9" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
                  <path d="M5 7.5V6a4 4 0 0 1 8 0v1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>
                  <circle cx="9" cy="12" r="1.5" fill="currentColor" opacity=".7"/>
                </svg>
              </div>
              <h2 id="info-heading" class="biz-card-title">Genel Bilgiler</h2>
            </div>

            <div class="field-group">
              <div class="field-row">
                <div class="field">
                  <label for="business-name">İşletme adı <span class="req" aria-hidden="true">*</span></label>
                  <input
                    id="business-name"
                    v-model="form.name"
                    type="text"
                    name="name"
                    required
                    minlength="2"
                    maxlength="100"
                    placeholder="Örn. Güzellik Salonu…"
                    autocomplete="organization"
                    :aria-invalid="!!errors.name"
                    :aria-describedby="errors.name ? 'err-name' : undefined"
                  />
                  <span v-if="errors.name" id="err-name" class="field-error" role="alert">{{ errors.name }}</span>
                </div>
                <div class="field">
                  <label for="business-phone">Telefon <span class="req" aria-hidden="true">*</span></label>
                  <input
                    id="business-phone"
                    v-model="form.phoneNumber"
                    type="tel"
                    name="phone"
                    required
                    maxlength="10"
                    placeholder="5XX XXX XX XX"
                    inputmode="numeric"
                    autocomplete="tel-national"
                    :aria-invalid="!!errors.phoneNumber"
                    :aria-describedby="errors.phoneNumber ? 'err-phone' : undefined"
                    @input="onPhoneInput"
                    @paste="onPhonePaste"
                  />
                  <span v-if="errors.phoneNumber" id="err-phone" class="field-error" role="alert">{{ errors.phoneNumber }}</span>
                </div>
              </div>

              <div class="field">
                <label for="business-email">E-posta</label>
                <input
                  id="business-email"
                  v-model="form.email"
                  type="email"
                  name="email"
                  placeholder="info@isletme.com…"
                  inputmode="email"
                  autocomplete="email"
                  spellcheck="false"
                  :aria-invalid="!!errors.email"
                  :aria-describedby="errors.email ? 'err-email' : undefined"
                  @blur="touchEmail"
                  @input="onEmailInput"
                />
                <span v-if="errors.email" id="err-email" class="field-error" role="alert">{{ errors.email }}</span>
              </div>

              <div class="field">
                <label for="business-address">Adres</label>
                <textarea
                  id="business-address"
                  v-model="form.address"
                  name="address"
                  rows="2"
                  maxlength="500"
                  placeholder="Tam adres (isteğe bağlı)…"
                  autocomplete="street-address"
                />
              </div>

              <div class="field">
                <label for="business-desc">Açıklama</label>
                <textarea
                  id="business-desc"
                  v-model="form.description"
                  name="description"
                  rows="3"
                  maxlength="1000"
                  placeholder="İşletmenizi kısaca tanıtın…"
                />
              </div>

              <div class="field">
                <label for="business-category">İşletme kategorisi <span class="req" aria-hidden="true">*</span></label>
                <select
                  id="business-category"
                  v-model="form.category"
                  class="app-select"
                  name="category"
                  required
                  :disabled="categoriesLoading"
                  :aria-invalid="!!errors.category"
                  :aria-describedby="
                    errors.category ? 'err-category' : categoriesLoadError ? 'warn-category' : undefined
                  "
                >
                  <option value="">{{ categoriesLoading ? 'Yükleniyor…' : 'Seçiniz' }}</option>
                  <option v-for="c in categoryOptions" :key="c.code" :value="c.code">{{ c.label }}</option>
                </select>
                <span v-if="categoriesLoadError" id="warn-category" class="field-error" role="status">{{ categoriesLoadError }}</span>
                <span v-else-if="errors.category" id="err-category" class="field-error" role="alert">{{ errors.category }}</span>
              </div>
            </div>

            <!-- Randevu linki -->
            <div v-if="business?.slug" class="link-block">
              <div class="link-block-label">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M5 9l4-4M2 10.5A3.5 3.5 0 0 1 7 5l1-1a3.5 3.5 0 0 1 5 5l-1 1a3.5 3.5 0 0 1-4.95.05" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                Randevu sayfanız
              </div>
              <p class="link-block-desc">Bu linki paylaşın; müşterileriniz online randevu alabilsin.</p>
              <div class="link-box">
                <code class="link-url">{{ publicUrl }}</code>
                <AppButton
                  size="sm"
                  variant="primary"
                  :aria-label="copyDone ? 'Link kopyalandı' : 'Randevu linkini kopyala'"
                  @click="copyLink"
                >
                  {{ copyDone ? 'Kopyalandı ✓' : 'Kopyala' }}
                </AppButton>
              </div>
            </div>
          </section>

          <!-- Sag: Ayarlar -->
          <div class="biz-right-col">

            <!-- Rezervasyon kuralları -->
            <section class="biz-card" aria-labelledby="booking-heading">
              <div class="biz-card-header">
                <div class="biz-card-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="1.5" y="2.5" width="15" height="13" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
                    <path d="M1.5 7h15" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M6 1.5v2M12 1.5v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </div>
                <h2 id="booking-heading" class="biz-card-title">Rezervasyon Kuralları</h2>
              </div>

              <div class="toggle-list">
                <div class="toggle-row">
                  <div class="toggle-info">
                    <span class="toggle-label" id="toggle-autoconfirm-label">Otomatik onay</span>
                    <span class="toggle-desc">Yeni randevular onay beklemeden otomatik onaylansın</span>
                  </div>
                  <button
                    type="button"
                    class="toggle-btn"
                    :class="{ on: form.autoConfirm }"
                    :aria-checked="String(form.autoConfirm)"
                    aria-labelledby="toggle-autoconfirm-label"
                    role="switch"
                    @click="form.autoConfirm = !form.autoConfirm"
                  >
                    <span class="toggle-thumb" aria-hidden="true" />
                  </button>
                </div>

                <div class="toggle-row">
                  <div class="toggle-info">
                    <span class="toggle-label" id="toggle-sameday-label">Aynı gün randevu</span>
                    <span class="toggle-desc">Müşteriler bugün için randevu alabilsin</span>
                  </div>
                  <button
                    type="button"
                    class="toggle-btn"
                    :class="{ on: form.sameDayBookingAllowed }"
                    :aria-checked="String(form.sameDayBookingAllowed)"
                    aria-labelledby="toggle-sameday-label"
                    role="switch"
                    @click="form.sameDayBookingAllowed = !form.sameDayBookingAllowed"
                  >
                    <span class="toggle-thumb" aria-hidden="true" />
                  </button>
                </div>

                <div class="toggle-row">
                  <div class="toggle-info">
                    <span class="toggle-label" id="toggle-whatsapp-label">WhatsApp'ta fiyat</span>
                    <span class="toggle-desc">Hatırlatma mesajında hizmet fiyatı yer alsın</span>
                  </div>
                  <button
                    type="button"
                    class="toggle-btn"
                    :class="{ on: form.whatsappSendPrice }"
                    :aria-checked="String(form.whatsappSendPrice)"
                    aria-labelledby="toggle-whatsapp-label"
                    role="switch"
                    @click="form.whatsappSendPrice = !form.whatsappSendPrice"
                  >
                    <span class="toggle-thumb" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </section>

            <!-- Limitler -->
            <section class="biz-card" aria-labelledby="limits-heading">
              <div class="biz-card-header">
                <div class="biz-card-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3 14V8M7 14V4M11 14V10M15 14V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </div>
                <h2 id="limits-heading" class="biz-card-title">Limitler</h2>
              </div>

              <div class="number-list">
                <div class="number-row">
                  <div class="number-info">
                    <label for="setting-advance-days" class="number-label">İleri tarihli rezervasyon</label>
                    <span class="number-desc">Müşteriler en fazla kaç gün öncesine randevu alabilir</span>
                  </div>
                  <div class="number-input-wrap">
                    <input
                      id="setting-advance-days"
                      v-model.number="form.maxAdvanceBookingDays"
                      type="number"
                      min="1"
                      max="365"
                      inputmode="numeric"
                      class="number-input"
                    />
                    <span class="number-unit">gün</span>
                  </div>
                </div>

                <div class="number-row">
                  <div class="number-info">
                    <label for="setting-max-per-day" class="number-label">Günlük müşteri limiti</label>
                    <span class="number-desc">Bir müşteri aynı güne en fazla kaç randevu alabilsin — boş bırakılırsa sınırsız</span>
                  </div>
                  <div class="number-input-wrap">
                    <input
                      id="setting-max-per-day"
                      v-model.number="form.maxAppointmentsPerCustomerPerDay"
                      type="number"
                      min="1"
                      max="10"
                      inputmode="numeric"
                      placeholder="∞"
                      class="number-input"
                    />
                    <span class="number-unit">randevu</span>
                  </div>
                </div>

                <div class="number-row">
                  <div class="number-info">
                    <label for="setting-reminder-hours" class="number-label">Hatırlatma süresi</label>
                    <span class="number-desc">Randevudan kaç saat önce WhatsApp hatırlatması gönderilsin</span>
                  </div>
                  <div class="number-input-wrap">
                    <input
                      id="setting-reminder-hours"
                      v-model.number="form.reminderHoursBefore"
                      type="number"
                      min="1"
                      max="72"
                      inputmode="numeric"
                      class="number-input"
                    />
                    <span class="number-unit">saat</span>
                  </div>
                </div>
              </div>
            </section>

            <!-- Kaydet -->
            <div class="form-footer">
              <output v-if="submitSuccess" class="success-msg" aria-live="polite">
                Değişiklikler kaydedildi ✓
              </output>
              <p v-if="submitError" class="submit-error" role="alert" aria-live="assertive">{{ submitError }}</p>
              <AppButton native-type="submit" variant="primary" class="save-btn" :loading="saving" :disabled="saving">
                {{ saving ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet' }}
              </AppButton>
            </div>

          </div><!-- /biz-right-col -->
        </div><!-- /biz-grid -->
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { businessApi, type BusinessCategoryResponse, type BusinessResponse, type UpdateBusinessRequest } from '@/api/business'
import { buildPublicBookingUrl } from '@/utils/publicBookingUrl'
import { businessProfileValidationSchema } from '@/validation/schemas'
import {
  validatePhoneField,
  validateEmailField,
  fieldErrorI18nKey,
  sanitizeLocalPhoneInput,
  applyPhoneInputMask,
} from '@/utils/fieldValidators'
import { useI18n } from 'vue-i18n'
import AppButton from '@/components/ui/AppButton.vue'

const { t } = useI18n()

const auth = useAuthStore()
const businessId = computed(() => auth.user?.businessId ?? null)

const business = ref<BusinessResponse | null>(null)
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const submitError = ref('')
const submitSuccess = ref(false)
const copyDone = ref(false)

const categories = ref<BusinessCategoryResponse[]>([])
const categoriesLoading = ref(false)
const categoriesLoadError = ref('')

const form = reactive({
  category: '',
  name: '',
  phoneNumber: '',
  email: '',
  address: '',
  description: '',
  autoConfirm: true,
  reminderHoursBefore: 24,
  sameDayBookingAllowed: true,
  maxAdvanceBookingDays: 30,
  maxAppointmentsPerCustomerPerDay: null as number | null,
  whatsappSendPrice: false,
})

const categoryOptions = computed(() => {
  const list = [...categories.value]
  const cur = form.category
  if (cur && !list.some(c => c.code === cur)) {
    list.unshift({ code: cur, label: cur })
  }
  return list
})

const publicUrl = computed(() => {
  const slug = business.value?.slug?.trim()
  if (!slug) return ''
  return buildPublicBookingUrl(slug)
})

const errors = reactive<Record<string, string>>({})
const touched = reactive<Record<string, boolean>>({})

function checkPhone(showRequired = false): boolean {
  if (!form.phoneNumber && !showRequired) {
    errors.phoneNumber = ''
    return false
  }
  const r = validatePhoneField(form.phoneNumber, { required: true })
  errors.phoneNumber = r.errorKey ? t(fieldErrorI18nKey('phone', r.errorKey)) : ''
  return r.valid
}

function checkEmail(): boolean {
  const r = validateEmailField(form.email, { required: false })
  errors.email = r.errorKey ? t(fieldErrorI18nKey('email', r.errorKey)) : ''
  return r.valid
}

function onPhoneInput(event: Event) {
  form.phoneNumber = applyPhoneInputMask(event)
  checkPhone()
}

function onPhonePaste(event: ClipboardEvent) {
  const pasted = event.clipboardData?.getData('text') ?? ''
  if (!pasted) return
  event.preventDefault()
  const sanitized = sanitizeLocalPhoneInput(pasted)
  form.phoneNumber = sanitized
  const target = event.target as HTMLInputElement | null
  if (target) target.value = sanitized
  checkPhone()
}

function touchEmail() {
  touched.email = true
  checkEmail()
}

function onEmailInput() {
  if (touched.email) checkEmail()
}

function setFormFromBusiness(b: BusinessResponse) {
  form.name = b.name
  form.phoneNumber = sanitizeLocalPhoneInput(b.phoneNumber ?? '')
  form.email = b.email ?? ''
  form.address = b.address ?? ''
  form.description = b.description ?? ''
  form.category = b.category ?? ''
  form.autoConfirm = b.autoConfirm
  form.reminderHoursBefore = b.reminderHoursBefore
  form.sameDayBookingAllowed = b.sameDayBookingAllowed
  form.maxAdvanceBookingDays = b.maxAdvanceBookingDays
  form.maxAppointmentsPerCustomerPerDay = b.maxAppointmentsPerCustomerPerDay ?? null
  form.whatsappSendPrice = b.whatsappSendPrice
}

function validate(): boolean {
  submitError.value = ''
  errors.category = ''
  errors.name = ''
  errors.phoneNumber = ''
  errors.email = ''
  if (!form.category.trim()) { errors.category = 'Bir kategori seçiniz'; return false }
  const phoneDigits = form.phoneNumber.replaceAll(/\D/g, '')
  const result = businessProfileValidationSchema.safeParse({
    name: form.name.trim(),
    phoneNumber: phoneDigits,
    email: form.email.trim() || undefined,
  })
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path[0]
      if (key === 'name' || key === 'phoneNumber' || key === 'email') {
        if (!errors[key]) errors[key] = issue.message
      }
    }
    return false
  }
  return true
}

async function copyLink() {
  if (!publicUrl.value) return
  try {
    await navigator.clipboard.writeText(publicUrl.value)
    copyDone.value = true
    setTimeout(() => { copyDone.value = false }, 2000)
  } catch { copyDone.value = false }
}

async function loadBusiness() {
  if (!businessId.value) return
  loading.value = true
  error.value = ''
  categoriesLoadError.value = ''
  categoriesLoading.value = true
  try {
    const [bizSettled, catSettled] = await Promise.allSettled([
      businessApi.getById(businessId.value),
      businessApi.getCategories(),
    ])

    if (bizSettled.status === 'fulfilled') {
      const { data } = bizSettled.value
      if (data.success && data.data) {
        business.value = data.data
        setFormFromBusiness(data.data)
      } else {
        error.value = 'İşletme bilgisi alınamadı.'
      }
    } else {
      error.value = 'İşletme yüklenirken hata oluştu.'
    }

    if (catSettled.status === 'fulfilled') {
      const { data: cat } = catSettled.value
      if (cat.success && cat.data?.length) {
        categories.value = cat.data
      } else {
        categories.value = []
        categoriesLoadError.value = 'Kategoriler yüklenemedi. Sayfayı yenileyip tekrar deneyin.'
      }
    } else {
      categories.value = []
      categoriesLoadError.value = 'Kategoriler yüklenemedi. Sayfayı yenileyip tekrar deneyin.'
    }
  } finally {
    loading.value = false
    categoriesLoading.value = false
  }
}

async function onSubmit() {
  if (!businessId.value || !validate()) return
  saving.value = true
  submitError.value = ''
  submitSuccess.value = false
  try {
    const body: UpdateBusinessRequest = {
      category: form.category.trim(),
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      description: form.description.trim() || undefined,
      autoConfirm: form.autoConfirm,
      reminderHoursBefore: form.reminderHoursBefore,
      sameDayBookingAllowed: form.sameDayBookingAllowed,
      maxAdvanceBookingDays: form.maxAdvanceBookingDays,
      maxAppointmentsPerCustomerPerDay: (form.maxAppointmentsPerCustomerPerDay != null && !Number.isNaN(form.maxAppointmentsPerCustomerPerDay))
        ? form.maxAppointmentsPerCustomerPerDay
        : null,
      whatsappSendPrice: form.whatsappSendPrice,
    }
    const { data } = await businessApi.update(businessId.value, body)
    if (data.success && data.data) {
      business.value = data.data
      setFormFromBusiness(data.data)
      submitSuccess.value = true
      setTimeout(() => { submitSuccess.value = false }, 3000)
    }
  } catch (e: unknown) {
    submitError.value = e instanceof Error ? e.message : 'Kayıt güncellenemedi.'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (businessId.value) loadBusiness()
  else loading.value = false
})
</script>

<style scoped>
.page-header {
  margin-bottom: 1.5rem;
}
.page-desc {
  margin: 0.25rem 0 0;
  font-size: 0.9375rem;
  color: var(--color-text-muted);
}

/* ── Loading ──────────────────────────────────────────────────────────────── */
.loading-state {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}
@media (max-width: 860px) {
  .loading-state { grid-template-columns: 1fr; }
}
.skeleton-col { display: flex; flex-direction: column; gap: 0.875rem; }
.skeleton-block {
  height: 3.5rem;
  background: linear-gradient(90deg, var(--color-background-alt) 25%, var(--color-border-light) 50%, var(--color-background-alt) 75%);
  background-size: 200% 100%;
  animation: skeleton 1.2s ease-in-out infinite;
  border-radius: var(--radius-md);
}
@keyframes skeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.empty-state, .error-state {
  padding: 2.5rem;
  text-align: center;
  background: var(--color-background-alt);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
}
.error-state p { margin: 0 0 1rem; }

/* ── Grid layout ─────────────────────────────────────────────────────────── */
.biz-form { display: contents; }
.biz-grid {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 1.25rem;
  align-items: start;
}
@media (max-width: 860px) {
  .biz-grid { grid-template-columns: 1fr; }
}

/* ── Cards ───────────────────────────────────────────────────────────────── */
.biz-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 1px 3px rgba(0,0,0,.05);
  overflow: hidden;
}

.biz-card-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border-light);
}

.biz-card-icon {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.biz-card-title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
}

.field-group {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.875rem;
}
@media (max-width: 520px) {
  .field-row { grid-template-columns: 1fr; }
}

/* Fields */
.field { display: flex; flex-direction: column; gap: 0.3125rem; }

.field label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.field input,
.field textarea {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.9375rem;
  font-family: inherit;
  background: var(--color-surface);
  color: var(--color-text);
  transition: border-color 0.15s, box-shadow 0.15s;
  width: 100%;
}

.field input:focus,
.field textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.field input[aria-invalid="true"],
.field textarea[aria-invalid="true"] {
  border-color: var(--color-danger);
}

.field select.app-select {
  width: 100%;
  font-size: 0.9375rem;
}

.req { color: var(--color-danger); }

.field-error {
  font-size: 0.8125rem;
  color: var(--color-danger);
}

/* ── Link block ──────────────────────────────────────────────────────────── */
.link-block {
  margin: 0;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-border-light);
  background: var(--color-background-alt);
}

.link-block-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.25rem;
}

.link-block-desc {
  margin: 0 0 0.75rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.link-box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.875rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.link-url {
  flex: 1;
  min-width: 0;
  font-size: 0.8125rem;
  font-family: ui-monospace, monospace;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Right column ────────────────────────────────────────────────────────── */
.biz-right-col {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── Toggle list ──────────────────────────────────────────────────────────── */
.toggle-list {
  display: flex;
  flex-direction: column;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--color-border-light);
  cursor: default;
}

.toggle-row:last-child { border-bottom: none; }

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.toggle-label {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text);
}

.toggle-desc {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.toggle-btn {
  flex-shrink: 0;
  width: 2.75rem;
  height: 1.5rem;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  background: var(--color-border);
  position: relative;
  transition: background 0.2s;
  padding: 0;
  touch-action: manipulation;
}

.toggle-btn.on { background: var(--color-primary); }

.toggle-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.toggle-thumb {
  position: absolute;
  top: 0.125rem;
  left: 0.125rem;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,.18);
  transition: transform 0.2s;
}

.toggle-btn.on .toggle-thumb {
  transform: translateX(1.25rem);
}

/* ── Number list ─────────────────────────────────────────────────────────── */
.number-list {
  display: flex;
  flex-direction: column;
}

.number-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--color-border-light);
}

.number-row:last-child { border-bottom: none; }

.number-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
  min-width: 0;
}

.number-label {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text);
}

.number-desc {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.number-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
}

.number-input {
  width: 5rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.9375rem;
  font-family: inherit;
  font-variant-numeric: tabular-nums;
  background: var(--color-surface);
  color: var(--color-text);
  text-align: right;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.number-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.number-unit {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}

/* ── Form footer ─────────────────────────────────────────────────────────── */
.form-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
}

.save-btn {
  min-width: 10rem;
}

.submit-error {
  font-size: 0.875rem;
  color: var(--color-danger);
  flex: 1;
  text-align: right;
  min-width: 0;
}

.success-msg {
  font-size: 0.875rem;
  color: var(--color-success);
  flex: 1;
  text-align: right;
  min-width: 0;
}
</style>
