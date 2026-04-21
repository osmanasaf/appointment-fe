<template>
  <header class="app-topbar">
    <button
      type="button"
      class="app-topbar__menu-btn"
      :aria-label="t(sidebarOpen ? 'admin.menuClose' : 'admin.menuOpen')"
      :aria-expanded="sidebarOpen"
      @click="$emit('toggle-sidebar')"
    >
      <Menu class="size-5" aria-hidden="true" />
    </button>

    <nav
      class="app-topbar__breadcrumb"
      :aria-label="t('admin.breadcrumb')"
    >
      <span class="app-topbar__crumb-root">{{ t('admin.breadcrumb') }}</span>
      <span class="app-topbar__crumb-sep" aria-hidden="true">/</span>
      <span class="app-topbar__crumb-current">{{ pageTitle }}</span>
    </nav>

    <div class="app-topbar__search" role="search">
      <Search class="size-4 shrink-0" aria-hidden="true" />
      <input
        type="text"
        readonly
        :placeholder="t('admin.searchPlaceholder')"
        :aria-label="t('admin.searchPlaceholder')"
        class="app-topbar__search-input"
        @focus="onSearchFocus"
        @click="onSearchFocus"
      />
      <kbd class="app-topbar__kbd" aria-hidden="true">{{ kbdShortcut }}</kbd>
    </div>

    <button
      type="button"
      class="app-topbar__icon-btn"
      :aria-label="t(themePref === 'dark' ? 'admin.themeLight' : 'admin.themeDark')"
      @click="onThemeToggle"
    >
      <Sun v-if="themePref === 'dark'" class="size-[18px]" aria-hidden="true" />
      <Moon v-else class="size-[18px]" aria-hidden="true" />
    </button>

    <button
      type="button"
      class="app-topbar__icon-btn app-topbar__icon-btn--with-dot"
      :aria-label="t('admin.notifications')"
      @click="toggleNotifications"
    >
      <Bell class="size-[18px]" aria-hidden="true" />
      <span v-if="hasNotifications" class="app-topbar__dot" aria-hidden="true" />
    </button>

    <div class="app-topbar__user">
      <span class="app-topbar__avatar" aria-hidden="true">{{ userInitials }}</span>
      <span class="app-topbar__user-meta">
        <span class="app-topbar__user-name">{{ userDisplayName }}</span>
        <span class="app-topbar__user-role">{{ userRoleLabel }}</span>
      </span>
      <button
        type="button"
        class="app-topbar__logout"
        :aria-label="t('admin.logout')"
        @click="$emit('logout')"
      >
        <LogOut class="size-[16px]" aria-hidden="true" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Bell, LogOut, Menu, Moon, Search, Sun } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'
import { useNotificationsDrawer } from '@/composables/useNotificationsDrawer'
import { useCommandPalette } from '@/composables/useCommandPalette'

const props = withDefaults(
  defineProps<{
    pageTitle: string
    sidebarOpen: boolean
    userDisplayName: string
    userRoleLabel: string
    hasNotifications?: boolean
  }>(),
  { hasNotifications: false },
)

defineEmits<{
  (event: 'toggle-sidebar'): void
  (event: 'logout'): void
}>()

const { t } = useI18n()
const { effective: themePref, toggle } = useTheme()
const { toggle: toggleNotifications } = useNotificationsDrawer()
const { open: openCommandPalette } = useCommandPalette()

const userInitials = computed(() => {
  const name = props.userDisplayName.trim()
  if (!name) return 'A'
  const parts = name.split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase() || 'A'
})

const kbdShortcut = computed(() => {
  if (typeof navigator === 'undefined') return 'Ctrl+K'
  const platform = navigator.platform || ''
  const ua = navigator.userAgent || ''
  return /Mac|iPhone|iPad/.test(platform) || /Mac OS/.test(ua) ? '⌘K' : 'Ctrl+K'
})

function onThemeToggle() {
  toggle()
}

function onSearchFocus() {
  openCommandPalette()
}
</script>

