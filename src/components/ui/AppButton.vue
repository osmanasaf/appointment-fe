<template>
  <button
    :type="nativeType"
    class="inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:pointer-events-none disabled:opacity-50"
    :class="[variantClass, sizeClass]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    loading?: boolean
    nativeType?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
    nativeType: 'button',
  },
)

defineEmits<{ click: [MouseEvent] }>()

const variantClass = computed(() => {
  const v = props.variant
  if (v === 'primary') {
    return 'bg-indigo-500 text-white hover:bg-indigo-600 active:bg-indigo-700'
  }
  if (v === 'secondary') {
    return 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
  }
  if (v === 'danger') {
    return 'border border-red-200 bg-white text-red-600 hover:bg-red-50'
  }
  return 'bg-transparent text-slate-700 hover:bg-slate-100'
})

const sizeClass = computed(() => {
  const s = props.size
  if (s === 'sm') return 'min-h-8 px-3 text-xs'
  if (s === 'lg') return 'min-h-12 px-6 text-base'
  return 'min-h-10 px-4 text-sm'
})
</script>
