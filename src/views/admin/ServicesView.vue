<template>
  <div class="space-y-6">
    <!-- Header -->
    <SectionHeader
      :title="$t('servicesView.title')"
      :subtitle="headerSubtitle"
    >
      <template #actions>
        <AppButton v-if="businessId" variant="primary" @click="openCreate">
          <Plus class="size-4" aria-hidden="true" />
          {{ $t('servicesView.action.new') }}
        </AppButton>
      </template>
    </SectionHeader>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div v-for="i in 4" :key="i" class="h-44 animate-pulse rounded-xl" style="background: var(--surface-2)" />
    </div>

    <!-- Error -->
    <div
      v-else-if="listError"
      class="card flex items-center justify-between gap-4 px-4 py-3 text-sm"
      style="background: var(--danger-tint); border-color: var(--danger); color: var(--danger)"
      role="alert"
    >
      <span>{{ listError }}</span>
      <AppButton variant="secondary" size="sm" @click="loadList">{{ $t('common.retry') }}</AppButton>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="services.length === 0"
      class="rounded-xl border border-dashed px-4 py-16 text-center"
      style="background: var(--surface); border-color: var(--hairline)"
    >
      <Scissors class="mx-auto mb-3 size-10" style="color: var(--ink-5)" aria-hidden="true" />
      <p class="font-semibold" style="color: var(--ink-3)">{{ $t('servicesView.empty.title') }}</p>
      <p class="mt-1 text-sm" style="color: var(--ink-4)">{{ $t('servicesView.empty.desc') }}</p>
      <AppButton class="mt-4" variant="primary" @click="openCreate">
        <Plus class="size-4" aria-hidden="true" />
        {{ $t('servicesView.empty.action') }}
      </AppButton>
    </div>

    <!-- Two-pane layout -->
    <div v-else class="layout">
      <!-- Left: service list -->
      <div class="list-pane">
        <!-- Toolbar -->
        <div class="list-toolbar">
          <div class="search-wrap">
            <Search :size="15" aria-hidden="true" class="search-icon" />
            <input
              v-model="searchQuery"
              type="search"
              class="search-input"
              :placeholder="$t('servicesView.search.placeholder')"
              :aria-label="$t('servicesView.search.aria')"
            />
          </div>
        </div>

        <!-- Filter chips -->
        <div class="filter-chip-row" role="radiogroup" :aria-label="$t('servicesView.filter.label')">
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

        <!-- Service grid -->
        <ul class="service-grid">
          <li
            v-for="s in filteredServices"
            :key="s.id"
            class="service-card"
            :class="{ 'service-card--selected': selectedServiceId === s.id, 'service-card--inactive': !s.active }"
            @click="selectService(s.id)"
            role="button"
            tabindex="0"
            @keydown.enter="selectService(s.id)"
            @keydown.space.prevent="selectService(s.id)"
          >
            <!-- Icon & More menu -->
            <div class="service-card__header">
              <div class="service-icon" :style="{ background: getServiceColor(s.id, 0.15), color: getServiceColor(s.id, 1) }">
                <Scissors :size="20" aria-hidden="true" />
              </div>
              <button
                type="button"
                class="more-btn"
                :aria-label="$t('common.moreActions')"
                @click.stop="toggleMoreMenu(s.id, $event)"
              >
                <MoreHorizontal :size="14" aria-hidden="true" />
              </button>
            </div>

            <!-- Name & Meta -->
            <div class="service-card__body">
              <h3 class="service-card__title">{{ s.name }}</h3>
              <p class="service-card__meta">{{ s.durationMinutes }} {{ $t('servicesView.field.durationUnit') }}</p>
            </div>

            <!-- Price & Toggle -->
            <div class="service-card__footer">
              <div>
                <div class="service-card__price">₺{{ formatPrice(s.price) }}</div>
                <!-- Placeholder for "randevu/ay" if backend provides it later -->
              </div>
              <button
                type="button"
                class="toggle-pill"
                :class="s.active ? 'toggle-pill--active' : 'toggle-pill--passive'"
                :aria-label="$t(`servicesView.action.${s.active ? 'deactivate' : 'activate'}`)"
                @click.stop="toggleServiceActive(s)"
              >
                <span class="toggle-pill__knob" />
              </button>
            </div>

            <!-- Overflow menu -->
            <div
              v-if="moreMenuServiceId === s.id"
              class="service-more-menu"
              @click.stop
            >
              <button type="button" class="service-more-menu__item" @click="editService(s)">
                <Pencil :size="14" aria-hidden="true" />
                {{ $t('servicesView.action.edit') }}
              </button>
              <button type="button" class="service-more-menu__item" @click="confirmDelete(s)">
                <Trash2 :size="14" aria-hidden="true" />
                {{ $t('servicesView.action.delete') }}
              </button>
              <button
                v-if="s.packageEligible"
                type="button"
                class="service-more-menu__item"
                @click="goToCreatePackageFor(s)"
              >
                <PackageCheck :size="14" aria-hidden="true" />
                {{ $t('servicesView.action.createPackage') }}
              </button>
            </div>
          </li>

          <!-- Dashed "Add Service" card -->
          <li class="service-card service-card--add" @click="openCreate" role="button" tabindex="0" @keydown.enter="openCreate" @keydown.space.prevent="openCreate">
            <div class="service-add__icon">
              <Plus :size="20" aria-hidden="true" />
            </div>
            <div class="service-add__label">{{ $t('servicesView.action.addNew') }}</div>
          </li>
        </ul>
      </div>

      <!-- Right: detail panel -->
      <div class="detail-pane">
        <div v-if="!selectedService" class="detail-empty">
          <Scissors :size="40" style="color: var(--ink-5)" aria-hidden="true" />
          <p>{{ $t('servicesView.detail.empty') }}</p>
          <p class="detail-empty__desc">{{ $t('servicesView.detail.emptyDesc') }}</p>
        </div>

        <div v-else class="detail-content">
          <!-- Hero -->
          <div class="detail-hero">
            <div class="detail-hero__icon" :style="{ background: getServiceColor(selectedService.id, 0.15), color: getServiceColor(selectedService.id, 1) }">
              <Scissors :size="24" aria-hidden="true" />
            </div>
            <div class="detail-hero__body">
              <h2 class="detail-hero__title">{{ selectedService.name }}</h2>
              <p class="detail-hero__meta">
                {{ selectedService.durationMinutes }} {{ $t('servicesView.field.durationUnit') }}
                · ₺{{ formatPrice(selectedService.price) }}
                <span v-if="selectedService.packageEligible" class="detail-hero__badge">
                  {{ $t('servicesView.tag.packageEligible') }}
                </span>
              </p>
            </div>
            <button
              type="button"
              class="detail-hero__more"
              :aria-label="$t('common.moreActions')"
              @click="toggleDetailMore"
            >
              <MoreHorizontal :size="16" aria-hidden="true" />
            </button>

            <!-- Overflow menu -->
            <div v-if="detailMoreOpen" class="detail-more-menu" @click.stop>
              <button type="button" class="detail-more-menu__item" @click="editService(selectedService)">
                <Pencil :size="14" aria-hidden="true" />
                {{ $t('servicesView.action.edit') }}
              </button>
              <button type="button" class="detail-more-menu__item" @click="confirmDelete(selectedService)">
                <Trash2 :size="14" aria-hidden="true" />
                {{ $t('servicesView.action.delete') }}
              </button>
              <button
                v-if="selectedService.packageEligible"
                type="button"
                class="detail-more-menu__item"
                @click="goToCreatePackageFor(selectedService)"
              >
                <PackageCheck :size="14" aria-hidden="true" />
                {{ $t('servicesView.action.createPackage') }}
              </button>
            </div>
          </div>

          <!-- Info rows -->
          <div class="info-rows">
            <div class="info-row">
              <span class="info-row__label">{{ $t('servicesView.detail.info.duration') }}</span>
              <span class="info-row__value">{{ selectedService.durationMinutes }} {{ $t('servicesView.field.durationUnit') }}</span>
            </div>
            <div class="info-row">
              <span class="info-row__label">{{ $t('servicesView.detail.info.price') }}</span>
              <span class="info-row__value">₺{{ formatPrice(selectedService.price) }} {{ selectedService.currency }}</span>
            </div>
            <div v-if="selectedService.bufferBeforeMinutes" class="info-row">
              <span class="info-row__label">{{ $t('servicesView.detail.info.bufferBefore') }}</span>
              <span class="info-row__value">{{ selectedService.bufferBeforeMinutes }} {{ $t('servicesView.field.durationUnit') }}</span>
            </div>
            <div v-if="selectedService.bufferAfterMinutes" class="info-row">
              <span class="info-row__label">{{ $t('servicesView.detail.info.bufferAfter') }}</span>
              <span class="info-row__value">{{ selectedService.bufferAfterMinutes }} {{ $t('servicesView.field.durationUnit') }}</span>
            </div>
            <div v-if="selectedService.requiresConfirmation" class="info-row">
              <span class="info-row__label">{{ $t('servicesView.detail.info.confirmation') }}</span>
              <span class="info-pill info-pill--warning">{{ $t('common.yes') }}</span>
            </div>
            <div v-if="selectedService.packageEligible" class="info-row">
              <span class="info-row__label">{{ $t('servicesView.detail.info.package') }}</span>
              <span class="info-pill info-pill--success">{{ $t('common.yes') }}</span>
            </div>
          </div>

          <!-- Employees section -->
          <div class="detail-section detail-employees">
            <h3 class="detail-section__title">
              {{ $t('servicesView.detail.employees.title') }}
              <span v-if="selectedServiceEmployees.length > 0" class="detail-section__count">
                · {{ selectedServiceEmployees.length }}/{{ allEmployees.length }}
              </span>
            </h3>

            <!-- Search (10+ employees) -->
            <div v-if="allEmployees.length >= 10" class="employee-search">
              <Search :size="14" aria-hidden="true" class="employee-search__icon" />
              <input
                v-model="employeeSearchQuery"
                type="search"
                class="employee-search__input"
                :placeholder="$t('servicesView.detail.employees.searchPlaceholder')"
              />
            </div>

            <p v-if="allEmployees.length === 0" class="detail-section__empty">
              {{ $t('servicesView.detail.employees.noEmployees') }}
            </p>
            <ul v-else class="employee-toggle-list">
              <li
                v-for="emp in filteredEmployeesForToggle"
                :key="emp.id"
                class="employee-toggle-item"
              >
                <div class="employee-toggle-item__left">
                  <div class="employee-avatar" :class="avatarColor(emp.id)">{{ initials(emp.name) }}</div>
                  <div class="employee-info">
                    <span class="employee-name">{{ emp.name }}</span>
                    <span v-if="emp.title" class="employee-title">{{ emp.title }}</span>
                  </div>
                </div>
                <div class="employee-toggle-item__right">
                  <!-- Skill chip (if assigned) -->
                  <button
                    v-if="getEmployeeSkillLevel(emp.id)"
                    type="button"
                    class="skill-chip"
                    :aria-label="$t('servicesView.detail.employees.changeSkill')"
                    @click.stop="toggleSkillDropdown(emp.id)"
                  >
                    {{ SKILL_LEVEL_LABELS[getEmployeeSkillLevel(emp.id)!] }}
                    <ChevronDown :size="12" aria-hidden="true" />
                  </button>
                  <!-- Skill dropdown -->
                  <div
                    v-if="skillDropdownEmployeeId === emp.id"
                    class="skill-dropdown"
                    @click.stop
                  >
                    <button
                      v-for="level in SKILL_LEVELS"
                      :key="level"
                      type="button"
                      class="skill-dropdown__item"
                      :class="{ 'skill-dropdown__item--active': getEmployeeSkillLevel(emp.id) === level }"
                      @click="changeEmployeeSkill(emp.id, level)"
                    >
                      {{ SKILL_LEVEL_LABELS[level] }}
                    </button>
                  </div>
                  <!-- Toggle -->
                  <button
                    type="button"
                    class="employee-toggle"
                    :class="{ 'employee-toggle--on': isEmployeeAssigned(emp.id) }"
                    :aria-label="$t(`servicesView.detail.employees.${isEmployeeAssigned(emp.id) ? 'unassign' : 'assign'}`)"
                    @click="toggleEmployeeAssignment(emp.id)"
                  >
                    <span class="employee-toggle__knob" />
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>


    <!-- ── Create / Edit Modal ──────────────────────────────────────────────── -->
    <AppModal
      v-model:visible="showFormModal"
      :title="editingId ? $t('servicesView.modal.edit') : $t('servicesView.modal.create')"
      :style="{ width: 'min(36rem, 95vw)' }"
    >
      <form class="space-y-5" @submit.prevent="submitService">
        <fieldset class="space-y-3">
          <legend class="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest" style="color: var(--ink-4)">
            <span class="flex size-5 items-center justify-center rounded-full text-[0.6rem] font-bold text-white" style="background: var(--primary)">1</span>
            {{ $t('servicesView.form.section1') }}
          </legend>
          <label class="block">
            <span class="text-sm font-medium" style="color: var(--ink-2)">
              {{ $t('servicesView.form.nameLabel') }}
              <span style="color: var(--danger)">{{ $t('servicesView.form.nameRequired') }}</span>
            </span>
            <input
              v-model="form.name"
              type="text"
              required
              minlength="2"
              maxlength="100"
              :placeholder="$t('servicesView.form.namePlaceholder')"
              class="form-input mt-1"
              :class="formErrors.name ? 'form-input-error' : ''"
            />
            <span v-if="formErrors.name" class="mt-1 block text-xs" style="color: var(--danger)">{{ formErrors.name }}</span>
          </label>
          <label class="block">
            <span class="text-sm font-medium" style="color: var(--ink-2)">
              {{ $t('servicesView.form.descLabel') }}
              <span class="font-normal" style="color: var(--ink-4)">{{ $t('servicesView.form.descOptional') }}</span>
            </span>
            <textarea
              v-model="form.description"
              rows="2"
              maxlength="500"
              :placeholder="$t('servicesView.form.descPlaceholder')"
              class="form-input mt-1 resize-none"
            />
          </label>
        </fieldset>

        <hr style="border-color: var(--hairline)" />

        <fieldset class="space-y-3">
          <legend class="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest" style="color: var(--ink-4)">
            <span class="flex size-5 items-center justify-center rounded-full text-[0.6rem] font-bold text-white" style="background: var(--primary)">2</span>
            {{ $t('servicesView.form.section2') }}
          </legend>
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="text-sm font-medium" style="color: var(--ink-2)">
                {{ $t('servicesView.form.durationLabel') }}
                <span style="color: var(--danger)">*</span>
              </span>
              <div class="relative mt-1">
                <input
                  v-model.number="form.durationMinutes"
                  type="number"
                  min="15"
                  max="360"
                  step="5"
                  required
                  class="form-input pr-10"
                  :class="formErrors.durationMinutes ? 'form-input-error' : ''"
                />
                <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs" style="color: var(--ink-4)">{{ $t('servicesView.form.durationUnit') }}</span>
              </div>
              <span v-if="formErrors.durationMinutes" class="mt-1 block text-xs" style="color: var(--danger)">{{ formErrors.durationMinutes }}</span>
            </label>
            <label class="block">
              <span class="text-sm font-medium" style="color: var(--ink-2)">{{ $t('servicesView.form.priceLabel') }}</span>
              <div class="relative mt-1">
                <input
                  v-model.number="form.price"
                  type="number"
                  min="0"
                  step="0.01"
                  class="form-input pr-10"
                />
                <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs" style="color: var(--ink-4)">{{ $t('servicesView.form.priceUnit') }}</span>
              </div>
            </label>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="text-sm font-medium" style="color: var(--ink-2)">{{ $t('servicesView.form.bufferBeforeLabel') }}</span>
              <input v-model.number="form.bufferBeforeMinutes" type="number" min="0" max="120" class="form-input mt-1" />
            </label>
            <label class="block">
              <span class="text-sm font-medium" style="color: var(--ink-2)">{{ $t('servicesView.form.bufferAfterLabel') }}</span>
              <input v-model.number="form.bufferAfterMinutes" type="number" min="0" max="120" class="form-input mt-1" />
            </label>
          </div>
        </fieldset>

        <hr style="border-color: var(--hairline)" />

        <fieldset class="space-y-3">
          <legend class="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest" style="color: var(--ink-4)">
            <span class="flex size-5 items-center justify-center rounded-full text-[0.6rem] font-bold text-white" style="background: var(--primary)">3</span>
            {{ $t('servicesView.form.section3') }}
          </legend>
          <div class="space-y-2.5 rounded-xl p-4" style="background: var(--surface-2)">
            <AppCheckbox
              v-model="form.requiresConfirmation"
              :label="$t('servicesView.form.requiresConfirmationLabel')"
              :description="$t('servicesView.form.requiresConfirmationDesc')"
            />
            <AppCheckbox
              v-model="form.sameDayBookingAllowed"
              :label="$t('servicesView.form.sameDayLabel')"
              :description="$t('servicesView.form.sameDayDesc')"
            />
            <AppCheckbox
              v-model="form.packageEligible"
              :label="$t('servicesView.form.packageEligibleLabel')"
              :description="$t('servicesView.form.packageEligibleDesc')"
            />
          </div>
        </fieldset>

        <p v-if="formSubmitError" class="rounded-lg px-3 py-2 text-sm" style="background: var(--danger-tint); color: var(--danger)" role="alert">{{ formSubmitError }}</p>

        <div class="flex justify-end gap-2 pt-4" style="border-top: 1px solid var(--hairline)">
          <AppButton variant="secondary" @click="showFormModal = false">{{ $t('common.cancel') }}</AppButton>
          <AppButton variant="primary" native-type="submit" :loading="formSaving">
            {{ editingId ? $t('servicesView.form.submitUpdate') : $t('servicesView.form.submitCreate') }}
          </AppButton>
        </div>
      </form>
    </AppModal>

    <!-- ── Employee Management Modal ────────────────────────────────────────── -->
    <AppModal
      v-model:visible="showEmployeesModal"
      :title="$t('servicesView.modal.employees', { name: employeesModalService?.name ?? '' })"
      :style="{ width: 'min(38rem, 95vw)' }"
    >
      <div class="space-y-5">
        <!-- Capable employees -->
        <div>
          <h3 class="mb-2 text-sm font-semibold" style="color: var(--ink-2)">{{ $t('servicesView.employeesModal.capable') }}</h3>
          <p v-if="modalCapableEmployees.length === 0" class="text-sm italic" style="color: var(--ink-4)">
            {{ $t('servicesView.employeesModal.capableEmpty') }}
          </p>
          <ul v-else class="card divide-y" style="divide-color: var(--hairline)">
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
                  <span class="text-sm font-medium" style="color: var(--ink-1)">{{ emp.name }}</span>
                  <span v-if="emp.title" class="ml-1.5 text-xs" style="color: var(--ink-4)">{{ emp.title }}</span>
                </div>
              </div>
              <AppButton
                variant="danger"
                size="sm"
                :loading="removingEmployeeId === emp.id"
                @click="removeEmployee(emp.id)"
              >
                {{ $t('servicesView.employeesModal.removeButton') }}
              </AppButton>
            </li>
          </ul>
        </div>

        <!-- Assign form -->
        <div class="card space-y-3 p-4">
          <h3 class="text-sm font-semibold" style="color: var(--ink-2)">{{ $t('servicesView.employeesModal.assignTitle') }}</h3>
          <p v-if="unassignedActiveEmployees.length === 0" class="text-sm italic" style="color: var(--ink-4)">
            {{ $t('servicesView.employeesModal.assignEmpty') }}
          </p>
          <template v-else>
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="space-y-1">
                <label class="block text-sm font-medium" style="color: var(--ink-2)">{{ $t('servicesView.employeesModal.assignEmployeeLabel') }}</label>
                <select v-model.number="assignForm.employeeId" class="app-select w-full">
                  <option :value="0">{{ $t('servicesView.employeesModal.assignEmployeePlaceholder') }}</option>
                  <option v-for="emp in unassignedActiveEmployees" :key="emp.id" :value="emp.id">{{ emp.name }}</option>
                </select>
              </div>
              <div class="space-y-1">
                <label class="block text-sm font-medium" style="color: var(--ink-2)">{{ $t('servicesView.employeesModal.assignSkillLabel') }}</label>
                <select v-model="assignForm.skillLevel" class="app-select w-full">
                  <option value="">{{ $t('servicesView.employeesModal.assignSkillPlaceholder') }}</option>
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
                {{ $t('servicesView.employeesModal.assignButton') }}
              </AppButton>
            </div>
          </template>
          <p v-if="assignError" class="text-sm" style="color: var(--danger)" role="alert">{{ assignError }}</p>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showEmployeesModal = false">{{ $t('servicesView.employeesModal.close') }}</AppButton>
      </template>
    </AppModal>

    <!-- ── Delete Modal ──────────────────────────────────────────────────────── -->
    <AppModal v-model:visible="showDeleteModal" :title="$t('servicesView.modal.delete')">
      <p class="text-sm" style="color: var(--ink-3)">
        {{ $t('servicesView.modal.deleteBody', { name: toDelete?.name ?? '' }) }}
      </p>
      <template #footer>
        <AppButton variant="secondary" @click="showDeleteModal = false">{{ $t('servicesView.modal.deleteCancel') }}</AppButton>
        <AppButton variant="danger" :loading="deleting" @click="doDelete">{{ $t('servicesView.modal.deleteConfirm') }}</AppButton>
      </template>
    </AppModal>

    <!-- ── Package prompt Modal ──────────────────────────────────────────────── -->
    <AppModal v-model:visible="showPackagePrompt" :title="$t('servicesView.packagePrompt.title')">
      <div class="flex items-start gap-3">
        <div class="flex size-10 shrink-0 items-center justify-center rounded-xl" style="background: color-mix(in oklab, var(--niche-tattoo) 18%, transparent)">
          <PackageCheck class="size-5" style="color: var(--niche-tattoo)" aria-hidden="true" />
        </div>
        <div>
          <p class="font-semibold" style="color: var(--ink-1)">{{ $t('servicesView.packagePrompt.body', { name: createdServiceName }) }}</p>
          <p class="mt-1 text-sm" style="color: var(--ink-3)">{{ $t('servicesView.packagePrompt.desc') }}</p>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showPackagePrompt = false">{{ $t('servicesView.packagePrompt.later') }}</AppButton>
        <AppButton variant="primary" @click="goToCreatePackage">
          <PackageCheck class="size-4" aria-hidden="true" />
          {{ $t('servicesView.packagePrompt.create') }}
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { fetchAllPageContent } from '@/api/client'
import { serviceApi, type ServiceResponse, type CreateServiceRequest, type UpdateServiceRequest } from '@/api/service'
import { employeeApi, type EmployeeResponse, type SkillLevel } from '@/api/employee'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import {
  Plus, Pencil, Trash2, Eye, EyeOff,
  Clock, BadgeDollarSign, ShieldCheck, Scissors, PackageCheck, Users,
  Search, MoreHorizontal, ChevronDown,
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const { t } = useI18n()
const businessId = computed(() => auth.user?.businessId ?? null)

// ── Service list ─────────────────────────────────────────────────────────────
const services = ref<ServiceResponse[]>([])
const capableEmployeesMap = ref<Map<number, EmployeeResponse[]>>(new Map())
const allEmployees = ref<EmployeeResponse[]>([])
const loading = ref(true)
const listError = ref('')
const togglingId = ref<number | null>(null)

// ── Split layout state ───────────────────────────────────────────────────────
const searchQuery = ref('')
type ServiceFilter = 'all' | 'active' | 'passive' | 'packageEligible'
const activeFilter = ref<ServiceFilter>('all')
const selectedServiceId = ref<number | null>(null)
const moreMenuServiceId = ref<number | null>(null)
const detailMoreOpen = ref(false)

// ── Employee toggle state ────────────────────────────────────────────────────
const employeeSearchQuery = ref('')
const skillDropdownEmployeeId = ref<number | null>(null)
type EmployeeCapability = { serviceId: number; skillLevel: SkillLevel }
const employeeCapabilities = ref<Map<number, EmployeeCapability[]>>(new Map())

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
const SKILL_LEVEL_LABELS = computed<Record<SkillLevel, string>>(() => ({
  JUNIOR: t('employees.skillLevels.JUNIOR'),
  INTERMEDIATE: t('employees.skillLevels.INTERMEDIATE'),
  SENIOR: t('employees.skillLevels.SENIOR'),
  EXPERT: t('employees.skillLevels.EXPERT'),
}))

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-pink-500', 'bg-teal-500',
  'bg-orange-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-rose-500',
]

