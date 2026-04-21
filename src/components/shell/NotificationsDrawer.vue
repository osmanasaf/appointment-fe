<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div
        v-if="isOpen"
        class="notifications-drawer-scrim"
        aria-modal="true"
        role="dialog"
        :aria-label="t('notifications.title')"
        @click="onScrimClick"
      >
        <div
          ref="drawerRef"
          class="notifications-drawer"
          @click.stop
        >
          <!-- Header -->
          <div class="notifications-drawer__header">
            <div class="notifications-drawer__header-left">
              <h2 class="notifications-drawer__title">
                {{ t('notifications.title') }}
              </h2>
              <span
                v-if="unreadCount > 0"
                class="notifications-drawer__badge"
                :aria-label="t('notifications.unreadBadge', { n: unreadCount })"
              >
                {{ unreadCount }}
              </span>
            </div>
            <button
              type="button"
              class="notifications-drawer__close-btn"
              :aria-label="t('notifications.closeAria')"
              @click="close()"
            >
              <X :size="20" aria-hidden="true" />
            </button>
          </div>

          <!-- Sub-header -->
          <div class="notifications-drawer__subheader">
            <div class="notifications-drawer__filters">
              <FilterChip
                :label="t('notifications.filters.all')"
                :active="activeFilter === 'all'"
                @click="activeFilter = 'all'"
              />
              <FilterChip
                :label="t('notifications.filters.unread')"
                :count="unreadCount"
                :active="activeFilter === 'unread'"
                @click="activeFilter = 'unread'"
              />
            </div>
            <button
              v-if="unreadCount > 0"
              type="button"
              class="notifications-drawer__mark-all"
              @click="markAllAsRead()"
            >
              {{ t('notifications.markAllRead') }}
            </button>
          </div>

          <!-- Body -->
          <div class="notifications-drawer__body">
            <div
              v-if="filteredItems.length === 0"
              class="notifications-drawer__empty"
            >
              <BellOff :size="48" aria-hidden="true" class="notifications-drawer__empty-icon" />
              <p class="notifications-drawer__empty-text">
                {{ t('notifications.empty') }}
              </p>
            </div>

            <ul
              v-else
              class="notifications-drawer__list"
              role="list"
            >
              <li
                v-for="item in filteredItems"
                :key="item.id"
                role="listitem"
              >
                <button
                  type="button"
                  class="notifications-drawer__item"
                  :class="{ 'notifications-drawer__item--unread': !item.read }"
                  @click="onItemClick(item)"
                >
                  <div
                    class="notifications-drawer__icon-box"
                    :class="`notifications-drawer__icon-box--${item.severity}`"
                  >
                    <component
                      :is="getIcon(item.kind)"
                      :size="18"
                      aria-hidden="true"
                    />
                  </div>

                  <div class="notifications-drawer__item-content">
                    <p class="notifications-drawer__item-title">
                      {{ t(item.title) }}
                    </p>
                    <p v-if="item.body" class="notifications-drawer__item-body">
                      {{ t(item.body, item.bodyParams ?? {}) }}
                    </p>
                    <span class="notifications-drawer__item-time caption">
                      {{ formatRelativeTime(item.createdAt) }}
                    </span>
                  </div>

                  <div class="notifications-drawer__item-actions">
                    <span v-if="!item.read" class="notifications-drawer__unread-dot" aria-hidden="true" />
                    <button
                      type="button"
                      class="notifications-drawer__dismiss-btn"
                      :aria-label="t('notifications.dismissAria')"
                      @click.stop="dismiss(item.id)"
                    >
                      <X :size="16" aria-hidden="true" />
                    </button>
                  </div>
                </button>

                <div
                  v-if="item.actionLabel && item.actionRoute"
                  class="notifications-drawer__item-footer"
                >
                  <button
                    type="button"
                    class="notifications-drawer__action-btn"
                    @click="onActionClick(item)"
                  >
                    {{ t(item.actionLabel) }}
                  </button>
                </div>
              </li>
            </ul>
          </div>

          <!-- Footer -->
          <div class="notifications-drawer__footer">
            <button
              type="button"
              class="notifications-drawer__footer-link"
            >
              {{ t('notifications.viewAll') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { X, BellOff, Calendar, Ban, MessageCircle, DollarSign, AlertCircle } from 'lucide-vue-next'
import type { Component } from 'vue'
import type { NotificationItem, NotificationKind } from '@/types/notification'
import { useNotificationsDrawer } from '@/composables/useNotificationsDrawer'
import { useNotifications } from '@/composables/useNotifications'
import FilterChip from '@/components/ui/FilterChip.vue'

const { t } = useI18n()
const router = useRouter()
const { isOpen, close } = useNotificationsDrawer()
const { items, unreadCount, markAsRead, markAllAsRead, dismiss } = useNotifications()

const drawerRef = ref<HTMLElement | null>(null)
const activeFilter = ref<'all' | 'unread'>('all')

const filteredItems = computed(() => {
  if (activeFilter.value === 'unread') {
    return items.value.filter((n) => !n.read)
  }
  return items.value
})

function getIcon(kind: NotificationKind): Component {
  switch (kind) {
    case 'appointment_created':
      return Calendar
    case 'appointment_cancelled':
      return Ban
    case 'reminder_sent':
      return MessageCircle
    case 'payment_received':
      return DollarSign
    case 'system':
      return AlertCircle
    default:
      return AlertCircle
  }
}

function formatRelativeTime(isoString: string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / (1000 * 60))
  const diffHr = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMin < 1) return t('notifications.relativeTime.justNow')
  if (diffMin < 60) return t('notifications.relativeTime.minutes', { n: diffMin })
  if (diffHr < 24) return t('notifications.relativeTime.hours', { n: diffHr })
  if (diffDay === 1) return t('notifications.relativeTime.yesterday')
  return t('notifications.relativeTime.daysAgo', { n: diffDay })
}

