<template>
  <div class="space-y-6 p-4 sm:p-6">
    <!-- Back + Header -->
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="back-btn"
        @click="router.back()"
      >
        <ChevronLeft class="size-5" />
      </button>
      <div class="min-w-0 flex-1">
        <h1 class="truncate text-xl font-bold" style="color: var(--ink-1)">{{ template?.name ?? t('packageDetailView.title.fallback') }}</h1>
        <p class="text-sm" style="color: var(--ink-3)">{{ t('packageDetailView.lead') }}</p>
      </div>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-20 animate-pulse rounded-xl" style="background: var(--surface-2)" />
    </div>

    <div v-else-if="pageError" class="card" style="background: var(--danger-tint); border-color: var(--danger)" role="alert">
      <p class="text-sm" style="color: var(--danger)">{{ pageError }}</p>
      <AppButton variant="secondary" size="sm" class="mt-3" @click="load">{{ t('packageDetailView.action.retry') }}</AppButton>
    </div>

    <template v-else>
      <!-- ── Şablon bilgi kartı ── -->
      <div class="card">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="text-lg font-bold" style="color: var(--ink-2)">{{ template?.name }}</span>
              <span
                class="pill"
                :class="template?.active ? 'pill--active' : 'pill--passive'"
              >{{ template?.active ? t('packageDetailView.template.active') : t('packageDetailView.template.passive') }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-4 text-sm" style="color: var(--ink-3)">
              <span class="flex items-center gap-1.5">
                <Scissors class="size-4" style="color: var(--ink-4)" />
                {{ resolveServiceName(template?.serviceId) }}
              </span>
              <span class="flex items-center gap-1.5">
                <Hash class="size-4" style="color: var(--ink-4)" />
                {{ t('packageDetailView.template.sessions', { n: template?.totalSessions }) }}
              </span>
              <span v-if="template?.price != null" class="flex items-center gap-1.5 font-semibold" style="color: var(--primary)">
                <Tag class="size-4" />
                {{ formatPrice(template.price) }}
              </span>
            </div>
          </div>
          <div class="flex gap-2 shrink-0">
            <AppButton variant="primary" @click="openCreateForCustomer()">
              <Plus class="size-4" />
              {{ t('packageDetailView.action.assign') }}
            </AppButton>
          </div>
        </div>

        <!-- İstatistikler -->
        <div class="mt-4 grid grid-cols-2 gap-3 pt-4 sm:grid-cols-4" style="border-top: 1px solid var(--hairline)">
          <div class="rounded-lg p-3 text-center" style="background: var(--surface-2)">
            <p class="text-xl font-bold" style="color: var(--ink-2)">{{ packageOwners.length }}</p>
            <p class="text-xs" style="color: var(--ink-3)">{{ t('packageDetailView.stats.totalSales') }}</p>
          </div>
          <div class="rounded-lg p-3 text-center" style="background: var(--success-tint)">
            <p class="text-xl font-bold" style="color: var(--success)">{{ activeOwners.length }}</p>
            <p class="text-xs" style="color: var(--ink-3)">{{ t('packageDetailView.stats.activeCustomers') }}</p>
          </div>
          <div class="rounded-lg p-3 text-center" style="background: var(--warning-tint)">
            <p class="text-xl font-bold" style="color: var(--warning)">{{ totalRemaining }}</p>
            <p class="text-xs" style="color: var(--ink-3)">{{ t('packageDetailView.stats.remainingSessions') }}</p>
          </div>
          <div class="rounded-lg p-3 text-center" style="background: var(--primary-tint)">
            <p class="text-xl font-bold" style="color: var(--primary)">{{ totalUsed }}</p>
            <p class="text-xs" style="color: var(--ink-3)">{{ t('packageDetailView.stats.usedSessions') }}</p>
          </div>
        </div>
      </div>

      <!-- ── Müşteri listesi ── -->
      <section class="space-y-3">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-semibold" style="color: var(--ink-2)">{{ t('packageDetailView.section.customers') }}</h2>
          <!-- Filtre -->
          <div class="flex gap-0.5 rounded-lg p-0.5" style="border: 1px solid var(--hairline); background: var(--surface-2)">
            <button
              v-for="f in OWNER_FILTERS"
              :key="f.value"
              type="button"
              class="rounded-md px-3 py-1 text-xs font-medium transition"
              :style="ownerFilter === f.value ? 'background: var(--surface); color: var(--ink-1); box-shadow: var(--shadow-1)' : 'color: var(--ink-3)'"
              @click="ownerFilter = f.value"
            >{{ f.label }}</button>
          </div>
        </div>

        <div v-if="packageOwners.length === 0" class="rounded-xl p-8 text-center text-sm" style="border: 1px dashed var(--hairline); background: var(--surface-2); color: var(--ink-4)">
          {{ t('packageDetailView.empty.noAssigned') }}
        </div>
        <div v-else-if="filteredOwners.length === 0" class="py-6 text-center text-sm" style="color: var(--ink-4)">
          {{ t('packageDetailView.empty.noFilter') }}
        </div>

        <ul v-else class="space-y-2">
          <li
            v-for="pkg in filteredOwners"
            :key="pkg.id"
            class="rounded-xl overflow-hidden"
            :style="pkg.expired ? 'border: 1px solid var(--hairline); background: var(--surface); opacity: 0.7' : pkg.lowOnSessions ? 'border: 1px solid var(--warning); background: var(--surface)' : 'border: 1px solid var(--hairline); background: var(--surface)'"
          >
            <!-- Paket özet satırı -->
            <div
              class="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors"
              style="&:hover { background: var(--surface-2) }"
              role="button"
              tabindex="0"
              :aria-expanded="expandedPackageId === pkg.id"
              :aria-label="resolveCustomerName(pkg.customerId)"
              @click="toggleExpand(pkg.id)"
              @keydown.enter.prevent="toggleExpand(pkg.id)"
              @keydown.space.prevent="toggleExpand(pkg.id)"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  :style="{ backgroundColor: avatarColor(pkg.customerId) }"
                >{{ resolveCustomerName(pkg.customerId).charAt(0).toUpperCase() }}</div>
                <div>
                  <p class="font-semibold" style="color: var(--ink-2)">{{ resolveCustomerName(pkg.customerId) }}</p>
                  <p class="text-xs" style="color: var(--ink-3)">{{ resolveCustomerPhone(pkg.customerId) }}</p>
                </div>
              </div>

              <div class="flex items-center gap-4">
                <!-- Progress bar -->
                <div class="flex items-center gap-2">
                  <div class="h-1.5 w-20 overflow-hidden rounded-full" style="background: var(--surface-2)">
                    <div
                      class="h-full rounded-full transition-all"
                      :style="{ 
                        width: sessionsPercent(pkg) + '%',
                        background: pkg.expired ? 'var(--ink-4)' : pkg.lowOnSessions ? 'var(--warning)' : 'var(--success)'
                      }"
                    />
                  </div>
                  <span class="whitespace-nowrap text-sm font-semibold tabular-nums" style="color: var(--ink-2)">
                    {{ pkg.remainingSessions }}/{{ pkg.totalSessions }}
                  </span>
                </div>
                <!-- Status badge -->
                <span
                  class="pill"
                  :class="pkg.expired ? 'pill--expired' : pkg.lowOnSessions ? 'pill--low' : 'pill--active'"
                >{{ pkg.expired ? t('packageDetailView.status.expired') : pkg.lowOnSessions ? t('packageDetailView.status.low') : t('packageDetailView.status.active') }}</span>
                <!-- Bitiş -->
                <span class="hidden text-xs sm:block" style="color: var(--ink-4)">{{ packageExpiryLine(pkg.expiresAt) }}</span>
                <!-- Expand icon -->
                <ChevronDown
                  class="size-4 transition-transform"
                  style="color: var(--ink-4)"
                  :class="expandedPackageId === pkg.id ? 'rotate-180' : ''"
                />
              </div>
            </div>

            <!-- Seans detay paneli -->
            <div v-if="expandedPackageId === pkg.id" class="px-4 py-3" style="border-top: 1px solid var(--hairline); background: var(--surface-2)">
              <div v-if="sessionsLoading[pkg.id]" class="flex items-center gap-2 py-2 text-xs" style="color: var(--ink-4)">
                <div class="size-3 animate-spin rounded-full" style="border: 1px solid var(--hairline); border-top-color: var(--primary)" />
                {{ t('packageDetailView.sessions.loading') }}
              </div>
              <div v-else-if="!sessionsByPkg[pkg.id]?.length" class="py-2 text-xs" style="color: var(--ink-4)">
                {{ t('packageDetailView.sessions.empty') }}
              </div>
              <template v-else>
                <div class="mb-2 flex items-center justify-between">
                  <p class="text-xs font-semibold" style="color: var(--ink-3)">{{ t('packageDetailView.sessions.title') }}</p>
                  <AppButton
                    v-if="!pkg.expired && pkg.remainingSessions > 0"
                    variant="primary"
                    size="sm"
                    @click.stop="openAppointmentWizard(pkg)"
                  >
                    <CalendarPlus class="size-3.5" />
                    {{ t('packageDetailView.sessions.createAppointment') }}
                  </AppButton>
                </div>
                <ul style="border-top: 1px solid var(--hairline)">
                  <li
                    v-for="s in sessionsByPkg[pkg.id]"
                    :key="s.id"
                    class="flex flex-wrap items-center gap-3 py-2 text-xs"
                    style="border-bottom: 1px solid var(--hairline)"
                  >
                    <span class="w-6 font-semibold tabular-nums" style="color: var(--ink-3)">#{{ s.sessionNumber }}</span>
                    <span
                      class="rounded-full px-2 py-0.5 font-medium"
                      :style="{
                        background: s.status === 'PENDING' ? 'var(--surface-2)' : s.status === 'SCHEDULED' ? 'var(--primary-tint)' : s.status === 'COMPLETED' ? 'var(--success-tint)' : s.status === 'NO_SHOW' ? 'var(--danger-tint)' : 'var(--surface-2)',
                        color: s.status === 'PENDING' ? 'var(--ink-3)' : s.status === 'SCHEDULED' ? 'var(--primary)' : s.status === 'COMPLETED' ? 'var(--success)' : s.status === 'NO_SHOW' ? 'var(--danger)' : 'var(--ink-4)'
                      }"
                    >{{ sessionStatusLabel(s.status) }}</span>
                    <span v-if="s.scheduledAt" style="color: var(--ink-3)">{{ formatDateTime(s.scheduledAt) }}</span>
                    <span v-else style="color: var(--ink-4)">—</span>
                    <span v-if="s.status === 'PENDING'" class="ml-auto">
                      <AppButton size="sm" variant="primary" @click.stop="openAppointmentWizardForSession(pkg, s)">
                        <CalendarPlus class="size-3" />
                        {{ t('packageDetailView.sessions.assignAppointment') }}
                      </AppButton>
                    </span>
                  </li>
                </ul>
              </template>
            </div>
          </li>
        </ul>
      </section>
    </template>

    <!-- ── Randevu Oluşturma Modal (Wizard) ── -->
    <AppModal
      v-model:visible="showAppointmentModal"
      :title="t('packageDetailView.modal.appointment.title')"
      :dialog-style="{ width: 'min(38rem, 95vw)' }"
    >
      <!-- Step bar -->
      <div class="mb-6 flex items-center gap-0">
        <template v-for="(lbl, i) in WIZARD_LABELS" :key="i">
          <div class="flex flex-col items-center gap-1">
            <div
              class="flex size-7 items-center justify-center rounded-full text-xs font-bold transition"
              :style="apptStep > i + 1
                ? 'background: var(--primary); color: white'
                : apptStep === i + 1
                  ? 'background: var(--primary); color: white; box-shadow: 0 0 0 2px var(--primary-tint)'
                  : 'background: var(--surface-2); color: var(--ink-4)'"
            >
              <Check v-if="apptStep > i + 1" class="size-3.5" />
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span class="hidden text-[0.65rem] font-medium sm:block" :style="apptStep === i + 1 ? 'color: var(--primary)' : 'color: var(--ink-4)'">{{ lbl }}</span>
          </div>
          <div v-if="i < WIZARD_LABELS.length - 1" class="mb-4 h-px flex-1 transition" :style="apptStep > i + 1 ? 'background: var(--primary)' : 'background: var(--hairline)'" />
        </template>
      </div>

      <!-- Adım 1: Çalışan & Saat -->
      <div v-if="apptStep === 1" class="space-y-4">
        <!-- Seçilen müşteri & seans bilgisi -->
        <div v-if="apptTargetPkg" class="rounded-xl px-4 py-3 text-sm" style="background: var(--primary-tint)">
          <p class="font-semibold" style="color: var(--primary)">{{ resolveCustomerName(apptTargetPkg.customerId) }}</p>
          <p class="text-xs mt-0.5" style="color: var(--primary)">{{ apptTargetPkg.name }}</p>
          <p v-if="apptTargetSession" class="mt-1 text-xs font-medium" style="color: var(--primary)">{{ t('packageDetailView.wizard.summary.sessionNumber', { n: apptTargetSession.sessionNumber }) }}</p>
        </div>

        <div class="space-y-1">
          <label for="appt-employee" class="block text-sm font-medium" style="color: var(--ink-2)">
            {{ t('packageDetailView.wizard.employeeSelect.label') }} <span style="color: var(--danger)">{{ t('packageDetailView.wizard.employeeSelect.required') }}</span>
          </label>
          <div v-if="empLoading" class="flex gap-2">
            <div v-for="i in 2" :key="i" class="h-10 w-32 animate-pulse rounded-lg" style="background: var(--surface-2)" />
          </div>
          <div id="appt-employee" v-else class="grid gap-2 sm:grid-cols-2">
            <button
              v-for="emp in employees"
              :key="emp.id"
              type="button"
              class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition"
              :style="apptForm.employeeId === emp.id
                ? 'border: 1px solid var(--primary); background: var(--primary-tint); color: var(--primary); box-shadow: 0 0 0 1px var(--primary)'
                : 'border: 1px solid var(--hairline); &:hover { border-color: var(--ink-4); background: var(--surface-2) }'"
              @click="selectEmpForAppt(emp.id)"
            >
              <div
                class="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                :style="{ backgroundColor: avatarColor(emp.id) }"
              >{{ emp.name.charAt(0) }}</div>
              <div>
                <p class="font-medium">{{ emp.name }}</p>
                <p v-if="emp.title" class="text-xs" style="color: var(--ink-4)">{{ emp.title }}</p>
              </div>
            </button>
          </div>
          <span v-if="apptErrors.employeeId" class="text-xs" style="color: var(--danger)">{{ apptErrors.employeeId }}</span>
        </div>
      </div>

      <!-- Adım 2: Tarih -->
      <div v-else-if="apptStep === 2" class="space-y-4">
        <div v-if="datesLoading" class="flex justify-center py-8">
          <div class="size-8 animate-spin rounded-full" style="border: 2px solid var(--primary); border-top-color: transparent" />
        </div>
        <div v-else-if="availableDates.length === 0" class="rounded-xl p-4 text-center text-sm" style="border: 1px solid var(--warning); background: var(--warning-tint); color: var(--warning)">
          {{ t('packageDetailView.wizard.dateSelect.empty') }}
        </div>
        <template v-else>
          <div class="rounded-xl p-3" style="border: 1px solid var(--hairline); background: var(--surface)">
            <div class="mb-3 flex items-center justify-between">
              <button type="button" class="flex size-8 items-center justify-center rounded-lg transition" style="color: var(--ink-3); &:hover { background: var(--surface-2) }" :disabled="calMonthIdx === 0" @click="calMonthIdx--"><ChevronLeft class="size-4" /></button>
              <span class="text-sm font-semibold capitalize">{{ currentMonthLabel }}</span>
              <button type="button" class="flex size-8 items-center justify-center rounded-lg transition" style="color: var(--ink-3); &:hover { background: var(--surface-2) }" :disabled="calMonthIdx >= availableMonths.length - 1" @click="calMonthIdx++"><ChevronRight class="size-4" /></button>
            </div>
            <div class="mb-1 grid grid-cols-7 text-center text-[0.65rem] font-semibold uppercase tracking-wide" style="color: var(--ink-4)">
              <span v-for="d in dayAbbreviations" :key="d">{{ d }}</span>
            </div>
            <div class="grid grid-cols-7 gap-1">
              <template v-for="cell in calCells" :key="cell.iso ?? cell.index">
                <div v-if="!cell.iso" />
                <button
                  v-else
                  type="button"
                  class="flex flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-sm font-medium transition"
                  :style="cell.available 
                    ? apptForm.date === cell.iso 
                      ? 'background: var(--primary); color: white; box-shadow: var(--shadow-1)' 
                      : 'color: var(--ink-2); &:hover { background: var(--primary-tint); color: var(--primary) }' 
                    : 'cursor: not-allowed; opacity: 0.35'"
                  :disabled="!cell.available"
                  @click="apptForm.date = cell.iso"
                >
                  <span>{{ cell.day }}</span>
                  <span class="size-1 rounded-full" :style="cell.available ? (apptForm.date === cell.iso ? 'background: rgba(255,255,255,0.7)' : 'background: var(--primary)') : 'background: transparent'" />
                </button>
              </template>
            </div>
          </div>
          <span v-if="apptErrors.date" class="text-xs" style="color: var(--danger)">{{ apptErrors.date }}</span>
        </template>
      </div>

      <!-- Adım 3: Saat -->
      <div v-else-if="apptStep === 3" class="space-y-4">
        <div v-if="slotsLoading" class="flex justify-center py-8">
          <div class="size-8 animate-spin rounded-full" style="border: 2px solid var(--primary); border-top-color: transparent" />
        </div>
        <div v-else-if="availableSlots.length === 0" class="rounded-xl p-4 text-center text-sm" style="border: 1px solid var(--warning); background: var(--warning-tint); color: var(--warning)">
          {{ t('packageDetailView.wizard.timeSelect.empty') }}
        </div>
        <template v-else>
          <div v-for="group in slotGroups" :key="group.label" class="space-y-2">
            <h3 class="text-xs font-semibold uppercase tracking-wider" style="color: var(--ink-4)">{{ group.label }}</h3>
            <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
              <button
                v-for="slot in group.slots"
                :key="slot.startTime"
                type="button"
                class="flex flex-col items-center rounded-xl px-2 py-2.5 text-center transition"
                :style="apptForm.time === slot.startTime 
                  ? 'border: 1px solid var(--primary); background: var(--primary); color: white; box-shadow: var(--shadow-1)' 
                  : 'border: 1px solid var(--hairline); color: var(--ink-2); &:hover { border-color: var(--primary); background: var(--primary-tint) }'"
                @click="apptForm.time = slot.startTime"
              >
                <span class="text-sm font-semibold tabular-nums">{{ slot.startTime.slice(11, 16) }}</span>
                <span class="mt-0.5 text-[0.65rem] tabular-nums" :style="apptForm.time === slot.startTime ? 'color: rgba(255,255,255,0.7)' : 'color: var(--ink-4)'">→ {{ slot.endTime.slice(11, 16) }}</span>
              </button>
            </div>
          </div>
          <span v-if="apptErrors.time" class="text-xs" style="color: var(--danger)">{{ apptErrors.time }}</span>
        </template>
      </div>

      <!-- Adım 4: Özet & Onay -->
      <div v-else-if="apptStep === 4" class="space-y-4">
        <div class="rounded-xl p-4 space-y-2 text-sm" style="border: 1px solid var(--primary-tint); background: var(--primary-tint)">
          <div class="flex justify-between">
            <span style="color: var(--ink-3)">{{ t('packageDetailView.wizard.summary.customer') }}</span>
            <span class="font-semibold" style="color: var(--ink-2)">{{ resolveCustomerName(apptTargetPkg?.customerId) }}</span>
          </div>
          <div class="flex justify-between">
            <span style="color: var(--ink-3)">{{ t('packageDetailView.wizard.summary.employee') }}</span>
            <span class="font-semibold" style="color: var(--ink-2)">{{ resolveEmployeeName(apptForm.employeeId) }}</span>
          </div>
          <div class="flex justify-between">
            <span style="color: var(--ink-3)">{{ t('packageDetailView.wizard.summary.service') }}</span>
            <span class="font-semibold" style="color: var(--ink-2)">{{ resolveServiceName(template?.serviceId) }}</span>
          </div>
          <div class="flex justify-between">
            <span style="color: var(--ink-3)">{{ t('packageDetailView.wizard.summary.dateTime') }}</span>
            <span class="font-semibold" style="color: var(--ink-2)">{{ formatApptDateTime(apptForm.date, apptForm.time) }}</span>
          </div>
          <div v-if="apptTargetSession" class="flex justify-between">
            <span style="color: var(--ink-3)">{{ t('packageDetailView.wizard.summary.packageSession') }}</span>
            <span class="font-semibold" style="color: var(--primary)">{{ t('packageDetailView.wizard.summary.sessionNumber', { n: apptTargetSession.sessionNumber }) }}</span>
          </div>
        </div>
        <p v-if="apptSubmitError" class="text-xs" style="color: var(--danger)" role="alert">{{ apptSubmitError }}</p>
      </div>

      <template #footer>
        <AppButton variant="secondary" @click="apptStep === 1 ? showAppointmentModal = false : apptStep--">
          {{ apptStep === 1 ? t('packageDetailView.wizard.action.cancel') : t('packageDetailView.wizard.action.back') }}
        </AppButton>
        <AppButton v-if="apptStep < 4" variant="primary" :disabled="datesLoading || slotsLoading" @click="apptWizardNext">
          {{ t('packageDetailView.wizard.action.next') }}
        </AppButton>
        <AppButton v-else variant="primary" :loading="apptSaving" @click="submitAppointment">
          {{ t('packageDetailView.wizard.action.submit') }}
        </AppButton>
      </template>
    </AppModal>

    <!-- ── Müşteriye paket atama modal ── -->
    <AppModal v-model:visible="showAssignModal" :title="t('packageDetailView.modal.assign.title')" :dialog-style="{ width: 'min(30rem, 95vw)' }">
      <div class="space-y-4">
        <div class="space-y-1">
          <label for="assign-customer-search" class="block text-sm font-medium" style="color: var(--ink-2)">
            {{ t('packageDetailView.modal.assign.customerLabel') }} <span style="color: var(--danger)">{{ t('packageDetailView.modal.assign.customerRequired') }}</span>
          </label>
          <input
            id="assign-customer-search"
            v-model="assignSearch"
            type="search"
            :placeholder="t('packageDetailView.modal.assign.customerPlaceholder')"
            class="w-full rounded-lg px-3 py-2 text-sm"
            style="border: 1px solid var(--hairline); &:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 1px var(--primary) }"
          />
          <ul class="mt-1 max-h-48 overflow-y-auto rounded-lg" style="border: 1px solid var(--hairline); background: var(--surface)">
            <li v-if="filteredAssignCustomers.length === 0" class="px-3 py-2 text-center text-xs" style="color: var(--ink-4)">{{ t('packageDetailView.modal.assign.empty') }}</li>
            <li
              v-for="c in filteredAssignCustomers"
              :key="c.id"
              class="flex cursor-pointer items-center gap-2.5 px-3 py-2 transition"
              :style="assignCustomerId === c.id ? 'background: var(--primary-tint)' : '&:hover { background: var(--surface-2) }'"
              @click="assignCustomerId = c.id"
            >
              <div class="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" :style="{ backgroundColor: avatarColor(c.id) }">{{ c.name.charAt(0) }}</div>
              <div>
                <p class="text-sm font-medium" style="color: var(--ink-2)">{{ c.name }}</p>
                <p class="text-xs" style="color: var(--ink-4)">{{ c.phoneNumber }}</p>
              </div>
              <div v-if="assignCustomerId === c.id" class="ml-auto size-4 rounded-full" style="background: var(--primary)" />
            </li>
          </ul>
        </div>
        <p v-if="assignError" class="text-xs" style="color: var(--danger)" role="alert">{{ assignError }}</p>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showAssignModal = false">{{ t('packageDetailView.modal.assign.cancel') }}</AppButton>
        <AppButton variant="primary" :loading="assignSaving" :disabled="!assignCustomerId" @click="doAssignPackage">{{ t('packageDetailView.modal.assign.submit') }}</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import {
  ChevronLeft, ChevronDown, ChevronRight, Scissors, Hash, Tag, Plus,
  CalendarPlus, Check,
} from 'lucide-vue-next'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { packageTemplateApi, type PackageTemplateResponse } from '@/api/packageTemplate'
import { packageApi } from '@/api/customerPackage'
import { packageSessionApi, type PackageSessionResponse } from '@/api/packageSession'
import { customerApi, type CustomerResponse, type PackageResponse } from '@/api/customer'
import { serviceApi, type ServiceResponse } from '@/api/service'
import { employeeApi, type EmployeeResponse } from '@/api/employee'
import { appointmentApi } from '@/api/appointment'
import { fetchAllPageContent } from '@/api/client'
import { publicApi, type AvailableSlotResponse } from '@/api/public'
import { businessApi } from '@/api/business'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()
const businessId = computed(() => auth.user?.businessId ?? null)
const templateId = computed(() => Number(route.params.id))