// ── Computed ──────────────────────────────────────────────────────────────────
const headerSubtitle = computed(() => {
  const active = services.value.filter((s) => s.active).length
  return t('servicesView.lead', { total: services.value.length, active })
})

function matchesFilter(s: ServiceResponse, f: ServiceFilter): boolean {
  switch (f) {
    case 'all': return true
    case 'active': return s.active
    case 'passive': return !s.active
    case 'packageEligible': return s.packageEligible
  }
}

const filteredServices = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return services.value.filter((s) => {
    if (!matchesFilter(s, activeFilter.value)) return false
    if (!q) return true
    return s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
  })
})

const filterOptions = computed(() => {
  const list: { value: ServiceFilter; label: string; count: number }[] = [
    { value: 'all', label: t('servicesView.filter.all'), count: 0 },
    { value: 'active', label: t('servicesView.filter.active'), count: 0 },
    { value: 'passive', label: t('servicesView.filter.passive'), count: 0 },
    { value: 'packageEligible', label: t('servicesView.filter.packageEligible'), count: 0 },
  ]
  for (const s of services.value) {
    for (const opt of list) {
      if (matchesFilter(s, opt.value)) opt.count++
    }
  }
  return list
})

const selectedService = computed(() =>
  services.value.find((s) => s.id === selectedServiceId.value) ?? null,
)

