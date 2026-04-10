<template>
  <div class="settings-layout space-y-6">
    <nav
      class="flex flex-wrap gap-1 border-b border-slate-200 pb-3 sm:gap-2"
      aria-label="Ayarlar"
    >
      <RouterLink
        v-for="tab in tabs"
        :key="tab.path"
        :to="tab.path"
        class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-slate-100"
        :class="isActiveTab(tab.path) ? 'bg-teal-50 text-teal-700' : 'text-slate-600'"
      >
        <component :is="tab.icon" class="size-4" />
        <span class="hidden sm:inline">{{ tab.label }}</span>
      </RouterLink>
    </nav>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Building2, CreditCard, MessageSquareText, Bell, Shield } from 'lucide-vue-next'

const { t } = useI18n()
const route = useRoute()

const tabs = computed(() => [
  {
    path: '/admin/settings',
    label: t('settings.tabs.business'),
    icon: Building2,
    exact: true
  },
  {
    path: '/admin/settings/notifications',
    label: t('settings.tabs.notifications'),
    icon: Bell,
    exact: false
  },
  {
    path: '/admin/settings/message-templates',
    label: t('settings.tabs.messageTemplates'),
    icon: MessageSquareText,
    exact: false
  },
  {
    path: '/admin/settings/plan',
    label: t('settings.tabs.plan'),
    icon: CreditCard,
    exact: false
  },
  {
    path: '/admin/settings/security',
    label: t('settings.tabs.security'),
    icon: Shield,
    exact: false
  }
])

const isActiveTab = (path: string) => {
  if (path === '/admin/settings') {
    return route.path === '/admin/settings' || route.path === '/admin/settings/'
  }
  return route.path.startsWith(path)
}
</script>