const dayAbbreviations = computed(() => [
  t('packageDetailView.wizard.dateSelect.days.mon'),
  t('packageDetailView.wizard.dateSelect.days.tue'),
  t('packageDetailView.wizard.dateSelect.days.wed'),
  t('packageDetailView.wizard.dateSelect.days.thu'),
  t('packageDetailView.wizard.dateSelect.days.fri'),
  t('packageDetailView.wizard.dateSelect.days.sat'),
  t('packageDetailView.wizard.dateSelect.days.sun'),
])

// ── Data ──────────────────────────────────────────────────────────────────────
const template = ref<PackageTemplateResponse | null>(null)
const packageOwners = ref<PackageResponse[]>([])
const customers = ref<CustomerResponse[]>([])
const services = ref<ServiceResponse[]>([])
const employees = ref<EmployeeResponse[]>([])
const loading = ref(true)
const pageError = ref('')
const empLoading = ref(false)

// ── Expand state ──────────────────────────────────────────────────────────────
const expandedPackageId = ref<number | null>(null)
const sessionsByPkg = ref<Record<number, PackageSessionResponse[]>>({})
const sessionsLoading = ref<Record<number, boolean>>({})

// ── Filter ────────────────────────────────────────────────────────────────────
type OwnerFilter = 'all' | 'active' | 'low' | 'expired'
const OWNER_FILTERS = computed<{ value: OwnerFilter; label: string }[]>(() => [
  { value: 'all', label: t('packageDetailView.filter.all') },
  { value: 'active', label: t('packageDetailView.filter.active') },
  { value: 'low', label: t('packageDetailView.filter.low') },
  { value: 'expired', label: t('packageDetailView.filter.expired') },
])
const ownerFilter = ref<OwnerFilter>('all')

