<template>
  <div class="setup-wizard">
    <header class="setup-wizard__header">
      <div class="setup-wizard__brand">
        <div class="setup-wizard__logo" aria-hidden="true">
          <CalendarDays class="size-4" />
        </div>
        <span class="setup-wizard__brand-name">{{ t('admin.brand') }}</span>
      </div>
      <div class="setup-wizard__progress" role="status" aria-live="polite">
        <span>
          {{ t('setup.shell.progressText', { current: setup.completedCount, total: setup.totalCount }) }}
        </span>
        <div class="setup-wizard__bar" :aria-valuenow="setup.progressPercent" aria-valuemin="0" aria-valuemax="100" role="progressbar">
          <div class="setup-wizard__bar-fill" :style="{ width: `${setup.progressPercent}%` }" />
        </div>
      </div>
      <button
        type="button"
        class="setup-wizard__close"
        :aria-label="t('setup.shell.exit')"
        @click="exitWizard"
      >
        <X class="size-5" aria-hidden="true" />
      </button>
    </header>

    <div v-if="setup.loading && !setup.loaded" class="setup-wizard__loading">
      <span class="setup-wizard__spinner" aria-hidden="true" />
      <p>{{ t('common.loading') }}</p>
    </div>

    <div v-else-if="setup.loadError" class="setup-wizard__error" role="alert">
      <p>{{ setup.loadError }}</p>
      <button type="button" class="setup-wizard__retry" @click="setup.refresh()">
        {{ t('common.retry') }}
      </button>
    </div>

    <div v-else class="setup-wizard__body">
      <aside class="setup-wizard__aside">
        <h1 class="setup-wizard__title">{{ t('setup.title') }}</h1>
        <p class="setup-wizard__subtitle">{{ t('setup.subtitle') }}</p>
        <SetupStepper
          :steps="setup.stepStatuses"
          :current-step="setup.currentStep"
          @select="navigateTo"
        />
        <button
          v-if="setup.isComplete"
          type="button"
          class="setup-wizard__finish"
          @click="finishWizard"
        >
          {{ t('setup.shell.finish') }} →
        </button>
      </aside>

      <main class="setup-wizard__content">
        <component
          :is="currentStepComponent"
          :key="setup.currentStep"
          :step-index="setup.currentStep"
          :total-steps="setup.totalCount"
          :is-final="setup.currentStep === setup.totalCount"
          @next="goNext"
          @back="goBack"
          @dismiss="exitWizard"
        />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { CalendarDays, X } from 'lucide-vue-next'
import { useSetupStore } from '@/stores/setup'
import SetupStepper from '@/components/setup/SetupStepper.vue'
import { useToast } from '@/composables/useToast'

import BusinessInfoStep from '@/components/setup/steps/BusinessInfoStep.vue'
import ServicesStep from '@/components/setup/steps/ServicesStep.vue'
import EmployeesStep from '@/components/setup/steps/EmployeesStep.vue'
import AssignmentsStep from '@/components/setup/steps/AssignmentsStep.vue'
import WorkingHoursStep from '@/components/setup/steps/WorkingHoursStep.vue'
import ShareStep from '@/components/setup/steps/ShareStep.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const setup = useSetupStore()
const toast = useToast()

const STEP_COMPONENTS = [
  BusinessInfoStep,
  ServicesStep,
  EmployeesStep,
  AssignmentsStep,
  WorkingHoursStep,
  ShareStep,
]

const currentStepComponent = computed(
  () => STEP_COMPONENTS[setup.currentStep - 1] ?? STEP_COMPONENTS[0],
)

function syncStepFromQuery() {
  const raw = route.query.step
  const parsed = Array.isArray(raw) ? raw[0] : raw
  const num = parsed ? Number(parsed) : NaN
  if (Number.isFinite(num)) {
    setup.setCurrentStep(num)
  } else {
    setup.setCurrentStep(setup.firstIncompleteStep)
    void router.replace({ query: { ...route.query, step: String(setup.currentStep) } })
  }
}

function navigateTo(step: number) {
  setup.setCurrentStep(step)
  void router.replace({ query: { ...route.query, step: String(setup.currentStep) } })
  scrollContentTop()
}