function onItemClick(item: NotificationItem): void {
  markAsRead(item.id)
  if (item.actionRoute) {
    router.push({ name: item.actionRoute })
    close()
  }
}

function onActionClick(item: NotificationItem): void {
  markAsRead(item.id)
  if (item.actionRoute) {
    router.push({ name: item.actionRoute })
    close()
  }
}

function onScrimClick(): void {
  close()
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && isOpen.value) {
    close()
  }
}

// Body scroll lock
watch(isOpen, (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
    // Focus drawer
    if (drawerRef.value) {
      const firstFocusable = drawerRef.value.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      firstFocusable?.focus()
    }
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.notifications-drawer-scrim {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: var(--scrim);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  justify-content: flex-end;
}

.notifications-drawer {
  width: 100%;
  max-width: 400px;
  height: 100vh;
  background: var(--surface);
  box-shadow: var(--shadow-3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

@media (max-width: 640px) {
  .notifications-drawer {
    max-width: 100%;
  }
}

/* Header */
.notifications-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-bottom: 0.5px solid var(--hairline);
}

.notifications-drawer__header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.notifications-drawer__title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--ink-1);
  margin: 0;
}

.notifications-drawer__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.375rem;
  border-radius: 999px;
  background: var(--primary);
  color: var(--bg);
  font-size: 0.75rem;
  font-weight: 600;
  font-family: var(--font-mono);
}

.notifications-drawer__close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--r-sm);
  border: none;
  background: transparent;
  color: var(--ink-3);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.notifications-drawer__close-btn:hover {
  background: var(--surface-2);
  color: var(--ink-1);
}

.notifications-drawer__close-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--primary-tint);
}

/* Sub-header */
.notifications-drawer__subheader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 0.5px solid var(--hairline);
}

.notifications-drawer__filters {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.notifications-drawer__mark-all {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--primary);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: var(--r-sm);
  transition: background 0.15s ease;
}

.notifications-drawer__mark-all:hover {
  background: var(--primary-tint);
}