const activeOwners = computed(() => packageOwners.value.filter(p => !p.expired && p.remainingSessions > 0))
const totalRemaining = computed(() => packageOwners.value.reduce((s, p) => s + p.remainingSessions, 0))
const totalUsed = computed(() => packageOwners.value.reduce((s, p) => s + (p.totalSessions - p.remainingSessions), 0))

const filteredOwners = computed(() => {
  if (ownerFilter.value === 'active') return activeOwners.value
  if (ownerFilter.value === 'low') return packageOwners.value.filter(p => p.lowOnSessions && !p.expired)
  if (ownerFilter.value === 'expired') return packageOwners.value.filter(p => p.expired)
  return packageOwners.value
})

// ── Lookups ───────────────────────────────────────────────────────────────────
const customerMap = computed(() => {
  const m = new Map<number, CustomerResponse>()
  for (const c of customers.value) m.set(c.id, c)
  return m
})
const serviceMap = computed(() => {
  const m = new Map<number, string>()
  for (const s of services.value) m.set(s.id, s.name)
  return m
})
const employeeMap = computed(() => {
  const m = new Map<number, string>()
  for (const e of employees.value) m.set(e.id, e.name)
  return m
})

const AVATAR_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#06b6d4']
function avatarColor(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length] }
function resolveCustomerName(id?: number): string { return id == null ? '—' : (customerMap.value.get(id)?.name ?? t('common.customerFallback', { id })) }
function resolveCustomerPhone(id: number): string { return customerMap.value.get(id)?.phoneNumber ?? '' }
function resolveServiceName(id?: number): string { return id == null ? '—' : (serviceMap.value.get(id) ?? t('common.serviceFallback', { id })) }
function resolveEmployeeName(id?: number | ''): string { return id == null || id === '' ? '—' : (employeeMap.value.get(id as number) ?? t('common.employeeFallback', { id })) }

