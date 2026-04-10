<template>
  <section id="how-it-works" class="bg-slate-50 px-6 py-20 lg:px-8">
    <div class="mx-auto max-w-6xl">
      <div class="text-center">
        <h2 class="landing-heading text-3xl text-slate-900 sm:text-4xl">
          {{ t('landing.howItWorksTitle') }}
        </h2>
        <p class="mx-auto mt-4 max-w-2xl text-slate-600">
          {{ t('landing.howItWorksSubtitle') }}
        </p>
      </div>

      <div class="relative mt-16">
        <div
          class="absolute left-1/2 top-8 hidden h-0.5 w-2/3 -translate-x-1/2 bg-gradient-to-r from-teal-200 via-teal-400 to-teal-200 md:block"
        />

        <ol class="relative grid gap-8 md:grid-cols-3">
          <li
            v-for="(step, i) in 3"
            :key="i"
            class="relative text-center"
          >
            <div
              class="relative mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-teal-600 text-xl font-bold text-white shadow-lg shadow-teal-200"
            >
              {{ i + 1 }}
            </div>
            <h3 class="text-lg font-semibold text-slate-900">
              {{ t(`landing.step${i + 1}Title`) }}
            </h3>
            <p class="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-600">
              {{ t(`landing.step${i + 1}Body`) }}
            </p>
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
