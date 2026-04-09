<template>
  <div class="space-y-4">
    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="page-title">Randevular</h1>
        <p v-if="filteredTotal > 0 || !loading" class="mt-1 text-sm text-slate-500">
          {{ filteredTotal }} randevu<span v-if="view === 'list' && periodLabel"> · {{ periodLabel }}</span>
        </p>
      </div>
      <div class="flex shrink-0 flex-wrap items-center gap-2">
        <div
          class="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
          role="tablist"
          aria-label="Görünüm"
        >
          <button
            v-for="v in VIEWS"
            :key="v.value"
            role="tab"
            :aria-selected="view === v.value"
            class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            :class="view === v.value ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'"
            @click="switchView(v.value)"
          >
            <component :is="v.icon" class="size-4" aria-hidden="true" />
            {{ v.label }}
          </button>
        </div>
        <AppButton variant="primary" @click="openCreate">
          <Plus class="size-4" aria-hidden="true" />
          Yeni randevu
        </AppButton>
      </div>
    </header>

    <div
      v-if="!businessId"
      class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      İşletme bilgisi bulunamadı.
    </div>

    <template v-else>
      <!-- ── Hata bandı ─────────────────────────────────────────────── -->
      <div
        v-if="listError"
        class="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        role="alert"
      >
        <span>{{ listError }}</span>
        <AppButton variant="secondary" size="sm" @click="manualRefresh">Yeniden dene</AppButton>
      </div>

      <!-- ══════════════════════════════════════════════════════════════ -->
      <!-- TAKVİM GÖRÜNÜMÜ                                               -->
      <!-- ══════════════════════════════════════════════════════════════ -->
      <div v-if="view === 'calendar'" class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <!-- Toolbar -->
        <div class="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-2.5">
          <!-- Navigasyon -->
          <div class="flex items-center gap-1">
            <button
              aria-label="Önceki"
              class="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              @click="calPrev"
            >
              <ChevronLeft class="size-4" aria-hidden="true" />
            </button>
            <button
              class="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              @click="calToday"
            >
              Bugün
            </button>
            <button
              aria-label="Sonraki"
              class="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              @click="calNext"
            >
              <ChevronRight class="size-4" aria-hidden="true" />
            </button>
          </div>

          <!-- Başlık -->
          <span class="min-w-0 flex-1 truncate text-center text-sm font-semibold capitalize text-slate-800">
            {{ calendarTitle }}
          </span>

          <!-- Durum filtresi -->
          <select
            v-model="filterStatus"
            class="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            <option value="">Tüm durumlar</option>
            <option value="PENDING">Beklemede</option>
            <option value="CONFIRMED">Onaylı</option>
            <option value="RISKY">Riskli</option>
            <option value="COMPLETED">Tamamlandı</option>
            <option value="CANCELLED">İptal</option>
            <option value="NO_SHOW">Gelmedi</option>
          </select>

          <!-- Ay / Hafta / Gün -->
          <div
            class="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5"
            role="tablist"
          >
            <button
              v-for="cv in CALENDAR_VIEWS"
              :key="cv.value"
              role="tab"
              :aria-selected="calendarView === cv.value"
              class="rounded-md px-2.5 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              :class="calendarView === cv.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'"
              @click="setCalView(cv.value)"
            >
              {{ cv.label }}
            </button>
          </div>
        </div>

        <!-- Çalışan satırı -->
        <div
          v-if="employees.length"
          class="flex items-center gap-1.5 overflow-x-auto border-b border-slate-100 px-3 py-2 scrollbar-none"
          role="group"
          aria-label="Çalışana göre filtrele"
        >
          <!-- Tümü -->
          <button
            class="flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition"
            :class="filterEmployee === '' ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'"
            @click="filterEmployee = ''"
          >
            <Users class="size-3.5" aria-hidden="true" />
            Tümü
            <span
              class="rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold tabular-nums"
              :class="filterEmployee === '' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'"
            >{{ appointments.length }}</span>
          </button>

          <!-- Per employee -->
          <button
            v-for="emp in employees"
            :key="emp.id"
            class="flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition"
            :class="filterEmployee === emp.id ? 'border-transparent' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'"
            :style="filterEmployee === emp.id ? { backgroundColor: employeeColor(emp.id) + '18', borderColor: employeeColor(emp.id), color: employeeColor(emp.id) } : {}"
            @click="filterEmployee = filterEmployee === emp.id ? '' : emp.id"
          >
            <span
              class="flex size-4 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-bold text-white"
              :style="{ backgroundColor: employeeColor(emp.id) }"
              aria-hidden="true"
            >{{ emp.name.charAt(0) }}</span>
            {{ emp.name.split(' ')[0] }}
            <span
              class="rounded-full px-1 text-[0.6rem] font-bold tabular-nums"
              :style="filterEmployee === emp.id ? { backgroundColor: employeeColor(emp.id) + '30', color: employeeColor(emp.id) } : { backgroundColor: '#f1f5f9', color: '#94a3b8' }"
            >{{ employeeAppointmentCounts.get(emp.id) ?? 0 }}</span>
          </button>
        </div>

        <!-- Yükleniyor iskeleti (çalışanlar henüz gelmedi) -->
        <div v-else-if="empLoading" class="flex gap-2 border-b border-slate-100 px-3 py-2">
          <div v-for="i in 4" :key="i" class="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
        </div>

        <!-- Takvim gövdesi — HER ZAMAN RENDER EDİLİR -->
        <div class="relative">
          <!-- Yükleme örtüsü (non-blocking) -->
          <div
            v-if="calendarLoading"
            class="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden rounded-full bg-slate-100"
          >
            <div class="h-full w-1/2 animate-[slide_1.2s_ease-in-out_infinite] bg-indigo-400" />
          </div>
          <FullCalendar
            ref="calendarRef"
            class="calendar-shell px-2 pb-2 pt-1"
            :options="calendarOptions"
          />
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════ -->
      <!-- LİSTE GÖRÜNÜMÜ                                                -->
      <!-- ══════════════════════════════════════════════════════════════ -->
      <template v-else>
        <!-- Filtre çubuğu -->
        <div class="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <label class="flex min-w-[8rem] flex-col gap-1">
            <span class="text-xs font-medium text-slate-500">Başlangıç</span>
            <AppDateField v-model="filterStart" />
          </label>
          <label class="flex min-w-[8rem] flex-col gap-1">
            <span class="text-xs font-medium text-slate-500">Bitiş</span>
            <AppDateField v-model="filterEnd" />
          </label>
          <label class="flex min-w-[9rem] flex-col gap-1">
            <span class="text-xs font-medium text-slate-500">Durum</span>
            <select
              v-model="filterStatus"
              class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              <option value="">Tüm durumlar</option>
              <option value="PENDING">Beklemede</option>
              <option value="CONFIRMED">Onaylı</option>
              <option value="RISKY">Riskli</option>
              <option value="COMPLETED">Tamamlandı</option>
              <option value="CANCELLED">İptal</option>
              <option value="NO_SHOW">Gelmedi</option>
            </select>
          </label>
          <div class="ml-auto flex items-end gap-2">
            <AppButton v-if="hasActiveFilters" variant="ghost" size="sm" @click="clearFilters">
              <X class="size-3.5" aria-hidden="true" />
              Temizle
            </AppButton>
            <AppButton variant="secondary" size="sm" :loading="listLoading" @click="manualRefresh">
              <RefreshCw class="size-3.5" aria-hidden="true" />
              Yenile
            </AppButton>
          </div>
        </div>

        <!-- Çalışan chip'leri -->
        <div
          v-if="employees.length"
          class="flex flex-wrap gap-2"
          role="group"
          aria-label="Çalışana göre filtrele"
        >
          <button
            class="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition"
            :class="filterEmployee === '' ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'"
            @click="filterEmployee = ''"
          >
            <Users class="size-3.5" aria-hidden="true" />
            Tüm çalışanlar
            <span
              v-if="filterEmployee === ''"
              class="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[0.6rem] font-bold text-indigo-600"
            >{{ filteredAppointments.length }}</span>
          </button>
          <button
            v-for="emp in employees"
            :key="emp.id"
            class="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition"
            :class="filterEmployee !== emp.id ? 'border-slate-200 bg-white text-slate-500 hover:border-slate-300' : 'border-transparent'"
            :style="filterEmployee === emp.id ? { backgroundColor: employeeColor(emp.id) + '18', borderColor: employeeColor(emp.id), color: employeeColor(emp.id) } : {}"
            @click="filterEmployee = filterEmployee === emp.id ? '' : emp.id"
          >
            <span
              class="flex size-5 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-bold text-white"
              :style="{ backgroundColor: employeeColor(emp.id) }"
              aria-hidden="true"
            >{{ emp.name.charAt(0) }}</span>
            {{ emp.name }}
            <span
              v-if="filterEmployee === emp.id"
              class="rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold"
              :style="{ backgroundColor: employeeColor(emp.id) + '30', color: employeeColor(emp.id) }"
            >{{ filteredAppointments.length }}</span>
          </button>
        </div>

        <!-- Liste iskeleti -->
        <div v-if="listLoading && appointments.length === 0" class="space-y-3">
          <div v-for="i in 5" :key="i" class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <AppSkeleton variant="line" width="30%" height="1rem" class="mb-2" />
            <AppSkeleton variant="line" width="70%" height="0.875rem" class="mb-1.5" />
            <AppSkeleton variant="line" width="50%" height="0.875rem" />
          </div>
        </div>

        <!-- Boş durum -->
        <div
          v-else-if="!listLoading && filteredAppointments.length === 0"
          class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-14 text-center"
        >
          <CalendarX2 class="mx-auto mb-3 size-10 text-slate-300" aria-hidden="true" />
          <p class="font-medium text-slate-600">Bu aralıkta randevu bulunamadı</p>
          <p class="mt-1 text-sm text-slate-400">Tarih aralığını veya filtreleri değiştirin.</p>
          <AppButton class="mt-4" variant="secondary" size="sm" @click="openCreate">
            <Plus class="size-4" aria-hidden="true" />
            Randevu oluştur
          </AppButton>
        </div>

        <!-- Randevu listesi -->
        <div v-else class="space-y-6">
          <template v-for="(group, date) in groupedAppointments" :key="date">
            <div>
              <div class="mb-2 flex items-center gap-3">
                <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {{ formatDateGroupHeader(String(date)) }}
                </span>
                <span class="flex-1 border-t border-slate-100" />
                <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                  {{ group.length }}
                </span>
              </div>
              <ul class="space-y-2">
                <li
                  v-for="a in group"
                  :id="`appointment-${a.id}`"
                  :key="a.id"
                  class="rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  :class="cardBorderClass(a.status)"
                >
                  <div class="flex flex-wrap items-start gap-3">
                    <div class="flex w-12 shrink-0 flex-col items-center">
                      <span class="text-base font-bold tabular-nums text-slate-900">{{ formatTime(a.scheduledAt) }}</span>
                      <span class="text-[0.65rem] text-slate-400">{{ a.durationMinutes }} dk</span>
                    </div>
                    <div
                      class="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      :style="{ backgroundColor: employeeColor(a.employeeId) }"
                      :title="resolveEmployeeName(a.employeeId)"
                      aria-hidden="true"
                    >
                      {{ resolveEmployeeName(a.employeeId).charAt(0).toUpperCase() }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-1.5">
                        <span class="font-semibold text-slate-900">{{ resolveCustomerName(a.customerId) }}</span>
                        <AppBadge :status="a.status" />
                        <span v-if="a.risky" class="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-800">Riskli</span>
                        <span v-if="customerNoShowMap.get(a.customerId)" class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Onay zorunlu</span>
                      </div>
                      <div class="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                        <span class="flex items-center gap-1">
                          <UserCircle2 class="size-3.5" aria-hidden="true" />
                          {{ resolveEmployeeName(a.employeeId) }}
                        </span>
                        <span class="flex items-center gap-1">
                          <Scissors class="size-3.5" aria-hidden="true" />
                          {{ resolveServiceName(a.serviceId) }}
                        </span>
                        <span v-if="a.source === 'PHONE'" class="flex items-center gap-1">
                          <PhoneCall class="size-3.5" aria-hidden="true" />
                          Telefon
                        </span>
                        <span v-else-if="a.source === 'WALK_IN'" class="flex items-center gap-1">
                          <MapPin class="size-3.5" aria-hidden="true" />
                          Yerinde
                        </span>
                        <span v-else-if="a.source === 'ONLINE'" class="flex items-center gap-1">
                          <Globe class="size-3.5" aria-hidden="true" />
                          Online
                        </span>
                      </div>
                      <p v-if="a.notes" class="mt-1 truncate text-xs italic text-slate-400" :title="a.notes">{{ a.notes }}</p>
                    </div>
                  </div>
                  <div v-if="canAct(a)" class="mt-3 flex flex-wrap gap-1.5 border-t border-slate-50 pt-3">
                    <AppButton
                      v-if="a.status === 'PENDING' || a.status === 'RISKY'"
                      variant="primary" size="sm"
                      :loading="actingId === a.id && actingAction === 'confirm'"
                      @click="confirmAppointment(a.id)"
                    >
                      <Check class="size-3.5" aria-hidden="true" /> Onayla
                    </AppButton>
                    <AppButton
                      v-if="['PENDING','CONFIRMED','RISKY'].includes(a.status)"
                      variant="primary" size="sm"
                      :loading="actingId === a.id && actingAction === 'complete'"
                      @click="completeAppointment(a.id)"
                    >
                      <CheckCheck class="size-3.5" aria-hidden="true" /> Tamamla
                    </AppButton>
                    <AppButton
                      v-if="['PENDING','CONFIRMED','RISKY'].includes(a.status)"
                      variant="secondary" size="sm"
                      @click="openCancel(a)"
                    >
                      <X class="size-3.5" aria-hidden="true" /> İptal
                    </AppButton>
                    <AppButton
                      v-if="['PENDING','CONFIRMED','RISKY'].includes(a.status)"
                      variant="danger" size="sm"
                      :loading="actingId === a.id && actingAction === 'noshow'"
                      @click="markNoShow(a)"
                    >
                      <UserMinus class="size-3.5" aria-hidden="true" /> Gelmedi
                    </AppButton>
                  </div>
                </li>
              </ul>
            </div>
          </template>
        </div>
      </template>
    </template>

    <!-- ── İptal Modal ───────────────────────────────────────────────── -->
    <AppModal v-model:visible="showCancelModal" title="Randevuyu iptal et">
      <div class="space-y-4">
        <p v-if="cancelTarget" class="text-sm text-slate-600">
          <span class="font-semibold">{{ formatDateTime(cancelTarget.scheduledAt) }}</span>
          tarihli randevu iptal edilsin mi?
        </p>
        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-slate-700">
            İptal nedeni <span class="font-normal text-slate-400">(isteğe bağlı)</span>
          </span>
          <input
            v-model="cancelReason" type="text"
            class="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            placeholder="Neden iptal ediyorsunuz?"
          />
        </label>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showCancelModal = false">Vazgeç</AppButton>
        <AppButton variant="danger" :loading="cancelling" @click="doCancel">İptal et</AppButton>
      </template>
    </AppModal>

    <!-- ── Yeni Randevu Wizard Modal ───────────────────────────────────── -->
    <AppModal
      v-model:visible="showCreateModal"
      :title="wizardTitles[wizardStep - 1]"
      :dialog-style="{ width: 'min(40rem, 95vw)' }"
    >
      <!-- Step indicators -->
      <div class="mb-6 flex items-center gap-0">
        <template v-for="(label, i) in wizardStepLabels" :key="i">
          <div class="flex flex-col items-center gap-1">
            <div
              class="flex size-7 items-center justify-center rounded-full text-xs font-bold transition"
              :class="wizardStep > i + 1
                ? 'bg-indigo-600 text-white'
                : wizardStep === i + 1
                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-200'
                  : 'bg-slate-100 text-slate-400'"
            >
              <Check v-if="wizardStep > i + 1" class="size-3.5" />
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span class="hidden text-[0.65rem] font-medium sm:block" :class="wizardStep === i + 1 ? 'text-indigo-600' : 'text-slate-400'">{{ label }}</span>
          </div>
          <div v-if="i < wizardStepLabels.length - 1" class="mb-4 h-px flex-1 transition" :class="wizardStep > i + 1 ? 'bg-indigo-400' : 'bg-slate-200'" />
        </template>
      </div>

      <!-- ── Adım 1: Çalışan + Hizmet ─────────────────────────────────── -->
      <div v-if="wizardStep === 1" class="space-y-4">
        <div v-if="empLoading" class="space-y-2">
          <div v-for="i in 3" :key="i" class="h-10 animate-pulse rounded-lg bg-slate-100" />
        </div>
        <template v-else>
          <div class="space-y-1">
            <label class="block text-sm font-medium text-slate-700">Çalışan</label>
            <div class="grid gap-2 sm:grid-cols-2">
              <button
                v-for="emp in employees"
                :key="emp.id"
                type="button"
                class="flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition"
                :class="wizardForm.employeeId === emp.id
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-300'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
                @click="selectEmployee(emp.id)"
              >
                <div
                  class="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  :style="{ backgroundColor: employeeColor(emp.id) }"
                >{{ empInitials(emp.name) }}</div>
                <div>
                  <div class="font-medium">{{ emp.name }}</div>
                  <div v-if="emp.title" class="text-xs text-slate-400">{{ emp.title }}</div>
                </div>
              </button>
            </div>
            <span v-if="wizardErrors.employeeId" class="text-xs text-red-600">{{ wizardErrors.employeeId }}</span>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-medium text-slate-700">Hizmet</label>
            <p v-if="wizardForm.employeeId === '' && capableServices.length === 0" class="text-xs text-slate-400 italic">Önce çalışan seçin</p>
            <div class="grid gap-2 sm:grid-cols-2">
              <button
                v-for="svc in capableServices"
                :key="svc.id"
                type="button"
                class="flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition"
                :class="wizardForm.serviceId === svc.id
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-300'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
                @click="wizardForm.serviceId = svc.id"
              >
                <span class="font-medium">{{ svc.name }}</span>
                <span class="text-xs text-slate-400">{{ svc.durationMinutes }} dk</span>
              </button>
            </div>
            <span v-if="wizardErrors.serviceId" class="text-xs text-red-600">{{ wizardErrors.serviceId }}</span>
          </div>
        </template>
      </div>

      <!-- ── Adım 2: Tarih ──────────────────────────────────────────────── -->
      <div v-else-if="wizardStep === 2" class="space-y-4">
        <div v-if="datesLoading" class="flex justify-center py-8">
          <div class="size-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
        <div v-else-if="availableDates.length === 0" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-700">
          Önümüzdeki {{ maxAdvanceBookingDays }} gün içinde uygun tarih bulunamadı.
        </div>
        <template v-else>
          <div class="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <!-- Month navigation -->
            <div class="mb-3 flex items-center justify-between">
              <button
                type="button"
                class="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
                :disabled="calMonthIndex === 0"
                @click="calMonthIndex--"
              >
                <ChevronLeft class="size-4" aria-hidden="true" />
              </button>
              <span class="text-sm font-semibold capitalize text-slate-800">{{ currentCalMonthLabel }}</span>
              <button
                type="button"
                class="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
                :disabled="calMonthIndex >= availableMonths.length - 1"
                @click="calMonthIndex++"
              >
                <ChevronRight class="size-4" aria-hidden="true" />
              </button>
            </div>

            <!-- Day headers -->
            <div class="mb-1 grid grid-cols-7 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
              <span v-for="d in ['Pt','Sa','Ça','Pe','Cu','Ct','Pz']" :key="d">{{ d }}</span>
            </div>

            <!-- Calendar cells -->
            <div class="grid grid-cols-7 gap-1">
              <template v-for="cell in calendarCells" :key="cell.iso ?? cell.index">
                <div v-if="!cell.iso" />
                <button
                  v-else
                  type="button"
                  class="flex flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-sm font-medium transition"
                  :class="cell.available
                    ? wizardForm.date === cell.iso
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-800 hover:bg-indigo-50 hover:text-indigo-700'
                    : 'cursor-not-allowed opacity-35'"
                  :disabled="!cell.available"
                  @click="wizardForm.date = cell.iso"
                >
                  <span>{{ cell.day }}</span>
                  <span
                    class="size-1 rounded-full"
                    :class="cell.available
                      ? wizardForm.date === cell.iso
                        ? 'bg-white/70'
                        : 'bg-indigo-400'
                      : 'bg-transparent'"
                  />
                </button>
              </template>
            </div>
          </div>

          <!-- Selected date pill -->
          <div v-if="wizardForm.date" class="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
            <CalendarCheck class="size-4 shrink-0" aria-hidden="true" />
            <span class="font-medium">{{ formatDateFull(wizardForm.date) }}</span>
          </div>
          <p v-else class="text-xs text-slate-400">
            Yeşil tarihlerden birini seçin — {{ availableDates.length }} uygun gün bulundu.
          </p>
          <span v-if="wizardErrors.date" class="text-xs text-red-600">{{ wizardErrors.date }}</span>
        </template>
      </div>

      <!-- ── Adım 3: Saat ───────────────────────────────────────────────── -->
      <div v-else-if="wizardStep === 3" class="space-y-4">
        <div v-if="slotsLoading" class="flex justify-center py-8">
          <div class="size-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
        <div v-else-if="availableSlots.length === 0" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-700">
          Bu tarihte uygun saat yok. Geri dönüp başka gün seçin.
        </div>
        <template v-else>
          <!-- Date context -->
          <div class="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <CalendarCheck class="size-3.5 shrink-0 text-indigo-500" aria-hidden="true" />
            <span class="font-medium text-slate-700">{{ formatDateFull(wizardForm.date) }}</span>
            <span class="text-slate-400">·</span>
            <span>{{ availableSlots.length }} uygun saat</span>
          </div>

          <!-- Grouped slots -->
          <div class="space-y-4">
            <div v-for="group in slotGroups" :key="group.label" class="space-y-2">
              <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400">{{ group.label }}</h3>
              <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
                <button
                  v-for="slot in group.slots"
                  :key="slot.startTime"
                  type="button"
                  class="flex flex-col items-center rounded-xl border px-2 py-2.5 text-center transition"
                  :class="wizardForm.time === slot.startTime
                    ? 'border-indigo-400 bg-indigo-600 text-white shadow-sm'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700'"
                  @click="wizardForm.time = slot.startTime"
                >
                  <span class="text-sm font-semibold tabular-nums">{{ slot.startTime.slice(11, 16) }}</span>
                  <span
                    class="mt-0.5 text-[0.65rem] tabular-nums"
                    :class="wizardForm.time === slot.startTime ? 'text-indigo-200' : 'text-slate-400'"
                  >→ {{ slot.endTime.slice(11, 16) }}</span>
                  <span
                    v-if="slot.instantConfirmation"
                    class="mt-1 rounded-full px-1.5 py-0.5 text-[0.6rem] font-semibold"
                    :class="wizardForm.time === slot.startTime ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'"
                  >Anında</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Selected slot summary -->
          <div v-if="wizardForm.time" class="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
            <Check class="size-4 shrink-0" aria-hidden="true" />
            <span class="font-medium">{{ wizardForm.time.slice(11, 16) }} – {{ availableSlots.find(s => s.startTime === wizardForm.time)?.endTime.slice(11, 16) }}</span>
            <span class="text-indigo-400">·</span>
            <span class="text-indigo-500">{{ availableSlots.find(s => s.startTime === wizardForm.time)?.durationMinutes }} dk</span>
          </div>

          <span v-if="wizardErrors.time" class="text-xs text-red-600">{{ wizardErrors.time }}</span>
        </template>
      </div>

      <!-- ── Adım 4: Müşteri ────────────────────────────────────────────── -->
      <div v-else-if="wizardStep === 4" class="space-y-4">
        <!-- Summary bar -->
        <div class="flex flex-wrap gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
          <span class="font-medium">{{ resolveEmployeeName(wizardForm.employeeId as number) }}</span>
          <span class="text-slate-300">·</span>
          <span>{{ resolveServiceName(wizardForm.serviceId as number) }}</span>
          <span class="text-slate-300">·</span>
          <span>{{ formatDateFull(wizardForm.date) }} {{ wizardForm.time.slice(11, 16) }}</span>
        </div>

        <!-- Mod seçimi: Mevcut / Yeni -->
        <div class="flex gap-2">
          <button
            type="button"
            class="flex-1 rounded-xl border py-2 text-sm font-medium transition"
            :class="customerMode === 'existing'
              ? 'border-indigo-400 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
              : 'border-slate-200 text-slate-500 hover:bg-slate-50'"
            @click="customerMode = 'existing'"
          >
            Mevcut müşteri
          </button>
          <button
            type="button"
            class="flex-1 rounded-xl border py-2 text-sm font-medium transition"
            :class="customerMode === 'new'
              ? 'border-indigo-400 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
              : 'border-slate-200 text-slate-500 hover:bg-slate-50'"
            @click="customerMode = 'new'; clearExistingCustomer()"
          >
            Yeni müşteri
          </button>
        </div>

        <!-- ── Mevcut müşteri seçimi ── -->
        <template v-if="customerMode === 'existing'">
          <!-- Arama -->
          <div class="relative">
            <input
              v-model="customerSearch"
              type="search"
              placeholder="İsim veya telefon ara…"
              class="w-full rounded-xl border border-slate-200 px-3 py-2.5 pl-9 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <svg class="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>

          <!-- Seçili müşteri -->
          <div
            v-if="selectedExistingCustomer"
            class="flex items-center justify-between rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-3"
          >
            <div>
              <p class="text-sm font-semibold text-indigo-800">{{ selectedExistingCustomer.name }}</p>
              <p class="text-xs text-indigo-500">{{ selectedExistingCustomer.phoneNumber }}</p>
            </div>
            <button
              type="button"
              class="rounded-lg px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-100"
              @click="clearExistingCustomer()"
            >
              Değiştir
            </button>
          </div>

          <!-- Müşteri listesi -->
          <ul v-else class="max-h-48 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            <li v-if="filteredCustomersForWizard.length === 0" class="px-4 py-3 text-center text-sm text-slate-400">
              Müşteri bulunamadı
            </li>
            <li
              v-for="c in filteredCustomersForWizard"
              :key="c.id"
              class="flex cursor-pointer items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition"
              @click="selectExistingCustomer(c)"
            >
              <div class="flex items-center gap-2.5">
                <div
                  class="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  :style="{ backgroundColor: employeeColor(c.id) }"
                >{{ c.name.charAt(0).toUpperCase() }}</div>
                <div>
                  <p class="text-sm font-medium text-slate-800">{{ c.name }}</p>
                  <p class="text-xs text-slate-400">{{ c.phoneNumber }}</p>
                </div>
              </div>
              <span v-if="c.blacklisted" class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">Kara liste</span>
              <span v-else-if="c.noShowForcesManualApproval" class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Onay zorunlu</span>
            </li>
          </ul>
          <span v-if="wizardErrors.customer" class="text-xs text-red-600">{{ wizardErrors.customer }}</span>

          <!-- Paket seans seçimi -->
          <template v-if="selectedExistingCustomer">
            <div v-if="packagesLoadingForWizard" class="flex items-center gap-2 text-xs text-slate-400">
              <div class="size-3 animate-spin rounded-full border border-slate-300 border-t-indigo-400" />
              Paketler yükleniyor…
            </div>
            <div v-else-if="pendingSessionsForWizard.length > 0" class="space-y-2">
              <p class="text-sm font-medium text-slate-700">Paket seansı ata <span class="font-normal text-slate-400">(isteğe bağlı)</span></p>
              <div class="space-y-1.5">
                <!-- "Atamasız" seçeneği -->
                <label
                  class="flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition"
                  :class="selectedSessionId === null
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-slate-200 hover:bg-slate-50'"
                >
                  <input v-model="selectedSessionId" type="radio" :value="null" class="sr-only" />
                  <div class="flex size-4 shrink-0 items-center justify-center rounded-full border-2"
                    :class="selectedSessionId === null ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'">
                    <div v-if="selectedSessionId === null" class="size-1.5 rounded-full bg-white" />
                  </div>
                  <span class="text-sm text-slate-600">Seans atama (paketsiz randevu)</span>
                </label>
                <!-- Seans seçenekleri -->
                <label
                  v-for="{ pkg, session } in pendingSessionsForWizard"
                  :key="session.id"
                  class="flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition"
                  :class="selectedSessionId === session.id
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-slate-200 hover:bg-slate-50'"
                >
                  <input v-model="selectedSessionId" type="radio" :value="session.id" class="sr-only" />
                  <div class="flex size-4 shrink-0 items-center justify-center rounded-full border-2"
                    :class="selectedSessionId === session.id ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'">
                    <div v-if="selectedSessionId === session.id" class="size-1.5 rounded-full bg-white" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-slate-800">{{ pkg.name }}</p>
                    <p class="text-xs text-slate-400">Seans #{{ session.sessionNumber }} · {{ pkg.remainingSessions }} seans kaldı</p>
                  </div>
                  <span class="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-600">Paket</span>
                </label>
              </div>
            </div>
            <div v-else-if="!packagesLoadingForWizard && eligiblePackages.length === 0 && customerPackagesForWizard.length > 0" class="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Bu müşterinin bu hizmet için bekleyen paket seansı bulunmuyor.
            </div>
          </template>

          <!-- Not -->
          <label class="flex flex-col gap-1.5">
            <span class="text-sm font-medium text-slate-700">Not <span class="font-normal text-slate-400">(isteğe bağlı)</span></span>
            <textarea
              v-model="wizardForm.notes"
              rows="2"
              maxlength="500"
              placeholder="Varsa not…"
              class="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </label>
        </template>

        <!-- ── Yeni müşteri formu ── -->
        <template v-else>
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="flex flex-col gap-1.5">
              <span class="text-sm font-medium text-slate-700">Müşteri adı <span class="text-red-500">*</span></span>
              <input
                v-model="wizardForm.customerName"
                type="text"
                placeholder="Ad soyad…"
                class="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <span v-if="wizardErrors.customerName" class="text-xs text-red-600">{{ wizardErrors.customerName }}</span>
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="text-sm font-medium text-slate-700">Telefon <span class="text-red-500">*</span></span>
              <input
                v-model="wizardForm.phoneNumber"
                type="tel"
                placeholder="5XX XXX XX XX"
                class="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <span v-if="wizardErrors.phoneNumber" class="text-xs text-red-600">{{ wizardErrors.phoneNumber }}</span>
            </label>
          </div>

          <div>
            <span class="mb-1.5 block text-sm font-medium text-slate-700">Kaynak</span>
            <div class="flex gap-2">
              <label
                v-for="src in SOURCES"
                :key="src.value"
                class="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition"
                :class="wizardForm.source === src.value ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
              >
                <input v-model="wizardForm.source" type="radio" :value="src.value" class="sr-only" />
                <component :is="src.icon" class="size-4" aria-hidden="true" />
                {{ src.label }}
              </label>
            </div>
          </div>

          <label class="flex flex-col gap-1.5">
            <span class="text-sm font-medium text-slate-700">Not <span class="font-normal text-slate-400">(isteğe bağlı)</span></span>
            <textarea
              v-model="wizardForm.notes"
              rows="2"
              maxlength="500"
              placeholder="Varsa not…"
              class="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </label>
        </template>

        <p v-if="createSubmitError" class="text-xs text-red-600" role="alert">{{ createSubmitError }}</p>
      </div>

      <template #footer>
        <AppButton variant="secondary" @click="wizardBack">
          {{ wizardStep === 1 ? 'Vazgeç' : '← Geri' }}
        </AppButton>
        <AppButton
          v-if="wizardStep < 4"
          variant="primary"
          :disabled="datesLoading || slotsLoading"
          @click="wizardNext"
        >
          Devam →
        </AppButton>
        <AppButton
          v-else
          variant="primary"
          :loading="createSaving"
          @click="submitCreate"
        >
          Randevu oluştur
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
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
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import trLocale from '@fullcalendar/core/locales/tr'
import {
  List, Calendar, Plus, X, RefreshCw, Users,
  Check, CheckCheck, UserMinus, UserCircle2,
  Scissors, PhoneCall, MapPin, Globe, CalendarX2,
  ChevronLeft, ChevronRight, CalendarCheck,
} from 'lucide-vue-next'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppDateField from '@/components/ui/AppDateField.vue'

const auth = useAuthStore()
const businessId = computed(() => auth.user?.businessId ?? null)
const businessSlug = ref<string | null>(null)
const maxAdvanceBookingDays = ref(60)

// ─── Sabitler ───────────────────────────────────────────────────────────────

const VIEWS = [
  { value: 'list' as const, label: 'Liste', icon: List },
  { value: 'calendar' as const, label: 'Takvim', icon: Calendar },
]
const CALENDAR_VIEWS = [
  { value: 'dayGridMonth', label: 'Ay' },
  { value: 'timeGridWeek', label: 'Hafta' },
  { value: 'timeGridDay', label: 'Gün' },
]
const SOURCES = [
  { value: 'PHONE' as const, label: 'Telefon', icon: PhoneCall },
  { value: 'WALK_IN' as const, label: 'Yerinde', icon: MapPin },
]
const EMPLOYEE_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#06b6d4',
]

