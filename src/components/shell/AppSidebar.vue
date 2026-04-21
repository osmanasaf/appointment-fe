<template>
  <aside
    class="app-sidebar"
    :class="{ 'app-sidebar--open': open }"
    :aria-label="t('admin.sidebarLabel')"
  >
    <RouterLink :to="brandHomeTo" class="app-sidebar__brand" @click="$emit('navigate')">
      <span class="app-sidebar__logo" aria-hidden="true">
        <CalendarDays class="size-4" />
      </span>
      <span class="app-sidebar__brand-text">
        <span class="app-sidebar__brand-name">{{ t('admin.brand') }}</span>
        <span v-if="businessLabel" class="app-sidebar__brand-meta">{{ businessLabel }}</span>
      </span>
    </RouterLink>

    <nav class="app-sidebar__nav" :aria-label="t('admin.sidebarLabel')">
      <template v-for="group in groups" :key="group.id">
        <div class="app-sidebar__group caption">{{ group.label }}</div>
        <RouterLink
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          class="app-sidebar__item"
          :class="{ 'app-sidebar__item--active': isItemActive(item) }"
          :aria-current="isItemActive(item) ? 'page' : undefined"
          @click="$emit('navigate')"
        >
          <span class="app-sidebar__indicator" aria-hidden="true" />
          <component :is="item.icon" class="size-[18px] shrink-0" aria-hidden="true" />
          <span class="app-sidebar__label">{{ item.label }}</span>
          <span v-if="item.badge" class="app-sidebar__badge">{{ item.badge }}</span>
        </RouterLink>
      </template>
    </nav>

    <div class="app-sidebar__footer">
      <UpgradeCard v-if="showUpgrade" :cta-href="upgradeCtaHref" />
      <a
        :href="publicBookingUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="app-sidebar__public-link"
      >
        <ExternalLink class="size-4 shrink-0" aria-hidden="true" />
        {{ t('admin.publicBookingPage') }}
      </a>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { useRoute, type RouteLocationRaw } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  CalendarCheck,
  CalendarDays,
  Briefcase,
  ExternalLink,
  LayoutDashboard,
  Package,
  Scissors,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-vue-next'
import UpgradeCard from './UpgradeCard.vue'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon | Component
  exact?: boolean
  badge?: string | number
}

interface NavGroup {
  id: string
  label: string
  items: NavItem[]
}

const props = defineProps<{
  open: boolean
  role: 'business' | 'employee'
  businessLabel?: string
  showUpgrade?: boolean
  publicBookingUrl: string
  upgradeCtaHref?: string
  brandHomeTo: RouteLocationRaw
}>()

defineEmits<{
  (event: 'navigate'): void
}>()

const { t } = useI18n()
const route = useRoute()

const upgradeCtaHref = computed(() => props.upgradeCtaHref ?? '/admin/settings/plan')

const groups = computed<NavGroup[]>(() => {
  if (props.role === 'employee') {
    return [
      {
        id: 'today',
        label: t('admin.navGroup.today'),
        items: [
          { to: '/admin', label: t('nav.dashboard'), icon: LayoutDashboard, exact: true },
          { to: '/admin/calendar', label: t('nav.calendar'), icon: CalendarDays },
          { to: '/admin/appointments', label: t('nav.appointments'), icon: CalendarCheck },
        ],
      },
      {
        id: 'account',
        label: t('admin.navGroup.account'),
        items: [{ to: '/admin/settings', label: t('nav.settings'), icon: Settings }],
      },
    ]
  }

  return [
    {
      id: 'general',
      label: t('admin.navGroup.general'),
      items: [
        { to: '/admin', label: t('nav.dashboard'), icon: LayoutDashboard, exact: true },
        { to: '/admin/calendar', label: t('nav.calendar'), icon: CalendarDays },
        { to: '/admin/appointments', label: t('nav.appointments'), icon: CalendarCheck },
      ],
    },
    {
      id: 'business',
      label: t('admin.navGroup.business'),
      items: [
        { to: '/admin/customers', label: t('nav.customers'), icon: Users },
        { to: '/admin/services', label: t('nav.services'), icon: Scissors },
        { to: '/admin/employees', label: t('nav.employees'), icon: Briefcase },
        { to: '/admin/packages', label: t('nav.packages'), icon: Package },
      ],
    },
    {
      id: 'account',
      label: t('admin.navGroup.account'),
      items: [{ to: '/admin/settings', label: t('nav.settings'), icon: Settings }],
    },
  ]
})