function sessionsPercent(p: PackageResponse): number {
  return p.totalSessions === 0 ? 0 : Math.round((p.remainingSessions / p.totalSessions) * 100)
}
function packageExpiryLine(iso: string | null | undefined): string {
  if (!iso?.trim()) return t('packageDetailView.expiry.unlimited')
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? t('packageDetailView.expiry.unlimited') : t('packageDetailView.expiry.until', { date: new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short' }).format(d) })
}
function formatPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(price)
}
function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
}
function sessionStatusLabel(s: string): string {
  return t(`packageDetailView.sessionStatus.${s}` as any, s)
}

// ── Expand / sessions ─────────────────────────────────────────────────────────
async function toggleExpand(pkgId: number) {
  if (expandedPackageId.value === pkgId) {
    expandedPackageId.value = null
    return
  }
  expandedPackageId.value = pkgId
  if (sessionsByPkg.value[pkgId]) return
  sessionsLoading.value = { ...sessionsLoading.value, [pkgId]: true }
  try {
    const { data } = await packageSessionApi.listByPackage(pkgId)
    if (data.success && data.data) sessionsByPkg.value = { ...sessionsByPkg.value, [pkgId]: data.data }
  } catch { /* silent */ } finally {
    sessionsLoading.value = { ...sessionsLoading.value, [pkgId]: false }
  }
}

