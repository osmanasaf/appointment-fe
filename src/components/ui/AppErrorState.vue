<template>
  <div
    class="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50/60 px-6 py-10 text-center sm:px-8"
    role="alert"
  >
    <AlertCircle class="size-10 text-red-400" stroke-width="1.5" aria-hidden="true" />
    <h3 class="text-base font-semibold text-slate-900">{{ title }}</h3>
    <p v-if="message" class="max-w-sm text-sm text-slate-600">{{ message }}</p>
    <button
      v-if="onRetry"
      type="button"
      class="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
      @click="onRetry"
    >
      <RotateCcw class="size-3.5" aria-hidden="true" />
      Tekrar Dene
    </button>
  </div>
</template>

<script setup lang="ts">
import { AlertCircle, RotateCcw } from 'lucide-vue-next'

defineProps<{
  title?: string
  message?: string
  onRetry?: () => void
}>()
</script>
