<template>
  <div class="space-y-6">
    <SectionHeader
      :title="t('appearance.title')"
      :subtitle="t('appearance.lead')"
    />

    <div
      role="radiogroup"
      :aria-label="t('appearance.title')"
      class="grid gap-4 sm:grid-cols-3"
    >
      <button
        v-for="(option, idx) in themeOptions"
        :key="option.value"
        :ref="(el) => setOptionRef(el, idx)"
        type="button"
        role="radio"
        :aria-checked="preference === option.value"
        :tabindex="getTabindex(option.value, idx)"
        class="appearance-card relative overflow-hidden p-0 transition"
        :class="preference === option.value ? 'is-selected' : ''"
        @click="onSelect(option.value)"
        @keydown="(e) => onKeydown(e, idx)"
      >
        <!-- Mock preview -->
        <div
          class="relative h-32 p-4"
          :style="option.gradientStyle"
        >
          <div
            v-if="preference === option.value"
            class="absolute top-2 right-2 flex items-center justify-center size-6 rounded-full"
            :style="{ background: 'var(--primary)', color: 'var(--bg)' }"
          >
            <Check class="size-4" />
          </div>
          <!-- Mock UI elements -->
          <div class="space-y-2">
            <div class="h-3 w-20 rounded" :style="{ background: option.mockBar }" />
            <div class="h-2 w-full rounded" :style="{ background: option.mockLine1 }" />
            <div class="h-2 w-3/4 rounded" :style="{ background: option.mockLine2 }" />
          </div>
        </div>
        <!-- Label -->
        <div class="p-4 border-t" :style="{ borderColor: 'var(--hairline)' }">
          <h3 class="text-base font-semibold" :style="{ color: 'var(--ink-1)' }">
            {{ option.label }}
          </h3>
          <p class="mt-1 text-sm" :style="{ color: 'var(--ink-4)' }">
            {{ option.desc }}
          </p>
        </div>
      </button>
    </div>

    <!-- Note -->
    <div class="rounded-lg p-4" :style="{ background: 'var(--surface-2)', color: 'var(--ink-3)' }">
      <p class="text-sm">{{ t('appearance.note') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'
import SectionHeader from '@/components/ui/SectionHeader.vue'

type ThemePreference = 'light' | 'dark' | 'system'

const { t } = useI18n()
const { preference, setPreference } = useTheme()

const optionRefs = ref<(HTMLButtonElement | null)[]>([])

function setOptionRef(el: Element | { $el?: Element } | null, idx: number) {
  optionRefs.value[idx] = (el as HTMLButtonElement | null) ?? null
}

function getTabindex(value: ThemePreference, idx: number): number {
  if (preference.value === value) return 0
  const selectedExists = themeOptions.value.some((o) => o.value === preference.value)
  if (!selectedExists && idx === 0) return 0
  return -1
}

function onSelect(value: ThemePreference) {
  setPreference(value)
}

async function focusOption(idx: number) {
  await nextTick()
  optionRefs.value[idx]?.focus()
}

function onKeydown(event: KeyboardEvent, idx: number) {
  const lastIdx = themeOptions.value.length - 1
  let nextIdx = idx
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      nextIdx = idx === lastIdx ? 0 : idx + 1
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      nextIdx = idx === 0 ? lastIdx : idx - 1
      break
    case 'Home':
      nextIdx = 0
      break
    case 'End':
      nextIdx = lastIdx
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      onSelect(themeOptions.value[idx].value)
      return
    default:
      return
  }
  event.preventDefault()
  onSelect(themeOptions.value[nextIdx].value)
  focusOption(nextIdx)
}

const themeOptions = computed<Array<{
  value: ThemePreference
  label: string
  desc: string
  gradientStyle: { background: string }
  mockBar: string
  mockLine1: string
  mockLine2: string
}>>(() => [
  {
    value: 'light' as const,
    label: t('appearance.option.light.label'),
    desc: t('appearance.option.light.desc'),
    gradientStyle: {
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
    },
    mockBar: 'rgba(14, 165, 233, 0.3)',
    mockLine1: 'rgba(14, 165, 233, 0.2)',
    mockLine2: 'rgba(14, 165, 233, 0.15)'
  },
  {
    value: 'dark' as const,
    label: t('appearance.option.dark.label'),
    desc: t('appearance.option.dark.desc'),
    gradientStyle: {
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
    },
    mockBar: 'rgba(148, 163, 184, 0.4)',
    mockLine1: 'rgba(148, 163, 184, 0.3)',
    mockLine2: 'rgba(148, 163, 184, 0.2)'
  },
  {
    value: 'system' as const,
    label: t('appearance.option.system.label'),
    desc: t('appearance.option.system.desc'),
    gradientStyle: {
      background: 'linear-gradient(90deg, #f0f9ff 0%, #f0f9ff 50%, #1e293b 50%, #1e293b 100%)'
    },
    mockBar: 'rgba(100, 116, 139, 0.3)',
    mockLine1: 'rgba(100, 116, 139, 0.25)',
    mockLine2: 'rgba(100, 116, 139, 0.2)'
  }
])
</script>

<style scoped>
.appearance-card {
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--r-md, 0.75rem);
  box-shadow: var(--shadow-1);
  cursor: pointer;
}
.appearance-card:hover {
  border-color: var(--hairline-strong);
}
.appearance-card.is-selected {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary);
}
.appearance-card:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
</style>
