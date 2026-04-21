<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, Search, Users, X } from 'lucide-vue-next'
import type { EmployeeResponse } from '@/api/employee'

interface Props {
  modelValue: number | ''
  employees: EmployeeResponse[]
  counts?: Map<number, number>
  colorFn?: (id: number) => string
  ariaLabel?: string
  showClear?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  counts: undefined,
  colorFn: undefined,
  ariaLabel: undefined,
  showClear: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | '']
}>()

const { t } = useI18n()

const menuOpen = ref(false)
const searchQuery = ref('')
const triggerRef = ref<HTMLButtonElement | null>(null)
const menuRef = ref<HTMLDivElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)

const FOCUS_DELAY_MS = 30

const triggerLabel = computed(
  () => props.ariaLabel ?? t('filters.employee.groupLabel'),
)

const selectedEmployee = computed<EmployeeResponse | null>(() => {
  if (props.modelValue === '') return null
  return props.employees.find((e) => e.id === props.modelValue) ?? null
})

const filteredEmployees = computed<EmployeeResponse[]>(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return props.employees
  return props.employees.filter((e) => e.name.toLowerCase().includes(q))
})

function getColor(id: number): string {
  return props.colorFn ? props.colorFn(id) : 'var(--ink-3)'
}

function getCount(id: number): number {
  return props.counts?.get(id) ?? 0
}

function selectEmployee(id: number | '') {
  emit('update:modelValue', id)
  closeMenu()
}

function openMenu() {
  if (menuOpen.value) return
  menuOpen.value = true
  searchQuery.value = ''
  setTimeout(() => searchInputRef.value?.focus(), FOCUS_DELAY_MS)
}