const selectedServiceEmployees = computed(() => {
  if (!selectedServiceId.value) return []
  const assigned = new Set<number>()
  for (const [empId, caps] of employeeCapabilities.value) {
    if (caps.some((c) => c.serviceId === selectedServiceId.value)) {
      assigned.add(empId)
    }
  }
  return allEmployees.value.filter((e) => assigned.has(e.id))
})

const filteredEmployeesForToggle = computed(() => {
  const q = employeeSearchQuery.value.trim().toLowerCase()
  return allEmployees.value.filter((e) => {
    if (!q) return true
    return e.name.toLowerCase().includes(q) || e.title?.toLowerCase().includes(q)
  })
})

function isEmployeeAssigned(empId: number): boolean {
  if (!selectedServiceId.value) return false
  const caps = employeeCapabilities.value.get(empId) ?? []
  return caps.some((c) => c.serviceId === selectedServiceId.value)
}

function getEmployeeSkillLevel(empId: number): SkillLevel | null {
  if (!selectedServiceId.value) return null
  const caps = employeeCapabilities.value.get(empId) ?? []
  const cap = caps.find((c) => c.serviceId === selectedServiceId.value)
  return cap?.skillLevel ?? null
}

function toggleSkillDropdown(empId: number) {
  skillDropdownEmployeeId.value = skillDropdownEmployeeId.value === empId ? null : empId
}

