<script setup lang="ts">
import { X } from 'lucide-vue-next'

interface Props {
  label: string
  count?: number
  active?: boolean
  removable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  active: false,
  removable: false
})

interface Emits {
  (event: 'click'): void
  (event: 'remove'): void
}

const emit = defineEmits<Emits>()

const handleClick = () => {
  emit('click')
}

const handleRemove = (e: Event) => {
  e.stopPropagation()
  emit('remove')
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    handleClick()
  }
}
</script>

<template>
  <div
    role="button"
    tabindex="0"
    class="filter-chip"
    :class="{ 'filter-chip--active': active }"
    :aria-pressed="active"
    @click="handleClick"
    @keydown="handleKeyDown"
  >
    <span class="filter-chip__label">{{ label }}</span>

    <span v-if="count !== undefined" class="filter-chip__count mono">{{ count }}</span>

    <button
      v-if="removable"
      type="button"
      class="filter-chip__remove"
      aria-label="Remove filter"
      @click="handleRemove"
    >
      <X :size="12" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--r-full);
  border: 0.5px solid var(--hairline);
  background: var(--surface-2);
  color: var(--ink-2);
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.4;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    transform 0.1s ease;
}

.filter-chip:hover:not(.filter-chip--active) {
  background: var(--bg-subtle);
  border-color: var(--hairline-strong);
}

.filter-chip:active {
  transform: scale(0.98);
}

.filter-chip--active {
  background: var(--primary-tint);
  color: var(--primary);
  border-color: var(--primary);
  font-weight: 600;
}

.filter-chip__label {
  line-height: 1;
}

.filter-chip__count {
  padding: 2px 5px;
  border-radius: var(--r-sm);
  font-size: 10.5px;
  font-weight: 600;
  background: var(--surface);
  color: var(--ink-2);
}

.filter-chip--active .filter-chip__count {
  background: var(--primary);
  color: white;
}

.filter-chip__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  margin-left: 2px;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.15s ease;
}

.filter-chip__remove:hover {
  background: var(--hairline);
}

.filter-chip--active .filter-chip__remove:hover {
  background: color-mix(in oklab, var(--primary) 18%, transparent);
}
</style>