// ── Assign package to customer ────────────────────────────────────────────────
const showAssignModal = ref(false)
const assignSearch = ref('')
const assignCustomerId = ref<number | null>(null)
const assignSaving = ref(false)
const assignError = ref('')

const filteredAssignCustomers = computed(() => {
  const q = assignSearch.value.trim().toLowerCase()
  const base = customers.value.filter(c => !c.blacklisted)
  if (!q) return base.slice(0, 20)
  return base.filter(c => c.name.toLowerCase().includes(q) || c.phoneNumber.includes(q)).slice(0, 20)
})

function openCreateForCustomer() {
  assignSearch.value = ''
  assignCustomerId.value = null
  assignError.value = ''
  showAssignModal.value = true
}

async function doAssignPackage() {
  if (!assignCustomerId.value || !templateId.value) return
  assignSaving.value = true
  assignError.value = ''
  try {
    await packageApi.createFromTemplate({ customerId: assignCustomerId.value, templateId: templateId.value })
    showAssignModal.value = false
    await loadOwners()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: { message?: string } } } }
    assignError.value = err.response?.data?.error?.message ?? t('packageDetailView.modal.assign.error')
  } finally {
    assignSaving.value = false
  }
}

// ── Appointment wizard ────────────────────────────────────────────────────────
const WIZARD_LABELS = computed(() => [
  t('packageDetailView.wizard.step.employee'),
  t('packageDetailView.wizard.step.date'),
  t('packageDetailView.wizard.step.time'),
  t('packageDetailView.wizard.step.summary'),
])

