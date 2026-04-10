<template>
  <section id="problem" class="bg-slate-50 px-6 py-20 lg:px-8">
    <div class="mx-auto max-w-6xl">
      <div class="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 class="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {{ t('landing.problemTitle') }}
          </h2>
          <p class="mt-4 text-slate-600 leading-relaxed">
            {{ t('landing.problemBody') }}
          </p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-sm font-medium text-slate-700">{{ t('landing.calculatorTitle') }}</p>
          <div class="mt-4 space-y-4">
            <div>
              <label class="mb-1 block text-xs font-medium text-slate-500" for="calc-appts">
                {{ t('landing.calcAppts') }}
              </label>
              <input
                id="calc-appts"
                v-model.number="apptsPerDay"
                type="number"
                min="0"
                class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-slate-500" for="calc-fee">
                {{ t('landing.calcFee') }}
              </label>
              <input
                id="calc-fee"
                v-model.number="avgFee"
                type="number"
                min="0"
                step="50"
                class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-slate-500" for="calc-noshow">
                {{ t('landing.calcNoShow') }} ({{ noShowPercent }}%)
              </label>
              <input
                id="calc-noshow"
                v-model.number="noShowPercent"
                type="range"
                min="5"
                max="40"
                class="w-full accent-indigo-600"
              />
            </div>
          </div>
          <div class="mt-6 rounded-xl bg-indigo-50 px-4 py-3">
            <p class="text-xs font-medium text-indigo-800">{{ t('landing.calcResultLabel') }}</p>
            <p class="mt-1 text-2xl font-bold text-indigo-900">
              {{ formattedLoss }} {{ t('landing.calcCurrency') }}
            </p>
            <p class="mt-1 text-xs text-indigo-700/80">{{ t('landing.calcHint') }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const apptsPerDay = ref(8)
const avgFee = ref(800)
const noShowPercent = ref(15)

const monthlyLoss = computed(() => {
  const days = 22
  const rate = Math.min(100, Math.max(0, noShowPercent.value)) / 100
  return Math.round(apptsPerDay.value * avgFee.value * rate * days)
})

const formattedLoss = computed(() =>
  new Intl.NumberFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US').format(monthlyLoss.value),
)
</script>
