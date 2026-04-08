<template>
  <label class="inline-flex cursor-pointer items-start gap-2.5" :class="disabled ? 'opacity-50 cursor-not-allowed' : ''">
    <span class="relative mt-0.5 flex shrink-0">
      <input
        type="checkbox"
        class="peer sr-only"
        :checked="modelValue"
        :disabled="disabled"
        v-bind="$attrs"
        @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
      <!-- Box -->
      <span
        class="flex size-5 items-center justify-center rounded-md border-2 transition-all
               border-slate-300 bg-white
               peer-checked:border-indigo-600 peer-checked:bg-indigo-600
               peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-400 peer-focus-visible:ring-offset-1
               peer-disabled:cursor-not-allowed"
      >
        <!-- Checkmark -->
        <svg
          v-show="modelValue"
          class="size-3 text-white"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="2,6 5,9 10,3" />
        </svg>
      </span>
    </span>
    <span v-if="label || $slots.default" class="select-none">
      <span class="text-sm font-medium text-slate-700 leading-tight">
        <slot>{{ label }}</slot>
      </span>
      <span v-if="description" class="mt-0.5 block text-xs text-slate-400 leading-snug">{{ description }}</span>
    </span>
  </label>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

defineProps<{
  modelValue: boolean
  label?: string
  description?: string
  disabled?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [boolean] }>()
</script>