async function changeEmployeeSkill(empId: number, newLevel: SkillLevel) {
  if (!selectedServiceId.value) return
  const oldCaps = employeeCapabilities.value.get(empId) ?? []
  const oldCap = oldCaps.find((c) => c.serviceId === selectedServiceId.value)
  if (!oldCap || oldCap.skillLevel === newLevel) {
    skillDropdownEmployeeId.value = null
    return
  }

  // Optimistic update
  const newCaps = oldCaps.map((c) =>
    c.serviceId === selectedServiceId.value ? { ...c, skillLevel: newLevel } : c,
  )
  const updated = new Map(employeeCapabilities.value)
  updated.set(empId, newCaps)
  employeeCapabilities.value = updated
  skillDropdownEmployeeId.value = null

  try {
    await employeeApi.assignCapability(empId, {
      serviceId: selectedServiceId.value,
      skillLevel: newLevel,
    })
  } catch (err: unknown) {
    // Rollback
    const rolled = new Map(employeeCapabilities.value)
    rolled.set(empId, oldCaps)
    employeeCapabilities.value = rolled
    const errMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
    listError.value = errMsg ?? t('servicesView.error.assignFailed')
  }
}

async function toggleEmployeeAssignment(empId: number) {
  if (!selectedServiceId.value) return
  const isAssigned = isEmployeeAssigned(empId)
  const oldCaps = employeeCapabilities.value.get(empId) ?? []

  if (isAssigned) {
    // Unassign: optimistic remove
    const newCaps = oldCaps.filter((c) => c.serviceId !== selectedServiceId.value)
    const updated = new Map(employeeCapabilities.value)
    if (newCaps.length === 0) {
      updated.delete(empId)
    } else {
      updated.set(empId, newCaps)
    }
    employeeCapabilities.value = updated

    try {
      await employeeApi.removeCapability(empId, selectedServiceId.value)
    } catch (err: unknown) {
      // Rollback
      const rolled = new Map(employeeCapabilities.value)
      rolled.set(empId, oldCaps)
      employeeCapabilities.value = rolled
      const errMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
      listError.value = errMsg ?? t('servicesView.error.removeFailed')
    }
  } else {
    // Assign: optimistic add
    const newCap: EmployeeCapability = { serviceId: selectedServiceId.value, skillLevel: 'INTERMEDIATE' }
    const newCaps = [...oldCaps, newCap]
    const updated = new Map(employeeCapabilities.value)
    updated.set(empId, newCaps)
    employeeCapabilities.value = updated

    try {
      await employeeApi.assignCapability(empId, {
        serviceId: selectedServiceId.value,
        skillLevel: 'INTERMEDIATE',
      })
    } catch (err: unknown) {
      // Rollback
      const rolled = new Map(employeeCapabilities.value)
      if (oldCaps.length === 0) {
        rolled.delete(empId)
      } else {
        rolled.set(empId, oldCaps)
      }
      employeeCapabilities.value = rolled
      const errMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
      listError.value = errMsg ?? t('servicesView.error.assignFailed')
    }
  }
}

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
const SERVICE_COLORS = [
  'var(--niche-hair)',
  'var(--niche-beauty)',
  'var(--niche-tattoo)',
  'var(--primary)',
  'var(--info)',
]

