<template>
  <div class="flex justify-center gap-2">
    <input
      v-for="(_, index) in digits"
      :key="index"
      :ref="el => inputRefs[index] = el as HTMLInputElement"
      v-model="digits[index]"
      type="text"
      inputmode="numeric"
      maxlength="1"
      class="size-12 rounded-lg border-2 text-center text-xl font-bold transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:size-14 sm:text-2xl"
      :class="[
        error ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white',
        disabled ? 'cursor-not-allowed opacity-50' : ''
      ]"
      :disabled="disabled"
      @input="handleInput(index)"
      @keydown="handleKeydown(index, $event)"
      @paste="handlePaste"
      @focus="$event.target.select()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{
  modelValue: string
  error?: boolean
  disabled?: boolean
  length?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'complete': [value: string]
}>()

const length = props.length || 6
const digits = ref<string[]>(Array(length).fill(''))
const inputRefs = ref<(HTMLInputElement | null)[]>([])

const handleInput = (index: number) => {
  const value = digits.value[index]
  
  // Sadece rakam kabul et
  if (value && !/^\d$/.test(value)) {
    digits.value[index] = ''
    return
  }

  // Sonraki input'a geç
  if (value && index < length - 1) {
    inputRefs.value[index + 1]?.focus()
  }

  emitValue()
}

const handleKeydown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    inputRefs.value[index - 1]?.focus()
  }
  
  if (event.key === 'ArrowLeft' && index > 0) {
    inputRefs.value[index - 1]?.focus()
  }
  
  if (event.key === 'ArrowRight' && index < length - 1) {
    inputRefs.value[index + 1]?.focus()
  }
}

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const pastedData = event.clipboardData?.getData('text') || ''
  const numbers = pastedData.replace(/\D/g, '').slice(0, length)
  
  numbers.split('').forEach((num, i) => {
    digits.value[i] = num
  })
  
  const nextIndex = Math.min(numbers.length, length - 1)
  inputRefs.value[nextIndex]?.focus()
  
  emitValue()
}

const emitValue = () => {
  const value = digits.value.join('')
  emit('update:modelValue', value)
  
  if (value.length === length) {
    emit('complete', value)
  }
}

const clear = () => {
  digits.value = Array(length).fill('')
  inputRefs.value[0]?.focus()
  emitValue()
}

// Dışarıdan değer değişirse güncelle
watch(() => props.modelValue, (newValue) => {
  if (newValue !== digits.value.join('')) {
    const chars = (newValue || '').split('').slice(0, length)
    digits.value = [...chars, ...Array(length - chars.length).fill('')]
  }
})

onMounted(() => {
  inputRefs.value[0]?.focus()
})

defineExpose({ clear })
</script>
