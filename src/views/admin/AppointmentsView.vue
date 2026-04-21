<template>
  <div class="space-y-4">
    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <SectionHeader
      :title="t('appointmentsView.title')"
      :subtitle="headerSubtitle"
    >
      <template #actions>
        <AppButton variant="primary" @click="openCreate">
          <Plus class="size-4" aria-hidden="true" />
          <span class="hidden sm:inline">{{ t('appointmentsView.newAppointment') }}</span>
          <span class="sm:hidden">{{ t('appointmentsView.newShort') }}</span>
        </AppButton>
      </template>
    </SectionHeader>

    <div
      v-if="!businessId"
      class="card"
      :style="{ background: 'var(--warning-tint)', borderColor: 'var(--warning)' }"
    >
      {{ t('appointmentsView.noBusiness') }}
    </div>

    <template v-else>
      <!-- ── Hata bandı ─────────────────────────────────────────────── -->
      <div
        v-if="listError"
        class="card flex items-center justify-between"
        :style="{ background: 'var(--danger-tint)', borderColor: 'var(--danger)', color: 'var(--danger)' }"
        role="alert"
      >
        <span>{{ listError }}</span>
        <AppButton variant="secondary" size="sm" @click="manualRefresh">{{ t('common.retry') }}</AppButton>
      </div>

      <!-- ── Status Filter Chips (Prototype: Hepsi · Bekliyor · Onaylı · Riskli · İptal · Tamamlandı) ── -->
      <div
        ref="statusFilterRef"
        class="status-chip-row"
        role="group"
        :aria-label="t('appointmentsView.filter.statusGroupLabel')"
      >
        <button
          v-for="chip in statusChips"
          :key="chip.value"
          type="button"
          class="status-chip"
          :class="{ 'status-chip--active': filterStatus === chip.value }"
          :aria-pressed="filterStatus === chip.value"
          @click="filterStatus = chip.value"
        >
          <span>{{ chip.label }}</span>
          <span class="status-chip__count">{{ chip.count }}</span>
        </button>

        <div class="status-chip-spacer" aria-hidden="true" />

        <div class="status-chip-meta">
          <label class="meta-field">
            <span class="meta-field__label">{{ t('appointmentsView.filter.start') }}</span>
            <AppDateField v-model="filterStart" />
          </label>
          <label class="meta-field">
            <span class="meta-field__label">{{ t('appointmentsView.filter.end') }}</span>
            <AppDateField v-model="filterEnd" />
          </label>
          <AppButton variant="secondary" size="sm" :loading="listLoading" @click="manualRefresh">
            <RefreshCw class="size-3.5" aria-hidden="true" />
            <span class="hidden sm:inline">{{ t('appointmentsView.filter.refresh') }}</span>
          </AppButton>
        </div>
      </div>

      <!-- Çalışan filtresi (paylaşılan dropdown — büyük ekipler için ölçeklenir) -->
      <EmployeeFilterDropdown
        v-if="employees.length"
        v-model="filterEmployee"
        :employees="employees"
        :counts="employeeAppointmentCounts"
        :color-fn="employeeColor"
        :aria-label="t('appointmentsView.filter.employeeGroupLabel')"
      />

      <!-- Liste iskeleti -->
      <div v-if="listLoading && appointments.length === 0" class="space-y-3">
        <div
          v-for="i in 5"
          :key="i"
          class="rounded-xl p-4 shadow-sm"
          style="border: 1px solid var(--hairline); background: var(--surface)"
        >
          <AppSkeleton variant="line" width="30%" height="1rem" class="mb-2" />
          <AppSkeleton variant="line" width="70%" height="0.875rem" class="mb-1.5" />
          <AppSkeleton variant="line" width="50%" height="0.875rem" />
        </div>
      </div>

      <!-- Boş durum -->
      <div
        v-else-if="!listLoading && filteredAppointments.length === 0"
        class="rounded-xl border-dashed px-4 py-14 text-center"
        style="border: 1px dashed var(--hairline); background: var(--surface-2)"
      >
        <CalendarX2 class="mx-auto mb-3 size-10" style="color: var(--ink-4)" aria-hidden="true" />
        <p class="font-medium" style="color: var(--ink-2)">{{ t('appointmentsView.list.emptyTitle') }}</p>
        <p class="mt-1 text-sm" style="color: var(--ink-4)">{{ t('appointmentsView.list.emptyHint') }}</p>
        <AppButton class="mt-4" variant="secondary" size="sm" @click="openCreate">
          <Plus class="size-4" aria-hidden="true" />
          {{ t('appointmentsView.list.createCta') }}
        </AppButton>
      </div>

      <!-- Master/Detail: Tablo + Sticky Detail Panel -->
      <div v-else class="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_360px]">
        <div class="appointment-table-card">
          <div class="appointment-table-scroll">
            <table class="appointment-table">
              <thead>
                <tr>
                  <th scope="col">{{ t('appointmentsView.table.time') }}</th>
                  <th scope="col">{{ t('appointmentsView.table.customer') }}</th>
                  <th scope="col">{{ t('appointmentsView.table.service') }}</th>
                  <th scope="col">{{ t('appointmentsView.table.employee') }}</th>
                  <th scope="col">{{ t('appointmentsView.table.status') }}</th>
                  <th scope="col" class="appointment-table__th-right">{{ t('appointmentsView.table.duration') }}</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(group, date) in groupedAppointments" :key="date">
                  <tr class="appointment-table__group">
                    <td colspan="6">
                      <span class="appointment-table__group-label">{{ formatDateGroupHeader(String(date)) }}</span>
                      <span class="appointment-table__group-count">{{ t('appointmentsView.list.groupCount', { n: group.length }) }}</span>
                    </td>
                  </tr>
                  <tr
                    v-for="a in group"
                    :id="`appointment-${a.id}`"
                    :key="a.id"
                    class="appointment-row"
                    :class="{ 'appointment-row--selected': selectedAppointmentId === a.id }"
                    tabindex="0"
                    role="button"
                    :aria-pressed="selectedAppointmentId === a.id"
                    :aria-label="`${formatTime(a.scheduledAt)} · ${resolveCustomerName(a.customerId)} · ${resolveServiceName(a.serviceId)}`"
                    @click="selectAppointment(a)"
                    @keydown="handleMasterKeydown($event, a)"
                  >
                    <td>
                      <div class="appointment-row__time">{{ formatTime(a.scheduledAt) }}</div>
                      <div class="appointment-row__date-mini">{{ formatDateGroupHeader(a.scheduledAt.slice(0, 10)) }}</div>
                    </td>
                    <td>
                      <div class="appointment-row__customer">
                        <div
                          class="appointment-row__avatar"
                          :style="{ background: employeeColor(a.customerId) }"
                          aria-hidden="true"
                        >{{ resolveCustomerName(a.customerId).charAt(0).toUpperCase() }}</div>
                        <div class="min-w-0">
                          <div class="appointment-row__customer-name">{{ resolveCustomerName(a.customerId) }}</div>
                          <div class="appointment-row__customer-phone">{{ customerPhoneOf(a.customerId) ?? '—' }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="appointment-row__service">{{ resolveServiceName(a.serviceId) }}</td>
                    <td>
                      <div class="appointment-row__employee">
                        <span
                          class="appointment-row__employee-dot"
                          :style="{ background: employeeColor(a.employeeId) }"
                          aria-hidden="true"
                        />
                        {{ resolveEmployeeName(a.employeeId) }}
                      </div>
                    </td>
                    <td>
                      <StatusPill :status="a.status" :label="t(`appointmentStatus.${a.status}`)" size="xs" />
                    </td>
                    <td class="appointment-row__duration">
                      {{ t('appointmentsView.list.minutesShort', { n: a.durationMinutes }) }}
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Detail Panel (Desktop) -->
        <div class="hidden lg:block sticky top-4 self-start">
          <AppointmentDetailPanel
            v-bind="detailProps"
            @confirm="confirmAppointment"
            @complete="completeAppointment"
            @cancel="openCancel"
            @no-show="markNoShow"
            @close="selectedAppointmentId = null"
          />
        </div>
      </div>

      <!-- Detail Modal (Mobile) -->
      <AppModal
        v-model:visible="detailModalOpen"
        :title="t('appointmentsView.detail.title')"
        hide-footer
        class="lg:hidden"
      >
        <AppointmentDetailPanel
          v-bind="detailProps"
          @confirm="confirmAppointment"
          @complete="completeAppointment"
          @cancel="openCancel"
          @no-show="markNoShow"
          @close="closeDetail"
        />
      </AppModal>
    </template>

    <!-- ── İptal Modal ───────────────────────────────────────────────── -->
    <AppModal v-model:visible="showCancelModal" :title="t('appointmentsView.cancelModal.title')">
      <div class="space-y-4">
        <p v-if="cancelTarget" class="text-sm" style="color: var(--ink-2)">
          {{ t('appointmentsView.cancelModal.question', { datetime: formatDateTime(cancelTarget.scheduledAt) }) }}
        </p>
        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-medium" style="color: var(--ink-1)">
            {{ t('appointmentsView.cancelModal.reasonLabel') }}
          </span>
          <input
            v-model="cancelReason" type="text"
            class="rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
            style="border: 1px solid var(--hairline); color: var(--ink-1); background: var(--surface)"
            :placeholder="t('appointmentsView.cancelModal.reasonPlaceholder')"
          />
        </label>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showCancelModal = false">{{ t('common.cancel') }}</AppButton>
        <AppButton variant="danger" :loading="cancelling" @click="doCancel">{{ t('appointmentsView.cancelModal.submit') }}</AppButton>
      </template>
    </AppModal>

    <!-- ── Yeni Randevu Wizard Modal ───────────────────────────────────── -->
    <AppModal
      v-model:visible="showCreateModal"
      title="Yeni Randevu"
      :dialog-style="{ width: 'min(48.75rem, 95vw)' }"
    >
      <div class="wizard">
        <!-- Stepper -->
        <ol class="wizard-stepper" aria-label="Randevu oluşturma adımları">
          <li
            v-for="(step, i) in WIZARD_STEPS"
            :key="step.key"
            class="wizard-stepper__item"
            :class="{
              'wizard-stepper__item--done': wizardStep > i + 1,
              'wizard-stepper__item--active': wizardStep === i + 1,
            }"
            :aria-current="wizardStep === i + 1 ? 'step' : undefined"
          >
            <div class="wizard-stepper__marker">
              <div class="wizard-stepper__circle">
                <Check v-if="wizardStep > i + 1" class="size-3.5" :stroke-width="2.6" aria-hidden="true" />
                <span v-else>{{ i + 1 }}</span>
              </div>
              <div class="wizard-stepper__meta">
                <span class="wizard-stepper__caption">Adım {{ i + 1 }}</span>
                <span class="wizard-stepper__label">{{ step.caption }}</span>
              </div>
            </div>
            <span
              v-if="i < WIZARD_STEPS.length - 1"
              class="wizard-stepper__line"
              :class="{ 'wizard-stepper__line--done': wizardStep > i + 1 }"
              aria-hidden="true"
            />
          </li>
        </ol>

        <!-- Summary chips (önceki adımlardan seçilenler) -->
        <div v-if="wizardSummaryChips.length" class="wizard-summary" role="region" aria-label="Seçilenler">
          <span
            v-for="chip in wizardSummaryChips"
            :key="chip.key"
            class="wizard-summary__chip"
            :data-tone="chip.tone"
          >
            <component :is="chip.icon" class="size-3" aria-hidden="true" />
            <span>{{ chip.label }}</span>
          </span>
        </div>

        <!-- Adım başlığı -->
        <div class="wizard-section__head">
          <h2 class="wizard-section__title">{{ WIZARD_STEPS[wizardStep - 1].title }}</h2>
          <p class="wizard-section__subtitle">{{ WIZARD_STEPS[wizardStep - 1].subtitle }}</p>
        </div>

        <!-- ── Adım 1: Çalışan + Hizmet ─────────────────────────────── -->
        <div v-if="wizardStep === 1" class="wizard-body">
          <div v-if="empLoading" class="wizard-skeleton">
            <div v-for="i in 3" :key="i" class="wizard-skeleton__row" />
          </div>
          <template v-else>
            <div class="wizard-field">
              <span class="wizard-field__label">Çalışan</span>
              <div class="wizard-pick-grid">
                <button
                  v-for="emp in employees"
                  :key="emp.id"
                  type="button"
                  class="wizard-pick wizard-pick--employee"
                  :class="{ 'wizard-pick--active': wizardForm.employeeId === emp.id }"
                  @click="selectEmployee(emp.id)"
                >
                  <span
                    class="wizard-pick__avatar"
                    :style="{ backgroundColor: employeeColor(emp.id) }"
                  >{{ empInitials(emp.name) }}</span>
                  <span class="wizard-pick__body">
                    <span class="wizard-pick__title">{{ emp.name }}</span>
                    <span v-if="emp.title" class="wizard-pick__hint">{{ emp.title }}</span>
                  </span>
                  <Check
                    v-if="wizardForm.employeeId === emp.id"
                    class="wizard-pick__check size-4"
                    :stroke-width="2.6"
                    aria-hidden="true"
                  />
                </button>
              </div>
              <span v-if="wizardErrors.employeeId" class="wizard-field__error" role="alert">{{ wizardErrors.employeeId }}</span>
            </div>

            <div class="wizard-field">
              <span class="wizard-field__label">Hizmet</span>
              <p v-if="wizardForm.employeeId === '' && capableServices.length === 0" class="wizard-field__hint wizard-field__hint--muted">
                Önce çalışan seçin
              </p>
              <div v-else-if="capabilitiesLoading" class="wizard-skeleton">
                <div v-for="i in 2" :key="i" class="wizard-skeleton__row wizard-skeleton__row--sm" />
              </div>
              <div v-else-if="capableServices.length === 0" class="wizard-field__cta">
                <p class="wizard-field__hint wizard-field__hint--warning">
                  {{ t('appointmentsView.wizard.bridge.empty') }}
                </p>
                <RouterLink
                  :to="`/admin/services?focusEmployee=${wizardForm.employeeId}`"
                  class="wizard-field__link"
                >
                  {{ t('appointmentsView.wizard.bridge.action') }} →
                </RouterLink>
              </div>
              <div v-else class="wizard-pick-grid">
                <button
                  v-for="svc in capableServices"
                  :key="svc.id"
                  type="button"
                  class="wizard-pick wizard-pick--service"
                  :class="{ 'wizard-pick--active': wizardForm.serviceId === svc.id }"
                  @click="wizardForm.serviceId = svc.id"
                >
                  <span class="wizard-pick__body">
                    <span class="wizard-pick__title">{{ svc.name }}</span>
                    <span class="wizard-pick__hint">{{ svc.durationMinutes }} dk</span>
                  </span>
                  <Check
                    v-if="wizardForm.serviceId === svc.id"
                    class="wizard-pick__check size-4"
                    :stroke-width="2.6"
                    aria-hidden="true"
                  />
                </button>
              </div>
              <span v-if="wizardErrors.serviceId" class="wizard-field__error" role="alert">{{ wizardErrors.serviceId }}</span>
            </div>
          </template>
        </div>

        <!-- ── Adım 2: Tarih ──────────────────────────────────────────── -->
        <div v-else-if="wizardStep === 2" class="wizard-body">
          <div v-if="datesLoading" class="wizard-center">
            <div class="wizard-spinner" aria-label="Yükleniyor" />
          </div>
          <div v-else-if="availableDates.length === 0" class="wizard-alert">
            Önümüzdeki {{ maxAdvanceBookingDays }} gün içinde uygun tarih bulunamadı.
          </div>
          <template v-else>
            <div class="wizard-calendar">
              <div class="wizard-calendar__nav">
                <button
                  type="button"
                  class="wizard-calendar__nav-btn"
                  :disabled="calMonthIndex === 0"
                  aria-label="Önceki ay"
                  @click="calMonthIndex--"
                >
                  <ChevronLeft class="size-4" aria-hidden="true" />
                </button>
                <span class="wizard-calendar__month">{{ currentCalMonthLabel }}</span>
                <button
                  type="button"
                  class="wizard-calendar__nav-btn"
                  :disabled="calMonthIndex >= availableMonths.length - 1"
                  aria-label="Sonraki ay"
                  @click="calMonthIndex++"
                >
                  <ChevronRight class="size-4" aria-hidden="true" />
                </button>
              </div>

              <div class="wizard-calendar__days">
                <span v-for="d in ['Pt','Sa','Ça','Pe','Cu','Ct','Pz']" :key="d">{{ d }}</span>
              </div>

              <div class="wizard-calendar__grid">
                <template v-for="cell in calendarCells" :key="cell.iso ?? cell.index">
                  <div v-if="!cell.iso" />
                  <button
                    v-else
                    type="button"
                    class="wizard-calendar__cell"
                    :class="{
                      'wizard-calendar__cell--available': cell.available,
                      'wizard-calendar__cell--active': cell.available && wizardForm.date === cell.iso,
                      'wizard-calendar__cell--disabled': !cell.available,
                    }"
                    :disabled="!cell.available"
                    @click="wizardForm.date = cell.iso"
                  >
                    <span>{{ cell.day }}</span>
                    <span v-if="cell.available" class="wizard-calendar__dot" />
                  </button>
                </template>
              </div>
            </div>

            <div v-if="wizardForm.date" class="wizard-inline-confirm">
              <CalendarCheck class="size-4 shrink-0" aria-hidden="true" />
              <span>{{ formatDateFull(wizardForm.date) }}</span>
            </div>
            <p v-else class="wizard-field__hint wizard-field__hint--muted">
              Yeşil noktalı günler müsait — {{ availableDates.length }} uygun gün bulundu.
            </p>
            <span v-if="wizardErrors.date" class="wizard-field__error" role="alert">{{ wizardErrors.date }}</span>
          </template>
        </div>

        <!-- ── Adım 3: Saat ───────────────────────────────────────────── -->
        <div v-else-if="wizardStep === 3" class="wizard-body">
          <div v-if="slotsLoading" class="wizard-center">
            <div class="wizard-spinner" aria-label="Yükleniyor" />
          </div>
          <div v-else-if="availableSlots.length === 0" class="wizard-alert">
            Bu tarihte uygun saat yok. Geri dönüp başka gün seçin.
          </div>
          <template v-else>
            <!-- Context bar -->
            <div class="wizard-context">
              <CalendarCheck class="size-3.5 shrink-0" aria-hidden="true" />
              <span class="wizard-context__strong">{{ formatDateFull(wizardForm.date) }}</span>
              <span class="wizard-context__sep">·</span>
              <span>Stilist: {{ resolveEmployeeName(wizardForm.employeeId as number) }}</span>
              <span v-if="selectedServiceForWizard" class="wizard-context__sep">·</span>
              <span v-if="selectedServiceForWizard">Süre: {{ selectedServiceForWizard.durationMinutes }} dk</span>
            </div>

            <!-- Slot grid (tasarımdaki 6-col) -->
            <div class="wizard-slots">
              <button
                v-for="slot in availableSlots"
                :key="slot.startTime"
                type="button"
                class="wizard-slot"
                :class="{ 'wizard-slot--active': wizardForm.time === slot.startTime }"
                @click="wizardForm.time = slot.startTime"
              >
                {{ slot.startTime.slice(11, 16) }}
              </button>
            </div>

            <!-- Bilgi kartları (paket + hatırlatma) -->
            <div class="wizard-info-cards">
              <div class="wizard-info-card">
                <span class="wizard-info-card__icon wizard-info-card__icon--info" aria-hidden="true">
                  <Bell class="size-4" />
                </span>
                <div class="wizard-info-card__body">
                  <span class="wizard-info-card__title">Otomatik hatırlatma</span>
                  <span class="wizard-info-card__hint">Randevudan 2 saat önce gönderilir</span>
                </div>
                <span class="wizard-info-card__badge">Varsayılan</span>
              </div>
              <div class="wizard-info-card">
                <span class="wizard-info-card__icon wizard-info-card__icon--purple" aria-hidden="true">
                  <PackageIcon class="size-4" />
                </span>
                <div class="wizard-info-card__body">
                  <span class="wizard-info-card__title">Paketten düş</span>
                  <span class="wizard-info-card__hint">Sonraki adımda müşteri seçilince kontrol edilir</span>
                </div>
              </div>
            </div>

            <div v-if="wizardForm.time" class="wizard-inline-confirm">
              <Check class="size-4 shrink-0" aria-hidden="true" />
              <span>
                {{ wizardForm.time.slice(11, 16) }}
                –
                {{ availableSlots.find(s => s.startTime === wizardForm.time)?.endTime.slice(11, 16) }}
              </span>
              <span v-if="selectedSlotDurationMinutes !== null" class="wizard-inline-confirm__sep">·</span>
              <span v-if="selectedSlotDurationMinutes !== null">{{ selectedSlotDurationMinutes }} dk</span>
            </div>

            <span v-if="wizardErrors.time" class="wizard-field__error" role="alert">{{ wizardErrors.time }}</span>
          </template>
        </div>

        <!-- ── Adım 4: Müşteri ────────────────────────────────────────── -->
        <div v-else-if="wizardStep === 4" class="wizard-body">
          <!-- Mod seçimi: Mevcut / Yeni -->
          <div class="wizard-tabs" role="tablist" aria-label="Müşteri seçimi modu">
            <button
              type="button"
              class="wizard-tab"
              :class="{ 'wizard-tab--active': customerMode === 'existing' }"
              role="tab"
              :aria-selected="customerMode === 'existing'"
              @click="customerMode = 'existing'"
            >
              Mevcut müşteri
            </button>
            <button
              type="button"
              class="wizard-tab"
              :class="{ 'wizard-tab--active': customerMode === 'new' }"
              role="tab"
              :aria-selected="customerMode === 'new'"
              @click="customerMode = 'new'; clearExistingCustomer()"
            >
              Yeni müşteri
            </button>
          </div>

          <!-- Mevcut müşteri -->
          <template v-if="customerMode === 'existing'">
            <div class="wizard-search">
              <Search class="size-4 wizard-search__icon" aria-hidden="true" />
              <input
                v-model="customerSearch"
                type="search"
                placeholder="İsim veya telefon ara…"
                class="wizard-search__input"
              />
            </div>

            <div v-if="selectedExistingCustomer" class="wizard-selected-customer">
              <div class="wizard-selected-customer__body">
                <span
                  class="wizard-pick__avatar"
                  :style="{ backgroundColor: employeeColor(selectedExistingCustomer.id) }"
                >{{ selectedExistingCustomer.name.charAt(0).toUpperCase() }}</span>
                <div>
                  <p class="wizard-selected-customer__name">{{ selectedExistingCustomer.name }}</p>
                  <p class="wizard-selected-customer__phone">{{ selectedExistingCustomer.phoneNumber }}</p>
                </div>
              </div>
              <button
                type="button"
                class="wizard-selected-customer__change"
                @click="clearExistingCustomer()"
              >
                Değiştir
              </button>
            </div>

            <ul v-else class="wizard-customer-list">
              <li v-if="filteredCustomersForWizard.length === 0" class="wizard-customer-list__empty">
                Müşteri bulunamadı
              </li>
              <li
                v-for="c in filteredCustomersForWizard"
                :key="c.id"
                class="wizard-customer-list__item"
                @click="selectExistingCustomer(c)"
              >
                <div class="wizard-customer-list__info">
                  <span
                    class="wizard-pick__avatar wizard-pick__avatar--sm"
                    :style="{ backgroundColor: employeeColor(c.id) }"
                  >{{ c.name.charAt(0).toUpperCase() }}</span>
                  <div>
                    <p class="wizard-customer-list__name">{{ c.name }}</p>
                    <p class="wizard-customer-list__phone">{{ c.phoneNumber }}</p>
                  </div>
                </div>
                <span v-if="c.blacklisted" class="wizard-tag wizard-tag--danger">Kara liste</span>
                <span v-else-if="c.noShowForcesManualApproval" class="wizard-tag wizard-tag--warning">Onay zorunlu</span>
              </li>
            </ul>
            <span v-if="wizardErrors.customer" class="wizard-field__error" role="alert">{{ wizardErrors.customer }}</span>

            <!-- Paket seans seçimi -->
            <template v-if="selectedExistingCustomer">
              <div v-if="packagesLoadingForWizard" class="wizard-field__hint wizard-field__hint--muted">
                Paketler yükleniyor…
              </div>
              <div v-else-if="pendingSessionsForWizard.length > 0" class="wizard-field">
                <span class="wizard-field__label">
                  Paket seansı ata
                  <span class="wizard-field__label-hint">(isteğe bağlı)</span>
                </span>
                <div class="wizard-session-list">
                  <label
                    class="wizard-session"
                    :class="{ 'wizard-session--active': selectedSessionId === null }"
                  >
                    <input v-model="selectedSessionId" type="radio" :value="null" class="sr-only" />
                    <span class="wizard-session__radio">
                      <span v-if="selectedSessionId === null" class="wizard-session__radio-dot" />
                    </span>
                    <span class="wizard-session__label">Seans atama (paketsiz randevu)</span>
                  </label>
                  <label
                    v-for="{ pkg, session } in pendingSessionsForWizard"
                    :key="session.id"
                    class="wizard-session"
                    :class="{ 'wizard-session--active': selectedSessionId === session.id }"
                  >
                    <input v-model="selectedSessionId" type="radio" :value="session.id" class="sr-only" />
                    <span class="wizard-session__radio">
                      <span v-if="selectedSessionId === session.id" class="wizard-session__radio-dot" />
                    </span>
                    <div class="wizard-session__info">
                      <p class="wizard-session__title">{{ pkg.name }}</p>
                      <p class="wizard-session__hint">Seans #{{ session.sessionNumber }} · {{ pkg.remainingSessions }} seans kaldı</p>
                    </div>
                    <span class="wizard-tag wizard-tag--info">Paket</span>
                  </label>
                </div>
              </div>
              <div
                v-else-if="!packagesLoadingForWizard && eligiblePackages.length === 0 && customerPackagesForWizard.length > 0"
                class="wizard-field__hint wizard-field__hint--muted"
              >
                Bu müşterinin bu hizmet için bekleyen paket seansı yok.
              </div>
            </template>

            <label class="wizard-field">
              <span class="wizard-field__label">
                Not
                <span class="wizard-field__label-hint">(isteğe bağlı)</span>
              </span>
              <textarea
                v-model="wizardForm.notes"
                rows="2"
                maxlength="500"
                placeholder="Varsa not…"
                class="wizard-textarea"
              />
            </label>
          </template>

          <!-- Yeni müşteri formu -->
          <template v-else>
            <div class="wizard-form-grid">
              <label class="wizard-field">
                <span class="wizard-field__label">
                  Müşteri adı
                  <span class="wizard-field__required">*</span>
                </span>
                <input
                  v-model="wizardForm.customerName"
                  type="text"
                  placeholder="Ad soyad…"
                  class="wizard-input"
                />
                <span v-if="wizardErrors.customerName" class="wizard-field__error" role="alert">{{ wizardErrors.customerName }}</span>
              </label>
              <label class="wizard-field">
                <span class="wizard-field__label">
                  Telefon
                  <span class="wizard-field__required">*</span>
                </span>
                <input
                  v-model="wizardForm.phoneNumber"
                  type="tel"
                  placeholder="5XX XXX XX XX"
                  class="wizard-input"
                />
                <span v-if="wizardErrors.phoneNumber" class="wizard-field__error" role="alert">{{ wizardErrors.phoneNumber }}</span>
              </label>
            </div>

            <div class="wizard-field">
              <span class="wizard-field__label">Kaynak</span>
              <div class="wizard-source-row">
                <label
                  v-for="src in SOURCES"
                  :key="src.value"
                  class="wizard-source"
                  :class="{ 'wizard-source--active': wizardForm.source === src.value }"
                >
                  <input v-model="wizardForm.source" type="radio" :value="src.value" class="sr-only" />
                  <component :is="src.icon" class="size-4" aria-hidden="true" />
                  {{ src.label }}
                </label>
              </div>
            </div>

            <label class="wizard-field">
              <span class="wizard-field__label">
                Not
                <span class="wizard-field__label-hint">(isteğe bağlı)</span>
              </span>
              <textarea
                v-model="wizardForm.notes"
                rows="2"
                maxlength="500"
                placeholder="Varsa not…"
                class="wizard-textarea"
              />
            </label>
          </template>

          <p v-if="createSubmitError" class="wizard-field__error" role="alert">{{ createSubmitError }}</p>
        </div>
      </div>

      <template #footer>
        <div class="wizard-footer">
          <AppButton variant="secondary" @click="wizardBack">
            {{ wizardStep === 1 ? 'Vazgeç' : '← Geri' }}
          </AppButton>
          <span class="wizard-footer__counter">{{ wizardStep }} / {{ WIZARD_STEPS.length }} adım</span>
          <AppButton
            v-if="wizardStep < 4"
            variant="primary"
            :disabled="wizardContinueDisabled"
            @click="wizardNext"
          >
            Devam Et →
          </AppButton>
          <AppButton
            v-else
            variant="primary"
            :loading="createSaving"
            @click="submitCreate"
          >
            Randevu oluştur
          </AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { fetchAllPageContent, type ApiResponse } from '@/api/client'
