<template>
  <section id="niches" class="bg-slate-50 px-6 py-20 lg:px-8">
    <div class="mx-auto max-w-6xl">
      <div class="text-center">
        <h2 class="landing-heading text-3xl text-slate-900 sm:text-4xl">
          {{ t('landing.nicheTitle') }}
        </h2>
        <p class="mx-auto mt-4 max-w-2xl text-slate-600">
          {{ t('landing.nicheSubtitle') }}
        </p>
      </div>

      <div class="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="card in cards"
          :key="card.key"
          class="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-teal-200 hover:shadow-lg"
        >
          <div
            class="absolute -right-8 -top-8 size-24 rounded-full opacity-10 transition group-hover:opacity-20"
            :style="{ backgroundColor: card.color }"
          />
          <div
            class="relative mb-4 flex size-14 items-center justify-center rounded-xl"
            :style="{ backgroundColor: card.bgLight }"
          >
            <component :is="card.icon" class="size-7" :style="{ color: card.color }" />
          </div>
          <h3 class="text-lg font-semibold text-slate-900">
            {{ t(`landing.niche.${card.key}.title`) }}
          </h3>
          <p class="mt-2 text-sm leading-relaxed text-slate-600">
            {{ t(`landing.niche.${card.key}.desc`) }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Scissors, Sparkles, Hand, PenTool, Brain, Apple } from 'lucide-vue-next'

const { t } = useI18n()

const cards = [
  { key: 'hair', icon: Scissors, color: '#0891B2', bgLight: '#F0FDFA' },
  { key: 'beauty', icon: Sparkles, color: '#EC4899', bgLight: '#FDF2F8' },
  { key: 'nail', icon: Hand, color: '#F43F5E', bgLight: '#FFF1F2' },
  { key: 'tattoo', icon: PenTool, color: '#8B5CF6', bgLight: '#F5F3FF' },
  { key: 'psych', icon: Brain, color: '#3B82F6', bgLight: '#EFF6FF' },
  { key: 'diet', icon: Apple, color: '#22C55E', bgLight: '#F0FDF4' },
] as const
</script>
