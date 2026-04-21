<template>
  <div class="customers-page space-y-6">
    <!-- Page header -->
    <SectionHeader :title="t('customersView.title')" :subtitle="headerSubtitle">
      <template #actions>
        <AppButton
          v-if="businessId && !loading && !listError"
          variant="primary"
          @click="openCreate"
        >
          <Plus :size="14" :stroke-width="2.4" aria-hidden="true" />
          {{ t('customersView.action.new') }}
        </AppButton>
      </template>
    </SectionHeader>

    <div v-if="!businessId" class="empty-state"><p>{{ t('customersView.noBusiness') }}</p></div>

    <template v-else>
      <div v-if="loading" class="loading-state" aria-busy="true">
        <div class="skeleton-card" v-for="i in 4" :key="i" />
      </div>
      <div v-else-if="listError" class="error-state" role="alert">
        <p>{{ listError }}</p>
        <AppButton variant="primary" @click="loadList">{{ t('customersView.error.retry') }}</AppButton>
      </div>

      <!-- Two-pane layout -->
      <div v-else class="layout">
        <!-- Left: customer table -->
        <div class="list-pane">
          <div class="list-toolbar">
            <div class="search-wrap">
              <Search :size="15" aria-hidden="true" class="search-icon" />
              <input
                v-model="searchQuery"
                type="search"
                class="search-input"
                :placeholder="t('customersView.search.placeholder')"
                :aria-label="t('customersView.search.aria')"
              />
            </div>
            <button
              type="button"
              class="filter-btn"
              :class="{ 'filter-btn--active': filterPanelOpen || activeFilter !== 'all' }"
              :aria-pressed="filterPanelOpen"
              :aria-label="t('customersView.toolbar.filterToggleAria')"
              @click="filterPanelOpen = !filterPanelOpen"
            >
              <ListFilter :size="14" aria-hidden="true" />
              {{ t('customersView.toolbar.filter') }}
              <span v-if="activeFilter !== 'all'" class="filter-btn__badge">1</span>
            </button>
          </div>

          <div v-if="filterPanelOpen" class="filter-chip-row" role="radiogroup" :aria-label="t('customersView.toolbar.filter')">
            <button
              v-for="opt in filterOptions"
              :key="opt.value"
              type="button"
              role="radio"
              :aria-checked="activeFilter === opt.value"
              class="filter-chip"
              :class="{ 'filter-chip--active': activeFilter === opt.value }"
              @click="activeFilter = opt.value"
            >
              {{ opt.label }}
              <span class="filter-chip__count">{{ opt.count }}</span>
            </button>
          </div>

          <div class="list-meta">
            <span class="count-label">{{ t('customersView.list.count', { n: filteredCustomers.length }) }}</span>
          </div>

          <div v-if="filteredCustomers.length === 0 && customers.length === 0" class="empty-list">
            <p class="empty-title">{{ t('customersView.list.empty') }}</p>
            <p class="empty-desc">{{ t('customersView.list.emptyDesc') }}</p>
            <AppButton size="sm" variant="primary" @click="openCreate">{{ t('customersView.list.emptyAction') }}</AppButton>
          </div>
          <div v-else-if="filteredCustomers.length === 0" class="empty-list">
            <p>{{ t('customersView.list.noResults', { q: searchQuery }) }}</p>
          </div>

          <div v-else class="customer-table-scroll">
            <table class="customer-table" :aria-label="t('customersView.list.aria')">
              <thead>
                <tr>
                  <th scope="col">{{ t('customersView.table.name') }}</th>
                  <th scope="col">{{ t('customersView.table.tag') }}</th>
                  <th scope="col" class="customer-table__th-right">{{ t('customersView.table.joined') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="c in filteredCustomers"
                  :key="c.id"
                  class="customer-row"
                  :class="{
                    'customer-row--selected': selectedCustomer?.id === c.id,
                    'customer-row--blacklisted': c.blacklisted,
                  }"
                  role="button"
                  tabindex="0"
                  :aria-pressed="selectedCustomer?.id === c.id"
                  :aria-label="c.name"
                  @click="selectCustomer(c)"
                  @keydown.enter.prevent="selectCustomer(c)"
                  @keydown.space.prevent="selectCustomer(c)"
                >
                  <td>
                    <div class="customer-row__main">
                      <span class="customer-avatar" :class="avatarColor(c.id)" aria-hidden="true">
                        {{ customerInitial(c.name) }}
                      </span>
                      <div class="customer-row__info">
                        <div class="customer-row__name-line">
                          <span class="customer-row__name">{{ c.name }}</span>
                          <PackageIcon
                            v-if="customerHasPackage(c.id)"
                            :size="13"
                            class="customer-row__pkg-icon"
                            aria-hidden="true"
                          />
                        </div>
                        <span class="customer-row__phone">{{ c.phoneNumber }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="customer-row__tags">
                      <span
                        v-for="tag in customerTags(c)"
                        :key="tag.id"
                        class="badge"
                        :class="tag.variant"
                      >{{ tag.label }}</span>
                    </div>
                  </td>
                  <td class="customer-row__date">{{ formatRelativeDate(c.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right: detail pane -->
        <div class="detail-pane">
          <div v-if="!selectedCustomer" class="detail-empty">
            <div class="detail-empty-icon" aria-hidden="true">◎</div>
            <p>{{ t('customersView.detail.empty') }}</p>
          </div>

          <template v-else>
            <!-- Hero header (prototype'a uygun) -->
            <div class="detail-hero">
              <div class="detail-hero-avatar" :class="avatarColor(selectedCustomer.id)" aria-hidden="true">
                {{ customerInitial(selectedCustomer.name) }}
              </div>
              <h2 class="detail-hero-name">{{ selectedCustomer.name }}</h2>
              <a :href="'tel:' + selectedCustomer.phoneNumber" class="detail-hero-phone">
                {{ selectedCustomer.phoneNumber }}
              </a>
              <div v-if="heroBadges.length" class="detail-hero-badges">
                <span
                  v-for="tag in heroBadges"
                  :key="tag.id"
                  class="badge"
                  :class="tag.variant"
                >{{ tag.label }}</span>
                <span v-if="selectedCustomer.noShowCount > 0" class="badge muted">
                  {{ t('customersView.badge.noShowCount', { n: selectedCustomer.noShowCount }) }}
                </span>
              </div>
              <div class="detail-hero-actions">
                <RouterLink
                  :to="{ name: 'AdminAppointments', query: { new: '1' } }"
                  class="hero-action hero-action--primary"
                >
                  <Plus :size="13" :stroke-width="2.4" aria-hidden="true" />
                  {{ t('customersView.hero.appointment') }}
                </RouterLink>
                <a
                  :href="'tel:' + selectedCustomer.phoneNumber"
                  class="hero-action hero-action--icon"
                  :aria-label="t('customersView.hero.callAria', { name: selectedCustomer.name })"
                >
                  <Phone :size="14" aria-hidden="true" />
                </a>
                <div class="hero-more">
                  <button
                    type="button"
                    class="hero-action hero-action--icon"
                    :aria-label="t('customersView.detail.moreActions')"
                    :aria-expanded="moreMenuOpen"
                    aria-haspopup="menu"
                    @click="moreMenuOpen = !moreMenuOpen"
                  >
                    <MoreHorizontal :size="14" aria-hidden="true" />
                  </button>
                  <div v-if="moreMenuOpen" class="hero-more-menu" role="menu" @click="moreMenuOpen = false">
                    <button type="button" role="menuitem" class="hero-more-item" @click="openEdit(selectedCustomer)">
                      {{ t('customersView.action.edit') }}
                    </button>
                    <button
                      v-if="!selectedCustomer.blacklisted"
                      type="button"
                      role="menuitem"
                      class="hero-more-item hero-more-item--danger"
                      @click="openBlacklist(selectedCustomer)"
                    >
                      {{ t('customersView.action.blacklist') }}
                    </button>
                    <button
                      v-else
                      type="button"
                      role="menuitem"
                      class="hero-more-item"
                      @click="doRemoveBlacklist(selectedCustomer)"
                    >
                      {{ t('customersView.action.removeBlacklist') }}
                    </button>
                    <button
                      v-if="selectedCustomer.noShowForcesManualApproval"
                      type="button"
                      role="menuitem"
                      class="hero-more-item"
                      @click="doClearNoShowApproval(selectedCustomer)"
                    >
                      {{ t('customersView.action.clearApproval') }}
                    </button>
                    <button type="button" role="menuitem" class="hero-more-item hero-more-item--danger" @click="openDeleteConfirm(selectedCustomer)">
                      {{ t('customersView.action.delete') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3 stat blocks -->
            <div class="detail-stats">
              <div class="detail-stat">
                <div class="detail-stat__value">{{ apptLoading ? '—' : detailStats.total }}</div>
                <div class="detail-stat__label">{{ t('customersView.stat.visits') }}</div>
              </div>
              <div class="detail-stat">
                <div class="detail-stat__value">{{ apptLoading ? '—' : detailStats.completed }}</div>
                <div class="detail-stat__label">{{ t('customersView.stat.completed') }}</div>
              </div>
              <div class="detail-stat">
                <div class="detail-stat__value">{{ packagesLoading ? '—' : detailStats.pkgCount }}</div>
                <div class="detail-stat__label">{{ t('customersView.stat.packages') }}</div>
              </div>
            </div>

            <!-- Compact active package card (prototype) -->
            <div v-if="primaryActivePackage" class="active-pkg-card">
              <div class="active-pkg-card__head">
                <div class="active-pkg-card__title-wrap">
                  <PackageIcon :size="14" class="active-pkg-card__icon" aria-hidden="true" />
                  <span class="active-pkg-card__title">{{ primaryActivePackage.name }}</span>
                </div>
                <span class="active-pkg-card__count">
                  {{ primaryActivePackage.totalSessions - primaryActivePackage.remainingSessions }} / {{ primaryActivePackage.totalSessions }}
                </span>
              </div>
              <div class="active-pkg-card__bar" aria-hidden="true">
                <div class="active-pkg-card__fill" :style="{ width: usedSessionsPercent(primaryActivePackage) + '%' }" />
              </div>
            </div>

            <!-- Notes (varsa, compact) -->
            <div v-if="selectedCustomer.notes" class="note-card">
              <span class="note-card__label">{{ t('customersView.detail.noteLabel') }}</span>
              <p class="note-card__text">{{ selectedCustomer.notes }}</p>
            </div>

            <!-- Compact contact info -->
            <div class="info-rows">
              <div class="info-row">
                <span class="info-row__label">{{ t('customersView.field.phone') }}</span>
                <a :href="'tel:' + selectedCustomer.phoneNumber" class="info-row__value info-row__value--link">
                  {{ selectedCustomer.phoneNumber }}
                </a>
              </div>
              <div v-if="selectedCustomer.email" class="info-row">
                <span class="info-row__label">{{ t('customersView.field.email') }}</span>
                <a :href="'mailto:' + selectedCustomer.email" class="info-row__value info-row__value--link">
                  {{ selectedCustomer.email }}
                </a>
              </div>
              <div v-if="selectedCustomer.address" class="info-row">
                <span class="info-row__label">{{ t('customersView.field.address') }}</span>
                <span class="info-row__value">{{ selectedCustomer.address }}</span>
              </div>
              <div v-if="selectedCustomer.nationalIdMasked" class="info-row">
                <span class="info-row__label">{{ t('customersView.field.nationalId') }}</span>
                <span class="info-row__value mono">{{ selectedCustomer.nationalIdMasked }}</span>
              </div>
              <div class="info-row">
                <span class="info-row__label">{{ t('customersView.field.createdAt') }}</span>
                <span class="info-row__value">{{ formatDate(selectedCustomer.createdAt) }}</span>
              </div>
              <div v-if="selectedCustomer.blacklistReason" class="info-row info-row--danger">
                <span class="info-row__label">{{ t('customersView.field.blacklistReason') }}</span>
                <span class="info-row__value">{{ selectedCustomer.blacklistReason }}</span>
              </div>
            </div>

            <!-- Packages section -->
            <div class="detail-section">
              <div class="detail-section-head">
                <h3 class="detail-section-title">{{ t('customersView.section.packages') }}</h3>
                <AppButton variant="primary" size="sm" @click="openAddPackage(selectedCustomer)">
                  {{ t('customersView.action.assignPackage') }}
                </AppButton>
              </div>

              <div v-if="packagesLoading" class="loading-inline" aria-busy="true">
                <div class="skeleton-row" v-for="i in 2" :key="i" />
              </div>
              <div v-else-if="customerPackages.length === 0" class="section-empty">
                {{ t('customersView.package.empty') }}
              </div>
              <ul v-else class="pkg-list">
                <li v-for="p in customerPackages" :key="p.id" class="pkg-card" :class="{ expired: p.expired }">
                  <div class="pkg-card-head">
                    <div class="pkg-card-name-row">
                      <span class="pkg-card-name">{{ p.name }}</span>
                      <span v-if="p.expired" class="badge inactive">{{ t('customersView.package.statusExpired') }}</span>
                      <span v-else-if="p.lowOnSessions" class="badge warning">{{ t('customersView.package.statusLow') }}</span>
                      <span v-else class="badge active">{{ t('customersView.package.statusActive') }}</span>
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
                      {{ t('customersView.package.sessionsRemaining', { remaining: p.remainingSessions, total: p.totalSessions }) }}
                    </span>
                  </div>

                  <!-- Seans listesi -->
                  <div v-if="sessionsByPackageId[p.id]?.length" class="pkg-sessions-list">
                    <div class="pkg-sessions-head">{{ t('customersView.session.title') }}</div>
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
                              class="app-select session-assign-select"
                              :aria-label="t('customersView.session.selectAppointment')"
                            >
                              <option value="">{{ t('customersView.session.assignPlaceholder') }}</option>
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
                              {{ t('customersView.session.assignAction') }}
                            </AppButton>
                            <RouterLink
                              v-else
                              :to="{ name: 'AdminAppointments', query: { createFor: selectedCustomer?.id } }"
                              class="session-new-appt-btn"
                            >
                              {{ t('customersView.session.createAppointment') }}
                            </RouterLink>
                          </div>
                        </template>
                        <template v-else-if="s.status === 'SCHEDULED' && s.appointmentId">
                          <AppButton
                            variant="secondary"
                            size="sm"
                            @click="unassignSessionFromAppointment(p.id, s.id)"
                          >
                            {{ t('customersView.session.unassign') }}
                          </AppButton>
                        </template>
                      </li>
                    </ul>
                  </div>

                  <div class="pkg-card-footer">
                    <span class="pkg-expires">{{ p.expiresAt ? t('customersView.package.expiry', { date: formatDate(p.expiresAt) }) : t('customersView.package.expiryNone') }}</span>
                    <div class="pkg-session-actions" v-if="!p.expired">
                      <button
                        type="button"
                        class="session-btn"
                        :disabled="p.remainingSessions <= 0"
                        @click="deductSession(p)"
                        :aria-label="t('customersView.package.deductLabel', { name: p.name })"
                        :title="t('customersView.package.deductTitle')"
                      >
                        −1
                      </button>
                      <button
                        type="button"
                        class="session-btn add"
                        @click="addSession(p)"
                        :aria-label="t('customersView.package.addLabel', { name: p.name })"
                        :title="t('customersView.package.addTitle')"
                      >
                        +1
                      </button>
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <!-- Appointment history (compact, prototype) -->
            <div class="detail-section">
              <h3 class="detail-section-title">{{ t('customersView.section.appointments') }}</h3>
              <div v-if="apptLoading" class="loading-inline" aria-busy="true">
                <div class="skeleton-row" v-for="i in 2" :key="i" />
              </div>
              <div v-else-if="customerAppointments.length === 0" class="section-empty">
                {{ t('customersView.appointment.empty') }}
              </div>
              <ul v-else class="recent-appt-list">
                <li v-for="(a, idx) in visibleAppointments" :key="a.id" class="recent-appt-row" :class="{ 'recent-appt-row--last': idx === visibleAppointments.length - 1 }">
                  <div class="recent-appt-row__main">
                    <span class="recent-appt-row__service">{{ resolveServiceName(a.serviceId) }}</span>
                    <span class="recent-appt-row__date">{{ formatRelativeDate(a.scheduledAt) }}</span>
                  </div>
                  <div class="recent-appt-row__meta">
                    <span v-if="a.packageSessionId" class="appt-pkg-badge" :title="t('customersView.appointment.packageBadgeTitle')">{{ t('customersView.appointment.packageBadge') }}</span>
                    <span class="appt-badge" :class="apptStatusClass(a.status)">{{ apptStatusLabel(a.status) }}</span>
                  </div>
                </li>
              </ul>
              <p v-if="customerAppointments.length > APPOINTMENTS_PREVIEW_COUNT" class="more-hint">
                {{ t('customersView.detail.viewAll', { n: customerAppointments.length }) }}
              </p>
            </div>
          </template>
        </div>
      </div>

      <!-- ─── Modals ─── -->

      <!-- Create / Edit customer -->
      <AppModal
        v-model:visible="showFormModal"
        :title="editingId ? t('customersView.modal.edit.title') : t('customersView.modal.create.title')"
        :style="{ width: 'min(36rem, 95vw)' }"
      >
        <form class="space-y-4" @submit.prevent="submitCustomer">
          <div class="space-y-1">
            <label for="cust-name" class="block text-sm font-medium" style="color: var(--ink-2)">
              {{ t('customersView.modal.nameLabel') }}
              <span style="color: var(--danger)">{{ t('customersView.modal.nameRequired') }}</span>
            </label>
            <input
              id="cust-name"
              v-model="form.name"
              type="text"
              required
              minlength="2"
              maxlength="100"
              :placeholder="t('customersView.modal.namePlaceholder')"
              class="form-input"
              :class="{ 'form-input-error': formErrors.name }"
              :aria-invalid="!!formErrors.name"
            />
            <span v-if="formErrors.name" class="mt-1 block text-xs" style="color: var(--danger)" role="alert">{{ formErrors.name }}</span>
          </div>

          <div v-if="!editingId" class="space-y-1">
            <label for="cust-phone" class="block text-sm font-medium" style="color: var(--ink-2)">
              {{ t('customersView.modal.phoneLabel') }}
              <span style="color: var(--danger)">{{ t('customersView.modal.nameRequired') }}</span>
            </label>
            <input
              id="cust-phone"
              v-model="form.phoneNumber"
              type="tel"
              required
              :placeholder="t('customersView.modal.phonePlaceholder')"
              class="form-input"
              :class="{ 'form-input-error': formErrors.phoneNumber }"
              :aria-invalid="!!formErrors.phoneNumber"
            />
            <span v-if="formErrors.phoneNumber" class="mt-1 block text-xs" style="color: var(--danger)" role="alert">{{ formErrors.phoneNumber }}</span>
          </div>

          <div class="space-y-1">
            <label for="cust-email" class="block text-sm font-medium" style="color: var(--ink-2)">
              {{ t('customersView.modal.emailLabel') }}
            </label>
            <input
              id="cust-email"
              v-model="form.email"
              type="email"
              :placeholder="t('customersView.modal.emailPlaceholder')"
              class="form-input"
            />
          </div>

          <div class="space-y-1">
            <label for="cust-notes" class="block text-sm font-medium" style="color: var(--ink-2)">
              {{ t('customersView.modal.notesLabel') }}
            </label>
            <textarea
              id="cust-notes"
              v-model="form.notes"
              rows="2"
              maxlength="500"
              :placeholder="t('customersView.modal.notesPlaceholder')"
              class="form-input resize-none"
            />
          </div>

          <div class="space-y-1">
            <label for="cust-address" class="block text-sm font-medium" style="color: var(--ink-2)">
              {{ t('customersView.modal.addressLabel') }}
            </label>
            <textarea
              id="cust-address"
              v-model="form.address"
              rows="2"
              maxlength="500"
              :placeholder="t('customersView.modal.addressPlaceholder')"
              class="form-input resize-none"
            />
          </div>

          <div class="space-y-1">
            <label for="cust-nationalId" class="block text-sm font-medium" style="color: var(--ink-2)">
              {{ t('customersView.modal.nationalIdLabel') }}
            </label>
            <input
              id="cust-nationalId"
              v-model="form.nationalId"
              type="text"
              inputmode="numeric"
              maxlength="11"
              pattern="[0-9]*"
              :placeholder="t('customersView.modal.nationalIdPlaceholder')"
              class="form-input"
              :class="{ 'form-input-error': formErrors.nationalId }"
              :aria-invalid="!!formErrors.nationalId"
              :aria-describedby="editingId && selectedCustomer?.nationalIdMasked ? 'cust-nationalId-hint' : undefined"
            />
            <span v-if="editingId && selectedCustomer?.nationalIdMasked" id="cust-nationalId-hint" class="text-xs" style="color: var(--ink-4)">
              {{ t('customersView.modal.nationalIdHint', { masked: selectedCustomer.nationalIdMasked }) }}
            </span>
            <span v-if="formErrors.nationalId" class="mt-1 block text-xs" style="color: var(--danger)" role="alert">{{ formErrors.nationalId }}</span>
          </div>

          <p v-if="formSubmitError" class="rounded-lg px-3 py-2 text-sm" style="background: var(--danger-tint); color: var(--danger)" role="alert">{{ formSubmitError }}</p>

          <div class="flex justify-end gap-2 pt-4" style="border-top: 1px solid var(--hairline)">
            <AppButton variant="secondary" @click="closeCreate">{{ t('customersView.modal.cancel') }}</AppButton>
            <AppButton variant="primary" native-type="submit" :loading="formSaving">
              {{ editingId ? t('customersView.modal.save') : t('customersView.modal.create') }}
            </AppButton>
          </div>
        </form>
      </AppModal>

      <!-- Blacklist -->
      <AppModal
        v-model:visible="showBlacklistModal"
        :title="t('customersView.modal.blacklist.title')"
      >
        <p v-if="blacklistTarget" class="text-sm mb-4" style="color: var(--ink-3)">
          {{ t('customersView.modal.blacklist.body', { name: blacklistTarget.name }) }}
        </p>
        <div class="space-y-1">
          <label for="bl-reason" class="block text-sm font-medium" style="color: var(--ink-2)">
            {{ t('customersView.modal.blacklist.reasonLabel') }}
          </label>
          <input
            id="bl-reason"
            v-model="blacklistReason"
            type="text"
            maxlength="500"
            :placeholder="t('customersView.modal.blacklist.reasonPlaceholder')"
            class="form-input"
          />
        </div>
        <p v-if="blacklistError" class="mt-3 rounded-lg px-3 py-2 text-sm" style="background: var(--danger-tint); color: var(--danger)" role="alert">{{ blacklistError }}</p>
        <template #footer>
          <AppButton variant="secondary" @click="closeBlacklist">{{ t('customersView.modal.cancel') }}</AppButton>
          <AppButton variant="danger" @click="doBlacklist" :loading="blacklistSaving">
            {{ t('customersView.modal.blacklist.submit') }}
          </AppButton>
        </template>
      </AppModal>

      <!-- Delete confirm -->
      <AppModal
        v-model:visible="showDeleteModal"
        :title="t('customersView.modal.delete.title')"
      >
        <p class="text-sm" style="color: var(--ink-3)">
          {{ t('customersView.modal.delete.body', { name: deleteTarget?.name ?? '' }) }}
        </p>
        <p v-if="deleteError" class="mt-3 rounded-lg px-3 py-2 text-sm" style="background: var(--danger-tint); color: var(--danger)" role="alert">{{ deleteError }}</p>
        <template #footer>
          <AppButton variant="secondary" @click="closeDeleteConfirm">{{ t('customersView.modal.delete.cancel') }}</AppButton>
          <AppButton variant="danger" @click="doDelete" :loading="deleting">
            {{ t('customersView.modal.delete.submit') }}
          </AppButton>
        </template>
      </AppModal>

      <!-- Package assign -->
      <dialog ref="packageDialogRef" class="modal modal-lg" @cancel="closePackageModal">
        <div class="modal-inner">
          <div class="modal-header">
            <h2 class="modal-title">{{ t('customersView.modal.package.title') }}</h2>
            <button type="button" class="modal-close-btn" :aria-label="t('customersView.modal.close')" @click="closePackageModal">
              <X :size="22" :stroke-width="2" aria-hidden="true" />
            </button>
          </div>
          <p class="modal-sub" v-if="packageCustomer">
            {{ t('customersView.modal.package.body', { name: packageCustomer.name }) }}
          </p>
          <div v-if="packageCustomer" class="pkg-mode-tabs">
            <button
              type="button"
              class="tab-btn"
              :class="{ active: pkgFormMode === 'template' }"
              @click="pkgFormMode = 'template'"
            >
              {{ t('customersView.modal.package.tabTemplate') }}
            </button>
            <button
              type="button"
              class="tab-btn"
              :class="{ active: pkgFormMode === 'manual' }"
              @click="pkgFormMode = 'manual'"
            >
              {{ t('customersView.modal.package.tabManual') }}
            </button>
          </div>
          <!-- Şablondan: template select + create -->
          <form v-if="packageCustomer && pkgFormMode === 'template'" @submit.prevent="submitPackageFromTemplate" class="form">
            <div class="field">
              <label for="pkg-template">{{ t('customersView.modal.package.templateLabel') }} <span class="req">{{ t('customersView.modal.nameRequired') }}</span></label>
              <select id="pkg-template" v-model="pkgForm.templateId" class="app-select w-full" required>
                <option value="">{{ t('customersView.modal.package.templatePlaceholder') }}</option>
                <option v-for="t in packageTemplates" :key="t.id" :value="t.id">
                  {{ t.name }} ({{ t.totalSessions }} {{ $t('packageDetailView.template.sessions', { n: t.totalSessions }) }})
                </option>
              </select>
              <p v-if="packageTemplates.length === 0" class="field-hint empty-hint">
                {{ t('customersView.modal.package.templateEmptyHint') }}
              </p>
            </div>
            <p v-if="pkgSubmitError" class="submit-error" role="alert">{{ pkgSubmitError }}</p>
            <div class="modal-actions">
              <AppButton variant="secondary" @click="closePackageModal">{{ t('customersView.modal.cancel') }}</AppButton>
              <AppButton variant="primary" native-type="submit" :disabled="pkgSaving">
                {{ pkgSaving ? t('customersView.modal.saving') : t('customersView.modal.package.submit') }}
              </AppButton>
            </div>
          </form>
          <!-- Manuel: existing form -->
          <form v-if="packageCustomer && pkgFormMode === 'manual'" @submit.prevent="submitPackage" class="form">
            <div class="field">
              <label for="pkg-service">{{ t('customersView.modal.package.serviceLabel') }} <span class="req">{{ t('customersView.modal.nameRequired') }}</span></label>
              <select
                id="pkg-service"
                v-model="pkgForm.serviceId"
                class="app-select w-full"
                required
                :aria-invalid="!!pkgFormErrors.serviceId"
                @change="onServiceChange"
              >
                <option value="">{{ t('customersView.modal.package.templatePlaceholder') }}</option>
                <option v-for="s in packageEligibleServices" :key="s.id" :value="s.id">
                  {{ s.name }} — {{ formatPrice(s.price) }} {{ s.currency }}
                </option>
              </select>
              <p v-if="packageEligibleServices.length === 0" class="field-hint empty-hint">
                {{ t('customersView.modal.package.serviceEmptyHint') }}
              </p>
              <span v-if="pkgFormErrors.serviceId" class="error" role="alert">{{ pkgFormErrors.serviceId }}</span>
            </div>

            <div class="field">
              <label for="pkg-name">{{ t('customersView.modal.package.nameLabel') }} <span class="req">{{ t('customersView.modal.nameRequired') }}</span></label>
              <input
                id="pkg-name"
                v-model="pkgForm.name"
                type="text"
                required
                maxlength="100"
                :placeholder="t('customersView.modal.package.namePlaceholder')"
                :aria-invalid="!!pkgFormErrors.name"
              />
              <span v-if="pkgFormErrors.name" class="error" role="alert">{{ pkgFormErrors.name }}</span>
            </div>

            <div class="field-row">
              <div class="field">
                <label for="pkg-sessions">{{ t('customersView.modal.package.sessionsLabel') }} <span class="req">{{ t('customersView.modal.nameRequired') }}</span></label>
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
                <label for="pkg-expires">{{ t('customersView.modal.package.expiryLabel') }} <span class="req">{{ t('customersView.modal.nameRequired') }}</span></label>
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
              <span class="pkg-preview-label">{{ t('customersView.modal.package.previewLabel') }}</span>
              <span class="pkg-preview-text">
                {{ t('customersView.modal.package.previewText', { sessions: pkgForm.totalSessions, price: selectedServicePrice, total: pkgTotalPrice }) }}
              </span>
            </div>

            <p v-if="pkgSubmitError" class="submit-error" role="alert">{{ pkgSubmitError }}</p>
            <div class="modal-actions">
              <AppButton variant="secondary" @click="closePackageModal">{{ t('customersView.modal.cancel') }}</AppButton>
              <AppButton variant="primary" native-type="submit" :disabled="pkgSaving">
                {{ pkgSaving ? t('customersView.modal.saving') : t('customersView.modal.package.submit') }}
              </AppButton>
            </div>
          </form>
        </div>
      </dialog>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
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
import AppModal from '@/components/ui/AppModal.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import { X, Search, Phone, Plus, Package as PackageIcon, ListFilter, MoreHorizontal } from 'lucide-vue-next'
import { createCustomerSchema, updateCustomerSchema } from '@/validation/schemas'

const { t } = useI18n()
const auth = useAuthStore()
const businessId = computed(() => auth.user?.businessId ?? null)

// ── Data ──────────────────────────────────────────────────────────────────────
const customers = ref<CustomerResponse[]>([])
const services = ref<ServiceResponse[]>([])
const packageTemplates = ref<PackageTemplateResponse[]>([])
const loading = ref(true)
const listError = ref('')
const searchQuery = ref('')

type CustomerFilter = 'all' | 'new' | 'risky' | 'blacklist' | 'approval'
const filterPanelOpen = ref(false)
const activeFilter = ref<CustomerFilter>('all')
const moreMenuOpen = ref(false)

const selectedCustomer = ref<CustomerResponse | null>(null)
const customerPackages = ref<PackageResponse[]>([])
const packagesLoading = ref(false)
const customerAppointments = ref<AppointmentResponse[]>([])
const apptLoading = ref(false)

// ── Dialog refs ───────────────────────────────────────────────────────────────
const showFormModal = ref(false)
const showBlacklistModal = ref(false)
const showDeleteModal = ref(false)
const showPackageModal = ref(false)

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
    PENDING: t('customersView.session.statusPending'),
    SCHEDULED: t('customersView.session.statusScheduled'),
    COMPLETED: t('customersView.session.statusCompleted'),
    NO_SHOW: t('customersView.session.statusNoShow'),
    CANCELLED: t('customersView.session.statusCancelled'),
  }
  return labels[status] ?? status
}

function resolveServiceName(id: number): string {
  return serviceMap.value.get(id)?.name ?? t('common.serviceFallback', { id })
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
    pkgForm.name = t('common.packageNameSuffix', { name: svc.name })
  }
}

// ── Computed list ─────────────────────────────────────────────────────────────
function matchesFilter(c: CustomerResponse, f: CustomerFilter): boolean {
  switch (f) {
    case 'all': return true
    case 'new': return !c.blacklisted && !c.risky && isRecentCustomer(c.createdAt)
    case 'risky': return c.risky && !c.blacklisted
    case 'blacklist': return c.blacklisted
    case 'approval': return c.noShowForcesManualApproval
  }
}

const filteredCustomers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return customers.value.filter((c) => {
    if (!matchesFilter(c, activeFilter.value)) return false
    if (!q) return true
    return c.name.toLowerCase().includes(q) || c.phoneNumber.includes(q)
  })
})

const filterOptions = computed(() => {
  const list: { value: CustomerFilter; label: string; count: number }[] = [
    { value: 'all', label: t('customersView.filter.all'), count: 0 },
    { value: 'new', label: t('customersView.filter.new'), count: 0 },
    { value: 'risky', label: t('customersView.filter.risky'), count: 0 },
    { value: 'blacklist', label: t('customersView.filter.blacklist'), count: 0 },
    { value: 'approval', label: t('customersView.filter.approval'), count: 0 },
  ]
  for (const c of customers.value) {
    for (const opt of list) {
      if (matchesFilter(c, opt.value)) opt.count++
    }
  }
  return list
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

const RELATIVE_THRESHOLDS_MS = [
  { limit: 60_000, divisor: 1, unit: 'now' as const },
  { limit: 3_600_000, divisor: 60_000, unit: 'minute' as const },
  { limit: 86_400_000, divisor: 3_600_000, unit: 'hour' as const },
  { limit: 604_800_000, divisor: 86_400_000, unit: 'day' as const },
  { limit: 2_592_000_000, divisor: 604_800_000, unit: 'week' as const },
  { limit: 31_536_000_000, divisor: 2_592_000_000, unit: 'month' as const },
]

const RECENT_DAYS_THRESHOLD = 30
const RECENT_DAYS_MS = RECENT_DAYS_THRESHOLD * 86_400_000

function formatRelativeDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const time = new Date(iso).getTime()
  if (Number.isNaN(time)) return '—'
  const diff = Date.now() - time
  if (diff < 0) return formatDate(iso)
  for (const { limit, divisor, unit } of RELATIVE_THRESHOLDS_MS) {
    if (diff < limit) {
      if (unit === 'now') return t('customersView.relative.justNow')
      const value = Math.floor(diff / divisor)
      return t(`customersView.relative.${unit}`, { n: value })
    }
  }
  return formatDate(iso)
}

function isRecentCustomer(iso: string | null | undefined): boolean {
  if (!iso) return false
  const time = new Date(iso).getTime()
  if (Number.isNaN(time)) return false
  return Date.now() - time < RECENT_DAYS_MS
}

function customerInitial(name: string): string {
  const trimmed = name.trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?'
}

interface CustomerTag {
  id: string
  label: string
  variant: 'danger' | 'warning' | 'info' | 'noshow' | 'muted' | 'success'
}

function customerTags(c: CustomerResponse): CustomerTag[] {
  const tags: CustomerTag[] = []
  if (c.blacklisted) {
    tags.push({ id: 'blacklist', label: t('customersView.badge.blacklist'), variant: 'danger' })
  } else if (c.risky) {
    tags.push({ id: 'risky', label: t('customersView.badge.risky'), variant: 'warning' })
  }
  if (c.noShowForcesManualApproval) {
    tags.push({ id: 'approval', label: t('customersView.badge.requireApproval'), variant: 'noshow' })
  }
  if (!c.blacklisted && !c.risky && !c.noShowForcesManualApproval && isRecentCustomer(c.createdAt)) {
    tags.push({ id: 'new', label: t('customersView.badge.new'), variant: 'info' })
  }
  if (tags.length === 0) {
    tags.push({ id: 'regular', label: t('customersView.badge.regular'), variant: 'muted' })
  }
  return tags
}

function customerHasPackage(id: number): boolean {
  if (selectedCustomer.value?.id === id) return customerPackages.value.length > 0
  return false
}

const detailStats = computed(() => {
  const total = customerAppointments.value.length
  const completed = customerAppointments.value.filter(a => a.status === 'COMPLETED').length
  const pkgCount = customerPackages.value.length
  return { total, completed, pkgCount }
})

const primaryActivePackage = computed<PackageResponse | null>(() => {
  return customerPackages.value.find(p => !p.expired && p.remainingSessions > 0) ?? null
})

const APPOINTMENTS_PREVIEW_COUNT = 4
const visibleAppointments = computed(() => customerAppointments.value.slice(0, APPOINTMENTS_PREVIEW_COUNT))

function usedSessionsPercent(p: PackageResponse): number {
  if (p.totalSessions === 0) return 0
  const used = p.totalSessions - p.remainingSessions
  return Math.round((used / p.totalSessions) * 100)
}

const heroBadges = computed<CustomerTag[]>(() => {
  if (!selectedCustomer.value) return []
  return customerTags(selectedCustomer.value).filter(tag => tag.id !== 'regular')
})

const headerSubtitle = computed(() => {
  if (loading.value || customers.value.length === 0) return t('customersView.lead')
  const recent = customers.value.filter(c => isRecentCustomer(c.createdAt)).length
  return t('customersView.summary', { total: customers.value.length, recent })
})

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
  const key = `appointmentStatus.${s}` as const
  return t(key)
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
  moreMenuOpen.value = false
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
  showFormModal.value = true
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
  showFormModal.value = true
}

function closeCreate() { showFormModal.value = false }

function validateCustomer(): boolean {
  formErrors.name = ''
  formErrors.phoneNumber = ''
  formErrors.nationalId = ''
  const schema = editingId.value ? updateCustomerSchema : createCustomerSchema
  const phone = form.phoneNumber.replaceAll(/\D/g, '')
  const payload = {
    name: form.name.trim(),
    phoneNumber: phone,
    email: form.email.trim() || undefined,
    notes: form.notes.trim() || undefined,
    address: form.address.trim() || undefined,
    nationalId: form.nationalId.replaceAll(/\D/g, '') || undefined,
  }
  const result = schema.safeParse(payload)
  if (result.success) return true
  for (const issue of result.error.issues) {
    const key = issue.path[0]
    if (key === 'name' || key === 'phoneNumber' || key === 'nationalId') {
      if (!formErrors[key]) formErrors[key] = issue.message
    }
  }
  return false
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
    formSubmitError.value = err.response?.data?.error?.message ?? (e instanceof Error ? e.message : t('customersView.error.save'))
  } finally {
    formSaving.value = false
  }
}

// ── Blacklist ─────────────────────────────────────────────────────────────────
function openBlacklist(c: CustomerResponse) {
  blacklistTarget.value = c
  blacklistReason.value = ''
  blacklistError.value = ''
  showBlacklistModal.value = true
}

function closeBlacklist() {
  blacklistTarget.value = null
  showBlacklistModal.value = false
}

async function doBlacklist() {
  if (!blacklistTarget.value) return
  blacklistSaving.value = true
  blacklistError.value = ''
  try {
    const { data } = await customerApi.blacklist(blacklistTarget.value.id, blacklistReason.value.trim() || t('common.notSpecified'))
    if (data.success && data.data) {
      const idx = customers.value.findIndex(c => c.id === blacklistTarget.value?.id)
      if (idx !== -1) customers.value[idx] = data.data
      if (selectedCustomer.value?.id === data.data.id) selectedCustomer.value = data.data
    }
    closeBlacklist()
  } catch {
    blacklistError.value = t('customersView.error.blacklist')
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
    listError.value = t('customersView.error.removeBlacklist')
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
function openDeleteConfirm(c: CustomerResponse) {
  deleteTarget.value = c
  deleteError.value = ''
  showDeleteModal.value = true
}

function closeDeleteConfirm() {
  deleteTarget.value = null
  showDeleteModal.value = false
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
    deleteError.value = t('customersView.error.delete')
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
  showPackageModal.value = true
}

function closePackageModal() {
  packageCustomer.value = null
  showPackageModal.value = false
}

function validatePackage(): boolean {
  Object.assign(pkgFormErrors, { serviceId: '', name: '', totalSessions: '', expiresAt: '' })
  if (!pkgForm.serviceId) { pkgFormErrors.serviceId = t('customersView.validation.serviceRequired'); return false }
  if (!pkgForm.name.trim()) { pkgFormErrors.name = t('customersView.validation.packageNameRequired'); return false }
  if (pkgForm.totalSessions < 1) { pkgFormErrors.totalSessions = t('customersView.validation.sessionsMin'); return false }
  if (!pkgForm.expiresAt) { pkgFormErrors.expiresAt = t('customersView.validation.expiryRequired'); return false }
  if (new Date(pkgForm.expiresAt) <= new Date()) { pkgFormErrors.expiryInvalid = t('customersView.validation.expiryInvalid'); return false }
  return true
}

async function submitPackageFromTemplate() {
  if (!packageCustomer.value || !pkgForm.templateId) {
    pkgSubmitError.value = t('customersView.validation.templateRequired')
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
    pkgSubmitError.value = err.response?.data?.error?.message ?? (e instanceof Error ? e.message : t('customersView.error.save'))
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
    pkgSubmitError.value = err.response?.data?.error?.message ?? (e instanceof Error ? e.message : t('customersView.error.save'))
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
    sessionAssignError.value = err.response?.data?.error?.message ?? t('customersView.error.sessionAssign')
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
    sessionAssignError.value = err.response?.data?.error?.message ?? t('customersView.error.sessionUnassign')
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
    listError.value = t('customersView.error.load')
  } finally {
    loading.value = false
  }
}

function handleGlobalClick(e: MouseEvent) {
  if (!moreMenuOpen.value) return
  const target = e.target as HTMLElement | null
  if (!target) return
  if (target.closest('.hero-more')) return
  moreMenuOpen.value = false
}

onMounted(() => {
  document.addEventListener('mousedown', handleGlobalClick)
  if (businessId.value) loadList()
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleGlobalClick)
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
  color: var(--ink-3);
}

/* Form input styling for modals */
.form-input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--ink-1);
  font-size: 0.9375rem;
  font-family: inherit;
  transition: border-color 0.12s, box-shadow 0.12s;
}

.form-input::placeholder {
  color: var(--ink-4);
}

.form-input:hover:not(:disabled) {
  border-color: var(--ink-3);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary) 12%, transparent);
}

