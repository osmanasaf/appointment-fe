<template>
  <button
    :type="nativeType"
    class="app-btn"
    :class="[`app-btn--${variant}`, sizeClass]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    loading?: boolean
    nativeType?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
    nativeType: 'button',
  },
)

defineEmits<{ click: [MouseEvent] }>()

const sizeClass = computed(() => {
  const s = props.size
  if (s === 'sm') return 'min-h-8 px-3 text-xs'
  if (s === 'lg') return 'min-h-12 px-6 text-base'
  return 'min-h-10 px-4 text-sm'
})
</script>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  border: 1px solid transparent;
  transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
}
.app-btn:disabled {
  pointer-events: none;
  opacity: 0.5;
}
.app-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.app-btn--primary {
  background: var(--primary);
  color: var(--bg);
}
.app-btn--primary:hover {
  background: var(--primary-pressed);
}
.app-btn--primary:active {
  filter: brightness(0.95);
}

.app-btn--secondary {
  background: var(--surface);
  color: var(--ink-2);
  border-color: var(--hairline-strong);
}
.app-btn--secondary:hover {
  background: var(--surface-2);
  color: var(--ink-1);
}

.app-btn--danger {
  background: var(--surface);
  color: var(--danger);
  border-color: var(--danger);
}
.app-btn--danger:hover {
  background: var(--danger-tint);
}

.app-btn--ghost {
  background: transparent;
  color: var(--ink-2);
}
.app-btn--ghost:hover {
  background: var(--surface-2);
  color: var(--ink-1);
}
</style>
