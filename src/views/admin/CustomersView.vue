<template>
  <div class="customers-page space-y-6">
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Müşteriler</h1>
        <p class="page-desc">Müşteri kayıtları, iletişim bilgileri, paket ve randevu geçmişi.</p>
      </div>
      <AppButton
        v-if="businessId && !loading && !listError"
        variant="primary"
        @click="openCreate"
      >
        + Yeni müşteri
      </AppButton>
    </div>

    <div v-if="!businessId" class="empty-state"><p>İşletme bilgisi bulunamadı.</p></div>

    <template v-else>
      <div v-if="loading" class="loading-state" aria-busy="true">
        <div class="skeleton-card" v-for="i in 4" :key="i" />
      </div>
      <div v-else-if="listError" class="error-state" role="alert">
        <p>{{ listError }}</p>
        <AppButton variant="primary" @click="loadList">Tekrar dene</AppButton>
      </div>

      <!-- Two-pane layout -->
      <div v-else class="layout">
        <!-- Left: customer list -->
        <div class="list-pane">
          <div class="list-toolbar">
            <input
              v-model="searchQuery"
              type="search"
              class="search-input"
              placeholder="İsim veya telefon ara…"
              aria-label="Müşteri ara"
            />
            <span class="count-label">{{ filteredCustomers.length }} müşteri</span>
          </div>

          <div v-if="filteredCustomers.length === 0 && customers.length === 0" class="empty-list">
            <p class="empty-title">Henüz müşteri yok</p>
            <p class="empty-desc">İlk müşterinizi ekleyerek başlayın.</p>
            <AppButton size="sm" variant="primary" @click="openCreate">+ Ekle</AppButton>
          </div>
          <div v-else-if="filteredCustomers.length === 0" class="empty-list">
            <p>«{{ searchQuery }}» için sonuç bulunamadı.</p>
          </div>

          <ul v-else class="customer-list" aria-label="Müşteri listesi">
            <li
              v-for="c in filteredCustomers"
              :key="c.id"
              class="customer-item"
              :class="{ selected: selectedCustomer?.id === c.id, blacklisted: c.blacklisted }"
              @click="selectCustomer(c)"
            >
              <div class="customer-item-main">
                <span class="customer-avatar" :class="avatarColor(c.id)" aria-hidden="true">
                  {{ c.name.charAt(0).toUpperCase() }}
                </span>
                <div class="customer-item-info">
                  <span class="customer-item-name">{{ c.name }}</span>
                  <span class="customer-item-phone">{{ c.phoneNumber }}</span>
                </div>
              </div>
              <div class="customer-item-badges">
                <span v-if="c.blacklisted" class="badge danger">Kara liste</span>
                <span v-else-if="c.risky" class="badge warning">Riskli</span>
                <span v-if="c.noShowForcesManualApproval" class="badge noshow">Onay zorunlu</span>
              </div>
            </li>
          </ul>
        </div>

        <!-- Right: detail pane -->
        <div class="detail-pane">
          <div v-if="!selectedCustomer" class="detail-empty">
            <div class="detail-empty-icon" aria-hidden="true">◎</div>
            <p>Soldaki listeden bir müşteri seçin.</p>
          </div>

          <template v-else>
            <!-- Customer header -->
            <div class="detail-header">
              <div class="detail-avatar" :class="avatarColor(selectedCustomer.id)" aria-hidden="true">
                {{ selectedCustomer.name.charAt(0).toUpperCase() }}
              </div>
              <div class="detail-identity">
                <h2 class="detail-name">{{ selectedCustomer.name }}</h2>
                <div class="detail-badges">
                  <span v-if="selectedCustomer.blacklisted" class="badge danger">Kara liste</span>
                  <span v-else-if="selectedCustomer.risky" class="badge warning">Riskli</span>
                  <span v-if="selectedCustomer.noShowForcesManualApproval" class="badge noshow">Onay zorunlu</span>
                  <span v-if="selectedCustomer.noShowCount > 0" class="badge muted">
                    {{ selectedCustomer.noShowCount }}× gelmedi
                  </span>
                </div>
              </div>
              <div class="detail-header-actions">
                <AppButton variant="secondary" size="sm" @click="openEdit(selectedCustomer)">Düzenle</AppButton>
                <AppButton
                  v-if="!selectedCustomer.blacklisted"
                  variant="danger"
                  size="sm"
                  @click="openBlacklist(selectedCustomer)"
                >
                  Kara listeye al
                </AppButton>
                <AppButton
                  v-else
                  variant="secondary"
                  size="sm"
                  @click="doRemoveBlacklist(selectedCustomer)"
                >
                  Kara listeden çıkar
                </AppButton>
                <AppButton
                  v-if="selectedCustomer.noShowForcesManualApproval"
                  variant="secondary"
                  size="sm"
                  @click="doClearNoShowApproval(selectedCustomer)"
                >
                  Onay zorunluluğunu kaldır
                </AppButton>
                <AppButton variant="danger" size="sm" @click="openDeleteConfirm(selectedCustomer)">Sil</AppButton>
              </div>
            </div>

            <!-- Contact info -->
            <div class="detail-section">
              <h3 class="detail-section-title">İletişim</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Telefon</span>
                  <a :href="'tel:' + selectedCustomer.phoneNumber" class="info-value link">
                    {{ selectedCustomer.phoneNumber }}
                  </a>
                </div>
                <div v-if="selectedCustomer.email" class="info-item">
                  <span class="info-label">E-posta</span>
                  <a :href="'mailto:' + selectedCustomer.email" class="info-value link">
                    {{ selectedCustomer.email }}
                  </a>
                </div>
                <div class="info-item">
                  <span class="info-label">Kayıt tarihi</span>
                  <span class="info-value">{{ formatDate(selectedCustomer.createdAt) }}</span>
                </div>
                <div v-if="selectedCustomer.address" class="info-item info-item-full">
                  <span class="info-label">Adres</span>
                  <span class="info-value">{{ selectedCustomer.address }}</span>
                </div>
                <div v-if="selectedCustomer.nationalIdMasked" class="info-item">
                  <span class="info-label">TC kimlik no</span>
                  <span class="info-value">{{ selectedCustomer.nationalIdMasked }}</span>
                </div>
                <div v-if="selectedCustomer.notes" class="info-item info-item-full">
                  <span class="info-label">Notlar</span>
                  <span class="info-value">{{ selectedCustomer.notes }}</span>
                </div>
                <div v-if="selectedCustomer.blacklistReason" class="info-item info-item-full">
                  <span class="info-label">Kara liste gerekçesi</span>
                  <span class="info-value danger-text">{{ selectedCustomer.blacklistReason }}</span>
                </div>
              </div>
            </div>

            <!-- Packages section -->
            <div class="detail-section">
              <div class="detail-section-head">
                <h3 class="detail-section-title">Paketler</h3>
                <AppButton variant="primary" size="sm" @click="openAddPackage(selectedCustomer)">
                  + Paket ata
                </AppButton>
              </div>

              <div v-if="packagesLoading" class="loading-inline" aria-busy="true">
                <div class="skeleton-row" v-for="i in 2" :key="i" />
              </div>
              <div v-else-if="customerPackages.length === 0" class="section-empty">
                Bu müşteriye henüz paket atanmamış.
              </div>
              <ul v-else class="pkg-list">
                <li v-for="p in customerPackages" :key="p.id" class="pkg-card" :class="{ expired: p.expired }">
                  <div class="pkg-card-head">
                    <div class="pkg-card-name-row">
                      <span class="pkg-card-name">{{ p.name }}</span>
                      <span v-if="p.expired" class="badge inactive">Süresi doldu</span>
                      <span v-else-if="p.lowOnSessions" class="badge warning">Az kaldı</span>
                      <span v-else class="badge active">Aktif</span>
                    </div>
                    <span class="pkg-service-name">{{ resolveServiceName(p.serviceId) }}</span>
                  </div>

                  <!-- Sessions progress -->
                  <div class="pkg-progress-row">
                    <div class="pkg-progress-bar">
                      <div
                        class="pkg-progress-fill"
                        :class="{ low: p.lowOnSessions, expired: p.expired }"
                        :style="{ width: sessionsPercent(p) + '%' }"
                      />
                    </div>
                    <span class="pkg-sessions-text">
                      {{ p.remainingSessions }}/{{ p.totalSessions }} seans kaldı
                    </span>
                  </div>

                  <!-- Seans listesi -->
                  <div v-if="sessionsByPackageId[p.id]?.length" class="pkg-sessions-list">
                    <div class="pkg-sessions-head">Seanslar</div>
                    <p v-if="sessionAssignError" class="submit-error" role="alert">{{ sessionAssignError }}</p>
                    <ul class="session-rows">
                      <li v-for="s in sessionsByPackageId[p.id]" :key="s.id" class="session-row">
                        <span class="session-num">#{{ s.sessionNumber }}</span>
                        <span class="session-status" :class="s.status.toLowerCase()">{{ sessionStatusLabel(s.status) }}</span>
                        <span v-if="s.scheduledAt" class="session-date">{{ formatDateTime(s.scheduledAt) }}</span>
                        <span v-else class="session-date muted">—</span>
                        <template v-if="s.status === 'PENDING'">
                          <div class="session-assign-wrap">
                            <select
                              v-model="assignAppointmentForSession[s.id]"
                              class="session-assign-select"
                              aria-label="Randevu seç"
                            >
                              <option value="">Randevu ata…</option>
                              <option
                                v-for="a in futureAppointmentsForAssign"
                                :key="a.id"
                                :value="a.id"
                              >
                                {{ formatDateTime(a.scheduledAt) }} — {{ resolveServiceName(a.serviceId) }}
                              </option>
                            </select>
                            <AppButton
                              v-if="assignAppointmentForSession[s.id]"
                              variant="primary"
                              size="sm"
                              @click="assignSessionToAppointment(p.id, s.id, Number(assignAppointmentForSession[s.id]))"
                            >
                              Ata
                            </AppButton>
                            <RouterLink
                              v-else
                              :to="{ name: 'AdminAppointments', query: { createFor: selectedCustomer?.id } }"
                              class="session-new-appt-btn"
                            >
                              + Randevu oluştur
                            </RouterLink>
                          </div>
                        </template>
                        <template v-else-if="s.status === 'SCHEDULED' && s.appointmentId">
                          <AppButton
                            variant="secondary"
                            size="sm"
                            @click="unassignSessionFromAppointment(p.id, s.id)"
                          >
                            Randevudan kaldır
                          </AppButton>
                        </template>
                      </li>
                    </ul>
                  </div>

                  <div class="pkg-card-footer">
                    <span class="pkg-expires">Bitiş: {{ p.expiresAt ? formatDate(p.expiresAt) : '—' }}</span>
                    <div class="pkg-session-actions" v-if="!p.expired">
                      <button
                        type="button"
                        class="session-btn"
                        :disabled="p.remainingSessions <= 0"
                        @click="deductSession(p)"
                        :aria-label="'Seans düş: ' + p.name"
                        title="1 seans düş"
                      >
                        −1
                      </button>
                      <button
                        type="button"
                        class="session-btn add"
                        @click="addSession(p)"
                        :aria-label="'Seans ekle: ' + p.name"
                        title="1 seans ekle"
                      >
                        +1
                      </button>
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <!-- Appointment history -->
            <div class="detail-section">
              <h3 class="detail-section-title">Randevu geçmişi</h3>
              <div v-if="apptLoading" class="loading-inline" aria-busy="true">
                <div class="skeleton-row" v-for="i in 2" :key="i" />
              </div>
              <div v-else-if="customerAppointments.length === 0" class="section-empty">
                Bu müşteriye ait randevu kaydı yok.
              </div>
              <ul v-else class="appt-list">
                <li v-for="a in customerAppointments.slice(0, 12)" :key="a.id" class="appt-item">
                  <span class="appt-date">{{ formatDateTime(a.scheduledAt) }}</span>
                  <span class="appt-service">{{ resolveServiceName(a.serviceId) }}</span>
                  <span v-if="a.packageSessionId" class="appt-pkg-badge" title="Paket seansı">Paket</span>
                  <span class="appt-badge" :class="apptStatusClass(a.status)">{{ apptStatusLabel(a.status) }}</span>
                </li>
              </ul>
              <p v-if="customerAppointments.length > 12" class="more-hint">
                +{{ customerAppointments.length - 12 }} randevu daha
              </p>
            </div>
          </template>
        </div>
      </div>

      <!-- ─── Modals ─── -->

      <!-- Create / Edit customer -->
      <dialog ref="createDialogRef" class="modal" @cancel="closeCreate">
        <div class="modal-inner">
          <div class="modal-header">
            <h2 class="modal-title">{{ editingId ? 'Müşteri düzenle' : 'Yeni müşteri' }}</h2>
            <button type="button" class="modal-close-btn" aria-label="Kapat" @click="closeCreate">
              <X :size="22" :stroke-width="2" aria-hidden="true" />
            </button>
          </div>
          <form @submit.prevent="submitCustomer" class="form">
            <div class="field">
              <label for="cust-name">Ad soyad <span class="req">*</span></label>
              <input
                id="cust-name"
                v-model="form.name"
                type="text"
                required
                minlength="2"
                maxlength="100"
                placeholder="Ad Soyad"
                :aria-invalid="!!formErrors.name"
              />
              <span v-if="formErrors.name" class="error" role="alert">{{ formErrors.name }}</span>
            </div>
            <div v-if="!editingId" class="field">
              <label for="cust-phone">Telefon <span class="req">*</span></label>
              <input
                id="cust-phone"
                v-model="form.phoneNumber"
                type="tel"
                required
                placeholder="5XX XXX XX XX"
                :aria-invalid="!!formErrors.phoneNumber"
              />
              <span v-if="formErrors.phoneNumber" class="error" role="alert">{{ formErrors.phoneNumber }}</span>
            </div>
            <div class="field">
              <label for="cust-email">E-posta</label>
              <input id="cust-email" v-model="form.email" type="email" placeholder="ornek@mail.com" />
            </div>
            <div class="field">
              <label for="cust-notes">Notlar</label>
              <textarea id="cust-notes" v-model="form.notes" rows="2" maxlength="500" placeholder="Müşteri hakkında not…" />
            </div>
            <div class="field">
              <label for="cust-address">Adres (fatura için)</label>
              <textarea id="cust-address" v-model="form.address" rows="2" maxlength="500" placeholder="Fatura adresi (isteğe bağlı)" />
            </div>
            <div class="field">
              <label for="cust-nationalId">TC kimlik no (fatura için)</label>
              <input
                id="cust-nationalId"
                v-model="form.nationalId"
                type="text"
                inputmode="numeric"
                maxlength="11"
                pattern="[0-9]*"
                placeholder="11 haneli (isteğe bağlı)"
                :aria-invalid="!!formErrors.nationalId"
                :aria-describedby="editingId && selectedCustomer?.nationalIdMasked ? 'cust-nationalId-hint' : undefined"
              />
              <span v-if="editingId && selectedCustomer?.nationalIdMasked" id="cust-nationalId-hint" class="field-hint">
                Mevcut: {{ selectedCustomer.nationalIdMasked }}
              </span>
              <span v-if="formErrors.nationalId" class="error" role="alert">{{ formErrors.nationalId }}</span>
            </div>
            <p v-if="formSubmitError" class="submit-error" role="alert">{{ formSubmitError }}</p>
            <div class="modal-actions">
              <AppButton variant="secondary" @click="closeCreate">İptal</AppButton>
              <AppButton variant="primary" native-type="submit" :disabled="formSaving">
                {{ formSaving ? 'Kaydediliyor…' : 'Kaydet' }}
              </AppButton>
            </div>
          </form>
        </div>
      </dialog>

      <!-- Blacklist -->
      <dialog ref="blacklistDialogRef" class="modal" @cancel="closeBlacklist">
        <div class="modal-inner">
          <div class="modal-header">
            <h2 class="modal-title">Kara listeye al</h2>
            <button type="button" class="modal-close-btn" aria-label="Kapat" @click="closeBlacklist">
              <X :size="22" :stroke-width="2" aria-hidden="true" />
            </button>
          </div>
          <p class="modal-sub" v-if="blacklistTarget">
            «<strong>{{ blacklistTarget.name }}</strong>» kara listeye alınacak. Gerekçe giriniz.
          </p>
          <div class="field">
            <label for="bl-reason">Gerekçe (isteğe bağlı)</label>
            <input id="bl-reason" v-model="blacklistReason" type="text" maxlength="500" placeholder="Gerekçe…" />
          </div>
          <p v-if="blacklistError" class="submit-error" role="alert">{{ blacklistError }}</p>
          <div class="modal-actions">
            <AppButton variant="secondary" @click="closeBlacklist">İptal</AppButton>
            <AppButton variant="danger" @click="doBlacklist" :disabled="blacklistSaving">
              {{ blacklistSaving ? 'İşleniyor…' : 'Kara listeye al' }}
            </AppButton>
          </div>
        </div>
      </dialog>

      <!-- Delete confirm -->
      <dialog ref="deleteDialogRef" class="modal" @cancel="closeDeleteConfirm">
        <div class="modal-inner">
          <div class="modal-header">
            <h2 class="modal-title">Müşteriyi sil</h2>
            <button type="button" class="modal-close-btn" aria-label="Kapat" @click="closeDeleteConfirm">
              <X :size="22" :stroke-width="2" aria-hidden="true" />
            </button>
          </div>
          <p class="modal-sub">
            «<strong>{{ deleteTarget?.name }}</strong>» kalıcı olarak silinecek. Bu işlem geri alınamaz.
          </p>
          <p v-if="deleteError" class="submit-error" role="alert">{{ deleteError }}</p>
          <div class="modal-actions">
            <AppButton variant="secondary" @click="closeDeleteConfirm">Vazgeç</AppButton>
            <AppButton variant="danger" @click="doDelete" :disabled="deleting">
              {{ deleting ? 'Siliniyor…' : 'Kalıcı sil' }}
            </AppButton>
          </div>
        </div>
      </dialog>

      <!-- Package assign -->
      <dialog ref="packageDialogRef" class="modal modal-lg" @cancel="closePackageModal">
        <div class="modal-inner">
          <div class="modal-header">
            <h2 class="modal-title">Paket ata</h2>
            <button type="button" class="modal-close-btn" aria-label="Kapat" @click="closePackageModal">
              <X :size="22" :stroke-width="2" aria-hidden="true" />
            </button>
          </div>
          <p class="modal-sub" v-if="packageCustomer">
            <strong>{{ packageCustomer.name }}</strong> için yeni paket tanımlayın.
          </p>
          <div v-if="packageCustomer" class="pkg-mode-tabs">
            <button
              type="button"
              class="tab-btn"
              :class="{ active: pkgFormMode === 'template' }"
              @click="pkgFormMode = 'template'"
            >
              Şablondan
            </button>
            <button
              type="button"
              class="tab-btn"
              :class="{ active: pkgFormMode === 'manual' }"
              @click="pkgFormMode = 'manual'"
            >
              Manuel
            </button>
          </div>
          <!-- Şablondan: template select + create -->
          <form v-if="packageCustomer && pkgFormMode === 'template'" @submit.prevent="submitPackageFromTemplate" class="form">
            <div class="field">
              <label for="pkg-template">Paket şablonu <span class="req">*</span></label>
              <select id="pkg-template" v-model="pkgForm.templateId" required>
                <option value="">Seçin…</option>
                <option v-for="t in packageTemplates" :key="t.id" :value="t.id">
                  {{ t.name }} ({{ t.totalSessions }} seans)
                </option>
              </select>
              <p v-if="packageTemplates.length === 0" class="field-hint empty-hint">
                Önce Paketler sayfasında paket şablonu oluşturun.
              </p>
            </div>
            <p v-if="pkgSubmitError" class="submit-error" role="alert">{{ pkgSubmitError }}</p>
            <div class="modal-actions">
              <AppButton variant="secondary" @click="closePackageModal">İptal</AppButton>
              <AppButton variant="primary" native-type="submit" :disabled="pkgSaving">
                {{ pkgSaving ? 'Kaydediliyor…' : 'Paketi oluştur' }}
              </AppButton>
            </div>
          </form>
          <!-- Manuel: existing form -->
          <form v-if="packageCustomer && pkgFormMode === 'manual'" @submit.prevent="submitPackage" class="form">
            <div class="field">
              <label for="pkg-service">Hizmet <span class="req">*</span></label>
              <select
                id="pkg-service"
                v-model="pkgForm.serviceId"
                required
                :aria-invalid="!!pkgFormErrors.serviceId"
                @change="onServiceChange"
              >
                <option value="">Seçin…</option>
                <option v-for="s in packageEligibleServices" :key="s.id" :value="s.id">
                  {{ s.name }} — {{ formatPrice(s.price) }} {{ s.currency }}
                </option>
              </select>
              <p v-if="packageEligibleServices.length === 0" class="field-hint empty-hint">
                Paket oluşturulabilir hizmet tanımlayın. Hizmetler sayfasında «Paket hizmeti» işaretli olanlar burada listelenir.
              </p>
              <span v-if="pkgFormErrors.serviceId" class="error" role="alert">{{ pkgFormErrors.serviceId }}</span>
            </div>

            <div class="field">
              <label for="pkg-name">Paket adı <span class="req">*</span></label>
              <input
                id="pkg-name"
                v-model="pkgForm.name"
                type="text"
                required
                maxlength="100"
                placeholder="Örn. 10 Seans Saç Kesimi"
                :aria-invalid="!!pkgFormErrors.name"
              />
              <span v-if="pkgFormErrors.name" class="error" role="alert">{{ pkgFormErrors.name }}</span>
            </div>

            <div class="field-row">
              <div class="field">
                <label for="pkg-sessions">Seans sayısı <span class="req">*</span></label>
                <input
                  id="pkg-sessions"
                  v-model.number="pkgForm.totalSessions"
                  type="number"
                  min="1"
                  max="200"
                  required
                  :aria-invalid="!!pkgFormErrors.totalSessions"
                />
                <span v-if="pkgFormErrors.totalSessions" class="error" role="alert">{{ pkgFormErrors.totalSessions }}</span>
              </div>
              <div class="field">
                <label for="pkg-expires">Bitiş tarihi <span class="req">*</span></label>
                <AppDateField
                  id="pkg-expires"
                  v-model="pkgForm.expiresAt"
                  required
                  :min="tomorrowDate()"
                  :aria-invalid="!!pkgFormErrors.expiresAt"
                />
                <span v-if="pkgFormErrors.expiresAt" class="error" role="alert">{{ pkgFormErrors.expiresAt }}</span>
              </div>
            </div>

            <!-- Preview -->
            <div v-if="pkgForm.serviceId && pkgForm.totalSessions > 0" class="pkg-preview">
              <span class="pkg-preview-label">Özet:</span>
              <span class="pkg-preview-text">
                {{ pkgForm.totalSessions }} seans ×
                {{ selectedServicePrice }} =
                <strong>{{ pkgTotalPrice }}</strong>
              </span>
            </div>

            <p v-if="pkgSubmitError" class="submit-error" role="alert">{{ pkgSubmitError }}</p>
            <div class="modal-actions">
              <AppButton variant="secondary" @click="closePackageModal">İptal</AppButton>
              <AppButton variant="primary" native-type="submit" :disabled="pkgSaving">
                {{ pkgSaving ? 'Kaydediliyor…' : 'Paketi oluştur' }}
              </AppButton>
            </div>
          </form>
        </div>
      </dialog>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { fetchAllPageContent } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import {
  customerApi,
  type CustomerResponse,
  type CreateCustomerRequest,
  type UpdateCustomerRequest,
  type PackageResponse,
} from '@/api/customer'
import { packageApi, type CreatePackageRequest } from '@/api/customerPackage'
import { packageTemplateApi, type PackageTemplateResponse } from '@/api/packageTemplate'
import { packageSessionApi, type PackageSessionResponse } from '@/api/packageSession'
import { serviceApi, type ServiceResponse } from '@/api/service'
import { appointmentApi, type AppointmentResponse, type AppointmentStatus } from '@/api/appointment'
import AppButton from '@/components/ui/AppButton.vue'
import AppDateField from '@/components/ui/AppDateField.vue'
import { X } from 'lucide-vue-next'