const showAppointmentModal = ref(false)
const apptStep = ref(1)
const apptTargetPkg = ref<PackageResponse | null>(null)
const apptTargetSession = ref<PackageSessionResponse | null>(null)
const apptForm = ref({ employeeId: '' as number | '', date: '', time: '' })
const apptErrors = ref<Record<string, string>>({})
const apptSubmitError = ref('')
const apptSaving = ref(false)

const businessSlug = ref<string | null>(null)
const maxDays = ref(60)
const availableDates = ref<string[]>([])
const datesLoading = ref(false)
const availableSlots = ref<AvailableSlotResponse[]>([])
const slotsLoading = ref(false)
const calMonthIdx = ref(0)
const empCapabilities = ref<{ serviceId: number; active: boolean }[]>([])

const availableMonths = computed(() => {
  const seen = new Set<string>()
  return availableDates.value.reduce((acc: string[], d) => {
    const m = d.slice(0, 7)
    if (!seen.has(m)) { seen.add(m); acc.push(m) }
    return acc
  }, [])
})
const currentMonthLabel = computed(() => {
  const m = availableMonths.value[calMonthIdx.value]
  if (!m) return ''
  const [y, mo] = m.split('-').map(Number)
  return new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(new Date(y, mo - 1))
})
const calCells = computed(() => {
  const month = availableMonths.value[calMonthIdx.value]
  if (!month) return []
  const set = new Set(availableDates.value)
  const [y, mo] = month.split('-').map(Number)
  const start = new Date(y, mo - 1, 1)
  const end = new Date(y, mo, 0)
  let dow = start.getDay(); dow = dow === 0 ? 6 : dow - 1
  const cells: { iso: string | null; day: number; available: boolean; index: number }[] = []
  let idx = 0
  for (let i = 0; i < dow; i++) cells.push({ iso: null, day: 0, available: false, index: idx++ })
  const cur = new Date(start)
  while (cur <= end) {
    const iso = cur.toISOString().slice(0, 10)
    cells.push({ iso, day: cur.getDate(), available: set.has(iso), index: idx++ })
    cur.setDate(cur.getDate() + 1)
  }
  return cells
})
const slotGroups = computed(() => {
  const m: AvailableSlotResponse[] = [], a: AvailableSlotResponse[] = [], e: AvailableSlotResponse[] = []
  for (const s of availableSlots.value) {
    const h = Number(s.startTime.slice(11, 13))
    if (h < 12) m.push(s); else if (h < 17) a.push(s); else e.push(s)
  }
  return [
    { label: t('packageDetailView.wizard.timeSelect.morning'), slots: m },
    { label: t('packageDetailView.wizard.timeSelect.afternoon'), slots: a },
    { label: t('packageDetailView.wizard.timeSelect.evening'), slots: e }
  ].filter(g => g.slots.length > 0)
})