function getServiceColor(id: number, opacity: number): string {
  const base = SERVICE_COLORS[id % SERVICE_COLORS.length]
  if (opacity === 1) return base
  return `color-mix(in oklab, ${base} ${Math.round(opacity * 100)}%, transparent)`
}

function formatPrice(p: number | string): string {
  const n = typeof p === 'string' ? Number.parseFloat(p) : p
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)
}

function selectService(id: number) {
  selectedServiceId.value = selectedServiceId.value === id ? null : id
  moreMenuServiceId.value = null
  detailMoreOpen.value = false
}

function toggleMoreMenu(id: number, event: MouseEvent) {
  event.stopPropagation()
  moreMenuServiceId.value = moreMenuServiceId.value === id ? null : id
}

function toggleDetailMore() {
  detailMoreOpen.value = !detailMoreOpen.value
}

async function toggleServiceActive(s: ServiceResponse) {
  if (s.active) {
    await deactivate(s.id)
  } else {
    await activate(s.id)
  }
}

function editService(s: ServiceResponse) {
  moreMenuServiceId.value = null
  detailMoreOpen.value = false
  openEdit(s)
}

function goToCreatePackageFor(s: ServiceResponse) {
  moreMenuServiceId.value = null
  detailMoreOpen.value = false
  router.push(`/admin/packages?createFor=${s.id}&serviceName=${encodeURIComponent(s.name)}`)
}

