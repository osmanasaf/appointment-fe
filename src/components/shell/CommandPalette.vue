<template>
  <Teleport to="body">
    <Transition name="palette-fade">
      <div
        v-if="isOpen"
        class="command-palette-scrim"
        role="dialog"
        aria-modal="true"
        :aria-label="t('commandPalette.title')"
        @mousedown.self="handleScrimClick"
      >
        <div class="command-palette-container" @mousedown.stop>
          <div class="command-palette">
            <!-- Search input -->
            <div class="command-palette__header">
              <Search class="command-palette__search-icon" :size="16" aria-hidden="true" />
              <input
                ref="inputRef"
                v-model="searchQuery"
                type="text"
                class="command-palette__input"
                :placeholder="t('commandPalette.searchPlaceholder')"
                :aria-label="t('commandPalette.searchPlaceholder')"
                :aria-activedescendant="activeDescendantId"
                @keydown="handleKeydown"
              />
              <kbd class="command-palette__kbd" aria-hidden="true">ESC</kbd>
            </div>

            <!-- Commands list -->
            <div
              ref="listRef"
              class="command-palette__list"
              role="listbox"
              aria-label="Commands"
            >
              <!-- Recent commands section -->
              <template v-if="!searchQuery.trim() && recentCommands.length > 0">
                <div class="command-palette__section-title">
                  {{ t('commandPalette.sections.recent') }}
                </div>
                <button
                  v-for="(cmd, idx) in recentCommands"
                  :id="`cmd-${cmd.id}`"
                  :key="cmd.id"
                  type="button"
                  role="option"
                  :aria-selected="activeIndex === idx"
                  :class="[
                    'command-palette__item',
                    { 'command-palette__item--active': activeIndex === idx },
                  ]"
                  @click="executeCommand(cmd)"
                  @mouseenter="activeIndex = idx"
                >
                  <component
                    :is="cmd.icon"
                    v-if="cmd.icon"
                    class="command-palette__icon"
                    :size="18"
                    aria-hidden="true"
                  />
                  <div class="command-palette__label-group">
                    <span class="command-palette__label">{{ cmd.label }}</span>
                    <span v-if="cmd.description" class="command-palette__description">
                      {{ cmd.description }}
                    </span>
                  </div>
                  <div v-if="cmd.shortcut" class="command-palette__shortcuts">
                    <kbd
                      v-for="(key, keyIdx) in cmd.shortcut"
                      :key="keyIdx"
                      class="command-palette__shortcut-key"
                    >
                      {{ key }}
                    </kbd>
                  </div>
                </button>
              </template>

              <!-- Filtered commands by section -->
              <template v-if="searchQuery.trim() || recentCommands.length === 0">
                <template v-for="section in sectionsToShow" :key="section">
                  <template v-if="commandsBySection[section]?.length">
                    <div class="command-palette__section-title">
                      {{ sectionTitle(section) }}
                    </div>
                    <button
                      v-for="(cmd, idx) in commandsBySection[section]"
                      :id="`cmd-${cmd.id}`"
                      :key="cmd.id"
                      type="button"
                      role="option"
                      :aria-selected="activeIndex === globalIndex(section, idx)"
                      :class="[
                        'command-palette__item',
                        { 'command-palette__item--active': activeIndex === globalIndex(section, idx) },
                      ]"
                      @click="executeCommand(cmd)"
                      @mouseenter="activeIndex = globalIndex(section, idx)"
                    >
                      <component
                        :is="cmd.icon"
                        v-if="cmd.icon"
                        class="command-palette__icon"
                        :size="18"
                        aria-hidden="true"
                      />
                      <div class="command-palette__label-group">
                        <span class="command-palette__label">{{ cmd.label }}</span>
                        <span v-if="cmd.description" class="command-palette__description">
                          {{ cmd.description }}
                        </span>
                      </div>
                      <div v-if="cmd.shortcut" class="command-palette__shortcuts">
                        <kbd
                          v-for="(key, keyIdx) in cmd.shortcut"
                          :key="keyIdx"
                          class="command-palette__shortcut-key"
                        >
                          {{ key }}
                        </kbd>
                      </div>
                    </button>
                  </template>
                </template>
              </template>

              <!-- Empty state -->
              <div v-if="flatFiltered.length === 0" class="command-palette__empty">
                {{ t('commandPalette.empty') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search } from 'lucide-vue-next'
import { useCommandPalette } from '@/composables/useCommandPalette'
import { useCommands, type CommandItem, type CommandSection } from '@/composables/useCommands'

const { t } = useI18n()
const { isOpen, close } = useCommandPalette()
const allCommands = useCommands()

const inputRef = ref<HTMLInputElement>()
const listRef = ref<HTMLDivElement>()
const searchQuery = ref('')
const activeIndex = ref(0)

const RECENT_STORAGE_KEY = 'cmd-palette:recent'
const MAX_RECENT = 5

// Recent commands (localStorage)
const recentIds = ref<string[]>([])

function loadRecent() {
  if (typeof localStorage === 'undefined') return
  const raw = localStorage.getItem(RECENT_STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        recentIds.value = parsed.slice(0, MAX_RECENT)
      }
    } catch {
      // ignore
    }
  }
}

