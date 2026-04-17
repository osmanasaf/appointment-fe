<template>
  <section
    class="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm"
    :aria-labelledby="headingId"
  >
    <header class="flex flex-col gap-1.5 border-b border-slate-100 px-5 py-4 sm:px-7 sm:py-5">
      <p class="text-xs font-semibold uppercase tracking-widest text-indigo-600">
        {{ t('setup.shell.stepLabel', { current: stepIndex, total: totalSteps }) }}
      </p>
      <h2
        :id="headingId"
        ref="headingRef"
        tabindex="-1"
        class="text-xl font-semibold text-slate-900 sm:text-2xl"
      >
        {{ title }}
      </h2>
      <p v-if="description" class="text-sm text-slate-600">{{ description }}</p>
    </header>

    <div class="flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
      <slot />
    </div>

    <footer
      class="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7"
      :style="footerStyle"
    >
      <div class="flex items-center gap-3">
        <AppButton
          v-if="!hideBack"
          type="button"
          variant="ghost"
          :disabled="busy || stepIndex <= 1"
          @click="$emit('back')"
        >
          <ChevronLeft class="size-4" aria-hidden="true" />
          {{ t('setup.shell.back') }}
        </AppButton>
        <button
          v-if="!hideSkip"
          type="button"
          class="text-xs font-semibold text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          :disabled="busy"
          @click="$emit('dismiss')"
        >
          {{ t('setup.shell.dismiss') }}
        </button>
      </div>

      <div class="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <p
          v-if="errorMessage"
          class="text-sm text-red-600"
          role="alert"
          aria-live="assertive"
        >
          {{ errorMessage }}
        </p>
        <AppButton
          type="button"
          variant="primary"
          :loading="busy"
          :disabled="nextDisabled"
          @click="$emit('next')"
        >
          {{ nextLabel ?? defaultNextLabel }}
          <ChevronRight class="size-4" aria-hidden="true" />
        </AppButton>
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{
  stepIndex: number
  totalSteps: number
  title: string
  description?: string
  busy?: boolean
  errorMessage?: string | null
  nextLabel?: string
  nextDisabled?: boolean
  hideBack?: boolean
  hideSkip?: boolean
  isFinal?: boolean
}>()

defineEmits<{
  back: []
  next: []
  dismiss: []
}>()

const { t } = useI18n()
const headingRef = ref<HTMLElement | null>(null)
const headingId = useId()

const defaultNextLabel = computed(() =>
  props.isFinal ? t('setup.shell.finish') : t('setup.shell.next'),
)

const footerStyle = computed(() => ({
  paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
}))

function focusHeading() {
  nextTick(() => headingRef.value?.focus())
}

onMounted(focusHeading)
watch(() => props.stepIndex, focusHeading)
</script>