function handleGlobalClick(e: MouseEvent) {
  if (moreMenuServiceId.value !== null || detailMoreOpen.value || skillDropdownEmployeeId.value !== null) {
    const target = e.target as HTMLElement | null
    if (!target) return
    if (target.closest('.service-more-menu') || target.closest('.detail-more-menu') || target.closest('.more-btn') || target.closest('.detail-hero__more') || target.closest('.skill-dropdown') || target.closest('.skill-chip')) return
    moreMenuServiceId.value = null
    detailMoreOpen.value = false
    skillDropdownEmployeeId.value = null
  }
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
    formErrors.name = t('servicesView.error.nameMin')
    return false
  }
  if (form.durationMinutes < 15 || form.durationMinutes > 360) {
    formErrors.durationMinutes = t('servicesView.error.durationRange')
    return false
  }
  return true
}

// ── Data loading ─────────────────────────────────────────────────────────────
async function loadEmployeeCapabilities() {
  if (!businessId.value) return
  try {
    // Load all employees
    allEmployees.value = await fetchAllPageContent((page, size) =>
      employeeApi.list({ page, size }),
    )

    // Load capabilities for each employee (E requests, usually fewer than N services)
    const capMap = new Map<number, EmployeeCapability[]>()
    await Promise.all(
      allEmployees.value.map(async (emp) => {
        try {
          const { data } = await employeeApi.getCapabilities(emp.id)
          if (data.success && data.data) {
            const caps = data.data
              .filter((c) => c.active)
              .map((c) => ({ serviceId: c.serviceId, skillLevel: c.skillLevel }))
            if (caps.length > 0) {
              capMap.set(emp.id, caps)
            }
          }
        } catch (err: unknown) {
          const errMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
          console.error(`Failed to load capabilities for employee ${emp.id}:`, errMsg ?? err)
          listError.value = t('servicesView.error.loadCapabilitiesFailed')
        }
      }),
    )
    employeeCapabilities.value = capMap

    // Build capableEmployeesMap for backward compatibility (modals)
    const svcMap = new Map<number, EmployeeResponse[]>()
    for (const [empId, caps] of capMap) {
      const emp = allEmployees.value.find((e) => e.id === empId)
      if (!emp) continue
      for (const cap of caps) {
        const list = svcMap.get(cap.serviceId) ?? []
        list.push(emp)
        svcMap.set(cap.serviceId, list)
      }
    }
    capableEmployeesMap.value = svcMap
  } catch (err: unknown) {
    const errMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
    listError.value = errMsg ?? t('servicesView.error.loadEmployeesFailed')
  }
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
  } catch (err: unknown) {
    const errMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
    listError.value = errMsg ?? t('servicesView.error.reloadCapabilitiesFailed')
  }
}