const auth = useAuthStore()
const businessId = computed(() => auth.user?.businessId ?? null)

// ── Data ──────────────────────────────────────────────────────────────────────
const customers = ref<CustomerResponse[]>([])
const services = ref<ServiceResponse[]>([])
const packageTemplates = ref<PackageTemplateResponse[]>([])
const loading = ref(true)
const listError = ref('')
const searchQuery = ref('')

const selectedCustomer = ref<CustomerResponse | null>(null)
const customerPackages = ref<PackageResponse[]>([])
const packagesLoading = ref(false)
const customerAppointments = ref<AppointmentResponse[]>([])
const apptLoading = ref(false)

// ── Dialog refs ───────────────────────────────────────────────────────────────
const createDialogRef = ref<HTMLDialogElement | null>(null)
const blacklistDialogRef = ref<HTMLDialogElement | null>(null)
const deleteDialogRef = ref<HTMLDialogElement | null>(null)
const packageDialogRef = ref<HTMLDialogElement | null>(null)

// ── Create/Edit form ──────────────────────────────────────────────────────────
const editingId = ref<number | null>(null)
const formSaving = ref(false)
const formSubmitError = ref('')
const form = reactive({ name: '', phoneNumber: '', email: '', notes: '', address: '', nationalId: '' })
const formErrors = reactive<Record<string, string>>({})