function saveRecent(commandId: string) {
  // Önce varsa çıkar, sonra başa ekle
  recentIds.value = [commandId, ...recentIds.value.filter((id) => id !== commandId)].slice(
    0,
    MAX_RECENT,
  )
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recentIds.value))
  }
}

const recentCommands = computed<CommandItem[]>(() => {
  return recentIds.value
    .map((id) => allCommands.find((c) => c.id === id))
    .filter((c): c is CommandItem => !!c)
})

// Filtered commands
const filtered = computed<CommandItem[]>(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return allCommands

  return allCommands.filter((cmd) => {
    const labelMatch = cmd.label.toLowerCase().includes(q)
    const descMatch = cmd.description?.toLowerCase().includes(q)
    const keywordsMatch = cmd.keywords?.some((kw) => kw.toLowerCase().includes(q))
    return labelMatch || descMatch || keywordsMatch
  })
})

// Group by section
const sectionsToShow: CommandSection[] = ['navigation', 'actions', 'help']

const commandsBySection = computed(() => {
  const grouped: Partial<Record<CommandSection, CommandItem[]>> = {}
  for (const section of sectionsToShow) {
    grouped[section] = filtered.value.filter((c) => c.section === section)
  }
  return grouped
})

const flatFiltered = computed<CommandItem[]>(() => {
  if (!searchQuery.value.trim() && recentCommands.value.length > 0) {
    return recentCommands.value
  }
  return sectionsToShow.flatMap((sec) => commandsBySection.value[sec] || [])
})

function sectionTitle(section: CommandSection): string {
  return t(`commandPalette.sections.${section}`)
}

function globalIndex(section: CommandSection, localIdx: number): number {
  let count = 0
  for (const sec of sectionsToShow) {
    if (sec === section) {
      return count + localIdx
    }
    count += commandsBySection.value[sec]?.length || 0
  }
  return localIdx
}

const activeDescendantId = computed(() => {
  const cmd = flatFiltered.value[activeIndex.value]
  return cmd ? `cmd-${cmd.id}` : undefined
})

function executeCommand(cmd: CommandItem) {
  saveRecent(cmd.id)
  cmd.action()
  close()
  searchQuery.value = ''
  activeIndex.value = 0
}

function handleKeydown(event: KeyboardEvent) {
  const len = flatFiltered.value.length

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % len
    scrollActiveIntoView()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + len) % len
    scrollActiveIntoView()
  } else if (event.key === 'Enter') {
    event.preventDefault()
    const cmd = flatFiltered.value[activeIndex.value]
    if (cmd) {
      executeCommand(cmd)
    }
  } else if (event.key === 'Escape') {
    event.preventDefault()
    close()
    searchQuery.value = ''
    activeIndex.value = 0
  }
}

