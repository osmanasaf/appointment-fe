<template>
  <section id="faq" class="bg-slate-50 px-6 py-20 lg:px-8">
    <div class="mx-auto max-w-3xl">
      <h2 class="landing-heading text-center text-3xl text-slate-900 sm:text-4xl">
        {{ t('landing.faqTitle') }}
      </h2>

      <div class="mt-12 space-y-3">
        <div
          v-for="(_, index) in 6"
          :key="index"
          class="overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <button
            type="button"
            class="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-slate-50"
            :aria-expanded="openIndex === index"
            @click="toggle(index)"
          >
            <span class="text-sm font-semibold text-slate-900">
              {{ t(`landing.faq.q${index}.q`) }}
            </span>
            <ChevronDown
              class="size-5 shrink-0 text-slate-400 transition"
              :class="{ 'rotate-180': openIndex === index }"
            />
          </button>
          <div
            v-show="openIndex === index"
            class="border-t border-slate-100 px-6 py-5 text-sm leading-relaxed text-slate-600"
          >
            {{ t(`landing.faq.q${index}.a`) }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown } from 'lucide-vue-next'

const { t } = useI18n()

const openIndex = ref<number | null>(0)

function toggle(index: number) {
  openIndex.value = openIndex.value === index ? null : index
}
</script>