.form-input-error {
  border-color: var(--danger) !important;
}

.form-input-error:focus {
  border-color: var(--danger) !important;
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--danger) 12%, transparent) !important;
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--surface-2);
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
  border: 1px solid var(--hairline);
  border-radius: var(--r-xl);
  background: var(--surface);
  box-shadow: var(--shadow-2);
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
  color: var(--ink-1);
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
  border-radius: var(--r-md);
  background: transparent;
  color: var(--ink-3);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.modal-close-btn:hover {
  background: var(--surface-2);
  color: var(--ink-1);
}

.modal-close-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.modal-sub {
  margin: 0 0 1rem;
  font-size: 0.9375rem;
  color: var(--ink-2);
  line-height: 1.45;
}

.modal-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid color-mix(in oklab, var(--hairline) 50%, transparent);
}

/* ── Two-pane layout ─────────────────────────────────────────────────────── */
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

@media (max-width: 1024px) {
  .layout { grid-template-columns: 1fr; }
}

/* ── List pane ───────────────────────────────────────────────────────────── */
.list-pane {
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--r-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.list-toolbar {
  padding: 0.875rem;
  border-bottom: 1px solid var(--hairline);
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.search-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--surface-2);
  border-radius: var(--r-md);
  transition: box-shadow 0.15s ease;
}

