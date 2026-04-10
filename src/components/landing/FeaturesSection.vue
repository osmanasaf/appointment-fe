<template>
  <section id="features" class="bg-white px-6 py-20 lg:px-8">
    <div class="mx-auto max-w-6xl">
      <div class="text-center">
        <h2 class="landing-heading text-3xl text-slate-900 sm:text-4xl">
          {{ t('landing.featuresTitle') }}
        </h2>
        <p class="mx-auto mt-4 max-w-2xl text-slate-600">
          {{ t('landing.featuresSubtitle') }}
        </p>
      </div>

      <div class="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="(feature, i) in features"
          :key="feature.key"
          class="group rounded-2xl border border-slate-200 bg-slate-50/50 p-6 transition hover:border-teal-200 hover:bg-white hover:shadow-md"
          :class="{ 'sm:col-span-2 lg:col-span-1': i === 0 }"
        >
          <div
            class="mb-4 flex size-12 items-center justify-center rounded-xl bg-teal-100 text-teal-600 transition group-hover:bg-teal-600 group-hover:text-white"
          >
            <component :is="feature.icon" class="size-6" />
          </div>
          <h3 class="text-lg font-semibold text-slate-900">
            {{ t(`landing.features.${feature.key}.title`) }}
          </h3>
          <p class="mt-2 text-sm leading-relaxed text-slate-600">
            {{ t(`landing.features.${feature.key}.desc`) }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  CalendarCheck,
  MessageCircle,
  Users,
  Calendar,
  Package,
  BarChart3,
} from 'lucide-vue-next'

const { t } = useI18n()

const features = [
  { key: 'booking', icon: CalendarCheck },
  { key: 'whatsapp', icon: MessageCircle },
  { key: 'customers', icon: Users },
  { key: 'calendar', icon: Calendar },
  { key: 'packages', icon: Package },
  { key: 'reports', icon: BarChart3 },
] as const
</script>