import { appointmentApi, type AppointmentResponse, type AppointmentStatus } from '@/api/appointment'
import { employeeApi, type EmployeeResponse, type EmployeeCapabilityResponse } from '@/api/employee'
import { serviceApi, type ServiceResponse } from '@/api/service'
import { customerApi, type CustomerResponse, type PackageResponse } from '@/api/customer'
import { packageApi } from '@/api/customerPackage'
import { packageSessionApi, type PackageSessionResponse } from '@/api/packageSession'
import { publicApi, type AvailableSlotResponse } from '@/api/public'
import { businessApi } from '@/api/business'
import {
  Plus, X, RefreshCw,
  Check,
  PhoneCall, MapPin, CalendarX2,
  ChevronLeft, ChevronRight, CalendarCheck,
  User as UserIcon, Scissors, Clock as ClockIcon,
  Bell, Package as PackageIcon, Search,
} from 'lucide-vue-next'
import type { Component } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppDateField from '@/components/ui/AppDateField.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import StatusPill from '@/components/ui/StatusPill.vue'
import AppointmentDetailPanel from '@/components/appointments/AppointmentDetailPanel.vue'
import EmployeeFilterDropdown from '@/components/filters/EmployeeFilterDropdown.vue'
import { createStaffAppointmentSchema } from '@/validation/schemas'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const auth = useAuthStore()
const businessId = computed(() => auth.user?.businessId ?? null)
const businessSlug = ref<string | null>(null)
const maxAdvanceBookingDays = ref(60)