.search-wrap:focus-within {
  box-shadow: 0 0 0 2px var(--primary);
}

.search-icon {
  flex-shrink: 0;
  color: var(--ink-4);
}

.search-input {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: 0;
  outline: none;
  font-size: 0.8125rem;
  font-family: inherit;
  background: transparent;
  color: var(--ink-1);
}

.search-input::placeholder {
  color: var(--ink-4);
}

.count-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ink-4);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* ── Filter button & chip row ─────────────────────────────────────────────── */
.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: var(--r-md);
  border: 1px solid var(--hairline);
  background: var(--surface);
  color: var(--ink-2);
  font-size: 12.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.filter-btn:hover {
  border-color: var(--hairline-strong, var(--ink-4));
  color: var(--ink-1);
}

.filter-btn--active {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-tint);
}

.filter-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.filter-btn__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: var(--r-full);
  background: var(--primary);
  color: var(--bg, #fff);
  font-size: 10px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.filter-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 0.875rem 0.75rem;
  border-bottom: 1px solid var(--hairline);
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: var(--r-full);
  border: 1px solid var(--hairline);
  background: var(--surface);
  color: var(--ink-3);
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.filter-chip:hover {
  border-color: var(--hairline-strong, var(--ink-4));
  color: var(--ink-2);
}

.filter-chip--active {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--bg, #fff);
}

.filter-chip:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.filter-chip__count {
  font-size: 10px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  padding: 1px 6px;
  border-radius: var(--r-full);
  background: color-mix(in srgb, currentColor 16%, transparent);
}

.list-meta {
  padding: 6px 14px;
  display: flex;
  justify-content: flex-end;
  border-bottom: 1px solid var(--hairline);
  background: color-mix(in oklab, var(--surface-2) 60%, transparent);
}

/* ── Customer table (prototype) ──────────────────────────────────────────── */
.customer-table-scroll {
  overflow-x: auto;
  max-height: calc(100vh - 18rem);
  overflow-y: auto;
}

.customer-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.customer-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  text-align: left;
  padding: 10px 16px;
  font-size: 11px;
  font-weight: 700;
  color: var(--ink-4);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: var(--surface-2);
  border-bottom: 1px solid var(--hairline);
  white-space: nowrap;
}