// ─── State ──────────────────────────────────────────────────────────────────

const view = ref<'list' | 'calendar'>('calendar')
const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null)
const calendarTitle = ref('')
const calendarView = ref('timeGridWeek')
const calendarLoadedKey = ref('')

// Ayrı loading state'leri — örtüşme olmasın
const calendarLoading = ref(false)
const listLoading = ref(false)
const empLoading = ref(true)

const loading = computed(() => listLoading.value || calendarLoading.value || empLoading.value)

const appointments = ref<AppointmentResponse[]>([])
const employees = ref<EmployeeResponse[]>([])
const services = ref<ServiceResponse[]>([])
const customers = ref<CustomerResponse[]>([])

const listError = ref('')
const filterStart = ref('')
const filterEnd = ref('')
const filterStatus = ref<AppointmentStatus | ''>('')
const filterEmployee = ref<number | ''>('')

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

const calendarEvents = computed(() =>
  filteredAppointments.value.map((a) => ({
    id: String(a.id),
    title: customerMap.value.get(a.customerId) ?? `Müşteri #${a.customerId}`,
    start: a.scheduledAt,
    end: a.endAt,
    backgroundColor: employeeColor(a.employeeId),
    borderColor: employeeColor(a.employeeId),
    textColor: '#ffffff',
  })),
)

