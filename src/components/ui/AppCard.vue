<template>
  <section
    class="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm"
    :class="paddingClass"
  >
    <header
      v-if="title || $slots.title || $slots.actions"
      class="mb-3 flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3 sm:mb-4 sm:items-center shrink-0"
    >
      <div class="min-w-0">
        <slot name="title">
          <h2 v-if="title" class="text-base font-semibold text-slate-900">{{ title }}</h2>
          <p v-if="subtitle" class="mt-0.5 text-sm text-slate-600">{{ subtitle }}</p>
        </slot>
      </div>
      <div v-if="$slots.actions" class="shrink-0">
        <slot name="actions" />
      </div>
    </header>
    <div class="min-w-0 flex-1 flex flex-col">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="mt-auto shrink-0 border-t border-slate-100 pt-4">
      <slot name="footer" />
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    padded?: boolean
  }>(),
  {
    padded: true,
  },
)

const paddingClass = computed(() => (props.padded ? 'p-4 sm:p-5' : 'p-0'))
</script>
