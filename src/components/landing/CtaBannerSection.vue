<template>
  <section class="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-16 lg:px-8">
    <div class="mx-auto max-w-4xl text-center">
      <h2 class="landing-heading text-3xl text-white sm:text-4xl">
        {{ t('landing.ctaBannerTitle') }}
      </h2>
      <p class="mx-auto mt-4 max-w-xl text-lg text-teal-100">
        {{ t('landing.ctaBannerSubtitle') }}
      </p>
      <a
        :href="registerUrl"
        class="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-teal-700 shadow-lg transition hover:bg-teal-50"
      >
        {{ t('landing.ctaBannerButton') }}
        <ArrowRight class="size-4" />
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ArrowRight } from 'lucide-vue-next'
import { useAppPublicUrl } from '@/composables/useAppPublicUrl'

const { t } = useI18n()
const { registerUrl } = useAppPublicUrl()
</script>
