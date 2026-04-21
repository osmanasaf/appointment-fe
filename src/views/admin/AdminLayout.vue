<template>
  <div v-if="hideChrome" class="min-h-screen bg-[var(--bg)] text-[var(--ink-1)]">
    <router-view />
  </div>
  <div v-else class="admin-shell">
    <div
      v-if="sidebarOpen"
      class="admin-shell__overlay"
      aria-hidden="true"
      @click="sidebarOpen = false"
    />

    <AppSidebar
      :open="sidebarOpen"
      :role="sidebarRole"
      :business-label="businessLabel"
      :show-upgrade="showUpgrade"
      :public-booking-url="publicBookUrl"
      :brand-home-to="brandHomeRoute"
      :upgrade-cta-href="upgradeHref"
      @navigate="onNavigate"
    />

    <div class="admin-shell__main">
      <AppTopbar
        :page-title="breadcrumbLabel"
        :sidebar-open="sidebarOpen"
        :user-display-name="userDisplayName"
        :user-role-label="userRoleLabel"
        :has-notifications="hasNotifications"
        @toggle-sidebar="sidebarOpen = !sidebarOpen"
        @logout="logout"
      />

      <main class="admin-shell__content">
        <div class="admin-content">
          <router-view />
        </div>
      </main>
    </div>

    <!-- Global Command Palette (Teleport to body) -->
    <CommandPalette />

    <NotificationsDrawer />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { resolveLandingOrigin } from '@/config/siteOrigins'
import { buildPublicBookingUrl } from '@/utils/publicBookingUrl'
import { useNotifications } from '@/composables/useNotifications'
import AppSidebar from '@/components/shell/AppSidebar.vue'
import AppTopbar from '@/components/shell/AppTopbar.vue'
import NotificationsDrawer from '@/components/shell/NotificationsDrawer.vue'
import CommandPalette from '@/components/shell/CommandPalette.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const { unreadCount } = useNotifications()
const sidebarOpen = ref(false)

const hideChrome = computed(() => route.meta.hideChrome === true)

watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false
  },
)

const landingUrl = resolveLandingOrigin()

const brandHomeRoute = computed(() =>
  auth.isAuthenticated ? { path: '/admin' } : { path: '/' },
)

const publicBookUrl = computed(() => {
  const slug = auth.user?.businessSlug
  if (!slug) return landingUrl || '/'
  return buildPublicBookingUrl(slug)
})

const sidebarRole = computed<'business' | 'employee'>(() =>
  auth.isEmployee ? 'employee' : 'business',
)

const showUpgrade = computed(() => sidebarRole.value === 'business')

const upgradeHref = computed(() => '/admin/settings/plan')

const businessLabel = computed(() => {
  const u = auth.user
  if (!u) return ''
  if (u.businessSlug) return u.businessSlug
  return ''
})

const userDisplayName = computed(() => auth.user?.name ?? auth.user?.email ?? '')

const userRoleLabel = computed(() => {
  if (auth.isEmployee) return t('admin.roleLabel.employee')
  if (auth.isBusinessOwner) return t('admin.roleLabel.owner')
  if (auth.isAdmin) return t('admin.roleLabel.admin')
  if (auth.isSuperAdmin) return t('admin.roleLabel.superAdmin')
  return ''
})

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
  if (p.startsWith('/admin/onboarding') || p.startsWith('/admin/setup')) return t('pageTitles.setup')
  return t('pageTitles.default')
})

const hasNotifications = computed(() => unreadCount.value > 0)

function onNavigate() {
  sidebarOpen.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && sidebarOpen.value) {
    sidebarOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})

async function logout() {
  await auth.logout()
  await router.replace({ name: 'Login' })
}
</script>

<style scoped>
.admin-shell {
  display: flex;
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink-1);
}

.admin-shell__overlay {
  position: fixed;
  inset: 0;
  z-index: 35;
  background: var(--scrim-soft);
  backdrop-filter: blur(2px);
}

@media (min-width: 1024px) {
  .admin-shell__overlay {
    display: none;
  }
}

.admin-shell__main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.admin-shell__content {
  flex: 1;
  min-width: 0;
}
</style>
