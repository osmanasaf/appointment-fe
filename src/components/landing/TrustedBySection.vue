<template>
  <section class="border-b border-slate-100 bg-white px-6 py-12 lg:px-8">
    <div class="mx-auto max-w-6xl">
      <p class="mb-8 text-center text-sm font-medium text-slate-500">
        {{ t('landing.trustedTitle') }}
      </p>
      <div class="grid grid-cols-3 gap-8 text-center">
        <div v-for="stat in stats" :key="stat.key">
          <p class="text-3xl font-bold text-teal-600 sm:text-4xl">
            {{ t(`landing.trustedStats.${stat.key}`) }}
          </p>
          <p class="mt-1 text-sm text-slate-600">
            {{ t(`landing.trustedStats.${stat.key}Label`) }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const stats = [
  { key: 'businesses' },
  { key: 'appointments' },
  { key: 'noShowReduction' },
] as const
</script>