.notifications-drawer__mark-all:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--primary-tint);
}

/* Body */
.notifications-drawer__body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.notifications-drawer__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1.25rem;
  text-align: center;
}

.notifications-drawer__empty-icon {
  color: var(--ink-5);
}

.notifications-drawer__empty-text {
  font-size: 0.875rem;
  color: var(--ink-4);
  margin: 0;
}

.notifications-drawer__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* Item */
.notifications-drawer__item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
  border-bottom: 0.5px solid var(--hairline);
}

.notifications-drawer__item:hover {
  background: var(--surface-2);
}

.notifications-drawer__item:focus-visible {
  outline: none;
  background: var(--surface-2);
  box-shadow: inset 0 0 0 2px var(--primary-tint);
}

.notifications-drawer__item--unread {
  background: color-mix(in oklab, var(--primary-tint) 8%, transparent);
}

.notifications-drawer__item--unread:hover {
  background: color-mix(in oklab, var(--primary-tint) 14%, transparent);
}

.notifications-drawer__icon-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--r-md);
  flex-shrink: 0;
}

.notifications-drawer__icon-box--info {
  background: var(--primary-tint);
  color: var(--primary);
}

.notifications-drawer__icon-box--success {
  background: var(--success-tint);
  color: var(--success);
}

.notifications-drawer__icon-box--warning {
  background: var(--warning-tint);
  color: var(--warning);
}

.notifications-drawer__icon-box--danger {
  background: var(--danger-tint);
  color: var(--danger);
}

.notifications-drawer__item-content {
  flex: 1;
  min-width: 0;
}

.notifications-drawer__item-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ink-1);
  margin: 0 0 0.25rem 0;
}

.notifications-drawer__item-body {
  font-size: 0.8125rem;
  color: var(--ink-2);
  margin: 0 0 0.375rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notifications-drawer__item-time {
  color: var(--ink-4);
}

.notifications-drawer__item-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.notifications-drawer__unread-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: var(--primary);
}

.notifications-drawer__dismiss-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--r-sm);
  border: none;
  background: transparent;
  color: var(--ink-4);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.notifications-drawer__item:hover .notifications-drawer__dismiss-btn {
  display: inline-flex;
}

.notifications-drawer__dismiss-btn:hover {
  background: var(--danger-tint);
  color: var(--danger);
}

.notifications-drawer__dismiss-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--primary-tint);
}

.notifications-drawer__item-footer {
  padding: 0 1.25rem 0.875rem 3.75rem;
  border-bottom: 0.5px solid var(--hairline);
}

.notifications-drawer__action-btn {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--primary);
  background: var(--primary-tint);
  border: none;
  padding: 0.375rem 0.75rem;
  border-radius: var(--r-md);
  cursor: pointer;
  transition: background 0.15s ease;
}

.notifications-drawer__action-btn:hover {
  background: color-mix(in oklab, var(--primary-tint) 75%, var(--primary));
}

.notifications-drawer__action-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--primary-tint);
}

/* Footer */
.notifications-drawer__footer {
  padding: 0.875rem 1.25rem;
  border-top: 0.5px solid var(--hairline);
  text-align: center;
}

.notifications-drawer__footer-link {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--primary);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.375rem 0.75rem;
  border-radius: var(--r-sm);
  transition: background 0.15s ease;
}

.notifications-drawer__footer-link:hover {
  background: var(--primary-tint);
}

.notifications-drawer__footer-link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--primary-tint);
}

/* Transitions */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.25s ease;
}

.drawer-enter-active .notifications-drawer,
.drawer-leave-active .notifications-drawer {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .notifications-drawer,
.drawer-leave-to .notifications-drawer {
  transform: translateX(100%);
}

@media (prefers-reduced-motion: reduce) {
  .drawer-enter-active,
  .drawer-leave-active,
  .drawer-enter-active .notifications-drawer,
  .drawer-leave-active .notifications-drawer {
    transition: none;
  }
}
</style>