function scrollActiveIntoView() {
  nextTick(() => {
    const activeEl = document.getElementById(activeDescendantId.value || '')
    if (activeEl && listRef.value) {
      const listRect = listRef.value.getBoundingClientRect()
      const itemRect = activeEl.getBoundingClientRect()
      if (itemRect.bottom > listRect.bottom) {
        activeEl.scrollIntoView({ block: 'nearest' })
      } else if (itemRect.top < listRect.top) {
        activeEl.scrollIntoView({ block: 'nearest' })
      }
    }
  })
}

function handleScrimClick() {
  close()
  searchQuery.value = ''
  activeIndex.value = 0
}

// Auto-focus input ve body scroll lock
watch(isOpen, (open) => {
  if (open) {
    nextTick(() => {
      inputRef.value?.focus()
    })
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

// Reset state on close
watch(isOpen, (open) => {
  if (!open) {
    searchQuery.value = ''
    activeIndex.value = 0
  }
})

onMounted(() => {
  loadRecent()
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* Scrim */
.command-palette-scrim {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-block-start: 15vh;
  background: color-mix(in oklab, var(--bg) 20%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.command-palette-container {
  width: 100%;
  max-width: 600px;
  padding-inline: 1rem;
}

.command-palette {
  display: flex;
  flex-direction: column;
  max-height: 50vh;
  border-radius: var(--r-lg);
  background: var(--surface);
  box-shadow: var(--shadow-3);
  border: 0.5px solid var(--hairline-strong);
  overflow: hidden;
}

/* Header */
.command-palette__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-block-end: 0.5px solid var(--hairline);
  background: var(--surface-2);
}

.command-palette__search-icon {
  flex-shrink: 0;
  color: var(--ink-3);
}

.command-palette__input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: 0.9375rem;
  color: var(--ink-1);
  outline: none;
}

.command-palette__input::placeholder {
  color: var(--ink-4);
}

.command-palette__kbd {
  display: inline-flex;
  padding: 0.125rem 0.5rem;
  border-radius: 0.375rem;
  background: var(--bg-elevated);
  border: 0.5px solid var(--hairline);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--ink-4);
}

/* List */
.command-palette__list {
  overflow-y: auto;
  max-height: 40vh;
  padding: 0.5rem;
}

.command-palette__section-title {
  padding: 0.5rem 0.75rem 0.25rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--ink-4);
}

.command-palette__item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.625rem 0.75rem;
  border-radius: var(--r-md);
  border: none;
  background: transparent;
  font: inherit;
  text-align: start;
  color: var(--ink-2);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.command-palette__item:hover,
.command-palette__item--active {
  background: var(--surface-2);
  color: var(--ink-1);
  border-inline-start: 2px solid var(--primary);
  padding-inline-start: calc(0.75rem - 2px);
}

.command-palette__icon {
  flex-shrink: 0;
  color: var(--ink-3);
}

.command-palette__item--active .command-palette__icon {
  color: var(--primary);
}

.command-palette__label-group {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
  min-width: 0;
}

.command-palette__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.command-palette__description {
  font-size: 0.75rem;
  color: var(--ink-4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.command-palette__shortcuts {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.command-palette__shortcut-key {
  display: inline-flex;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  background: var(--bg-elevated);
  border: 0.5px solid var(--hairline);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--ink-4);
}

.command-palette__empty {
  padding: 2rem 1rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--ink-4);
}

/* Transition */
.palette-fade-enter-active,
.palette-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.palette-fade-enter-from,
.palette-fade-leave-to {
  opacity: 0;
}

.palette-fade-enter-from .command-palette {
  transform: translateY(-8px);
}

.palette-fade-leave-to .command-palette {
  transform: translateY(-8px);
}
</style>