// ─── Sabitler ───────────────────────────────────────────────────────────────

const SOURCES = [
  { value: 'PHONE' as const, label: 'Telefon', icon: PhoneCall },
  { value: 'WALK_IN' as const, label: 'Yerinde', icon: MapPin },
]
const EMPLOYEE_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#06b6d4',
]
const STATUS_FILTER_VALUES: Array<AppointmentStatus | ''> = [
  '', 'PENDING', 'CONFIRMED', 'RISKY', 'COMPLETED', 'CANCELLED', 'NO_SHOW',
]

// ─── State ──────────────────────────────────────────────────────────────────

const isMobile = ref(window.innerWidth < 640)

const listLoading = ref(false)
const empLoading = ref(true)

const loading = computed(() => listLoading.value || empLoading.value)
const statusFilterRef = ref<HTMLDivElement | null>(null)

const appointments = ref<AppointmentResponse[]>([])
const employees = ref<EmployeeResponse[]>([])
const services = ref<ServiceResponse[]>([])
const customers = ref<CustomerResponse[]>([])

const listError = ref('')
const filterStart = ref('')
const filterEnd = ref('')
const filterStatus = ref<AppointmentStatus | ''>('')
const filterEmployee = ref<number | ''>('')

// ─── Master/Detail State ────────────────────────────────────────────────────