.customer-table__th-right {
  text-align: right;
}

.customer-row {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.customer-row:hover {
  background: var(--surface-2);
}

.customer-row--selected {
  background: var(--primary-tint);
}

.customer-row--blacklisted .customer-row__name {
  text-decoration: line-through;
  opacity: 0.7;
}

.customer-row:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: -2px;
}

.customer-row td {
  padding: 12px 16px;
  border-top: 1px solid var(--hairline);
  vertical-align: middle;
}

.customer-row__main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.customer-row__info {
  min-width: 0;
}

.customer-row__name-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: var(--ink-1);
}

.customer-row__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customer-row__pkg-icon {
  flex-shrink: 0;
  color: var(--niche-tattoo, #8B5CF6);
}

.customer-row__phone {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: var(--ink-4);
  font-variant-numeric: tabular-nums;
}

.customer-row__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.customer-row__date {
  text-align: right;
  font-size: 12.5px;
  color: var(--ink-3);
  white-space: nowrap;
}

@media (max-width: 640px) {
  .customer-table thead th,
  .customer-row td {
    padding: 10px 12px;
  }
}

.empty-list {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--ink-3);
  font-size: 0.9rem;
}

.empty-title { font-weight: 600; color: var(--ink-1); margin: 0 0 0.25rem; font-size: 0.9375rem; }
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
  border-radius: var(--r-md);
  cursor: pointer;
  transition: background 0.12s;
}