// ── Blacklist form ────────────────────────────────────────────────────────────
const blacklistTarget = ref<CustomerResponse | null>(null)
const blacklistReason = ref('')
const blacklistSaving = ref(false)
const blacklistError = ref('')

// ── Delete confirm ────────────────────────────────────────────────────────────
const deleteTarget = ref<CustomerResponse | null>(null)
const deleting = ref(false)
const deleteError = ref('')

// ── Package form ──────────────────────────────────────────────────────────────
const packageCustomer = ref<CustomerResponse | null>(null)
const pkgFormMode = ref<'template' | 'manual'>('template')
const pkgSaving = ref(false)
const pkgSubmitError = ref('')
const pkgForm = reactive({
  templateId: '' as number | '',
  serviceId: '' as number | '',
  name: '',
  totalSessions: 10,
  expiresAt: '',
})
const pkgFormErrors = reactive<Record<string, string>>({})

// ── Sessions per package (for selected customer) ───────────────────────────────
const sessionsByPackageId = ref<Record<number, PackageSessionResponse[]>>({})
const assignAppointmentForSession = reactive<Record<number, string>>({})
const sessionAssignError = ref('')

// ── Service map ───────────────────────────────────────────────────────────────
const serviceMap = computed(() => {
  const m = new Map<number, ServiceResponse>()
  for (const s of services.value) m.set(s.id, s)
  return m
})