// ─── Takvim seçenekleri — headerToolbar kapalı ───────────────────────────────

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  locale: trLocale,
  initialView: 'timeGridWeek',
  headerToolbar: false as const,
  slotMinTime: '07:00:00',
  slotMaxTime: '22:00:00',
  allDaySlot: false,
  height: 'auto',
  editable: false,
  selectable: true,
  nowIndicator: true,
  events: calendarEvents.value,
  datesSet(info: { startStr: string; endStr: string; view: { title: string; type: string } }) {
    calendarTitle.value = info.view.title
    calendarView.value = info.view.type
    loadCalendarRange(info.startStr.slice(0, 10), info.endStr.slice(0, 10))
  },
  dateClick(info: { dateStr: string }) {
    openCreate()
  },
  eventClick(info: { event: { id: string } }) {
    const id = Number(info.event.id)
    switchView('list')
    nextTick(() => {
      document.getElementById(`appointment-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  },
}))

// ─── Takvim API ──────────────────────────────────────────────────────────────

function calPrev() { calendarRef.value?.getApi().prev() }
function calNext() { calendarRef.value?.getApi().next() }
function calToday() { calendarRef.value?.getApi().today() }
function setCalView(v: string) {
  calendarView.value = v
  calendarRef.value?.getApi().changeView(v)
}

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

function employeeColor(id: number): string {
  return EMPLOYEE_COLORS[id % EMPLOYEE_COLORS.length]
}
function cardBorderClass(status: AppointmentStatus): string {
  const map: Record<AppointmentStatus, string> = {
    PENDING: 'border-amber-200', CONFIRMED: 'border-indigo-200',
    RISKY: 'border-orange-200', COMPLETED: 'border-emerald-200',
    CANCELLED: 'border-slate-200 opacity-60', NO_SHOW: 'border-red-200 opacity-70',
  }
  return map[status] ?? 'border-slate-200'
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
    listError.value = 'Randevular yüklenemedi.'
  } finally {
    listLoading.value = false
  }
}

async function loadCalendarRange(start: string, end: string) {
  const key = `${start}|${end}`
  if (calendarLoadedKey.value === key) return
  calendarLoadedKey.value = key
  if (!businessId.value) return
  calendarLoading.value = true
  try {
    appointments.value = await fetchAllPageContent((page, size) =>
      appointmentApi.list({ startDate: start, endDate: end, page, size }),
    )
  } catch {
    listError.value = 'Randevular yüklenemedi.'
  } finally {
    calendarLoading.value = false
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
    listError.value = 'Çalışan ve hizmet listesi yüklenemedi.'
  } finally {
    empLoading.value = false
  }
}

async function manualRefresh() {
  if (view.value === 'calendar') {
    const fcApi = calendarRef.value?.getApi()
    if (fcApi) {
      calendarLoadedKey.value = ''
      const start = fcApi.view.currentStart.toISOString().slice(0, 10)
      const end = fcApi.view.currentEnd.toISOString().slice(0, 10)
      await loadCalendarRange(start, end)
    }
  } else {
    await reloadList()
  }
}

function switchView(v: 'list' | 'calendar') {
  if (v === view.value) return
  if (v === 'list' && calendarLoadedKey.value) {
    const [start, end] = calendarLoadedKey.value.split('|')
    filterStart.value = start
    filterEnd.value = end
    if (!appointments.value.length) reloadList()
  }
  view.value = v
}

function clearFilters() {
  filterStatus.value = ''
  filterEmployee.value = ''
}

watch([filterStart, filterEnd], () => {
  if (businessId.value && view.value === 'list') reloadList()
})

// ─── Aksiyonlar ──────────────────────────────────────────────────────────────

const actingId = ref<number | null>(null)
const actingAction = ref('')

async function confirmAppointment(id: number) {
  actingId.value = id; actingAction.value = 'confirm'
  try { await appointmentApi.confirm(id); await reloadList() }
  catch { listError.value = 'Onaylanamadı.' }
  finally { actingId.value = null; actingAction.value = '' }
}
async function completeAppointment(id: number) {
  actingId.value = id; actingAction.value = 'complete'
  try { await appointmentApi.complete(id); await reloadList() }
  catch { listError.value = 'Tamamlanamadı.' }
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
  } catch { listError.value = 'İşaretlenemedi.' }
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
  catch { listError.value = 'İptal edilemedi.' }
  finally { cancelling.value = false }
}

// ─── Wizard — Yeni Randevu ───────────────────────────────────────────────────

const wizardTitles = ['Çalışan & Hizmet', 'Tarih Seç', 'Saat Seç', 'Müşteri Bilgileri']
const wizardStepLabels = ['Çalışan', 'Tarih', 'Saat', 'Müşteri']

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

const slotGroups = computed(() => {
  const morning: AvailableSlotResponse[] = []
  const afternoon: AvailableSlotResponse[] = []
  const evening: AvailableSlotResponse[] = []
  for (const slot of availableSlots.value) {
    const hour = Number(slot.startTime.slice(11, 13))
    if (hour < 12) morning.push(slot)
    else if (hour < 17) afternoon.push(slot)
    else evening.push(slot)
  }
  return [
    { label: 'Sabah', slots: morning },
    { label: 'Öğleden Sonra', slots: afternoon },
    { label: 'Akşam', slots: evening },
  ].filter((g) => g.slots.length > 0)
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

function openCreate() {
  wizardStep.value = 1
  wizardForm.employeeId = ''
  wizardForm.serviceId = ''
  wizardForm.date = ''
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
    if (!wizardForm.customerName.trim()) { wizardErrors.value.customerName = 'Müşteri adı girin'; return }
    if (!wizardForm.phoneNumber.trim()) { wizardErrors.value.phoneNumber = 'Telefon girin'; return }
    if (wizardForm.phoneNumber.replaceAll(/\D/g, '').length < 10) { wizardErrors.value.phoneNumber = 'Geçerli telefon girin'; return }
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
    if (view.value === 'list') {
      await reloadList()
    } else {
      calendarLoadedKey.value = ''
      await manualRefresh()
    }
  } catch (e: unknown) {
    const data = (e as { response?: { data?: ApiResponse<unknown> } }).response?.data
    createSubmitError.value = data?.error?.message ?? (e instanceof Error ? e.message : 'Randevu oluşturulamadı.')
  } finally {
    createSaving.value = false
  }
}

// ─── Mount ───────────────────────────────────────────────────────────────────

watch(view, (v) => {
  if (v === 'list' && businessId.value && appointments.value.length === 0) reloadList()
})

onMounted(() => {
  if (businessId.value) {
    setDefaultWeekRange()
    loadEmployeesAndServices()
  }
})
</script>

<style scoped>
.calendar-shell :deep(.fc) {
  --fc-border-color: #f1f5f9;
  --fc-today-bg-color: #eef2ff;
  --fc-now-indicator-color: #f43f5e;
  --fc-page-bg-color: transparent;
  font-size: 0.8125rem;
}
.calendar-shell :deep(.fc-col-header-cell-cushion),
.calendar-shell :deep(.fc-daygrid-day-number) {
  color: #475569;
  font-weight: 600;
  text-decoration: none;
}
.calendar-shell :deep(.fc-event) {
  border: none !important;
  border-radius: 5px;
  font-size: 0.72rem;
  padding: 2px 5px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.12);
}
.calendar-shell :deep(.fc-event:hover) {
  filter: brightness(1.08);
  box-shadow: 0 2px 6px rgb(0 0 0 / 0.18);
}
.calendar-shell :deep(.fc-timegrid-now-indicator-line) { border-color: #f43f5e; }
.calendar-shell :deep(.fc-timegrid-now-indicator-arrow) { border-color: #f43f5e; }

.scrollbar-none { scrollbar-width: none; }
.scrollbar-none::-webkit-scrollbar { display: none; }

@keyframes slide {
  0%   { transform: translateX(-100%); }
  50%  { transform: translateX(100%); }
  100% { transform: translateX(300%); }
}
</style>