async function loadList() {
  if (!businessId.value) return
  loading.value = true
  listError.value = ''
  try {
    const { data } = await serviceApi.list()
    services.value = data.success && data.data ? data.data : []
    await loadEmployeeCapabilities()
  } catch (err: unknown) {
    const errMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
    listError.value = errMsg ?? t('servicesView.error.load')
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
  let createdId: number | null = null
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
      if (res.data.success && res.data.data) {
        createdId = res.data.data.id
        createdServiceId.value = res.data.data.id
        createdServiceName.value = res.data.data.name
      }
    }
    await loadList()
    showFormModal.value = false

    // Auto-select created service and scroll to employees section
    if (wasCreate && createdId) {
      selectedServiceId.value = createdId
      await nextTick()
      const employeesSection = document.querySelector('.detail-employees')
      if (employeesSection) {
        employeesSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      listError.value = '' // Clear any previous errors
      // Show toast
      const toastMsg = t('servicesView.toast.serviceCreated')
      listError.value = toastMsg // Using listError as toast (temporary solution)
      setTimeout(() => {
        if (listError.value === toastMsg) listError.value = ''
      }, 3000)
    }

    if (wasCreate && wasPackageEligible) showPackagePrompt.value = true
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: { message?: string } } } }
    formSubmitError.value = err.response?.data?.error?.message ?? t('servicesView.error.saveFailed')
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
  catch { listError.value = t('servicesView.error.activateFailed') }
  finally { togglingId.value = null }
}

async function deactivate(id: number) {
  togglingId.value = id
  try { await serviceApi.deactivate(id); await loadList() }
  catch { listError.value = t('servicesView.error.deactivateFailed') }
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
    listError.value = t('servicesView.error.deleteFailed')
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
    assignError.value = t('servicesView.error.removeFailed')
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
    assignError.value = t('servicesView.error.assignFailed')
  } finally {
    assigning.value = false
  }
}

// ── Mount ─────────────────────────────────────────────────────────────────────
onMounted(() => {
  document.addEventListener('mousedown', handleGlobalClick)
  if (businessId.value) {
    loadList()

    // Check for focusEmployee query param
    const focusEmpId = route.query.focusEmployee
    if (focusEmpId) {
      const empId = Number(focusEmpId)
      if (!Number.isNaN(empId)) {
        // Find employee name
        setTimeout(() => {
          const emp = allEmployees.value.find((e) => e.id === empId)
          if (emp) {
            listError.value = t('servicesView.toast.focusEmployee', { name: emp.name })
            setTimeout(() => {
              if (listError.value === t('servicesView.toast.focusEmployee', { name: emp.name })) {
                listError.value = ''
              }
            }, 4000)
          }
        }, 500)
      }
    }
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleGlobalClick)
})
</script>

<style scoped>
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

/* ── Split Layout ──────────────────────────────────────────────────────────── */
.layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .layout {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1.5fr);
  }
}

.list-pane {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-pane {
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 1rem;
  height: fit-content;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--r-lg);
  overflow: hidden;
}

/* ── Toolbar & Filters ──────────────────────────────────────────────────────── */
.list-toolbar {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.search-wrap {
  position: relative;
  flex: 1;
}

.search-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-4);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 2.5rem;
  padding-left: 2.75rem;
  padding-right: 1rem;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--r-md);
  font-size: 0.875rem;
  color: var(--ink-1);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input::placeholder {
  color: var(--ink-4);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-tint);
}

.filter-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  height: 2rem;
  padding: 0 0.875rem;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--r-full);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--ink-3);
  cursor: pointer;
  transition: all 0.2s;
}

.filter-chip:hover {
  border-color: var(--ink-4);
  color: var(--ink-2);
}

.filter-chip--active {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

.filter-chip__count {
  font-variant-numeric: tabular-nums;
  opacity: 0.8;
}

/* ── Service Cards ──────────────────────────────────────────────────────────── */
.service-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.service-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 1.25rem;
  background: var(--surface);
  border: 1.5px solid var(--hairline);
  border-radius: var(--r-lg);
  cursor: pointer;
  transition: all 0.2s;
  min-height: 200px;
}

.service-card:hover {
  border-color: var(--ink-4);
  box-shadow: var(--shadow-md);
}

.service-card:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.service-card--selected {
  border-color: var(--primary);
  border-width: 1.5px;
}

.service-card--inactive {
  opacity: 0.65;
}

.service-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.service-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--r-md);
}

.more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: transparent;
  border: none;
  border-radius: var(--r-md);
  color: var(--ink-4);
  cursor: pointer;
  transition: all 0.2s;
}

.more-btn:hover {
  background: var(--surface-2);
  color: var(--ink-2);
}

.service-card__body {
  flex: 1;
}

.service-card__title {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--ink-1);
  margin: 0;
}

.service-card__meta {
  font-size: 0.8125rem;
  color: var(--ink-4);
  margin: 0.25rem 0 0;
}

.service-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.service-card__price {
  font-family: var(--font-mono);
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--ink-1);
}

/* ── Toggle Pill ──────────────────────────────────────────────────────────────── */
.toggle-pill {
  position: relative;
  width: 40px;
  height: 24px;
  border-radius: var(--r-full);
  border: none;
  padding: 2px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.toggle-pill--active {
  background: var(--primary);
  justify-content: flex-end;
}

.toggle-pill--passive {
  background: var(--surface-2);
  justify-content: flex-start;
}

.toggle-pill__knob {
  display: block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  transition: transform 0.2s;
}

.toggle-pill--active .toggle-pill__knob {
  transform: translateX(16px);
}

.toggle-pill:hover {
  opacity: 0.85;
}

/* ── Service More Menu ──────────────────────────────────────────────────────── */
.service-more-menu {
  position: absolute;
  top: 3.5rem;
  right: 1rem;
  min-width: 160px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-lg);
  z-index: 50;
  overflow: hidden;
}

.service-more-menu__item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.625rem 1rem;
  background: transparent;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ink-2);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s;
}

.service-more-menu__item:hover {
  background: var(--surface-2);
}

/* ── Add Service Card ────────────────────────────────────────────────────────── */
.service-card--add {
  border-style: dashed;
  border-color: var(--hairline-strong);
  background: transparent;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  min-height: 200px;
}

.service-card--add:hover {
  border-color: var(--primary);
  background: var(--surface);
}

.service-add__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--primary-tint);
  border-radius: var(--r-md);
  color: var(--primary);
}

.service-add__label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--primary);
}