.customer-item:hover { background: var(--surface-2); }

.customer-item:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.customer-item.selected {
  background: var(--primary-tint);
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

.av-indigo  { background: color-mix(in oklab, var(--primary) 90%, #8b5cf6 10%); }
.av-violet  { background: color-mix(in oklab, var(--niche-tattoo) 100%, transparent); }
.av-blue    { background: #3b82f6; }
.av-teal    { background: #14b8a6; }
.av-emerald { background: color-mix(in oklab, var(--success) 100%, transparent); }
.av-amber   { background: color-mix(in oklab, var(--warning) 100%, transparent); }
.av-rose    { background: #f43f5e; }

.customer-item-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.customer-item-name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--ink-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customer-item-phone {
  font-size: 0.75rem;
  color: var(--ink-3);
}

.customer-item-badges {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

/* ── Detail pane ─────────────────────────────────────────────────────────── */
.detail-pane {
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--r-lg);
  min-height: 20rem;
}

.detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--ink-3);
  text-align: center;
  gap: 0.75rem;
}

.detail-empty-icon {
  font-size: 2.5rem;
  opacity: 0.3;
}

/* ── Hero header (prototype: gradient + büyük avatar) ────────────────────── */
.detail-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem 1.5rem 1.25rem;
  background: linear-gradient(180deg, var(--primary-tint), transparent);
  border-bottom: 1px solid var(--hairline);
}

.detail-hero-avatar {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  font-weight: 700;
  color: #fff;
  box-shadow: 0 4px 12px color-mix(in srgb, var(--primary) 18%, transparent);
}

.detail-hero-name {
  margin: 12px 0 4px;
  font-family: var(--font-display, inherit);
  font-size: 22px;
  font-weight: 700;
  color: var(--ink-1);
}

.detail-hero-phone {
  font-size: 13px;
  color: var(--ink-3);
  text-decoration: none;
  font-variant-numeric: tabular-nums;
}

.detail-hero-phone:hover {
  color: var(--primary);
  text-decoration: underline;
}

.detail-hero-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  margin-top: 10px;
}

.detail-hero-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
}

.hero-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: var(--r-md);
  font-size: 12.5px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.hero-action:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.hero-action--primary {
  padding: 7px 14px;
  background: var(--primary);
  color: #fff;
}

.hero-action--primary:hover {
  background: var(--primary-pressed, var(--primary));
}

.hero-action--icon {
  width: 34px;
  height: 34px;
  background: var(--surface);
  border-color: var(--hairline);
  color: var(--ink-2);
}

.hero-action--icon:hover {
  border-color: var(--primary);
  color: var(--primary);
}

/* ── Stats (3 sütun) ─────────────────────────────────────────────────────── */
.detail-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  padding: 16px 20px;
  border-bottom: 1px solid var(--hairline);
}

