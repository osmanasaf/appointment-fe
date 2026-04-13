<template>
  <div class="staff-layout">
    <header class="staff-header">
      <div class="header-container">
        <div class="brand">
          <a :href="brandHomeHref" class="brand-link">
            <h1>{{ t('staff.title') }}</h1>
          </a>
        </div>
        <div class="user-menu">
          <span class="user-name">{{ auth.user?.name }}</span>
          <button @click="handleLogout" class="btn-logout">
            {{ t('common.logout') }}
          </button>
        </div>
      </div>
    </header>
    
    <main class="staff-main">
      <div class="container">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { resolveLandingOrigin } from '@/config/siteOrigins'

const auth = useAuthStore()
const landingUrl = resolveLandingOrigin()
const brandHomeHref = computed(() =>
  auth.isAuthenticated ? '/staff' : landingUrl || '/',
)
const router = useRouter()
const { t } = useI18n()

async function handleLogout() {
  await auth.logout()
  await router.replace({ name: 'Login' })
}
</script>

<style scoped>
.staff-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9fafb;
}

.staff-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand {
  display: flex;
  align-items: center;
}

.brand-link {
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s;
}

.brand-link:hover {
  opacity: 0.8;
}

.brand h1 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-name {
  font-size: 0.875rem;
  color: #6b7280;
}

.btn-logout {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-logout:hover {
  background: #dc2626;
}

.staff-main {
  flex: 1;
  padding: 2rem 0;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
}
</style>