const selectedAppointmentId = ref<number | null>(null)
const detailModalOpen = ref(false)

const selectedAppointment = computed(() =>
  appointments.value.find((a) => a.id === selectedAppointmentId.value) ?? null,
)

const detailProps = computed(() => {
  const a = selectedAppointment.value
  if (!a) return { appointment: null, customerName: '', employeeName: '', serviceName: '' }
  return {
    appointment: a,
    customerName: resolveCustomerName(a.customerId),
    employeeName: resolveEmployeeName(a.employeeId),
    serviceName: resolveServiceName(a.serviceId),
    customerPhone: customerPhoneOf(a.customerId),
    employeeColor: employeeColor(a.employeeId),
    actingId: actingId.value,
    actingAction: actingAction.value,
    customerHasNoShow: customerNoShowMap.value.get(a.customerId) ?? false,
  }
})

// ─── Türetilen ──────────────────────────────────────────────────────────────

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
const employeeAppointmentCounts = computed(() => {
  const m = new Map<number, number>()
  for (const a of appointments.value) {
    m.set(a.employeeId, (m.get(a.employeeId) ?? 0) + 1)
  }
  return m
})

const hasActiveFilters = computed(() => !!(filterStatus.value || filterEmployee.value !== ''))

const filteredAppointments = computed(() => {
  let list = Array.isArray(appointments.value) ? appointments.value : []
  if (filterStatus.value) list = list.filter((a) => a.status === filterStatus.value)
  if (filterEmployee.value !== '') list = list.filter((a) => a.employeeId === filterEmployee.value)
  return list
})

const filteredTotal = computed(() => filteredAppointments.value.length)

const periodLabel = computed(() => {
  if (!filterStart.value && !filterEnd.value) return ''
  const fmt = (s: string) =>
    new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(new Date(s))
  if (filterStart.value && filterEnd.value)
    return `${fmt(filterStart.value)} – ${fmt(filterEnd.value)}`
  return filterStart.value || filterEnd.value
})

const groupedAppointments = computed(() => {
  const sorted = [...filteredAppointments.value].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  )
  const groups: Record<string, AppointmentResponse[]> = {}
  for (const a of sorted) {
    const key = a.scheduledAt.slice(0, 10)
    if (!groups[key]) groups[key] = []
    groups[key].push(a)
  }
  return groups
})

// ─── Status chip count'ları (prototype) ──────────────────────────────────────

const statusBaseCounts = computed(() => {
  const counts = new Map<AppointmentStatus, number>()
  let allCount = 0
  let base = appointments.value
  if (filterEmployee.value !== '') base = base.filter((a) => a.employeeId === filterEmployee.value)
  for (const a of base) {
    counts.set(a.status, (counts.get(a.status) ?? 0) + 1)
    allCount++
  }
  return { counts, allCount }
})

const statusChips = computed(() =>
  STATUS_FILTER_VALUES.map((value) => {
    const count =
      value === ''
        ? statusBaseCounts.value.allCount
        : statusBaseCounts.value.counts.get(value) ?? 0
    const labelKey = value === '' ? 'appointmentsView.filter.statusAll' : `appointmentStatus.${value}`
    return { value, label: t(labelKey), count }
  }),
)

const headerSubtitle = computed(() => {
  if (loading.value && filteredTotal.value === 0) return ''
  if (periodLabel.value) {
    return t('appointmentsView.summaryWithPeriod', {
      count: filteredTotal.value,
      period: periodLabel.value,
    })
  }
  return t('appointmentsView.summary', { count: filteredTotal.value })
})

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

function employeeColor(id: number): string {
  return EMPLOYEE_COLORS[id % EMPLOYEE_COLORS.length]
}
function resolveEmployeeName(id: number): string { return employeeMap.value.get(id) ?? `Çalışan #${id}` }
function resolveServiceName(id: number): string { return serviceMap.value.get(id) ?? `Hizmet #${id}` }
function resolveCustomerName(id: number): string { return customerMap.value.get(id) ?? `Müşteri #${id}` }
function canAct(a: AppointmentResponse): boolean { return ['PENDING', 'CONFIRMED', 'RISKY'].includes(a.status) }
function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('tr-TR', { timeStyle: 'short' }).format(new Date(iso))
}
function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
}
function formatDateGroupHeader(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000)
  if (diff === 0) return 'Bugün'
  if (diff === 1) return 'Yarın'
  if (diff === -1) return 'Dün'
  return new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }).format(d)
}

function selectAppointment(a: AppointmentResponse) {
  selectedAppointmentId.value = a.id
  if (isMobile.value) detailModalOpen.value = true
}

function closeDetail() {
  detailModalOpen.value = false
  if (isMobile.value) selectedAppointmentId.value = null
}

function customerPhoneOf(id: number): string | null {
  return customers.value.find((c) => c.id === id)?.phoneNumber ?? null
}

function handleMasterKeydown(event: KeyboardEvent, a: AppointmentResponse) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    selectAppointment(a)
  }
}

const MOBILE_BREAKPOINT_PX = 640
function syncIsMobile() {
  isMobile.value = window.innerWidth < MOBILE_BREAKPOINT_PX
}

onMounted(() => {
  window.addEventListener('resize', syncIsMobile)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', syncIsMobile)
})

watch(detailModalOpen, (open) => {
  if (!open && isMobile.value) selectedAppointmentId.value = null
})

watch(filteredAppointments, (list) => {
  if (
    selectedAppointmentId.value !== null &&
    !list.some((a) => a.id === selectedAppointmentId.value)
  ) {
    selectedAppointmentId.value = null
    detailModalOpen.value = false
  }
})