const packageEligibleServices = computed(() =>
  services.value.filter(s => s.packageEligible)
)

const ACTIVE_APPOINTMENT_STATUSES = new Set<string>(['PENDING', 'CONFIRMED', 'RISKY'])

const futureAppointmentsForAssign = computed(() => {
  if (!selectedCustomer.value) return []
  const now = new Date().toISOString()
  return customerAppointments.value.filter(
    a =>
      a.customerId === selectedCustomer.value!.id &&
      a.scheduledAt >= now &&
      !a.packageSessionId &&
      ACTIVE_APPOINTMENT_STATUSES.has(a.status)
  )
})

function sessionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Bekliyor',
    SCHEDULED: 'Randevulu',
    COMPLETED: 'Tamamlandı',
    NO_SHOW: 'Gelmedi',
    CANCELLED: 'İptal',
  }
  return labels[status] ?? status
}

function resolveServiceName(id: number): string {
  return serviceMap.value.get(id)?.name ?? `Hizmet #${id}`
}

// ── Package pricing preview ───────────────────────────────────────────────────
const selectedServicePrice = computed(() => {
  if (!pkgForm.serviceId) return '—'
  const svc = serviceMap.value.get(Number(pkgForm.serviceId))
  if (!svc) return '—'
  return `${formatPrice(svc.price)} ${svc.currency}`
})