function goNext() {
  if (setup.currentStep >= setup.totalCount) {
    finishWizard()
    return
  }
  navigateTo(setup.currentStep + 1)
}

function goBack() {
  if (setup.currentStep <= 1) return
  navigateTo(setup.currentStep - 1)
}

function exitWizard() {
  setup.markDismissed()
  toast.info(t('setup.shell.dismissedToast'))
  void router.push({ name: 'AdminDashboard' })
}

function finishWizard() {
  setup.clearDismissed()
  toast.success(t('setup.shell.finishedToast'))
  void router.push({ name: 'AdminDashboard' })
}

function scrollContentTop() {
  const el = document.querySelector<HTMLElement>('.setup-wizard__content')
  if (el) el.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(async () => {
  await setup.ensureLoaded()
  syncStepFromQuery()
})

watch(
  () => route.query.step,
  () => {
    if (!setup.loaded) return
    syncStepFromQuery()
  },
)
</script>

<style scoped>
.setup-wizard {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: rgb(248 250 252);
}

.setup-wizard__header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgb(226 232 240);
  background-color: white;
  position: sticky;
  top: 0;
  z-index: 20;
}

.setup-wizard__brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.setup-wizard__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  background-color: rgb(13 148 136);
  color: white;
}

.setup-wizard__brand-name {
  font-weight: 600;
  font-size: 0.9375rem;
  color: rgb(15 23 42);
}

.setup-wizard__progress {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: rgb(71 85 105);
  max-width: 24rem;
}

.setup-wizard__bar {
  width: 100%;
  height: 0.375rem;
  background-color: rgb(226 232 240);
  border-radius: 9999px;
  overflow: hidden;
}

.setup-wizard__bar-fill {
  height: 100%;
  background-color: rgb(99 102 241);
  border-radius: 9999px;
  transition: width 0.3s ease;
}

.setup-wizard__close {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  border: 1px solid rgb(226 232 240);
  background-color: white;
  color: rgb(71 85 105);
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}

.setup-wizard__close:hover {
  background-color: rgb(241 245 249);
  color: rgb(15 23 42);
}

.setup-wizard__close:focus-visible {
  outline: 2px solid rgb(99 102 241);
  outline-offset: 2px;
}

.setup-wizard__loading,
.setup-wizard__error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 1rem;
  padding: 3rem 1rem;
  color: rgb(71 85 105);
}

.setup-wizard__spinner {
  width: 1.75rem;
  height: 1.75rem;
  border: 3px solid rgb(226 232 240);
  border-top-color: rgb(99 102 241);
  border-radius: 9999px;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.setup-wizard__retry {
  padding: 0.5rem 1rem;
  border: 1px solid rgb(99 102 241);
  background-color: white;
  color: rgb(99 102 241);
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
}

.setup-wizard__body {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(16rem, 18rem) 1fr;
  gap: 1.5rem;
  padding: 1.25rem;
  max-width: 80rem;
  width: 100%;
  margin: 0 auto;
  align-items: start;
}

.setup-wizard__aside {
  position: sticky;
  top: 4.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 1rem;
  background-color: white;
  border: 1px solid rgb(226 232 240);
  border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.setup-wizard__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: rgb(15 23 42);
}

.setup-wizard__subtitle {
  margin: 0 0 0.5rem;
  font-size: 0.8125rem;
  color: rgb(100 116 139);
  line-height: 1.4;
}

.setup-wizard__finish {
  margin-top: 0.5rem;
  padding: 0.625rem 0.875rem;
  background-color: rgb(16 185 129);
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  border: none;
  border-radius: 0.625rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.setup-wizard__finish:hover {
  background-color: rgb(5 150 105);
}

.setup-wizard__content {
  min-height: calc(100vh - 8rem);
  max-height: calc(100vh - 6rem);
  overflow-y: auto;
}

@media (max-width: 1023px) {
  .setup-wizard__body {
    grid-template-columns: 1fr;
    padding: 0.75rem;
    gap: 0.75rem;
  }
  .setup-wizard__aside {
    position: static;
    padding: 0.75rem;
  }
  .setup-wizard__content {
    max-height: none;
    min-height: 0;
  }
  .setup-wizard__progress {
    display: none;
  }
}
</style>