// ─── Veri yükleme ────────────────────────────────────────────────────────────

function setDefaultWeekRange() {
  const today = new Date()
  const dow = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() + (dow === 0 ? -6 : 1 - dow))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  filterStart.value = monday.toISOString().slice(0, 10)
  filterEnd.value = sunday.toISOString().slice(0, 10)
}

async function reloadList() {
  if (!businessId.value) return
  listLoading.value = true
  listError.value = ''
  try {
    const start = filterStart.value || undefined
    const end = filterEnd.value || undefined
    appointments.value =
      start && end
        ? await fetchAllPageContent((page, size) =>
            appointmentApi.list({ startDate: start, endDate: end, page, size }),
          )
        : await fetchAllPageContent((page, size) => appointmentApi.list({ page, size }))
  } catch {
    listError.value = t('appointmentsView.errorLoad')
  } finally {
    listLoading.value = false
  }
}

async function loadEmployeesAndServices() {
  if (!businessId.value) return
  empLoading.value = true
  try {
    const [emps, svcRes, custs, bizRes] = await Promise.all([
      fetchAllPageContent((page, size) => employeeApi.list({ activeOnly: true, page, size })),
      serviceApi.list({ activeOnly: true }),
      fetchAllPageContent((page, size) => customerApi.list({ page, size })),
      businessApi.getById(businessId.value),
    ])
    employees.value = emps
    services.value = svcRes.data.success && svcRes.data.data ? svcRes.data.data : []
    customers.value = custs
    if (bizRes.data.success && bizRes.data.data) {
      businessSlug.value = bizRes.data.data.slug
      maxAdvanceBookingDays.value = bizRes.data.data.maxAdvanceBookingDays
    }
  } catch {
    listError.value = t('appointmentsView.errorRefs')
  } finally {
    empLoading.value = false
  }
}

async function manualRefresh() {
  await reloadList()
}

watch([filterStart, filterEnd], () => {
  if (businessId.value) reloadList()
})

// ─── Aksiyonlar ──────────────────────────────────────────────────────────────

const actingId = ref<number | null>(null)
const actingAction = ref('')

async function confirmAppointment(id: number) {
  actingId.value = id; actingAction.value = 'confirm'
  try { await appointmentApi.confirm(id); await reloadList() }
  catch { listError.value = t('appointmentsView.errorConfirm') }
  finally { actingId.value = null; actingAction.value = '' }
}
async function completeAppointment(id: number) {
  actingId.value = id; actingAction.value = 'complete'
  try { await appointmentApi.complete(id); await reloadList() }
  catch { listError.value = t('appointmentsView.errorComplete') }
  finally { actingId.value = null; actingAction.value = '' }
}
async function markNoShow(a: AppointmentResponse) {
  actingId.value = a.id; actingAction.value = 'noshow'
  try {
    await appointmentApi.markNoShow(a.id)
    await reloadList()
    if (businessId.value) {
      customers.value = await fetchAllPageContent((page, size) => customerApi.list({ page, size }))
    }
  } catch { listError.value = t('appointmentsView.errorNoShow') }
  finally { actingId.value = null; actingAction.value = '' }
}

// ─── İptal ───────────────────────────────────────────────────────────────────

const showCancelModal = ref(false)
const cancelTarget = ref<AppointmentResponse | null>(null)
const cancelReason = ref('')
const cancelling = ref(false)

function openCancel(a: AppointmentResponse) { cancelTarget.value = a; cancelReason.value = ''; showCancelModal.value = true }
async function doCancel() {
  if (!cancelTarget.value) return
  cancelling.value = true
  try { await appointmentApi.cancel(cancelTarget.value.id, cancelReason.value || undefined); showCancelModal.value = false; await reloadList() }
  catch { listError.value = t('appointmentsView.errorCancel') }
  finally { cancelling.value = false }
}

// ─── Wizard — Yeni Randevu ───────────────────────────────────────────────────

interface WizardStepConfig {
  key: 'team' | 'date' | 'time' | 'customer'
  caption: string
  title: string
  subtitle: string
}

const WIZARD_STEPS: WizardStepConfig[] = [
  { key: 'team', caption: 'Çalışan & Hizmet', title: 'Çalışan ve hizmet seç', subtitle: 'Önce çalışanı, sonra sunduğu hizmeti seçin.' },
  { key: 'date', caption: 'Tarih', title: 'Uygun tarihi seç', subtitle: 'Yeşil işaretli günler müsait. İstediğiniz günü seçin.' },
  { key: 'time', caption: 'Saat', title: 'Müsait saat seç', subtitle: 'Seçtiğiniz günde dolu saatler çizik görünür.' },
  { key: 'customer', caption: 'Müşteri', title: 'Müşteri ve detaylar', subtitle: 'Mevcut bir müşteriyi seç ya da yeni müşteri oluştur.' },
]

type WizardChipTone = 'primary' | 'success' | 'info'
interface WizardSummaryChip {
  key: string
  icon: Component
  label: string
  tone: WizardChipTone
}

const showCreateModal = ref(false)
const wizardStep = ref(1)
const wizardForm = reactive({
  employeeId: '' as number | '',
  serviceId: '' as number | '',
  date: '',
  time: '',
  customerName: '',
  phoneNumber: '',
  source: 'PHONE' as 'PHONE' | 'WALK_IN',
  notes: '',
})
const wizardErrors = ref<Record<string, string>>({})
const createSubmitError = ref('')
const createSaving = ref(false)

// ─── Müşteri seçimi (adım 4) ─────────────────────────────────────────────────

const customerMode = ref<'existing' | 'new'>('existing')
const customerSearch = ref('')
const selectedExistingCustomer = ref<CustomerResponse | null>(null)

const filteredCustomersForWizard = computed(() => {
  const q = customerSearch.value.trim().toLowerCase()
  if (!q) return customers.value.slice(0, 20)
  return customers.value
    .filter(c => c.name.toLowerCase().includes(q) || c.phoneNumber.includes(q))
    .slice(0, 20)
})

// ─── Paket seans seçimi (adım 4) ─────────────────────────────────────────────

const customerPackagesForWizard = ref<PackageResponse[]>([])
const customerPackageSessions = ref<Record<number, PackageSessionResponse[]>>({})
const packagesLoadingForWizard = ref(false)
const selectedSessionId = ref<number | null>(null)

const eligiblePackages = computed(() =>
  customerPackagesForWizard.value.filter(p =>
    p.active &&
    !p.expired &&
    p.remainingSessions > 0 &&
    p.serviceId === wizardForm.serviceId
  )
)

const pendingSessionsForWizard = computed(() => {
  const result: Array<{ pkg: PackageResponse; session: PackageSessionResponse }> = []
  for (const pkg of eligiblePackages.value) {
    const sessions = customerPackageSessions.value[pkg.id] ?? []
    for (const s of sessions) {
      if (s.status === 'PENDING') {
        result.push({ pkg, session: s })
      }
    }
  }
  return result
})

async function loadPackagesForSelectedCustomer(customerId: number) {
  packagesLoadingForWizard.value = true
  selectedSessionId.value = null
  customerPackagesForWizard.value = []
  customerPackageSessions.value = {}
  try {
    const { data } = await packageApi.listByCustomer(customerId)
    if (data.success && data.data) {
      customerPackagesForWizard.value = data.data
      const eligible = data.data.filter(p =>
        p.active && !p.expired && p.remainingSessions > 0 && p.serviceId === wizardForm.serviceId
      )
      await Promise.all(
        eligible.map(async (p) => {
          try {
            const r = await packageSessionApi.listByPackage(p.id)
            if (r.data.success && r.data.data) {
              customerPackageSessions.value = { ...customerPackageSessions.value, [p.id]: r.data.data }
            }
          } catch { /* silent */ }
        })
      )
    }
  } catch { /* silent */ } finally {
    packagesLoadingForWizard.value = false
  }
}

function selectExistingCustomer(c: CustomerResponse) {
  selectedExistingCustomer.value = c
  selectedSessionId.value = null
  loadPackagesForSelectedCustomer(c.id)
}

function clearExistingCustomer() {
  selectedExistingCustomer.value = null
  selectedSessionId.value = null
  customerPackagesForWizard.value = []
  customerPackageSessions.value = {}
}

const wizardEmpCapabilities = ref<EmployeeCapabilityResponse[]>([])
const capabilitiesLoading = ref(false)

const capableServices = computed(() => {
  if (wizardForm.employeeId === '') return []
  const capableIds = new Set(
    wizardEmpCapabilities.value.filter((c) => c.active).map((c) => c.serviceId),
  )
  return services.value.filter((s) => capableIds.has(s.id))
})

const availableDates = ref<string[]>([])
const datesLoading = ref(false)
const availableSlots = ref<AvailableSlotResponse[]>([])
const slotsLoading = ref(false)

const calMonthIndex = ref(0)

const availableMonths = computed(() => {
  const seen = new Set<string>()
  const months: string[] = []
  for (const d of availableDates.value) {
    const m = d.slice(0, 7)
    if (!seen.has(m)) { seen.add(m); months.push(m) }
  }
  return months
})

const currentCalMonthLabel = computed(() => {
  const m = availableMonths.value[calMonthIndex.value]
  if (!m) return ''
  const [y, mo] = m.split('-').map(Number)
  return new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(new Date(y, mo - 1))
})