const pkgTotalPrice = computed(() => {
  if (!pkgForm.serviceId || pkgForm.totalSessions <= 0) return '—'
  const svc = serviceMap.value.get(Number(pkgForm.serviceId))
  if (!svc) return '—'
  const price = typeof svc.price === 'string' ? Number.parseFloat(svc.price) : svc.price
  const total = price * pkgForm.totalSessions
  return `${formatPrice(total)} ${svc.currency}`
})

function onServiceChange() {
  if (!pkgForm.serviceId) return
  const svc = serviceMap.value.get(Number(pkgForm.serviceId))
  if (svc && !pkgForm.name) {
    pkgForm.name = `${svc.name} Paketi`
  }
}

// ── Computed list ─────────────────────────────────────────────────────────────
const filteredCustomers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return customers.value
  return customers.value.filter(
    c => c.name.toLowerCase().includes(q) || c.phoneNumber.includes(q)
  )
})

// ── Helpers ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['av-indigo', 'av-violet', 'av-blue', 'av-teal', 'av-emerald', 'av-amber', 'av-rose']
function avatarColor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length]
}

function formatPrice(p: number | string): string {
  const n = typeof p === 'string' ? Number.parseFloat(p) : p
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)
}

function formatDate(iso: string | null | undefined): string {
  if (iso == null || String(iso).trim() === '') {
    return '—'
  }
  const d = new Date(iso)
  const t = d.getTime()
  if (Number.isNaN(t) || t === 0) {
    return '—'
  }
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short' }).format(d)
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
}

function tomorrowDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function sessionsPercent(p: PackageResponse): number {
  if (p.totalSessions === 0) return 0
  return Math.round((p.remainingSessions / p.totalSessions) * 100)
}

function apptStatusLabel(s: AppointmentStatus): string {
  const m: Record<AppointmentStatus, string> = {
    PENDING: 'Beklemede', CONFIRMED: 'Onaylı', RISKY: 'Riskli',
    CANCELLED: 'İptal', COMPLETED: 'Tamamlandı', NO_SHOW: 'Gelmedi',
  }
  return m[s] ?? s
}

function apptStatusClass(s: AppointmentStatus): string {
  const m: Record<AppointmentStatus, string> = {
    PENDING: 'badge-pending', CONFIRMED: 'badge-active', RISKY: 'badge-risky',
    CANCELLED: 'badge-inactive', COMPLETED: 'badge-active', NO_SHOW: 'badge-inactive',
  }
  return m[s] ?? ''
}

// ── Select customer ───────────────────────────────────────────────────────────
function selectCustomer(c: CustomerResponse) {
  if (selectedCustomer.value?.id === c.id) return
  selectedCustomer.value = c
}

watch(selectedCustomer, async (c) => {
  customerPackages.value = []
  customerAppointments.value = []
  sessionsByPackageId.value = {}
  sessionAssignError.value = ''
  if (!c) return

  packagesLoading.value = true
  apptLoading.value = true

  const [pkgRes, apptRes] = await Promise.allSettled([
    customerApi.getPackages(c.id),
    appointmentApi.listByCustomer(c.id),
  ])

  packagesLoading.value = false
  apptLoading.value = false

  if (pkgRes.status === 'fulfilled' && pkgRes.value.data.success) {
    customerPackages.value = pkgRes.value.data.data ?? []
    const map: Record<number, PackageSessionResponse[]> = {}
    await Promise.all(
      customerPackages.value.map(async (p) => {
        try {
          const { data } = await packageSessionApi.listByPackage(p.id)
          map[p.id] = data.success && data.data ? data.data : []
        } catch {
          map[p.id] = []
        }
      })
    )
    sessionsByPackageId.value = map
  } else {
    sessionsByPackageId.value = {}
  }

  if (apptRes.status === 'fulfilled' && apptRes.value.data.success) {
    customerAppointments.value = (apptRes.value.data.data ?? [])
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
  }
})

// ── Create / Edit ─────────────────────────────────────────────────────────────
function openCreate() {
  editingId.value = null
  Object.assign(form, { name: '', phoneNumber: '', email: '', notes: '', address: '', nationalId: '' })
  Object.assign(formErrors, { name: '', phoneNumber: '', nationalId: '' })
  formSubmitError.value = ''
  createDialogRef.value?.showModal()
}

function openEdit(c: CustomerResponse) {
  editingId.value = c.id
  Object.assign(form, {
    name: c.name,
    phoneNumber: c.phoneNumber,
    email: c.email ?? '',
    notes: c.notes ?? '',
    address: c.address ?? '',
    nationalId: '',
  })
  Object.assign(formErrors, { name: '', phoneNumber: '', nationalId: '' })
  formSubmitError.value = ''
  createDialogRef.value?.showModal()
}

function closeCreate() { createDialogRef.value?.close() }

function validateCustomer(): boolean {
  formErrors.name = ''
  formErrors.phoneNumber = ''
  formErrors.nationalId = ''
  if (!form.name.trim()) { formErrors.name = 'Ad soyad giriniz'; return false }
  if (form.name.trim().length < 2) { formErrors.name = 'En az 2 karakter olmalıdır'; return false }
  if (!editingId.value) {
    if (!form.phoneNumber.trim()) { formErrors.phoneNumber = 'Telefon giriniz'; return false }
    if (form.phoneNumber.replaceAll(/\D/g, '').length < 10) {
      formErrors.phoneNumber = 'Geçerli bir telefon numarası giriniz'; return false
    }
  }
  const tc = form.nationalId.replaceAll(/\D/g, '')
  if (tc.length > 0 && tc.length !== 11) {
    formErrors.nationalId = 'TC kimlik numarası 11 haneli olmalıdır'
    return false
  }
  return true
}

async function submitCustomer() {
  if (!businessId.value || !validateCustomer()) return
  formSaving.value = true
  formSubmitError.value = ''
  try {
    if (editingId.value) {
      const body: UpdateCustomerRequest = {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        notes: form.notes.trim() || undefined,
        address: form.address.trim() || undefined,
        nationalId: form.nationalId.replaceAll(/\D/g, '').trim() || undefined,
      }
      const { data } = await customerApi.update(editingId.value, body)
      if (data.success && data.data) {
        const idx = customers.value.findIndex(c => c.id === editingId.value)
        if (idx !== -1) customers.value[idx] = data.data
        if (selectedCustomer.value?.id === editingId.value) selectedCustomer.value = data.data
      }
    } else {
      const body: CreateCustomerRequest = {
        name: form.name.trim(),
        phoneNumber: form.phoneNumber.trim(),
        phoneCountryCode: '+90',
        email: form.email.trim() || undefined,
        notes: form.notes.trim() || undefined,
        address: form.address.trim() || undefined,
        nationalId: form.nationalId.replaceAll(/\D/g, '').trim() || undefined,
      }
      await customerApi.create(body)
      await loadList()
    }
    closeCreate()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: { message?: string } } } }
    formSubmitError.value = err.response?.data?.error?.message ?? (e instanceof Error ? e.message : 'Kaydedilemedi.')
  } finally {
    formSaving.value = false
  }
}

