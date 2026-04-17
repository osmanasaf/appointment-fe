<template>
  <nav class="setup-stepper" :aria-label="t('setup.stepper.label')" role="tablist">
    <ol class="setup-stepper__list">
      <li
        v-for="(step, idx) in steps"
        :key="step.key"
        class="setup-stepper__item"
        :class="itemStateClass(step, idx)"
      >
        <button
          type="button"
          role="tab"
          class="setup-stepper__btn"
          :class="btnStateClass(step, idx)"
          :aria-current="step.index === currentStep ? 'step' : undefined"
          :aria-selected="step.index === currentStep"
          :disabled="!isReachable(step)"
          @click="onSelect(step)"
        >
          <span class="setup-stepper__indicator" aria-hidden="true">
            <Check v-if="step.done" class="size-4" />
            <span v-else>{{ step.index }}</span>
          </span>
          <span class="setup-stepper__text">
            <span class="setup-stepper__label">{{ t(`setup.steps.${step.key}.label`) }}</span>
            <span class="setup-stepper__status">{{ statusLabel(step) }}</span>
          </span>
        </button>
        <span
          v-if="idx < steps.length - 1"
          class="setup-stepper__connector"
          :class="connectorClass(step)"
          aria-hidden="true"
        />
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check } from 'lucide-vue-next'
import type { SetupStepStatus } from '@/stores/setup'

const props = defineProps<{
  steps: SetupStepStatus[]
  currentStep: number
}>()

const emit = defineEmits<{
  select: [step: number]
}>()

const { t } = useI18n()

const lastDoneIndex = computed(() => {
  let last = 0
  for (const s of props.steps) {
    if (s.done) last = s.index
    else break
  }
  return last
})

function isReachable(step: SetupStepStatus): boolean {
  if (step.done) return true
  if (step.index === props.currentStep) return true
  return step.index <= lastDoneIndex.value + 1
}

function itemStateClass(step: SetupStepStatus, _idx: number): string {
  if (step.index === props.currentStep) return 'is-current'
  if (step.done) return 'is-done'
  return 'is-pending'
}

function btnStateClass(step: SetupStepStatus, _idx: number): string {
  if (step.index === props.currentStep) return 'btn-current'
  if (step.done) return 'btn-done'
  return isReachable(step) ? 'btn-reachable' : 'btn-locked'
}

function connectorClass(step: SetupStepStatus): string {
  return step.done ? 'connector-done' : 'connector-pending'
}

function statusLabel(step: SetupStepStatus): string {
  if (step.done) return t('setup.stepper.statusDone')
  if (step.index === props.currentStep) return t('setup.stepper.statusInProgress')
  return t('setup.stepper.statusPending')
}

function onSelect(step: SetupStepStatus) {
  if (!isReachable(step)) return
  emit('select', step.index)
}
</script>

<style scoped>
.setup-stepper {
  width: 100%;
}

.setup-stepper__list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.setup-stepper__item {
  position: relative;
  display: flex;
  flex-direction: column;
}

.setup-stepper__btn {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  width: 100%;
  padding: 0.75rem 0.875rem;
  border: 1px solid transparent;
  border-radius: 0.75rem;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
  color: rgb(71 85 105);
}

.setup-stepper__btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.setup-stepper__btn.btn-reachable:hover {
  background-color: rgb(241 245 249);
}

.setup-stepper__btn.btn-current {
  background-color: rgb(238 242 255);
  border-color: rgb(199 210 254);
  color: rgb(30 41 59);
}

.setup-stepper__btn.btn-done {
  color: rgb(15 23 42);
}

.setup-stepper__btn:focus-visible {
  outline: 2px solid rgb(99 102 241);
  outline-offset: 2px;
}

.setup-stepper__indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.8125rem;
  background-color: rgb(226 232 240);
  color: rgb(71 85 105);
  flex-shrink: 0;
}

.is-done .setup-stepper__indicator {
  background-color: rgb(16 185 129);
  color: white;
}

.is-current .setup-stepper__indicator {
  background-color: rgb(99 102 241);
  color: white;
}

.setup-stepper__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.setup-stepper__label {
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.25rem;
}

.setup-stepper__status {
  font-size: 0.75rem;
  color: rgb(100 116 139);
  margin-top: 0.125rem;
}

.setup-stepper__connector {
  display: none;
}

@media (max-width: 1023px) {
  .setup-stepper__list {
    flex-direction: row;
    overflow-x: auto;
    gap: 0.5rem;
    padding: 0.25rem 0.125rem;
    scrollbar-width: thin;
  }
  .setup-stepper__item {
    flex-direction: row;
    align-items: center;
    flex-shrink: 0;
  }
  .setup-stepper__btn {
    padding: 0.5rem 0.75rem;
    min-width: max-content;
  }
  .setup-stepper__text {
    flex-direction: row;
    align-items: baseline;
    gap: 0.5rem;
  }
  .setup-stepper__label {
    font-size: 0.8125rem;
  }
  .setup-stepper__status {
    margin-top: 0;
    font-size: 0.6875rem;
  }
  .setup-stepper__connector {
    display: block;
    width: 1.25rem;
    height: 2px;
    background-color: rgb(226 232 240);
    flex-shrink: 0;
    border-radius: 9999px;
  }
  .setup-stepper__connector.connector-done {
    background-color: rgb(16 185 129);
  }
}
</style>