const calendarCells = computed(() => {
  const month = availableMonths.value[calMonthIndex.value]
  if (!month) return []
  const availableSet = new Set(availableDates.value)
  const [y, mo] = month.split('-').map(Number)
  const monthStart = new Date(y, mo - 1, 1)
  const monthEnd = new Date(y, mo, 0)
  let dow = monthStart.getDay()
  dow = dow === 0 ? 6 : dow - 1
  const cells: { iso: string | null; day: number; available: boolean; index: number }[] = []
  let idx = 0
  for (let i = 0; i < dow; i++) cells.push({ iso: null, day: 0, available: false, index: idx++ })
  const cur = new Date(monthStart)
  while (cur <= monthEnd) {
    const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
    cells.push({ iso, day: cur.getDate(), available: availableSet.has(iso), index: idx++ })
    cur.setDate(cur.getDate() + 1)
  }
  return cells
})

function empInitials(name: string | null | undefined): string {
  if (!name?.trim()) return '?'
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatDateFull(iso: string): string {
  if (!iso) return ''
  return new Intl.DateTimeFormat('tr-TR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso + 'T00:00:00'))
}

async function selectEmployee(empId: number) {
  wizardForm.employeeId = empId
  wizardForm.serviceId = ''
  wizardEmpCapabilities.value = []
  capabilitiesLoading.value = true
  try {
    const res = await employeeApi.getCapabilities(empId)
    if (res.data.success && res.data.data) wizardEmpCapabilities.value = res.data.data
  } catch { /* silent */ } finally {
    capabilitiesLoading.value = false
  }
}

async function loadAvailableDates() {
  if (!businessId.value) return
  datesLoading.value = true
  availableDates.value = []
  wizardForm.date = ''
  calMonthIndex.value = 0
  try {
    const slug = businessSlug.value
    if (!slug) return
    const daysAhead = maxAdvanceBookingDays.value
    const empId =
      wizardForm.employeeId === '' ? undefined : Number(wizardForm.employeeId)
    const res = await publicApi.getAvailableDates(
      slug,
      Number(wizardForm.serviceId),
      daysAhead,
      empId && !Number.isNaN(empId) ? empId : undefined,
    )
    if (res.data.success && res.data.data) availableDates.value = res.data.data
  } catch { /* silent */ } finally {
    datesLoading.value = false
  }
}

async function loadAvailableSlots() {
  if (!businessId.value) return
  slotsLoading.value = true
  availableSlots.value = []
  wizardForm.time = ''
  try {
    const slug = businessSlug.value
    if (!slug) return
    const empId =
      wizardForm.employeeId === '' ? undefined : Number(wizardForm.employeeId)
    const res = await publicApi.getAvailableSlots(
      slug,
      Number(wizardForm.serviceId),
      wizardForm.date,
      empId && !Number.isNaN(empId) ? empId : undefined,
    )
    if (res.data.success && res.data.data) availableSlots.value = res.data.data
  } catch { /* silent */ } finally {
    slotsLoading.value = false
  }
}

async function wizardNext() {
  wizardErrors.value = {}
  if (wizardStep.value === 1) {
    if (wizardForm.employeeId === '') { wizardErrors.value.employeeId = 'Çalışan seçin'; return }
    if (wizardForm.serviceId === '') { wizardErrors.value.serviceId = 'Hizmet seçin'; return }
    await loadAvailableDates()
    wizardStep.value = 2
  } else if (wizardStep.value === 2) {
    if (!wizardForm.date) { wizardErrors.value.date = 'Tarih seçin'; return }
    await loadAvailableSlots()
    wizardStep.value = 3
  } else if (wizardStep.value === 3) {
    if (!wizardForm.time) { wizardErrors.value.time = 'Saat seçin'; return }
    wizardStep.value = 4
  }
}

function wizardBack() {
  if (wizardStep.value === 1) {
    showCreateModal.value = false
  } else {
    wizardStep.value--
  }
}

const selectedServiceForWizard = computed(() => {
  if (wizardForm.serviceId === '') return null
  return services.value.find((s) => s.id === Number(wizardForm.serviceId)) ?? null
})

const selectedSlotDurationMinutes = computed(() => {
  if (!wizardForm.time) return null
  const slot = availableSlots.value.find((s) => s.startTime === wizardForm.time)
  return slot?.durationMinutes ?? null
})

function formatShortDate(iso: string): string {
  if (!iso) return ''
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(new Date(iso + 'T00:00:00'))
}

const wizardSummaryChips = computed<WizardSummaryChip[]>(() => {
  const chips: WizardSummaryChip[] = []
  if (wizardStep.value >= 2 && wizardForm.employeeId !== '') {
    chips.push({
      key: 'employee',
      icon: UserIcon,
      label: resolveEmployeeName(Number(wizardForm.employeeId)),
      tone: 'success',
    })
  }
  if (wizardStep.value >= 2 && wizardForm.serviceId !== '') {
    chips.push({
      key: 'service',
      icon: Scissors,
      label: resolveServiceName(Number(wizardForm.serviceId)),
      tone: 'success',
    })
  }
  if (wizardStep.value >= 3 && wizardForm.date) {
    chips.push({
      key: 'date',
      icon: CalendarCheck,
      label: formatShortDate(wizardForm.date),
      tone: 'success',
    })
  }
  if (wizardStep.value >= 4 && wizardForm.time) {
    chips.push({
      key: 'time',
      icon: ClockIcon,
      label: wizardForm.time.slice(11, 16),
      tone: 'success',
    })
  }
  return chips
})

const wizardContinueDisabled = computed(() => {
  if (datesLoading.value || slotsLoading.value) return true
  if (wizardStep.value === 1) return wizardForm.employeeId === '' || wizardForm.serviceId === ''
  if (wizardStep.value === 2) return !wizardForm.date
  if (wizardStep.value === 3) return !wizardForm.time
  return false
})

function openCreate(opts: { date?: string } = {}) {
  wizardStep.value = 1
  wizardForm.employeeId = ''
  wizardForm.serviceId = ''
  wizardForm.date = opts.date && /^\d{4}-\d{2}-\d{2}$/.test(opts.date) ? opts.date : ''
  wizardForm.time = ''
  wizardForm.customerName = ''
  wizardForm.phoneNumber = ''
  wizardForm.source = 'PHONE'
  wizardForm.notes = ''
  wizardErrors.value = {}
  createSubmitError.value = ''
  wizardEmpCapabilities.value = []
  availableDates.value = []
  availableSlots.value = []
  calMonthIndex.value = 0
  customerMode.value = 'existing'
  customerSearch.value = ''
  selectedExistingCustomer.value = null
  selectedSessionId.value = null
  customerPackagesForWizard.value = []
  customerPackageSessions.value = {}
  showCreateModal.value = true
  if (!employees.value.length || !services.value.length) loadEmployeesAndServices()
}

/** Backend LocalDateTime + @Future sunucu yerel saatiyle uyumlu; toISOString UTC kaydırır. */
function toLocalDateTimeApiString(date: string, time: string): string {
  const t = time.trim()
  const withSeconds = t.length === 5 ? `${t}:00` : t
  return `${date}T${withSeconds}`
}

async function submitCreate() {
  if (!businessId.value) return
  wizardErrors.value = {}
  createSubmitError.value = ''

  if (customerMode.value === 'existing') {
    if (!selectedExistingCustomer.value) {
      wizardErrors.value.customer = 'Müşteri seçin veya yeni müşteri moduna geçin'
      return
    }
  } else {
    const phoneDigits = wizardForm.phoneNumber.replaceAll(/\D/g, '')
    const result = createStaffAppointmentSchema.pick({ customerName: true, phoneNumber: true }).safeParse({
      customerName: wizardForm.customerName.trim(),
      phoneNumber: phoneDigits,
    })
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0]
        if (key === 'customerName' || key === 'phoneNumber') {
          if (!wizardErrors.value[key]) wizardErrors.value[key] = issue.message
        }
      }
      return
    }
  }

  createSaving.value = true
  try {
    let createdAppointment: AppointmentResponse

    if (customerMode.value === 'existing' && selectedExistingCustomer.value) {
      const { data } = await appointmentApi.create({
        customerId: selectedExistingCustomer.value.id,
        employeeId: Number(wizardForm.employeeId),
        serviceId: Number(wizardForm.serviceId),
        scheduledAt: wizardForm.time.slice(0, 19),
        notes: wizardForm.notes.trim() || undefined,
        source: wizardForm.source,
      })
      if (!data.success || !data.data) throw new Error(data.error?.message ?? 'Randevu oluşturulamadı.')
      createdAppointment = data.data
    } else {
      const { data } = await appointmentApi.createStaff({
        employeeId: Number(wizardForm.employeeId),
        serviceId: Number(wizardForm.serviceId),
        scheduledAt: wizardForm.time.slice(0, 19),
        customerName: wizardForm.customerName.trim(),
        phoneNumber: wizardForm.phoneNumber.trim(),
        phoneCountryCode: '+90',
        notes: wizardForm.notes.trim() || undefined,
        source: wizardForm.source,
      })
      if (!data.success || !data.data) throw new Error(data.error?.message ?? 'Randevu oluşturulamadı.')
      createdAppointment = data.data
    }

    if (selectedSessionId.value !== null) {
      const pkg = eligiblePackages.value.find(p =>
        (customerPackageSessions.value[p.id] ?? []).some(s => s.id === selectedSessionId.value)
      )
      if (pkg) {
        try {
          await packageSessionApi.assign(pkg.id, selectedSessionId.value, { appointmentId: createdAppointment.id })
        } catch { /* seans ataması başarısız olsa bile randevu oluşturuldu */ }
      }
    }

    showCreateModal.value = false
    await reloadList()
  } catch (e: unknown) {
    const data = (e as { response?: { data?: ApiResponse<unknown> } }).response?.data
    createSubmitError.value = data?.error?.message ?? (e instanceof Error ? e.message : 'Randevu oluşturulamadı.')
  } finally {
    createSaving.value = false
  }
}