// ── Blacklist ─────────────────────────────────────────────────────────────────
function openBlacklist(c: CustomerResponse) {
  blacklistTarget.value = c
  blacklistReason.value = ''
  blacklistError.value = ''
  blacklistDialogRef.value?.showModal()
}

function closeBlacklist() {
  blacklistTarget.value = null
  blacklistDialogRef.value?.close()
}

async function doBlacklist() {
  if (!blacklistTarget.value) return
  blacklistSaving.value = true
  blacklistError.value = ''
  try {
    const { data } = await customerApi.blacklist(blacklistTarget.value.id, blacklistReason.value.trim() || 'Belirtilmedi')
    if (data.success && data.data) {
      const idx = customers.value.findIndex(c => c.id === blacklistTarget.value?.id)
      if (idx !== -1) customers.value[idx] = data.data
      if (selectedCustomer.value?.id === data.data.id) selectedCustomer.value = data.data
    }
    closeBlacklist()
  } catch {
    blacklistError.value = 'İşlem gerçekleştirilemedi.'
  } finally {
    blacklistSaving.value = false
  }
}

async function doRemoveBlacklist(c: CustomerResponse) {
  try {
    const { data } = await customerApi.removeBlacklist(c.id)
    if (data.success && data.data) {
      const idx = customers.value.findIndex(x => x.id === c.id)
      if (idx !== -1) customers.value[idx] = data.data
      if (selectedCustomer.value?.id === c.id) selectedCustomer.value = data.data
    }
  } catch {
    listError.value = 'Kara listeden çıkarılamadı.'
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
function openDeleteConfirm(c: CustomerResponse) {
  deleteTarget.value = c
  deleteError.value = ''
  deleteDialogRef.value?.showModal()
}

function closeDeleteConfirm() {
  deleteTarget.value = null
  deleteDialogRef.value?.close()
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await customerApi.delete(deleteTarget.value.id)
    if (selectedCustomer.value?.id === deleteTarget.value.id) selectedCustomer.value = null
    customers.value = customers.value.filter(c => c.id !== deleteTarget.value?.id)
    closeDeleteConfirm()
  } catch {
    deleteError.value = 'Müşteri silinemedi.'
  } finally {
    deleting.value = false
  }
}

// ── Package ───────────────────────────────────────────────────────────────────
function openAddPackage(c: CustomerResponse) {
  packageCustomer.value = c
  pkgFormMode.value = 'template'
  const expDate = new Date()
  expDate.setMonth(expDate.getMonth() + 3)
  Object.assign(pkgForm, {
    templateId: '',
    serviceId: '',
    name: '',
    totalSessions: 10,
    expiresAt: expDate.toISOString().slice(0, 10),
  })
  Object.assign(pkgFormErrors, { serviceId: '', name: '', totalSessions: '', expiresAt: '' })
  pkgSubmitError.value = ''
  packageDialogRef.value?.showModal()
}

function closePackageModal() {
  packageCustomer.value = null
  packageDialogRef.value?.close()
}

function validatePackage(): boolean {
  Object.assign(pkgFormErrors, { serviceId: '', name: '', totalSessions: '', expiresAt: '' })
  if (!pkgForm.serviceId) { pkgFormErrors.serviceId = 'Hizmet seçiniz'; return false }
  if (!pkgForm.name.trim()) { pkgFormErrors.name = 'Paket adı giriniz'; return false }
  if (pkgForm.totalSessions < 1) { pkgFormErrors.totalSessions = 'En az 1 seans olmalıdır'; return false }
  if (!pkgForm.expiresAt) { pkgFormErrors.expiresAt = 'Bitiş tarihi giriniz'; return false }
  if (new Date(pkgForm.expiresAt) <= new Date()) { pkgFormErrors.expiresAt = 'Bitiş tarihi gelecekte olmalıdır'; return false }
  return true
}

async function submitPackageFromTemplate() {
  if (!packageCustomer.value || !pkgForm.templateId) {
    pkgSubmitError.value = 'Şablon seçiniz'
    return
  }
  pkgSaving.value = true
  pkgSubmitError.value = ''
  try {
    await packageApi.createFromTemplate({
      customerId: packageCustomer.value.id,
      templateId: Number(pkgForm.templateId),
    })
    const tmp = packageCustomer.value
    closePackageModal()
    if (selectedCustomer.value?.id === tmp.id) {
      const { data } = await customerApi.getPackages(tmp.id)
      if (data.success) {
        customerPackages.value = data.data ?? []
        const map: Record<number, PackageSessionResponse[]> = {}
        for (const p of customerPackages.value) {
          try {
            const r = await packageSessionApi.listByPackage(p.id)
            map[p.id] = r.data.success && r.data.data ? r.data.data : []
          } catch {
            map[p.id] = []
          }
        }
        sessionsByPackageId.value = map
      }
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: { message?: string } } } }
    pkgSubmitError.value = err.response?.data?.error?.message ?? (e instanceof Error ? e.message : 'Kaydedilemedi.')
  } finally {
    pkgSaving.value = false
  }
}

async function submitPackage() {
  if (!packageCustomer.value || !validatePackage()) return
  pkgSaving.value = true
  pkgSubmitError.value = ''
  try {
    const body: CreatePackageRequest = {
      customerId: packageCustomer.value.id,
      serviceId: Number(pkgForm.serviceId),
      name: pkgForm.name.trim(),
      totalSessions: pkgForm.totalSessions,
      expiresAt: new Date(pkgForm.expiresAt + 'T23:59:59').toISOString(),
    }
    await packageApi.create(body)
    const tmp = packageCustomer.value
    closePackageModal()
    if (selectedCustomer.value?.id === tmp.id) {
      const { data } = await customerApi.getPackages(tmp.id)
      if (data.success) customerPackages.value = data.data ?? []
      sessionsByPackageId.value = {}
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: { message?: string } } } }
    pkgSubmitError.value = err.response?.data?.error?.message ?? (e instanceof Error ? e.message : 'Kaydedilemedi.')
  } finally {
    pkgSaving.value = false
  }
}

async function assignSessionToAppointment(packageId: number, sessionId: number, appointmentId: number) {
  sessionAssignError.value = ''
  try {
    await packageSessionApi.assign(packageId, sessionId, { appointmentId })
    const [sessRes, apptRes] = await Promise.allSettled([
      packageSessionApi.listByPackage(packageId),
      appointmentApi.listByCustomer(selectedCustomer.value!.id),
    ])
    if (sessRes.status === 'fulfilled' && sessRes.value.data.success && sessRes.value.data.data) {
      sessionsByPackageId.value = { ...sessionsByPackageId.value, [packageId]: sessRes.value.data.data }
    }
    if (apptRes.status === 'fulfilled' && apptRes.value.data.success && apptRes.value.data.data) {
      customerAppointments.value = apptRes.value.data.data
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    }
    assignAppointmentForSession[sessionId] = ''
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: { message?: string } } } }
    sessionAssignError.value = err.response?.data?.error?.message ?? 'Randevu atanamadı.'
  }
}

