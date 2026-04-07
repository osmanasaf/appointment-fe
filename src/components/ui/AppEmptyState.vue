<template>
  <div
    class="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-6 py-10 text-center sm:px-8"
    role="status"
  >
    <div v-if="$slots.icon" class="text-slate-400 [&_svg]:size-10">
      <slot name="icon" />
    </div>
    <div v-else-if="icon" class="text-slate-400" aria-hidden="true">
      <component :is="icon" class="size-10" stroke-width="1.5" />
    </div>
    <h3 class="text-base font-semibold text-slate-900">{{ title }}</h3>
    <p v-if="description" class="max-w-sm text-sm text-slate-600">{{ description }}</p>
    <div v-if="$slots.action" class="mt-1">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  title: string
  description?: string
  icon?: Component
}>()
</script>
