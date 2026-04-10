<template>
  <section class="bg-white px-6 py-20 lg:px-8">
    <div class="mx-auto max-w-6xl">
      <h2 class="landing-heading text-center text-3xl text-slate-900 sm:text-4xl">
        {{ t('landing.testimonialsTitle') }}
      </h2>

      <div class="mt-14 grid gap-6 md:grid-cols-3">
        <article
          v-for="(item, i) in testimonials"
          :key="i"
          class="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-6"
        >
          <Quote class="absolute right-4 top-4 size-8 text-teal-100" />
          <p class="relative text-slate-700 leading-relaxed">
            "{{ t(`landing.testimonials.t${i + 1}.quote`) }}"
          </p>
          <div class="mt-6 flex items-center gap-3">
            <div
              class="flex size-10 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700"
            >
              {{ t(`landing.testimonials.t${i + 1}.name`).charAt(0) }}
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-900">
                {{ t(`landing.testimonials.t${i + 1}.name`) }}
              </p>
              <p class="text-xs text-slate-500">
                {{ t(`landing.testimonials.t${i + 1}.role`) }}
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Quote } from 'lucide-vue-next'

const { t } = useI18n()

const testimonials = [1, 2, 3] as const
</script>