// ─── Mount + Query Param Handling ───────────────────────────────────────────

function applyQueryParams() {
  const q = route.query
  const focus = typeof q.focus === 'string' ? q.focus : null
  const newAppt = typeof q.new === 'string' ? q.new : null
  const dateParam = typeof q.date === 'string' ? q.date : null
  const statusParam = typeof q.status === 'string' ? q.status.toUpperCase() : null

  if (statusParam && (STATUS_FILTER_VALUES as string[]).includes(statusParam)) {
    filterStatus.value = statusParam as AppointmentStatus
  }

  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    filterStart.value = dateParam
    filterEnd.value = dateParam
  }

  if (newAppt === '1') {
    openCreate({ date: dateParam ?? undefined })
  }

  if (focus === 'filter') {
    setTimeout(() => statusFilterRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  if (focus || newAppt || dateParam || statusParam) {
    void router.replace({ path: route.path, query: {} })
  }
}

onMounted(async () => {
  if (businessId.value) {
    setDefaultWeekRange()
    await loadEmployeesAndServices()
    await reloadList()
    applyQueryParams()
  }
})
</script>

<style scoped>
/* ─── Status filter chips (prototype) ──────────────────────────────────── */
.status-chip-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--r-full);
  border: 1px solid var(--hairline);
  background: var(--surface);
  color: var(--ink-2);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  min-height: 32px;
}

.status-chip:hover {
  background: var(--surface-2);
  color: var(--ink-1);
}

.status-chip:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.status-chip--active {
  background: var(--primary-tint);
  color: var(--primary);
  border-color: var(--primary);
}

.status-chip__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  background: var(--surface-2);
  color: var(--ink-3);
  border-radius: var(--r-full);
}

.status-chip--active .status-chip__count {
  background: color-mix(in srgb, var(--primary) 18%, transparent);
  color: var(--primary);
}

.status-chip-spacer {
  flex: 1;
  min-width: 8px;
}

.status-chip-meta {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-field__label {
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-4);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ─── Appointment table (prototype) ───────────────────────────────────── */
.appointment-table-card {
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--r-lg);
  overflow: hidden;
  box-shadow: var(--shadow-1);
}

.appointment-table-scroll {
  overflow-x: auto;
}

.appointment-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.appointment-table thead th {
  text-align: left;
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 700;
  color: var(--ink-4);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: var(--surface-2);
  border-bottom: 1px solid var(--hairline);
  white-space: nowrap;
}

.appointment-table__th-right {
  text-align: right;
}

.appointment-table__group td {
  padding: 14px 16px 6px;
  background: var(--surface);
  border-top: 1px solid var(--hairline);
  font-size: 11px;
  font-weight: 700;
  color: var(--ink-4);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.appointment-table__group:first-child td {
  border-top: 0;
}

.appointment-table__group-label {
  margin-right: 12px;
}

.appointment-table__group-count {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--r-full);
  background: var(--surface-2);
  color: var(--ink-3);
  font-size: 11px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
}

.appointment-row {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.appointment-row:hover {
  background: var(--surface-2);
}

.appointment-row--selected {
  background: var(--primary-tint);
}

.appointment-row:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: -2px;
}

.appointment-row td {
  padding: 12px 16px;
  border-top: 1px solid var(--hairline);
  vertical-align: middle;
}

.appointment-row__time {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-weight: 700;
  color: var(--ink-1);
  font-size: 13.5px;
  font-variant-numeric: tabular-nums;
}

.appointment-row__date-mini {
  font-size: 10.5px;
  color: var(--ink-4);
  font-weight: 600;
  margin-top: 2px;
}

.appointment-row__customer {
  display: flex;
  align-items: center;
  gap: 10px;
}

.appointment-row__avatar {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--r-full);
  color: #fff;
  font-weight: 700;
  font-size: 12px;
}

.appointment-row__customer-name {
  font-weight: 600;
  color: var(--ink-1);
  line-height: 1.2;
}

.appointment-row__customer-phone {
  font-size: 11px;
  color: var(--ink-4);
  margin-top: 2px;
  font-variant-numeric: tabular-nums;
}

.appointment-row__service {
  color: var(--ink-2);
}

.appointment-row__employee {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--ink-3);
}

.appointment-row__employee-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.appointment-row__duration {
  text-align: right;
  font-family: var(--font-mono, ui-monospace, monospace);
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 768px) {
  .appointment-table thead th,
  .appointment-row td,
  .appointment-table__group td {
    padding: 10px 12px;
  }

  .status-chip-meta {
    width: 100%;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Wizard — Yeni Randevu                                                  */
/* ═══════════════════════════════════════════════════════════════════════ */

.wizard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ─ Stepper ─ */
.wizard-stepper {
  list-style: none;
  margin: 0;
  padding: 4px 0 14px;
  display: flex;
  align-items: flex-start;
  gap: 0;
  border-bottom: 1px solid var(--hairline);
}

.wizard-stepper__item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.wizard-stepper__marker {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.wizard-stepper__circle {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: var(--r-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  background: var(--surface-2);
  color: var(--ink-4);
  border: 1px solid var(--hairline);
  transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}

.wizard-stepper__item--active .wizard-stepper__circle {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 18%, transparent);
}

.wizard-stepper__item--done .wizard-stepper__circle {
  background: var(--success);
  color: #fff;
  border-color: var(--success);
}

.wizard-stepper__meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.1;
}

.wizard-stepper__caption {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--ink-4);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.wizard-stepper__label {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-3);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wizard-stepper__item--active .wizard-stepper__label,
.wizard-stepper__item--done .wizard-stepper__label {
  color: var(--ink-1);
}

.wizard-stepper__line {
  flex: 1;
  height: 2px;
  background: var(--hairline);
  border-radius: 2px;
  min-width: 12px;
}

.wizard-stepper__line--done {
  background: var(--success);
}

/* ─ Summary chips ─ */
.wizard-summary {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.wizard-summary__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--r-full);
  font-size: 12px;
  font-weight: 600;
  border: 1px solid transparent;
  max-width: 100%;
}

.wizard-summary__chip[data-tone="success"] {
  background: var(--success-tint);
  color: var(--success);
}

.wizard-summary__chip[data-tone="primary"] {
  background: var(--primary-tint);
  color: var(--primary);
}

.wizard-summary__chip[data-tone="info"] {
  background: var(--info-tint, color-mix(in srgb, var(--primary) 10%, transparent));
  color: var(--primary);
}

.wizard-summary__chip > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ─ Section head ─ */
.wizard-section__head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.wizard-section__title {
  font-family: var(--font-display, inherit);
  font-size: 20px;
  font-weight: 700;
  color: var(--ink-1);
  line-height: 1.2;
  margin: 0;
}

.wizard-section__subtitle {
  font-size: 13px;
  color: var(--ink-3);
  margin: 0;
}

/* ─ Body ─ */
.wizard-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.wizard-center {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}

.wizard-spinner {
  width: 28px;
  height: 28px;
  border-radius: var(--r-full);
  border: 2px solid var(--hairline);
  border-top-color: var(--primary);
  animation: wizard-spin 0.7s linear infinite;
}

@keyframes wizard-spin {
  to { transform: rotate(360deg); }
}

.wizard-alert {
  padding: 14px 16px;
  border-radius: var(--r-md);
  border: 1px solid color-mix(in srgb, var(--warning) 40%, transparent);
  background: var(--warning-tint);
  color: var(--warning);
  font-size: 13px;
  text-align: center;
}

/* ─ Field ─ */
.wizard-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wizard-field__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-2);
}

.wizard-field__label-hint {
  font-weight: 400;
  color: var(--ink-4);
  margin-left: 4px;
}

.wizard-field__required {
  color: var(--danger);
}

.wizard-field__hint {
  font-size: 12px;
  color: var(--ink-3);
}

.wizard-field__hint--muted {
  color: var(--ink-4);
}

.wizard-field__hint--warning {
  padding: 10px 12px;
  border-radius: var(--r-md);
  background: var(--warning-tint);
  color: var(--warning);
}

.wizard-field__cta {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  align-items: flex-start;
}

.wizard-field__link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary);
  text-decoration: none;
  transition: opacity 0.2s;
}

.wizard-field__link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.wizard-field__error {
  font-size: 12px;
  color: var(--danger);
}

/* ─ Skeleton ─ */
.wizard-skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wizard-skeleton__row {
  height: 44px;
  background: var(--surface-2);
  border-radius: var(--r-md);
  animation: wizard-pulse 1.4s ease-in-out infinite;
}

.wizard-skeleton__row--sm {
  height: 36px;
}

@keyframes wizard-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}

/* ─ Pick grid (employee + service) ─ */
.wizard-pick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

@media (max-width: 560px) {
  .wizard-pick-grid {
    grid-template-columns: 1fr;
  }
}

.wizard-pick {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--r-lg);
  border: 1px solid var(--hairline);
  background: var(--surface);
  color: var(--ink-2);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
  min-height: 52px;
}

