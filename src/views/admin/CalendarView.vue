<template>
  <div class="space-y-4">
    <h1 class="page-title">{{ t('pageTitles.calendar') }}</h1>
    <AppEmptyState
      :title="t('calendar.emptyTitle')"
      :description="t('calendar.emptyDescription')"
    >
      <template #icon>
        <CalendarRange class="mx-auto size-10 text-indigo-400" :stroke-width="1.25" />
      </template>
    </AppEmptyState>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CalendarRange } from 'lucide-vue-next'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'

const { t } = useI18n()
</script>
