<template>
  <label
    class="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition hover:border-slate-300 hover:bg-slate-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-400 has-[:focus-visible]:ring-offset-1"
    :class="{ 'border-indigo-300 bg-indigo-50/80 ring-1 ring-indigo-200': selected }"
  >
    <span class="relative mt-0.5 flex h-5 w-5 shrink-0">
      <input
        type="radio"
        class="peer sr-only"
        :name="name"
        :value="optionValue"
        :checked="selected"
        :disabled="disabled"
        @change="onChange"
      />
      <span
        class="flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-300 bg-white transition peer-checked:border-indigo-600 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-400 peer-focus-visible:ring-offset-1 peer-disabled:opacity-50 after:block after:h-2.5 after:w-2.5 after:rounded-full after:bg-indigo-600 after:opacity-0 after:transition after:content-[''] peer-checked:after:opacity-100"
        aria-hidden="true"
      />
    </span>
    <span class="min-w-0 flex-1 text-sm leading-snug text-slate-700">
      <slot />
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  name: string
  modelValue: string
  optionValue: string
  disabled?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const selected = computed(() => props.modelValue === props.optionValue)

function onChange() {
  if (!props.disabled) emit('update:modelValue', props.optionValue)
}
</script>
