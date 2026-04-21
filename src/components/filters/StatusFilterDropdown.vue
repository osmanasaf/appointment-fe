<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, ListFilter, X } from 'lucide-vue-next'

export interface StatusOption {
  value: string
  label: string
  count?: number
  color?: string
}

interface Props {
  modelValue: string
  options: StatusOption[]
  ariaLabel?: string
  showClear?: boolean
  allLabel?: string
  totalCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  ariaLabel: undefined,
  showClear: true,
  allLabel: undefined,
  totalCount: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useI18n()

const menuOpen = ref(false)
const triggerRef = ref<HTMLButtonElement | null>(null)
const menuRef = ref<HTMLDivElement | null>(null)

const triggerLabel = computed(() => props.ariaLabel ?? t('filters.status.groupLabel'))
const allLabelText = computed(() => props.allLabel ?? t('filters.status.all'))

const selectedOption = computed<StatusOption | null>(() => {
  if (props.modelValue === '') return null
  return props.options.find((o) => o.value === props.modelValue) ?? null
})

const totalCountValue = computed(() => {
  if (typeof props.totalCount === 'number') return props.totalCount
  return props.options.reduce((sum, o) => sum + (o.count ?? 0), 0)
})

function selectStatus(value: string) {
  emit('update:modelValue', value)
  closeMenu()
}

function openMenu() {
  if (menuOpen.value) return
  menuOpen.value = true
}

function closeMenu() {
  menuOpen.value = false
}

function toggleMenu() {
  if (menuOpen.value) closeMenu()
  else openMenu()
}

function handleMenuKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    closeMenu()
    triggerRef.value?.focus()
  }
}

function handleOutsideClick(e: MouseEvent) {
  if (!menuOpen.value) return
  const target = e.target as Node | null
  if (!target) return
  if (menuRef.value?.contains(target)) return
  if (triggerRef.value?.contains(target)) return
  closeMenu()
}

onMounted(() => {
  document.addEventListener('mousedown', handleOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleOutsideClick)
})
</script>

<template>
  <div class="status-filter">
    <button
      ref="triggerRef"
      type="button"
      class="status-filter__trigger"
      :class="{ 'status-filter__trigger--active': modelValue !== '' }"
      :style="selectedOption?.color
        ? { background: selectedOption.color + '22', borderColor: selectedOption.color, color: selectedOption.color }
        : {}"
      :aria-haspopup="'listbox'"
      :aria-expanded="menuOpen"
      :aria-label="triggerLabel"
      @click="toggleMenu"
    >
      <template v-if="selectedOption">
        <span
          v-if="selectedOption.color"
          class="status-filter__dot"
          :style="{ background: selectedOption.color }"
          aria-hidden="true"
        />
        <span class="status-filter__name">{{ selectedOption.label }}</span>
        <span v-if="typeof selectedOption.count === 'number'" class="status-filter__count">{{ selectedOption.count }}</span>
      </template>
      <template v-else>
        <ListFilter class="size-3.5 status-filter__leading" aria-hidden="true" />
        <span>{{ allLabelText }}</span>
        <span class="status-filter__count">{{ totalCountValue }}</span>
      </template>
      <ChevronDown
        class="size-3.5 status-filter__chevron"
        :class="{ 'status-filter__chevron--open': menuOpen }"
        aria-hidden="true"
      />
    </button>

    <button
      v-if="showClear && modelValue !== ''"
      type="button"
      class="status-filter__clear"
      :aria-label="t('filters.status.clear')"
      @click="selectStatus('')"
    >
      <X class="size-3" aria-hidden="true" />
    </button>

    <div
      v-if="menuOpen"
      ref="menuRef"
      class="status-filter__menu"
      role="dialog"
      :aria-label="triggerLabel"
      @keydown="handleMenuKeydown"
    >
      <ul class="status-filter__list" role="listbox">
        <li>
          <button
            type="button"
            class="status-filter__option"
            :class="{ 'status-filter__option--active': modelValue === '' }"
            role="option"
            :aria-selected="modelValue === ''"
            @click="selectStatus('')"
          >
            <span class="status-filter__option-icon" aria-hidden="true">
              <ListFilter class="size-3.5" />
            </span>
            <span class="status-filter__option-name">{{ allLabelText }}</span>
            <span class="status-filter__option-count">{{ totalCountValue }}</span>
          </button>
        </li>
        <li v-for="opt in options" :key="opt.value">
          <button
            type="button"
            class="status-filter__option"
            :class="{ 'status-filter__option--active': modelValue === opt.value }"
            role="option"
            :aria-selected="modelValue === opt.value"
            @click="selectStatus(opt.value)"
          >
            <span
              v-if="opt.color"
              class="status-filter__option-dot"
              :style="{ background: opt.color }"
              aria-hidden="true"
            />
            <span v-else class="status-filter__option-icon" aria-hidden="true" />
            <span class="status-filter__option-name">{{ opt.label }}</span>
            <span v-if="typeof opt.count === 'number'" class="status-filter__option-count">{{ opt.count }}</span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.status-filter {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.status-filter__trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 10px;
  border-radius: var(--r-full);
  border: 1px solid var(--hairline);
  background: var(--surface);
  color: var(--ink-3);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  min-height: 32px;
  max-width: 240px;
}

.status-filter__trigger:hover {
  border-color: var(--hairline-strong);
  color: var(--ink-2);
}

.status-filter__trigger:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.status-filter__leading {
  flex-shrink: 0;
}

.status-filter__dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: var(--r-full);
  flex-shrink: 0;
}

.status-filter__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
}

.status-filter__count {
  font-size: 10px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  padding: 1px 6px;
  border-radius: var(--r-full);
  background: color-mix(in srgb, currentColor 14%, transparent);
  color: inherit;
  flex-shrink: 0;
}

.status-filter__chevron {
  transition: transform 0.18s ease;
  flex-shrink: 0;
  opacity: 0.7;
}

.status-filter__chevron--open {
  transform: rotate(180deg);
}

.status-filter__clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--r-full);
  border: 1px solid var(--hairline);
  background: var(--surface);
  color: var(--ink-3);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.status-filter__clear:hover {
  background: var(--surface-2);
  color: var(--ink-1);
}

.status-filter__clear:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.status-filter__menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 30;
  width: 240px;
  max-width: calc(100vw - 32px);
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.status-filter__list {
  list-style: none;
  margin: 0;
  padding: 4px;
  max-height: 320px;
  overflow-y: auto;
}

.status-filter__option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  background: transparent;
  border-radius: var(--r-md);
  color: var(--ink-1);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.12s ease;
}

.status-filter__option:hover {
  background: var(--surface-2);
}

.status-filter__option:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: -2px;
}

.status-filter__option--active {
  background: var(--primary-tint);
  color: var(--primary);
  font-weight: 600;
}

.status-filter__option-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: var(--r-full);
  background: var(--surface-2);
  color: var(--ink-3);
  flex-shrink: 0;
}

.status-filter__option-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: var(--r-full);
  margin-left: 6px;
  margin-right: 6px;
  flex-shrink: 0;
}

.status-filter__option-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-filter__option-count {
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  padding: 1px 6px;
  border-radius: var(--r-full);
  background: var(--surface-2);
  color: var(--ink-4);
  flex-shrink: 0;
}

.status-filter__option--active .status-filter__option-count {
  background: color-mix(in srgb, var(--primary) 18%, transparent);
  color: var(--primary);
}
</style>
