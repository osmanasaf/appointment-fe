<template>
  <section class="app-card flex flex-col rounded-xl border" :class="paddingClass">
    <header
      v-if="title || $slots.title || $slots.actions"
      class="app-card__header mb-3 flex flex-wrap items-start justify-between gap-2 border-b pb-3 sm:mb-4 sm:items-center shrink-0"
    >
      <div class="min-w-0">
        <slot name="title">
          <h2 v-if="title" class="text-base font-semibold app-card__title">{{ title }}</h2>
          <p v-if="subtitle" class="mt-0.5 text-sm app-card__subtitle">{{ subtitle }}</p>
        </slot>
      </div>
      <div v-if="$slots.actions" class="shrink-0">
        <slot name="actions" />
      </div>
    </header>
    <div class="min-w-0 flex-1 flex flex-col">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="app-card__footer mt-auto shrink-0 border-t pt-4">
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

<style scoped>
.app-card {
  background: var(--surface);
  border-color: var(--hairline);
  box-shadow: var(--shadow-1);
  color: var(--ink-2);
}
.app-card__header {
  border-color: var(--hairline);
}
.app-card__footer {
  border-color: var(--hairline);
}
.app-card__title {
  color: var(--ink-1);
}
.app-card__subtitle {
  color: var(--ink-3);
}
</style>