function formatApptDateTime(date: string, time: string): string {
  if (!date || !time) return '—'
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(`${date}T${time.slice(11, 16)}:00`))
}

async function selectEmpForAppt(empId: number) {
  apptForm.value.employeeId = empId
  empCapabilities.value = []
  try {
    const res = await employeeApi.getCapabilities(empId)
    if (res.data.success && res.data.data) empCapabilities.value = res.data.data
  } catch { /* silent */ }
}

async function loadDates() {
  if (!businessId.value || !template.value) return
  datesLoading.value = true
  availableDates.value = []
  apptForm.value.date = ''
  calMonthIdx.value = 0
  try {
    const slug = businessSlug.value
    if (!slug) return
    const svcId = template.value.serviceId
    const empId =
      apptForm.value.employeeId === '' ? undefined : Number(apptForm.value.employeeId)
    const res = await publicApi.getAvailableDates(
      slug,
      svcId,
      maxDays.value,
      empId !== undefined && !Number.isNaN(empId) ? empId : undefined,
    )
    if (res.data.success && res.data.data) availableDates.value = res.data.data
  } catch { /* silent */ } finally { datesLoading.value = false }
}

async function loadSlots() {
  if (!businessId.value || !template.value) return
  slotsLoading.value = true
  availableSlots.value = []
  apptForm.value.time = ''
  try {
    const slug = businessSlug.value
    if (!slug) return
    const svcId = template.value.serviceId
    const empId =
      apptForm.value.employeeId === '' ? undefined : Number(apptForm.value.employeeId)
    const res = await publicApi.getAvailableSlots(
      slug,
      svcId,
      apptForm.value.date,
      empId !== undefined && !Number.isNaN(empId) ? empId : undefined,
    )
    if (res.data.success && res.data.data) availableSlots.value = res.data.data
  } catch { /* silent */ } finally { slotsLoading.value = false }
}