function isItemActive(item: NavItem) {
  const path = route.path
  if (item.exact) return path === item.to || path === `${item.to}/`
  if (item.to === '/admin/settings') {
    return path === '/admin/settings' || path.startsWith('/admin/settings/')
  }
  return path === item.to || path.startsWith(`${item.to}/`)
}
</script>

<style scoped>
.app-sidebar {
  position: fixed;
  inset-block: 0;
  inset-inline-start: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  width: var(--sidebar-w);
  max-width: 88vw;
  background: var(--bg-elevated);
  border-inline-end: 0.5px solid var(--hairline);
  transform: translateX(-100%);
  transition: transform 0.22s ease;
}

.app-sidebar--open {
  transform: translateX(0);
  box-shadow: var(--shadow-3);
}

@media (min-width: 1024px) {
  .app-sidebar {
    position: sticky;
    inset-block-start: 0;
    height: 100vh;
    transform: none;
    box-shadow: none;
  }
}

.app-sidebar__brand {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  height: var(--topbar-h);
  padding-inline: 1rem;
  border-block-end: 0.5px solid var(--hairline);
  text-decoration: none;
  color: var(--ink-1);
}

.app-sidebar__brand:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--primary);
}

.app-sidebar__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--r-sm);
  background: var(--primary);
  color: #fff;
  flex-shrink: 0;
}

.app-sidebar__brand-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.app-sidebar__brand-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: -0.01em;
  color: var(--ink-1);
  line-height: 1.1;
}

.app-sidebar__brand-meta {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--ink-4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 0.125rem;
}

.app-sidebar__nav {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 0.75rem 0.625rem 0.5rem;
  overflow-y: auto;
  gap: 0.125rem;
}

.app-sidebar__group {
  margin-top: 0.875rem;
  margin-bottom: 0.375rem;
  padding-inline: 0.625rem;
  font-size: 0.65rem;
  color: var(--ink-4);
}

.app-sidebar__group:first-of-type {
  margin-top: 0.25rem;
}

.app-sidebar__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--r-sm);
  color: var(--ink-3);
  font-size: 0.8125rem;
  font-weight: 500;
  text-decoration: none;
  line-height: 1.25;
  transition: background 0.15s ease, color 0.15s ease;
}

.app-sidebar__indicator {
  position: absolute;
  inset-block: 0.375rem;
  inset-inline-start: -0.625rem;
  width: 2.5px;
  border-radius: 999px;
  background: transparent;
  transition: background 0.15s ease;
}

.app-sidebar__item:hover {
  background: var(--bg-subtle);
  color: var(--ink-1);
}

.app-sidebar__item:focus-visible {
  outline: none;
  background: var(--bg-subtle);
  box-shadow: 0 0 0 2px var(--primary-tint) inset;
}

.app-sidebar__item--active {
  background: var(--surface-2);
  color: var(--ink-1);
  font-weight: 600;
}

.app-sidebar__item--active .app-sidebar__indicator {
  background: var(--primary);
}

.app-sidebar__label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-sidebar__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.125rem;
  height: 1.125rem;
  padding: 0 0.375rem;
  border-radius: 999px;
  background: var(--primary-tint);
  color: var(--primary);
  font-size: 0.6875rem;
  font-weight: 700;
  font-family: var(--font-mono);
}

.app-sidebar__footer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border-block-start: 0.5px solid var(--hairline);
}

.app-sidebar__public-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4375rem 0.625rem;
  border-radius: var(--r-sm);
  color: var(--ink-4);
  font-size: 0.71875rem;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
}

.app-sidebar__public-link:hover {
  background: var(--bg-subtle);
  color: var(--ink-2);
}

.app-sidebar__public-link:focus-visible {
  outline: none;
  background: var(--bg-subtle);
  color: var(--ink-1);
  box-shadow: 0 0 0 2px var(--primary-tint);
}
</style>
