<template>
  <div class="otp-container">
    <input
      v-for="(_, index) in digits"
      :key="index"
      :ref="el => inputRefs[index] = el as HTMLInputElement"
      v-model="digits[index]"
      type="text"
      inputmode="numeric"
      maxlength="1"
      class="otp-digit"
      :class="[
        error ? 'otp-digit--error' : '',
        disabled ? 'otp-digit--disabled' : ''
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

<style scoped>
.otp-container {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.otp-digit {
  width: 3rem;
  height: 3rem;
  border: 2px solid var(--hairline-strong);
  border-radius: var(--r-md);
  background: var(--surface);
  color: var(--ink-1);
  text-align: center;
  font-size: 1.25rem;
  font-weight: 700;
  font-family: var(--font-display);
  transition: border-color 0.15s, box-shadow 0.15s, background-color 0.15s;
}

@media (min-width: 640px) {
  .otp-digit {
    width: 3.5rem;
    height: 3.5rem;
    font-size: 1.5rem;
  }
}

.otp-digit:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-tint);
}

.otp-digit--error {
  border-color: var(--danger);
  background: var(--danger-tint);
}

.otp-digit--error:focus {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--danger) 20%, transparent);
}

.otp-digit--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
