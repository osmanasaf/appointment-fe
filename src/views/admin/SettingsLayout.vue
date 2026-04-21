<template>
  <div class="settings-shell grid gap-6 md:grid-cols-[220px_1fr]">
    <aside class="settings-nav card p-2">
      <nav
        class="flex flex-col gap-1"
        role="navigation"
        :aria-label="t('nav.settings')"
      >
        <RouterLink
          v-for="tab in tabs"
          :key="tab.path"
          :to="tab.path"
          :aria-current="isActiveTab(tab.path) ? 'page' : undefined"
          class="settings-tab flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition min-h-[44px]"
          :class="isActiveTab(tab.path) ? 'is-active' : ''"
        >
          <component :is="tab.icon" class="size-4 shrink-0" />
          <span>{{ tab.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <section class="settings-content">
      <router-view />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Building2, CreditCard, MessageSquareText, Bell, Shield, Palette } from 'lucide-vue-next'

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
  },
  {
    path: '/admin/settings/appearance',
    label: t('settings.tabs.appearance'),
    icon: Palette,
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

<style scoped>
.settings-shell {
  max-width: 1200px;
}

.settings-nav {
  position: sticky;
  top: 1rem;
  align-self: start;
}

.settings-tab {
  color: var(--ink-3);
}
.settings-tab:hover {
  background: var(--surface-2);
  color: var(--ink-1);
}
.settings-tab.is-active {
  background: var(--primary-tint);
  color: var(--primary);
  font-weight: 600;
}
.settings-tab:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

@media (max-width: 768px) {
  .settings-shell {
    display: flex;
    flex-direction: column;
  }
  .settings-nav {
    position: static;
  }
  .settings-nav nav {
    flex-direction: row;
    overflow-x: auto;
    gap: 0.5rem;
  }
  .settings-tab {
    flex-shrink: 0;
  }
}
</style>