<style scoped>
.app-topbar {
  position: sticky;
  inset-block-start: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  height: var(--topbar-h);
  padding-inline: 0.875rem;
  background: color-mix(in oklab, var(--bg-elevated) 92%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-block-end: 0.5px solid var(--hairline);
}

@media (min-width: 640px) {
  .app-topbar {
    padding-inline: 1.25rem;
    gap: 0.75rem;
  }
}

.app-topbar__menu-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--r-sm);
  border: none;
  background: transparent;
  color: var(--ink-2);
  cursor: pointer;
  transition: background 0.15s ease;
}

.app-topbar__menu-btn:hover {
  background: var(--bg-subtle);
  color: var(--ink-1);
}

.app-topbar__menu-btn:focus-visible {
  outline: none;
  background: var(--bg-subtle);
  box-shadow: 0 0 0 2px var(--primary-tint);
}

@media (max-width: 639px) {
  .app-topbar__menu-btn,
  .app-topbar__icon-btn {
    width: 2.75rem;
    height: 2.75rem;
  }
}

@media (min-width: 1024px) {
  .app-topbar__menu-btn {
    display: none;
  }
}

.app-topbar__breadcrumb {
  display: none;
  align-items: center;
  gap: 0.375rem;
  min-width: 0;
  font-size: 0.8125rem;
  color: var(--ink-4);
}

@media (min-width: 640px) {
  .app-topbar__breadcrumb {
    display: inline-flex;
  }
}

.app-topbar__crumb-root {
  font-weight: 500;
}

.app-topbar__crumb-sep {
  color: var(--ink-5);
}

.app-topbar__crumb-current {
  font-weight: 600;
  color: var(--ink-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-topbar__search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  max-width: 26rem;
  height: 2.25rem;
  padding: 0 0.625rem;
  border-radius: var(--r-md);
  background: var(--surface-2);
  border: 0.5px solid var(--hairline);
  color: var(--ink-3);
  margin-inline-start: auto;
}

.app-topbar__search:focus-within {
  border-color: var(--primary);
  background: var(--bg-elevated);
  box-shadow: 0 0 0 3px var(--primary-tint);
}

.app-topbar__search-input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: 0.8125rem;
  color: var(--ink-1);
  outline: none;
  cursor: pointer;
}

.app-topbar__search-input:read-only {
  cursor: pointer;
}

.app-topbar__search-input::placeholder {
  color: var(--ink-4);
}

.app-topbar__kbd {
  display: none;
  padding: 0.0625rem 0.375rem;
  border-radius: 0.375rem;
  background: var(--bg-elevated);
  border: 0.5px solid var(--hairline);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--ink-4);
}

@media (min-width: 768px) {
  .app-topbar__kbd {
    display: inline-flex;
  }
}

.app-topbar__icon-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--r-sm);
  border: none;
  background: transparent;
  color: var(--ink-2);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.app-topbar__icon-btn:hover {
  background: var(--bg-subtle);
  color: var(--ink-1);
}

.app-topbar__icon-btn:focus-visible {
  outline: none;
  background: var(--bg-subtle);
  box-shadow: 0 0 0 2px var(--primary-tint);
}

.app-topbar__dot {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: var(--danger);
  border: 2px solid var(--bg-elevated);
}

.app-topbar__user {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding-inline: 0.625rem;
  border-inline-start: 0.5px solid var(--hairline);
  margin-inline-start: 0.25rem;
}

@media (min-width: 640px) {
  .app-topbar__user {
    display: flex;
  }
}

.app-topbar__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.125rem;
  height: 2.125rem;
  border-radius: 999px;
  background: var(--primary-tint);
  color: var(--primary);
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
}

.app-topbar__user-meta {
  display: none;
  flex-direction: column;
  line-height: 1.15;
  max-width: 9rem;
}

@media (min-width: 1024px) {
  .app-topbar__user-meta {
    display: flex;
  }
}

.app-topbar__user-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--ink-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-topbar__user-role {
  font-size: 0.6875rem;
  color: var(--ink-4);
}

.app-topbar__logout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--r-sm);
  border: none;
  background: transparent;
  color: var(--ink-3);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.app-topbar__logout:hover {
  background: var(--danger-tint);
  color: var(--danger);
}

.app-topbar__logout:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--primary-tint);
}
</style>
