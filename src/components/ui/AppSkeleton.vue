<template>
  <div
    class="animate-pulse bg-slate-200/80"
    :class="radiusClass"
    :style="styleObj"
    role="presentation"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'line' | 'circle' | 'block'
    width?: string
    height?: string
  }>(),
  {
    variant: 'line',
    width: '100%',
    height: '0.75rem',
  },
)

const radiusClass = computed(() => {
  if (props.variant === 'circle') return 'rounded-full shrink-0'
  if (props.variant === 'block') return 'rounded-lg w-full min-h-24'
  return 'rounded-md'
})

const styleObj = computed(() => {
  if (props.variant === 'circle') {
    const s = props.height
    return { width: s, height: s }
  }
  if (props.variant === 'block') {
    return { width: props.width }
  }
  return { width: props.width, height: props.height }
})
</script>
