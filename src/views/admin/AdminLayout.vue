<template>
  <div class="flex min-h-screen bg-slate-100 text-slate-900">
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden"
      aria-hidden="true"
      @click="sidebarOpen = false"
    />

    <aside
      class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800 bg-slate-900 text-slate-200 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
      :aria-label="t('admin.breadcrumb')"
    >
      <div class="flex items-center gap-2 border-b border-slate-800 px-4 py-4">
        <a
          :href="brandHomeHref"
          class="flex items-center gap-2 transition hover:opacity-80"
        >
          <div class="flex size-9 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">
            <CalendarDays class="size-4" />
          </div>
          <span class="flex-1 truncate font-semibold tracking-tight text-white">{{ t('admin.brand') }}</span>
        </a>
        <button
          type="button"
          class="flex size-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          :aria-label="t('admin.menuClose')"
          @click="sidebarOpen = false"
        >
          <X class="size-5" aria-hidden="true" />
        </button>
      </div>

      <nav class="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3" aria-label="Admin">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white"
          :class="isNavActive(item) ? 'bg-slate-800 text-white' : ''"
          @click="sidebarOpen = false"
        >
          <component :is="item.icon" class="size-5 shrink-0 opacity-90" aria-hidden="true" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="border-t border-slate-800 p-3">
        <a
          :href="publicBookUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-800 hover:text-slate-200"
        >
          <ExternalLink class="size-4 shrink-0" aria-hidden="true" />
          {{ t('admin.publicBookingPage') }}
        </a>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6"
      >
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            class="flex size-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 lg:hidden"
            :aria-expanded="sidebarOpen"
            :aria-label="t('admin.menuOpen')"
            @click="sidebarOpen = true"
          >
            <Menu class="size-5" aria-hidden="true" />
          </button>
          <nav class="flex min-w-0 items-center gap-1.5 text-sm text-slate-500" aria-label="Breadcrumb">
            <span class="hidden sm:inline">{{ t('admin.breadcrumb') }}</span>
            <span v-if="breadcrumbLabel" class="hidden sm:inline" aria-hidden="true">/</span>
            <span class="truncate font-semibold text-slate-900">{{ breadcrumbLabel }}</span>
          </nav>
        </div>
        <div class="flex shrink-0 items-center gap-2 sm:gap-3">
          <span class="hidden max-w-[10rem] truncate text-xs text-slate-500 sm:inline" :title="auth.user?.email ?? ''">
            {{ auth.user?.name ?? auth.user?.email }}
          </span>
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            @click="logout"
          >
            {{ t('admin.logout') }}
          </button>
        </div>
      </header>

      <main class="flex-1 overflow-auto">
        <div class="admin-content">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  Users,
  UserCircle,
  List,
  Package,
  Settings,
  Menu,
  X,
  ExternalLink,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { resolveLandingOrigin } from '@/config/siteOrigins'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const sidebarOpen = ref(false)

const landingUrl = resolveLandingOrigin()

const brandHomeHref = computed(() =>
  auth.isAuthenticated ? '/admin' : landingUrl || '/',
)

const publicBookUrl = computed(() => {
  const base = globalThis.window?.location.origin ?? ''
  const slug = auth.user?.businessSlug ?? 'test-kuafor'
  return `${base}/b/${slug}`
})

const navItems = computed(() => [
  { to: '/admin', label: t('nav.dashboard'), icon: LayoutDashboard, exact: true },
  { to: '/admin/appointments', label: t('nav.appointments'), icon: CalendarCheck, exact: false },
  { to: '/admin/customers', label: t('nav.customers'), icon: Users, exact: false },
  { to: '/admin/employees', label: t('nav.employees'), icon: UserCircle, exact: false },
  { to: '/admin/services', label: t('nav.services'), icon: List, exact: false },
  { to: '/admin/packages', label: t('nav.packages'), icon: Package, exact: false },
  { to: '/admin/settings', label: t('nav.settings'), icon: Settings, exact: false },
])

function isNavActive(item: { to: string; exact?: boolean }) {
  if (item.exact) return route.path === item.to
  if (item.to === '/admin/settings') {
    return route.path === '/admin/settings' || route.path.startsWith('/admin/settings/')
  }
  return route.path === item.to || route.path.startsWith(`${item.to}/`)
}

const breadcrumbLabel = computed(() => {
  const p = route.path
  if (p === '/admin' || p === '/admin/') return t('pageTitles.dashboard')
  if (p.startsWith('/admin/calendar')) return t('pageTitles.calendar')
  if (p.startsWith('/admin/appointments')) return t('pageTitles.appointments')
  if (p.startsWith('/admin/customers')) return t('pageTitles.customers')
  if (p.startsWith('/admin/employees')) return t('pageTitles.employees')
  if (p.startsWith('/admin/services')) return t('pageTitles.services')
  if (p.startsWith('/admin/packages')) return t('pageTitles.packages')
  if (p.startsWith('/admin/settings/plan')) return t('pageTitles.plan')
  if (p.startsWith('/admin/settings')) return t('pageTitles.settings')
  if (p.startsWith('/admin/onboarding')) return t('pageTitles.onboarding')
  return t('pageTitles.default')
})

async function logout() {
  await auth.logout()
  await router.replace({ name: 'Login' })
}
</script>