async function unassignSessionFromAppointment(packageId: number, sessionId: number) {
  sessionAssignError.value = ''
  try {
    await packageSessionApi.unassign(packageId, sessionId)
    const [sessRes, apptRes] = await Promise.allSettled([
      packageSessionApi.listByPackage(packageId),
      appointmentApi.listByCustomer(selectedCustomer.value!.id),
    ])
    if (sessRes.status === 'fulfilled' && sessRes.value.data.success && sessRes.value.data.data) {
      sessionsByPackageId.value = { ...sessionsByPackageId.value, [packageId]: sessRes.value.data.data }
    }
    if (apptRes.status === 'fulfilled' && apptRes.value.data.success && apptRes.value.data.data) {
      customerAppointments.value = apptRes.value.data.data
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: { message?: string } } } }
    sessionAssignError.value = err.response?.data?.error?.message ?? 'Randevu kaldırılamadı.'
  }
}

async function doClearNoShowApproval(c: CustomerResponse) {
  try {
    const { data } = await customerApi.clearNoShowApproval(c.id)
    if (data.success && data.data) {
      const idx = customers.value.findIndex(x => x.id === c.id)
      if (idx !== -1) customers.value[idx] = data.data
      if (selectedCustomer.value?.id === c.id) selectedCustomer.value = data.data
    }
  } catch {
    // ignore
  }
}

// ── Session deduct/add ────────────────────────────────────────────────────────
async function deductSession(p: PackageResponse) {
  try {
    const { data } = await packageApi.deductSession(p.id)
    if (data.success && data.data) {
      const idx = customerPackages.value.findIndex(x => x.id === p.id)
      if (idx !== -1) customerPackages.value[idx] = data.data
    }
  } catch {
    // silently ignore — UI stays unchanged
  }
}

async function addSession(p: PackageResponse) {
  try {
    const { data } = await packageApi.addSessions(p.id, 1)
    if (data.success && data.data) {
      const idx = customerPackages.value.findIndex(x => x.id === p.id)
      if (idx !== -1) customerPackages.value[idx] = data.data
    }
  } catch {
    // silently ignore
  }
}

// ── Load ──────────────────────────────────────────────────────────────────────
async function loadList() {
  if (!businessId.value) return
  loading.value = true
  listError.value = ''
  try {
    const [custList, svcRes, tplRes] = await Promise.all([
      fetchAllPageContent((page, size) => customerApi.list({ page, size })),
      serviceApi.list(),
      packageTemplateApi.list(),
    ])
    customers.value = custList
    services.value = svcRes.data.success && svcRes.data.data ? svcRes.data.data : []
    packageTemplates.value = tplRes.data.success && tplRes.data.data ? tplRes.data.data : []
  } catch {
    listError.value = 'Liste yüklenemedi.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (businessId.value) loadList()
})
</script>

<style scoped>
/* ── Page header ─────────────────────────────────────────────────────────── */
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

/* ── Native dialog modals ─────────────────────────────────────────────────── */
dialog.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  margin: 0;
  transform: translate(-50%, -50%);
  max-width: calc(100vw - 2rem);
  width: min(26rem, 100%);
  max-height: min(90vh, 100%);
  overflow: auto;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
}

dialog.modal::backdrop {
  background: rgb(15 23 42 / 0.45);
}

dialog.modal.modal-lg {
  width: min(36rem, 100%);
}

.modal-inner {
  padding: 1.25rem 1.25rem 1rem;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.modal-title {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.35;
}

.modal-close-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  margin: -0.125rem -0.125rem 0 0;
  padding: 0;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.modal-close-btn:hover {
  background: var(--color-background-alt);
  color: var(--color-text);
}

.modal-close-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.modal-sub {
  margin: 0 0 1rem;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  line-height: 1.45;
}

.modal-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-light);
}

/* ── Two-pane layout ─────────────────────────────────────────────────────── */
.layout {
  display: grid;
  grid-template-columns: 18rem 1fr;
  gap: 1.25rem;
  align-items: start;
}

@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
}

/* ── List pane ───────────────────────────────────────────────────────────── */
.list-pane {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.list-toolbar {
  padding: 0.75rem;
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
  min-width: 0;
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-family: inherit;
  background: var(--color-background-alt);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.count-label {
  font-size: 0.75rem;
  color: var(--color-text-subtle);
  white-space: nowrap;
}

.empty-list {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.empty-title { font-weight: 600; color: var(--color-text); margin: 0 0 0.25rem; font-size: 0.9375rem; }
.empty-desc  { margin: 0 0 1rem; font-size: 0.875rem; }

.customer-list {
  list-style: none;
  padding: 0.375rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  max-height: calc(100vh - 16rem);
  overflow-y: auto;
}

.customer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.12s;
}

.customer-item:hover { background: var(--color-background-alt); }

.customer-item.selected {
  background: var(--color-primary-light);
}

.customer-item.blacklisted .customer-item-name {
  text-decoration: line-through;
  opacity: 0.7;
}

.customer-item-main {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-width: 0;
}

.customer-avatar {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
}

.av-indigo  { background: #6366f1; }
.av-violet  { background: #8b5cf6; }
.av-blue    { background: #3b82f6; }
.av-teal    { background: #14b8a6; }
.av-emerald { background: #10b981; }
.av-amber   { background: #f59e0b; }
.av-rose    { background: #f43f5e; }

.customer-item-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.customer-item-name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customer-item-phone {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.customer-item-badges {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

/* ── Detail pane ─────────────────────────────────────────────────────────── */
.detail-pane {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  min-height: 20rem;
}

.detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--color-text-muted);
  text-align: center;
  gap: 0.75rem;
}

.detail-empty-icon {
  font-size: 2.5rem;
  opacity: 0.3;
}

/* Detail header */
.detail-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border-light);
  flex-wrap: wrap;
}

.detail-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.detail-identity {
  flex: 1;
  min-width: 0;
}

.detail-name {
  margin: 0 0 0.375rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
}

.detail-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.detail-header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: flex-start;
}

/* Detail sections */
.detail-section {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border-light);
}

.detail-section:last-child { border-bottom: none; }

.detail-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.875rem;
}

.detail-section-title {
  margin: 0 0 0.875rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
}

.detail-section-head .detail-section-title { margin-bottom: 0; }

/* Info grid */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

@media (max-width: 640px) {
  .info-grid { grid-template-columns: 1fr; }
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.info-item-full { grid-column: 1 / -1; }

.info-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.info-value {
  font-size: 0.9375rem;
  color: var(--color-text);
}

.info-value.link {
  color: var(--color-primary);
  text-decoration: none;
}

.info-value.link:hover { text-decoration: underline; }
.danger-text { color: var(--color-danger); }

/* Skeleton loaders */
.loading-state { display: flex; flex-direction: column; gap: 0.75rem; }
.skeleton-card {
  height: 4.5rem;
  background: linear-gradient(90deg, var(--color-background-alt) 25%, var(--color-border-light) 50%, var(--color-background-alt) 75%);
  background-size: 200% 100%;
  animation: skeleton 1.2s ease-in-out infinite;
  border-radius: var(--radius-lg);
}

.loading-inline { display: flex; flex-direction: column; gap: 0.5rem; }
.skeleton-row {
  height: 3rem;
  background: linear-gradient(90deg, var(--color-background-alt) 25%, var(--color-border-light) 50%, var(--color-background-alt) 75%);
  background-size: 200% 100%;
  animation: skeleton 1.2s ease-in-out infinite;
  border-radius: var(--radius-md);
}

@keyframes skeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.section-empty { font-size: 0.875rem; color: var(--color-text-muted); padding: 0.5rem 0; }

/* Package cards */
.pkg-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pkg-card {
  background: var(--color-background-alt);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: 0.875rem 1rem;
  transition: border-color 0.15s;
}

.pkg-card:hover { border-color: var(--color-border); }
.pkg-card.expired { opacity: 0.65; }

.pkg-card-head { display: flex; flex-direction: column; gap: 0.125rem; margin-bottom: 0.625rem; }

.pkg-card-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pkg-card-name { font-size: 0.9375rem; font-weight: 600; color: var(--color-text); flex: 1; }
.pkg-service-name { font-size: 0.8125rem; color: var(--color-text-muted); }

/* Progress */
.pkg-progress-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.625rem;
}

.pkg-progress-bar {
  flex: 1;
  height: 0.4375rem;
  background: var(--color-border);
  border-radius: 9999px;
  overflow: hidden;
}

.pkg-progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 9999px;
  transition: width 0.3s;
}

.pkg-progress-fill.low { background: var(--color-warning); }
.pkg-progress-fill.expired { background: var(--color-text-subtle); }

.pkg-sessions-text {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.pkg-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.pkg-expires { font-size: 0.8125rem; color: var(--color-text-muted); }

.pkg-session-actions { display: flex; gap: 0.375rem; }

.session-btn {
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
  transition: background 0.12s, border-color 0.12s;
}

.session-btn:hover:not(:disabled) { background: var(--color-background-alt); border-color: var(--color-text-subtle); }
.session-btn.add:hover:not(:disabled) { background: var(--color-success-bg); border-color: var(--color-success); color: var(--color-success); }
.session-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.session-btn:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }

/* Appointment history */
.appt-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.appt-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border-light);
}

.appt-item:last-child { border-bottom: none; }

.appt-date {
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-muted);
  min-width: 7rem;
}

