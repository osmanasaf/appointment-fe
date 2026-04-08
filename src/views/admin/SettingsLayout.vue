<template>
  <div class="settings-layout space-y-6">
    <nav class="flex flex-wrap gap-2 border-b border-slate-200 pb-3" aria-label="Ayarlar">
      <RouterLink
        to="/admin/settings"
        class="rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-slate-100"
        :class="isBusinessTab ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'"
      >
        {{ t('settings.tabs.business') }}
      </RouterLink>
      <RouterLink
        to="/admin/settings/plan"
        class="rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-slate-100"
        :class="isPlanTab ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'"
      >
        {{ t('settings.tabs.plan') }}
      </RouterLink>
    </nav>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const isPlanTab = computed(() => route.path.includes('/settings/plan'))
const isBusinessTab = computed(() => route.path === '/admin/settings' || route.path === '/admin/settings/')
</script>
