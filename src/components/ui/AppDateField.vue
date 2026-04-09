<template>
  <div class="relative w-full">
    <CalendarDays
      class="pointer-events-none absolute left-3 top-1/2 z-0 size-[1.125rem] -translate-y-1/2 text-slate-400"
      aria-hidden="true"
      :stroke-width="2"
    />
    <input
      :id="id"
      type="date"
      :value="modelValue"
      :min="min"
      :max="max"
      :required="required"
      :disabled="disabled"
      class="app-date-field"
      v-bind="$attrs"
      @input="onInput"
    />
  </div>
</template>

<script setup lang="ts">
import { CalendarDays } from 'lucide-vue-next'

defineOptions({ inheritAttrs: false })

defineProps<{
  modelValue: string
  id?: string
  min?: string
  max?: string
  required?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [string] }>()

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>