.appt-service {
  flex: 1;
  font-size: 0.875rem;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.appt-badge {
  font-size: 0.6875rem;
  font-weight: 500;
  padding: 0.125rem 0.4rem;
  border-radius: 9999px;
  white-space: nowrap;
}

.appt-pkg-badge {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.125rem 0.4rem;
  border-radius: 9999px;
  white-space: nowrap;
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.badge-pending  { background: var(--color-warning-bg); color: var(--color-warning); }
.badge-active   { background: var(--color-success-bg); color: var(--color-success); }
.badge-risky    { background: var(--color-danger-bg); color: var(--color-danger); }
.badge-inactive { background: var(--color-background-alt); color: var(--color-text-muted); }

.more-hint {
  margin: 0.5rem 0 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

/* ── Badges ──────────────────────────────────────────────────────────────── */
.badge {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  white-space: nowrap;
}

.badge.danger   { background: var(--color-danger-bg); color: var(--color-danger); }
.badge.warning  { background: var(--color-warning-bg); color: var(--color-warning); }
.badge.active   { background: var(--color-success-bg); color: var(--color-success); }
.badge.inactive { background: var(--color-background-alt); color: var(--color-text-muted); }
.badge.muted    { background: var(--color-background-alt); color: var(--color-text-muted); }
.badge.noshow   { background: #fef3c7; color: #b45309; }

.pkg-mode-tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.tab-btn {
  padding: 0.375rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
  font-family: inherit;
}
.tab-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.tab-btn.active { background: var(--color-primary); border-color: var(--color-primary); color: white; }
.tab-btn:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }

.pkg-sessions-list { margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--color-border-light); }
.pkg-sessions-head { font-size: 0.8125rem; font-weight: 600; color: var(--color-text-muted); margin-bottom: 0.5rem; }
.session-rows { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.375rem; }
.session-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.8125rem;
  padding: 0.375rem 0;
}
.session-num { font-variant-numeric: tabular-nums; font-weight: 600; min-width: 2rem; }
.session-status { padding: 0.125rem 0.375rem; border-radius: var(--radius-sm); font-size: 0.75rem; }
.session-status.pending { background: var(--color-background-alt); color: var(--color-text-muted); }
.session-status.scheduled { background: var(--color-primary-light); color: var(--color-primary); }
.session-status.completed { background: var(--color-success-bg); color: var(--color-success); }
.session-status.no_show { background: var(--color-danger-bg); color: var(--color-danger); }
.session-status.cancelled { background: var(--color-background-alt); color: var(--color-text-muted); }
.session-date { min-width: 8rem; }
.session-date.muted { color: var(--color-text-muted); }
.session-assign-wrap { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.session-assign-select { max-width: 12rem; padding: 0.25rem 0.5rem; font-size: 0.8125rem; border-radius: var(--radius-md); border: 1px solid var(--color-border); }
.session-assign-hint { margin: 0.25rem 0 0; font-size: 0.75rem; color: var(--color-text-muted); }
.session-assign-hint a { color: var(--color-primary); text-decoration: underline; }
.session-new-appt-btn {
  display: inline-flex; align-items: center; gap: 0.25rem;
  padding: 0.25rem 0.625rem; border-radius: 0.5rem;
  font-size: 0.75rem; font-weight: 600;
  background: var(--color-primary); color: #fff;
  text-decoration: none; transition: background 0.15s;
}
.session-new-appt-btn:hover { background: var(--color-primary-dark, #4338ca); }
.btn.tiny { padding: 0.2rem 0.5rem; font-size: 0.75rem; }

/* ── States ──────────────────────────────────────────────────────────────── */
.empty-state {
  padding: 2rem;
  text-align: center;
  background: var(--color-background-alt);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
}

.error-state {
  padding: 2rem;
  text-align: center;
  background: var(--color-background-alt);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
}

.error-state p { margin: 0 0 1rem; }

/* ── Buttons ─────────────────────────────────────────────────────────────── */
.btn.danger-ghost {
  color: var(--color-danger);
  border-color: transparent;
  background: transparent;
}

.btn.danger-ghost:hover:not(:disabled) {
  background: var(--color-danger-bg);
  border-color: var(--color-danger);
}


.form { display: flex; flex-direction: column; gap: 1rem; }

.field { display: flex; flex-direction: column; gap: 0.3rem; }
.field label { font-weight: 500; font-size: 0.875rem; color: var(--color-text-muted); }
.field-hint { margin: 0.25rem 0 0; font-size: 0.8125rem; color: var(--color-text-muted); }
.field-hint.empty-hint { margin-top: 0.5rem; padding: 0.5rem; background: var(--color-background-alt); border-radius: var(--radius-md); }
.req { color: var(--color-danger); }

.field input,
.field select,
.field textarea {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.9375rem;
  font-family: inherit;
  width: 100%;
  background: var(--color-surface);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.field-row .field { margin-bottom: 0; }

.pkg-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  background: var(--color-primary-light);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}

.pkg-preview-label { font-weight: 600; color: var(--color-primary); }
.pkg-preview-text { color: var(--color-text); }

.error { font-size: 0.8125rem; color: var(--color-danger); }
.submit-error { font-size: 0.875rem; color: var(--color-danger); margin: 0; }
</style>