async function apptWizardNext() {
  apptErrors.value = {}
  if (apptStep.value === 1) {
    if (apptForm.value.employeeId === '') { apptErrors.value.employeeId = t('packageDetailView.wizard.employeeSelect.error'); return }
    await loadDates()
    apptStep.value = 2
  } else if (apptStep.value === 2) {
    if (!apptForm.value.date) { apptErrors.value.date = t('packageDetailView.wizard.dateSelect.error'); return }
    await loadSlots()
    apptStep.value = 3
  } else if (apptStep.value === 3) {
    if (!apptForm.value.time) { apptErrors.value.time = t('packageDetailView.wizard.timeSelect.error'); return }
    apptStep.value = 4
  }
}

async function submitAppointment() {
  if (!businessId.value || !apptTargetPkg.value || !template.value) return
  apptSaving.value = true
  apptSubmitError.value = ''
  try {
    const { data } = await appointmentApi.create({
      customerId: apptTargetPkg.value.customerId,
      employeeId: Number(apptForm.value.employeeId),
      serviceId: template.value.serviceId,
      scheduledAt: apptForm.value.time.slice(0, 19),
      source: 'PHONE',
    })
    if (!data.success || !data.data) throw new Error(data.error?.message ?? 'Randevu oluşturulamadı.')
    const createdId = data.data.id
    if (apptTargetSession.value) {
      try {
        await packageSessionApi.assign(apptTargetPkg.value.id, apptTargetSession.value.id, { appointmentId: createdId })
      } catch { /* seans ataması başarısız olsa da randevu oluşturuldu */ }
    }
    showAppointmentModal.value = false
    sessionsByPkg.value = { ...sessionsByPkg.value, [apptTargetPkg.value.id]: [] }
    await loadOwners()
    expandedPackageId.value = apptTargetPkg.value.id
    await toggleExpand(apptTargetPkg.value.id)
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: { message?: string } } } }
    apptSubmitError.value = err.response?.data?.error?.message ?? (e instanceof Error ? e.message : 'Randevu oluşturulamadı.')
  } finally {
    apptSaving.value = false
  }
}

function openAppointmentWizard(pkg: PackageResponse) {
  apptTargetPkg.value = pkg
  apptTargetSession.value = null
  resetApptWizard()
  showAppointmentModal.value = true
}

function openAppointmentWizardForSession(pkg: PackageResponse, session: PackageSessionResponse) {
  apptTargetPkg.value = pkg
  apptTargetSession.value = session
  resetApptWizard()
  showAppointmentModal.value = true
}

function resetApptWizard() {
  apptStep.value = 1
  apptForm.value = { employeeId: '', date: '', time: '' }
  apptErrors.value = {}
  apptSubmitError.value = ''
  availableDates.value = []
  availableSlots.value = []
  calMonthIdx.value = 0
}

// ── Load ──────────────────────────────────────────────────────────────────────
async function loadOwners() {
  if (!templateId.value) return
  try {
    const { data } = await packageApi.listByTemplate(templateId.value)
    if (data.success && data.data) packageOwners.value = data.data
  } catch { /* silent */ }
}

async function load() {
  if (!businessId.value) return
  loading.value = true
  pageError.value = ''
  try {
    const [tplRes, custList, svcRes, bizRes] = await Promise.all([
      packageTemplateApi.list(),
      fetchAllPageContent((page, size) => customerApi.list({ page, size })),
      serviceApi.list(),
      businessApi.getById(businessId.value),
    ])
    const tplList = tplRes.data.success && tplRes.data.data ? tplRes.data.data : []
    template.value = tplList.find((t) => t.id === templateId.value) ?? null
    customers.value = custList
    services.value = svcRes.data.success && svcRes.data.data ? svcRes.data.data : []
    if (bizRes.data.success && bizRes.data.data) {
      businessSlug.value = bizRes.data.data.slug
      maxDays.value = bizRes.data.data.maxAdvanceBookingDays
    }
    await loadOwners()

    empLoading.value = true
    employees.value = await fetchAllPageContent((page, size) =>
      employeeApi.list({ activeOnly: true, page, size }),
    )
    empLoading.value = false
  } catch {
    pageError.value = t('packageDetailView.error.load')
  } finally {
    loading.value = false
  }
}

onMounted(() => { if (businessId.value) load() })
</script>

<style scoped>
.back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--r-md);
  border: 1px solid var(--hairline);
  background: var(--surface);
  color: var(--ink-3);
  cursor: pointer;
  transition: background 0.15s;
}
.back-btn:hover {
  background: var(--surface-2);
}

.card {
  border-radius: var(--r-xl);
  border: 1px solid var(--hairline);
  background: var(--surface);
  padding: 1.25rem;
  box-shadow: var(--shadow-1);
}

.pill {
  padding: 4px 10px;
  border-radius: var(--r-full);
  font-size: 11px;
  font-weight: 600;
}
.pill--active {
  background: var(--success-tint);
  color: var(--success);
}
.pill--passive {
  background: var(--surface-2);
  color: var(--ink-3);
}
.pill--low {
  background: var(--warning-tint);
  color: var(--warning);
}
.pill--expired {
  background: var(--surface-2);
  color: var(--ink-3);
}
</style>