.wizard-pick:hover {
  border-color: var(--hairline-strong);
  background: var(--surface-2);
}

.wizard-pick:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.wizard-pick--active {
  border-color: var(--primary);
  background: var(--primary-tint);
  color: var(--ink-1);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 22%, transparent);
}

.wizard-pick__avatar {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--r-full);
  color: #fff;
  font-weight: 700;
  font-size: 12.5px;
  letter-spacing: 0.02em;
}

.wizard-pick__avatar--sm {
  width: 30px;
  height: 30px;
  font-size: 11.5px;
}

.wizard-pick__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.wizard-pick__title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wizard-pick__hint {
  font-size: 11.5px;
  color: var(--ink-4);
}

.wizard-pick--active .wizard-pick__hint {
  color: var(--primary);
}

.wizard-pick__check {
  flex-shrink: 0;
  color: var(--primary);
}

/* ─ Calendar ─ */
.wizard-calendar {
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--r-lg);
  padding: 14px;
  box-shadow: var(--shadow-1);
}

.wizard-calendar__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.wizard-calendar__nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--r-md);
  border: 0;
  background: transparent;
  color: var(--ink-3);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.wizard-calendar__nav-btn:hover:not(:disabled) {
  background: var(--surface-2);
  color: var(--ink-1);
}

.wizard-calendar__nav-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.wizard-calendar__nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.wizard-calendar__month {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink-1);
  text-transform: capitalize;
}

.wizard-calendar__days {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  text-align: center;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-4);
  margin-bottom: 4px;
}

.wizard-calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
}

.wizard-calendar__cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 0;
  border-radius: var(--r-md);
  background: transparent;
  border: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-1);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.wizard-calendar__cell--disabled {
  color: var(--ink-4);
  opacity: 0.35;
  cursor: not-allowed;
}

.wizard-calendar__cell--available:hover {
  background: var(--primary-tint);
  color: var(--primary);
}

.wizard-calendar__cell--active,
.wizard-calendar__cell--active:hover {
  background: var(--primary);
  color: #fff;
  box-shadow: var(--shadow-1);
}

.wizard-calendar__cell:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.wizard-calendar__dot {
  width: 4px;
  height: 4px;
  border-radius: var(--r-full);
  background: var(--success);
}

.wizard-calendar__cell--active .wizard-calendar__dot {
  background: rgba(255, 255, 255, 0.7);
}

/* ─ Inline confirm + context ─ */
.wizard-inline-confirm {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--r-md);
  background: var(--primary-tint);
  color: var(--primary);
  font-size: 13px;
  font-weight: 600;
  align-self: flex-start;
}

.wizard-inline-confirm__sep {
  color: var(--ink-4);
  font-weight: 400;
}

.wizard-context {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border-radius: var(--r-md);
  background: var(--surface-2);
  color: var(--ink-3);
  font-size: 12.5px;
}

.wizard-context__strong {
  color: var(--ink-1);
  font-weight: 600;
}

.wizard-context__sep {
  color: var(--ink-4);
}

/* ─ Slot grid (6-col like prototype) ─ */
.wizard-slots {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
}

@media (max-width: 560px) {
  .wizard-slots {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.wizard-slot {
  padding: 10px 0;
  text-align: center;
  border-radius: var(--r-md);
  border: 1px solid var(--hairline-strong);
  background: var(--surface);
  color: var(--ink-1);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}

.wizard-slot:hover {
  border-color: var(--primary);
  background: var(--primary-tint);
  color: var(--primary);
}

.wizard-slot--active,
.wizard-slot--active:hover {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
  box-shadow: var(--shadow-1);
}

.wizard-slot:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* ─ Info cards ─ */
.wizard-info-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

@media (max-width: 560px) {
  .wizard-info-cards {
    grid-template-columns: 1fr;
  }
}

.wizard-info-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: var(--r-lg);
  border: 1px solid var(--hairline);
  background: var(--surface);
}

.wizard-info-card__icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--r-md);
}

.wizard-info-card__icon--info {
  background: color-mix(in srgb, #3b82f6 12%, transparent);
  color: #3b82f6;
}

.wizard-info-card__icon--purple {
  background: color-mix(in srgb, #8b5cf6 14%, transparent);
  color: #8b5cf6;
}

.wizard-info-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.wizard-info-card__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-1);
}

.wizard-info-card__hint {
  font-size: 11.5px;
  color: var(--ink-3);
}

.wizard-info-card__badge {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: var(--r-full);
  background: var(--primary-tint);
  color: var(--primary);
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ─ Tabs ─ */
.wizard-tabs {
  display: flex;
  gap: 8px;
}

.wizard-tab {
  flex: 1;
  padding: 10px 14px;
  border-radius: var(--r-lg);
  border: 1px solid var(--hairline);
  background: var(--surface);
  color: var(--ink-3);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}

.wizard-tab:hover {
  background: var(--surface-2);
  color: var(--ink-1);
}

.wizard-tab:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.wizard-tab--active,
.wizard-tab--active:hover {
  border-color: var(--primary);
  background: var(--primary-tint);
  color: var(--primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 18%, transparent);
}

/* ─ Search ─ */
.wizard-search {
  position: relative;
}

.wizard-search__icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-4);
  pointer-events: none;
}

.wizard-search__input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border-radius: var(--r-lg);
  border: 1px solid var(--hairline);
  background: var(--surface);
  color: var(--ink-1);
  font-size: 13.5px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.wizard-search__input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 18%, transparent);
}

/* ─ Selected customer + list ─ */
.wizard-selected-customer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--r-lg);
  border: 1px solid var(--primary);
  background: var(--primary-tint);
}

.wizard-selected-customer__body {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.wizard-selected-customer__name {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink-1);
  margin: 0;
}

.wizard-selected-customer__phone {
  font-size: 12px;
  color: var(--primary);
  margin: 2px 0 0;
}

.wizard-selected-customer__change {
  padding: 6px 10px;
  border-radius: var(--r-md);
  background: transparent;
  border: 0;
  color: var(--primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.wizard-selected-customer__change:hover {
  background: var(--surface);
}

.wizard-customer-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid var(--hairline);
  border-radius: var(--r-lg);
  background: var(--surface);
}

.wizard-customer-list__empty {
  padding: 16px;
  text-align: center;
  color: var(--ink-4);
  font-size: 13px;
}

.wizard-customer-list__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  border-top: 1px solid var(--hairline);
  transition: background-color 0.12s ease;
}

.wizard-customer-list__item:first-child {
  border-top: 0;
}

.wizard-customer-list__item:hover {
  background: var(--surface-2);
}

.wizard-customer-list__info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.wizard-customer-list__name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink-1);
  margin: 0;
}

.wizard-customer-list__phone {
  font-size: 11.5px;
  color: var(--ink-4);
  margin: 2px 0 0;
}

.wizard-tag {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: var(--r-full);
  font-size: 11px;
  font-weight: 700;
}

.wizard-tag--danger {
  background: var(--danger-tint);
  color: var(--danger);
}

.wizard-tag--warning {
  background: var(--warning-tint);
  color: var(--warning);
}

.wizard-tag--info {
  background: var(--primary-tint);
  color: var(--primary);
}

/* ─ Session list ─ */
.wizard-session-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wizard-session {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--r-lg);
  border: 1px solid var(--hairline);
  background: var(--surface);
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.wizard-session:hover {
  background: var(--surface-2);
}

.wizard-session--active {
  border-color: var(--primary);
  background: var(--primary-tint);
}

.wizard-session__radio {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: var(--r-full);
  border: 2px solid var(--hairline-strong);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.wizard-session--active .wizard-session__radio {
  border-color: var(--primary);
  background: var(--primary);
}

.wizard-session__radio-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--r-full);
  background: #fff;
}

.wizard-session__label {
  font-size: 13px;
  color: var(--ink-2);
}

.wizard-session__info {
  flex: 1;
  min-width: 0;
}

.wizard-session__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-1);
  margin: 0;
}

.wizard-session__hint {
  font-size: 11.5px;
  color: var(--ink-4);
  margin: 2px 0 0;
}

/* ─ Forms ─ */
.wizard-form-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 560px) {
  .wizard-form-grid {
    grid-template-columns: 1fr;
  }
}

.wizard-input,
.wizard-textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--r-md);
  border: 1px solid var(--hairline);
  background: var(--surface);
  color: var(--ink-1);
  font-size: 13.5px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  font-family: inherit;
}

.wizard-textarea {
  resize: vertical;
  min-height: 60px;
}

.wizard-input:focus,
.wizard-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 18%, transparent);
}

.wizard-source-row {
  display: flex;
  gap: 8px;
}

.wizard-source {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: var(--r-md);
  border: 1px solid var(--hairline);
  background: var(--surface);
  color: var(--ink-3);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}

.wizard-source:hover {
  background: var(--surface-2);
  color: var(--ink-1);
}

.wizard-source--active,
.wizard-source--active:hover {
  border-color: var(--primary);
  background: var(--primary-tint);
  color: var(--primary);
}

/* ─ Footer ─ */
.wizard-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.wizard-footer__counter {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 560px) {
  .wizard-stepper {
    gap: 0;
    overflow-x: auto;
    padding-bottom: 8px;
  }

  .wizard-stepper__meta {
    display: none;
  }

  .wizard-stepper__item {
    flex: 0 0 auto;
    gap: 6px;
  }

  .wizard-stepper__line {
    min-width: 24px;
  }

  .wizard-footer__counter {
    display: none;
  }
}
</style>