.detail-stat {
  text-align: center;
  padding: 0 8px;
  border-right: 1px solid var(--hairline);
}

.detail-stat:last-child {
  border-right: 0;
}

.detail-stat__value {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 18px;
  font-weight: 700;
  color: var(--ink-1);
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.detail-stat__label {
  margin-top: 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--ink-4);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── Hero overflow menu ──────────────────────────────────────────────────── */
.hero-more {
  position: relative;
  display: inline-flex;
}

.hero-more-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 30;
  min-width: 200px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-2);
  padding: 4px;
  display: flex;
  flex-direction: column;
}

.hero-more-item {
  display: block;
  padding: 8px 10px;
  border: 0;
  background: transparent;
  border-radius: var(--r-sm);
  color: var(--ink-1);
  font-size: 12.5px;
  font-weight: 500;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.hero-more-item:hover {
  background: var(--surface-2);
}

.hero-more-item:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: -2px;
}

.hero-more-item--danger {
  color: var(--danger);
}

.hero-more-item--danger:hover {
  background: var(--danger-tint);
}

/* ── Compact active package card (prototype) ─────────────────────────────── */
.active-pkg-card {
  margin: 12px 16px 0;
  padding: 12px 14px;
  background: color-mix(in srgb, #8B5CF6 6%, transparent);
  border: 1px solid color-mix(in srgb, #8B5CF6 18%, transparent);
  border-radius: var(--r-md);
}

.active-pkg-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.active-pkg-card__title-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.active-pkg-card__icon {
  flex-shrink: 0;
  color: var(--niche-tattoo, #8B5CF6);
}

.active-pkg-card__title {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.active-pkg-card__count {
  font-size: 12px;
  font-weight: 700;
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
  font-family: var(--font-mono, ui-monospace, monospace);
  flex-shrink: 0;
}

.active-pkg-card__bar {
  height: 6px;
  background: var(--surface-2);
  border-radius: var(--r-full);
  overflow: hidden;
}

.active-pkg-card__fill {
  height: 100%;
  background: var(--niche-tattoo, #8B5CF6);
  border-radius: var(--r-full);
  transition: width 0.3s ease;
}

/* ── Notes card ──────────────────────────────────────────────────────────── */
.note-card {
  margin: 12px 16px 0;
  padding: 10px 12px;
  background: var(--surface-2);
  border-radius: var(--r-md);
  border-left: 3px solid var(--warning, #F59E0B);
}

.note-card__label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  color: var(--ink-4);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 3px;
}

.note-card__text {
  margin: 0;
  font-size: 12.5px;
  color: var(--ink-1);
  line-height: 1.45;
  white-space: pre-line;
}

/* ── Compact info rows ───────────────────────────────────────────────────── */
.info-rows {
  margin: 14px 16px 4px;
  padding: 10px 12px;
  background: var(--surface-2);
  border-radius: var(--r-md);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 12.5px;
}

.info-row__label {
  color: var(--ink-4);
  font-weight: 600;
  flex-shrink: 0;
}

.info-row__value {
  color: var(--ink-1);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.info-row__value.mono {
  font-variant-numeric: tabular-nums;
  font-family: var(--font-mono, ui-monospace, monospace);
}

.info-row__value--link {
  color: var(--primary);
  text-decoration: none;
}

.info-row__value--link:hover {
  text-decoration: underline;
}

.info-row--danger .info-row__value {
  color: var(--danger);
  white-space: normal;
  text-align: right;
}

/* ── Recent appointments (compact) ───────────────────────────────────────── */
.recent-appt-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.recent-appt-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid color-mix(in oklab, var(--hairline) 50%, transparent);
}

.recent-appt-row--last {
  border-bottom: 0;
}

.recent-appt-row__main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.recent-appt-row__service {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-appt-row__date {
  font-size: 11px;
  color: var(--ink-4);
}

.recent-appt-row__meta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

/* Detail sections */
.detail-section {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid color-mix(in oklab, var(--hairline) 50%, transparent);
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
  color: var(--ink-1);
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
  color: var(--ink-4);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.info-value {
  font-size: 0.9375rem;
  color: var(--ink-1);
}

.info-value.link {
  color: var(--primary);
  text-decoration: none;
}

.info-value.link:hover { text-decoration: underline; }
.danger-text { color: var(--danger); }

/* Skeleton loaders */
.loading-state { display: flex; flex-direction: column; gap: 0.75rem; }
.skeleton-card {
  height: 4.5rem;
  background: linear-gradient(90deg, var(--surface-2) 25%, color-mix(in oklab, var(--hairline) 50%, transparent) 50%, var(--surface-2) 75%);
  background-size: 200% 100%;
  animation: skeleton 1.2s ease-in-out infinite;
  border-radius: var(--r-lg);
}

.loading-inline { display: flex; flex-direction: column; gap: 0.5rem; }
.skeleton-row {
  height: 3rem;
  background: linear-gradient(90deg, var(--surface-2) 25%, color-mix(in oklab, var(--hairline) 50%, transparent) 50%, var(--surface-2) 75%);
  background-size: 200% 100%;
  animation: skeleton 1.2s ease-in-out infinite;
  border-radius: var(--r-md);
}

@keyframes skeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.section-empty { font-size: 0.875rem; color: var(--ink-3); padding: 0.5rem 0; }

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
  background: var(--surface-2);
  border: 1px solid color-mix(in oklab, var(--hairline) 70%, transparent);
  border-radius: var(--r-md);
  padding: 0.875rem 1rem;
  transition: border-color 0.15s;
}

.pkg-card:hover { border-color: var(--hairline); }
.pkg-card.expired { opacity: 0.65; }

.pkg-card-head { display: flex; flex-direction: column; gap: 0.125rem; margin-bottom: 0.625rem; }

.pkg-card-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pkg-card-name { font-size: 0.9375rem; font-weight: 600; color: var(--ink-1); flex: 1; }
.pkg-service-name { font-size: 0.8125rem; color: var(--ink-3); }

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
  background: color-mix(in oklab, var(--hairline) 40%, transparent);
  border-radius: 9999px;
  overflow: hidden;
}

.pkg-progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 9999px;
  transition: width 0.3s;
}

.pkg-progress-fill.low { background: var(--warning); }
.pkg-progress-fill.expired { background: var(--ink-4); }

.pkg-sessions-text {
  font-size: 0.8125rem;
  color: var(--ink-3);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.pkg-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.pkg-expires { font-size: 0.8125rem; color: var(--ink-3); }

.pkg-session-actions { display: flex; gap: 0.375rem; }

.session-btn {
  width: 2rem;
  height: 2rem;
  border-radius: var(--r-md);
  border: 1px solid var(--hairline);
  background: var(--surface);
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-1);
  transition: background 0.12s, border-color 0.12s;
}

.session-btn:hover:not(:disabled) { background: var(--surface-2); border-color: var(--ink-4); }
.session-btn.add:hover:not(:disabled) { background: var(--success-tint); border-color: var(--success); color: var(--success); }
.session-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.session-btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

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
  border-bottom: 1px solid color-mix(in oklab, var(--hairline) 40%, transparent);
}

.appt-item:last-child { border-bottom: none; }

.appt-date {
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  color: var(--ink-3);
  min-width: 7rem;
}

.appt-service {
  flex: 1;
  font-size: 0.875rem;
  color: var(--ink-1);
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
  background: var(--primary-tint);
  color: var(--primary);
}

.badge-pending  { background: var(--warning-tint); color: var(--warning); }
.badge-active   { background: var(--success-tint); color: var(--success); }
.badge-risky    { background: var(--danger-tint); color: var(--danger); }
.badge-inactive { background: var(--surface-2); color: var(--ink-3); }

.more-hint {
  margin: 0.5rem 0 0;
  font-size: 0.8125rem;
  color: var(--ink-3);
}

/* ── Badges ──────────────────────────────────────────────────────────────── */
.badge {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  white-space: nowrap;
}

.badge.danger   { background: var(--danger-tint); color: var(--danger); }
.badge.warning  { background: var(--warning-tint); color: var(--warning); }
.badge.active   { background: var(--success-tint); color: var(--success); }
.badge.inactive { background: var(--surface-2); color: var(--ink-3); }
.badge.muted    { background: var(--surface-2); color: var(--ink-3); }
.badge.noshow   { background: color-mix(in oklab, var(--niche-tattoo) 18%, transparent); color: var(--niche-tattoo); }

.pkg-mode-tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.tab-btn {
  padding: 0.375rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: var(--r-md);
  border: 1px solid var(--hairline);
  background: var(--surface);
  color: var(--ink-3);
  cursor: pointer;
  font-family: inherit;
}
.tab-btn:hover { border-color: var(--primary); color: var(--primary); }
.tab-btn.active { background: var(--primary); border-color: var(--primary); color: white; }
.tab-btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

.pkg-sessions-list { margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid color-mix(in oklab, var(--hairline) 50%, transparent); }
.pkg-sessions-head { font-size: 0.8125rem; font-weight: 600; color: var(--ink-3); margin-bottom: 0.5rem; }
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
.session-status { padding: 0.125rem 0.375rem; border-radius: var(--r-sm); font-size: 0.75rem; }
.session-status.pending { background: var(--surface-2); color: var(--ink-3); }
.session-status.scheduled { background: var(--primary-tint); color: var(--primary); }
.session-status.completed { background: var(--success-tint); color: var(--success); }
.session-status.no_show { background: var(--danger-tint); color: var(--danger); }
.session-status.cancelled { background: var(--surface-2); color: var(--ink-3); }
.session-date { min-width: 8rem; }
.session-date.muted { color: var(--ink-3); }
.session-assign-wrap { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.session-assign-select {
  max-width: 12rem;
  min-height: 2rem;
  padding: 0.25rem 1.75rem 0.25rem 0.5rem;
  font-size: 0.8125rem;
  border-radius: var(--r-md);
}
.session-assign-hint { margin: 0.25rem 0 0; font-size: 0.75rem; color: var(--ink-3); }
.session-assign-hint a { color: var(--primary); text-decoration: underline; }
.session-new-appt-btn {
  display: inline-flex; align-items: center; gap: 0.25rem;
  padding: 0.25rem 0.625rem; border-radius: 0.5rem;
  font-size: 0.75rem; font-weight: 600;
  background: var(--primary); color: #fff;
  text-decoration: none; transition: background 0.15s;
}
.session-new-appt-btn:hover { background: var(--primary-pressed); }
.btn.tiny { padding: 0.2rem 0.5rem; font-size: 0.75rem; }

/* ── States ──────────────────────────────────────────────────────────────── */
.empty-state {
  padding: 2rem;
  text-align: center;
  background: var(--surface-2);
  border-radius: var(--r-lg);
  color: var(--ink-3);
}

.error-state {
  padding: 2rem;
  text-align: center;
  background: var(--surface-2);
  border-radius: var(--r-lg);
  color: var(--ink-3);
}

.error-state p { margin: 0 0 1rem; }

/* ── Buttons ─────────────────────────────────────────────────────────────── */
.btn.danger-ghost {
  color: var(--danger);
  border-color: transparent;
  background: transparent;
}

.btn.danger-ghost:hover:not(:disabled) {
  background: var(--danger-tint);
  border-color: var(--danger);
}


.form { display: flex; flex-direction: column; gap: 1rem; }

.field { display: flex; flex-direction: column; gap: 0.3rem; }
.field label { font-weight: 500; font-size: 0.875rem; color: var(--ink-3); }
.field-hint { margin: 0.25rem 0 0; font-size: 0.8125rem; color: var(--ink-3); }
.field-hint.empty-hint { margin-top: 0.5rem; padding: 0.5rem; background: var(--surface-2); border-radius: var(--r-md); }
.req { color: var(--danger); }

.field input,
.field select,
.field textarea {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--hairline);
  border-radius: var(--r-md);
  font-size: 0.9375rem;
  font-family: inherit;
  width: 100%;
  background: var(--surface);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-tint);
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
  background: var(--primary-tint);
  border-radius: var(--r-md);
  font-size: 0.875rem;
}

.pkg-preview-label { font-weight: 600; color: var(--primary); }
.pkg-preview-text { color: var(--ink-1); }

.error { font-size: 0.8125rem; color: var(--danger); }
.submit-error { font-size: 0.875rem; color: var(--danger); margin: 0; }
</style>