/* ── Detail Panel ────────────────────────────────────────────────────────────── */
.detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1.5rem;
  text-align: center;
  color: var(--ink-4);
  font-size: 0.875rem;
}

.detail-empty__desc {
  font-size: 0.8125rem;
  color: var(--ink-5);
}

.detail-content {
  display: flex;
  flex-direction: column;
}

.detail-hero {
  position: relative;
  display: flex;
  gap: 0.875rem;
  padding: 1.5rem;
  border-bottom: 1px solid var(--hairline);
}

.detail-hero__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--r-md);
  flex-shrink: 0;
}

.detail-hero__body {
  flex: 1;
  min-width: 0;
}

.detail-hero__title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ink-1);
  margin: 0;
  line-height: 1.3;
}

.detail-hero__meta {
  font-size: 0.8125rem;
  color: var(--ink-3);
  margin: 0.375rem 0 0;
}

.detail-hero__badge {
  display: inline-block;
  padding: 2px 8px;
  background: color-mix(in oklab, var(--niche-tattoo) 18%, transparent);
  color: var(--niche-tattoo);
  border-radius: var(--r-full);
  font-size: 0.6875rem;
  font-weight: 600;
  margin-left: 0.5rem;
}

.detail-hero__more {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: var(--r-md);
  color: var(--ink-4);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.detail-hero__more:hover {
  background: var(--surface-2);
  color: var(--ink-2);
}

.detail-more-menu {
  position: absolute;
  top: 3.75rem;
  right: 1rem;
  min-width: 160px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-lg);
  z-index: 50;
  overflow: hidden;
}

.detail-more-menu__item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.625rem 1rem;
  background: transparent;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ink-2);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s;
}

.detail-more-menu__item:hover {
  background: var(--surface-2);
}

/* ── Info Rows ──────────────────────────────────────────────────────────────── */
.info-rows {
  display: flex;
  flex-direction: column;
  padding: 1.25rem 1.5rem;
  gap: 0.875rem;
  border-bottom: 1px solid var(--hairline);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.info-row__label {
  font-size: 0.8125rem;
  color: var(--ink-4);
  font-weight: 500;
}

.info-row__value {
  font-size: 0.875rem;
  color: var(--ink-2);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.info-pill {
  padding: 3px 10px;
  border-radius: var(--r-full);
  font-size: 0.6875rem;
  font-weight: 600;
}

.info-pill--warning {
  background: var(--warning-tint);
  color: var(--warning);
}

.info-pill--success {
  background: var(--success-tint);
  color: var(--success);
}

/* ── Detail Section (Employees) ───────────────────────────────────────────────── */
.detail-section {
  padding: 1.25rem 1.5rem;
}

.detail-section__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ink-2);
  margin: 0 0 1rem;
}

.detail-section__count {
  font-weight: 500;
  color: var(--ink-4);
}

.detail-section__empty {
  font-size: 0.8125rem;
  color: var(--ink-4);
  font-style: italic;
}

.employee-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.employee-list__item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.employee-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.employee-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.employee-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ink-2);
}

.employee-title {
  font-size: 0.75rem;
  color: var(--ink-4);
}

/* ── Employee Toggle List ───────────────────────────────────────────────────── */
.detail-employees {
  max-height: 600px;
  overflow-y: auto;
}

.employee-search {
  position: relative;
  margin-bottom: 1rem;
}

.employee-search__icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-4);
  pointer-events: none;
}

.employee-search__input {
  width: 100%;
  height: 2rem;
  padding-left: 2.25rem;
  padding-right: 0.75rem;
  background: var(--surface-2);
  border: 1px solid var(--hairline);
  border-radius: var(--r-md);
  font-size: 0.8125rem;
  color: var(--ink-1);
  transition: border-color 0.2s;
}

.employee-search__input::placeholder {
  color: var(--ink-4);
}

.employee-search__input:focus {
  outline: none;
  border-color: var(--primary);
}

.employee-toggle-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.employee-toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  background: var(--surface-2);
  border-radius: var(--r-md);
  transition: background-color 0.15s;
}

.employee-toggle-item:hover {
  background: color-mix(in oklab, var(--surface-2) 80%, var(--ink));
}

.employee-toggle-item__left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.employee-toggle-item__right {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* ── Skill Chip & Dropdown ──────────────────────────────────────────────────── */
.skill-chip {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  height: 1.75rem;
  padding: 0 0.625rem;
  background: var(--primary-tint);
  border: 1px solid color-mix(in oklab, var(--primary) 30%, transparent);
  border-radius: var(--r-full);
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--primary);
  cursor: pointer;
  transition: all 0.15s;
}

.skill-chip:hover {
  background: color-mix(in oklab, var(--primary) 20%, transparent);
  border-color: var(--primary);
}

.skill-dropdown {
  position: absolute;
  top: calc(100% + 0.25rem);
  right: 3.5rem;
  min-width: 120px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-lg);
  z-index: 50;
  overflow: hidden;
}

.skill-dropdown__item {
  display: block;
  width: 100%;
  padding: 0.5rem 0.875rem;
  background: transparent;
  border: none;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--ink-2);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s;
}

.skill-dropdown__item:hover {
  background: var(--surface-2);
}

.skill-dropdown__item--active {
  background: var(--primary-tint);
  color: var(--primary);
  font-weight: 600;
}

/* ── Employee Toggle Switch ──────────────────────────────────────────────────── */
.employee-toggle {
  position: relative;
  width: 36px;
  height: 20px;
  border-radius: var(--r-full);
  border: none;
  padding: 2px;
  cursor: pointer;
  transition: background-color 0.2s;
  background: var(--surface-3);
  flex-shrink: 0;
}

.employee-toggle--on {
  background: var(--primary);
}

.employee-toggle__knob {
  display: block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  transition: transform 0.2s;
}

.employee-toggle--on .employee-toggle__knob {
  transform: translateX(16px);
}

.employee-toggle:hover {
  opacity: 0.85;
}
</style>