function closeMenu() {
  menuOpen.value = false
  searchQuery.value = ''
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
  <div class="employee-filter">
    <button
      ref="triggerRef"
      type="button"
      class="employee-filter__trigger"
      :class="{ 'employee-filter__trigger--active': modelValue !== '' }"
      :style="selectedEmployee
        ? { background: getColor(selectedEmployee.id) + '22', borderColor: getColor(selectedEmployee.id), color: getColor(selectedEmployee.id) }
        : {}"
      :aria-haspopup="'listbox'"
      :aria-expanded="menuOpen"
      :aria-label="triggerLabel"
      @click="toggleMenu"
    >
      <template v-if="selectedEmployee">
        <span
          class="employee-filter__avatar"
          :style="{ background: getColor(selectedEmployee.id) }"
          aria-hidden="true"
        >{{ selectedEmployee.name.charAt(0).toUpperCase() }}</span>
        <span class="employee-filter__name">{{ selectedEmployee.name }}</span>
        <span v-if="counts" class="employee-filter__count">{{ getCount(selectedEmployee.id) }}</span>
      </template>
      <template v-else>
        <Users class="size-3.5 employee-filter__leading" aria-hidden="true" />
        <span>{{ t('filters.employee.all') }}</span>
        <span class="employee-filter__count">{{ employees.length }}</span>
      </template>
      <ChevronDown
        class="size-3.5 employee-filter__chevron"
        :class="{ 'employee-filter__chevron--open': menuOpen }"
        aria-hidden="true"
      />
    </button>

    <button
      v-if="showClear && modelValue !== ''"
      type="button"
      class="employee-filter__clear"
      :aria-label="t('filters.employee.clear')"
      @click="selectEmployee('')"
    >
      <X class="size-3" aria-hidden="true" />
    </button>

    <div
      v-if="menuOpen"
      ref="menuRef"
      class="employee-filter__menu"
      role="dialog"
      :aria-label="triggerLabel"
      @keydown="handleMenuKeydown"
    >
      <div class="employee-filter__search">
        <Search class="size-3.5" aria-hidden="true" style="color: var(--ink-4)" />
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="search"
          class="employee-filter__search-input"
          :placeholder="t('filters.employee.searchPlaceholder')"
          :aria-label="t('filters.employee.searchPlaceholder')"
        />
      </div>

      <ul class="employee-filter__list" role="listbox">
        <li>
          <button
            type="button"
            class="employee-filter__option"
            :class="{ 'employee-filter__option--active': modelValue === '' }"
            role="option"
            :aria-selected="modelValue === ''"
            @click="selectEmployee('')"
          >
            <span class="employee-filter__option-icon" aria-hidden="true">
              <Users class="size-3.5" />
            </span>
            <span class="employee-filter__option-name">{{ t('filters.employee.all') }}</span>
            <span class="employee-filter__option-count">{{ employees.length }}</span>
          </button>
        </li>
        <li v-for="emp in filteredEmployees" :key="emp.id">
          <button
            type="button"
            class="employee-filter__option"
            :class="{ 'employee-filter__option--active': modelValue === emp.id }"
            role="option"
            :aria-selected="modelValue === emp.id"
            @click="selectEmployee(emp.id)"
          >
            <span
              class="employee-filter__option-avatar"
              :style="{ background: getColor(emp.id) }"
              aria-hidden="true"
            >{{ emp.name.charAt(0).toUpperCase() }}</span>
            <span class="employee-filter__option-name">{{ emp.name }}</span>
            <span v-if="counts" class="employee-filter__option-count">{{ getCount(emp.id) }}</span>
          </button>
        </li>
        <li v-if="filteredEmployees.length === 0 && searchQuery.trim()">
          <p class="employee-filter__empty">{{ t('filters.employee.noResults') }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.employee-filter {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.employee-filter__trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 4px;
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

.employee-filter__trigger:hover {
  border-color: var(--hairline-strong);
  color: var(--ink-2);
}

.employee-filter__trigger:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.employee-filter__leading {
  margin-left: 8px;
}

.employee-filter__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: var(--r-full);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}

.employee-filter__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
}

.employee-filter__count {
  font-size: 10px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  padding: 1px 6px;
  border-radius: var(--r-full);
  background: color-mix(in srgb, currentColor 14%, transparent);
  color: inherit;
  flex-shrink: 0;
}

.employee-filter__chevron {
  transition: transform 0.18s ease;
  flex-shrink: 0;
  opacity: 0.7;
}

.employee-filter__chevron--open {
  transform: rotate(180deg);
}

.employee-filter__clear {
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

.employee-filter__clear:hover {
  background: var(--surface-2);
  color: var(--ink-1);
}

.employee-filter__clear:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.employee-filter__menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 30;
  width: 280px;
  max-width: calc(100vw - 32px);
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.employee-filter__search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--hairline);
  background: var(--surface-2);
}

.employee-filter__search-input {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--ink-1);
  font-size: 13px;
  font-family: inherit;
}

.employee-filter__search-input::placeholder {
  color: var(--ink-4);
}

.employee-filter__list {
  list-style: none;
  margin: 0;
  padding: 4px;
  max-height: 280px;
  overflow-y: auto;
}

.employee-filter__option {
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

.employee-filter__option:hover {
  background: var(--surface-2);
}

.employee-filter__option:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: -2px;
}

.employee-filter__option--active {
  background: var(--primary-tint);
  color: var(--primary);
  font-weight: 600;
}

.employee-filter__option-icon {
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

.employee-filter__option-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: var(--r-full);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}

.employee-filter__option-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.employee-filter__option-count {
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  padding: 1px 6px;
  border-radius: var(--r-full);
  background: var(--surface-2);
  color: var(--ink-4);
  flex-shrink: 0;
}

.employee-filter__option--active .employee-filter__option-count {
  background: color-mix(in srgb, var(--primary) 18%, transparent);
  color: var(--primary);
}

.employee-filter__empty {
  margin: 0;
  padding: 16px 12px;
  text-align: center;
  font-size: 12px;
  color: var(--ink-4);
}
</style>
