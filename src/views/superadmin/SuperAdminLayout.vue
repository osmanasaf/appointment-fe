<template>
  <div class="flex min-h-screen bg-gray-950 text-gray-100">
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
      aria-hidden="true"
      @click="sidebarOpen = false"
    />

    <aside
      class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-indigo-900/40 bg-gray-950 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
      aria-label="Super Admin"
    >
      <div class="flex items-center gap-3 border-b border-indigo-900/40 px-4 py-4">
        <div class="flex size-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
          <Shield class="size-4" />
        </div>
        <span class="flex-1 truncate font-semibold tracking-tight text-white">Super Admin</span>
        <button
          type="button"
          class="flex size-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white lg:hidden"
          aria-label="Menüyü kapat"
          @click="sidebarOpen = false"
        >
          <X class="size-5" aria-hidden="true" />
        </button>
      </div>

      <nav class="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3" aria-label="Super Admin Navigation">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-gray-800/80 hover:text-white"
          :class="isNavActive(item) ? 'bg-indigo-600/15 text-indigo-300' : ''"
          @click="sidebarOpen = false"
        >
          <component :is="item.icon" class="size-5 shrink-0 opacity-90" aria-hidden="true" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="border-t border-indigo-900/40 p-3">
        <div class="flex items-center gap-2 px-3 py-2">
          <div class="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span class="text-xs text-gray-500">Platform Aktif</span>
        </div>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b border-gray-800 bg-gray-950/95 px-4 backdrop-blur sm:px-6"
      >
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            class="flex size-10 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 lg:hidden"
            :aria-expanded="sidebarOpen"
            aria-label="Menüyü aç"
            @click="sidebarOpen = true"
          >
            <Menu class="size-5" aria-hidden="true" />
          </button>
          <nav class="flex min-w-0 items-center gap-1.5 text-sm text-gray-500" aria-label="Breadcrumb">
            <span class="hidden sm:inline">Super Admin</span>
            <span v-if="breadcrumbLabel" class="hidden sm:inline" aria-hidden="true">/</span>
            <span class="truncate font-semibold text-white">{{ breadcrumbLabel }}</span>
          </nav>
        </div>
        <div class="flex shrink-0 items-center gap-2 sm:gap-3">
          <span class="hidden max-w-[10rem] truncate text-xs text-gray-500 sm:inline" :title="auth.user?.email ?? ''">
            {{ auth.user?.name ?? auth.user?.email }}
          </span>
          <button
            type="button"
            class="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-white"
            @click="logout"
          >
            Çıkış
          </button>
        </div>
      </header>

      <main class="flex-1 overflow-auto bg-gray-900">
        <div class="mx-auto max-w-7xl p-4 sm:p-6">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  LayoutDashboard,
  Building2,
  Shield,
  Menu,
  X,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const sidebarOpen = ref(false)

const navItems = computed(() => [
  { to: '/superadmin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/superadmin/businesses', label: 'İşletmeler', icon: Building2, exact: false },
])

function isNavActive(item: { to: string; exact?: boolean }) {
  if (item.exact) return route.path === item.to
  return route.path === item.to || route.path.startsWith(`${item.to}/`)
}

const breadcrumbLabel = computed(() => {
  const p = route.path
  if (p === '/superadmin' || p === '/superadmin/') return 'Dashboard'
  if (p.startsWith('/superadmin/businesses/')) return 'İşletme Detay'
  if (p.startsWith('/superadmin/businesses')) return 'İşletmeler'
  return 'Dashboard'
})

async function logout() {
  await auth.logout()
  await router.replace({ name: 'Login' })
}
</script>
