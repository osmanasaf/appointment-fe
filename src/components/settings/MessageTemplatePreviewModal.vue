<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    @click.self="$emit('close')"
  >
    <div class="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
      <div class="border-b border-slate-100 px-4 py-3">
        <div class="flex items-center justify-between">
          <h3 class="font-medium text-slate-900">WhatsApp Önizleme</h3>
          <button
            type="button"
            class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            @click="$emit('close')"
          >
            <X class="size-5" />
          </button>
        </div>
      </div>

      <div class="bg-[#e5ddd5] p-4">
        <div class="space-y-2">
          <div class="ml-auto max-w-[85%] rounded-lg rounded-tr-none bg-[#dcf8c6] p-3 shadow-sm">
            <p v-if="template?.headerTemplate" class="mb-1 text-sm font-semibold text-slate-900">
              {{ renderText(template.headerTemplate) }}
            </p>
            <p class="whitespace-pre-wrap text-sm text-slate-800">
              {{ renderText(template?.bodyTemplate || '') }}
            </p>
            <p v-if="template?.footerTemplate" class="mt-2 text-xs text-slate-500">
              {{ renderText(template.footerTemplate) }}
            </p>
            <p class="mt-1 text-right text-[10px] text-slate-400">14:30 ✓✓</p>
          </div>

          <div v-if="hasButtons" class="ml-auto flex max-w-[85%] flex-col gap-1">
            <button
              v-if="template?.showConfirmButton"
              class="w-full rounded-lg bg-white py-2 text-sm font-medium text-[#00a884] shadow-sm"
            >
              {{ template.confirmButtonText || '✅ Geliyorum' }}
            </button>
            <button
              v-if="template?.showCancelButton"
              class="w-full rounded-lg bg-white py-2 text-sm font-medium text-[#00a884] shadow-sm"
            >
              {{ template.cancelButtonText || '❌ İptal Et' }}
            </button>
            <button
              v-if="template?.showRescheduleButton"
              class="w-full rounded-lg bg-white py-2 text-sm font-medium text-[#00a884] shadow-sm"
            >
              {{ template.rescheduleButtonText || '🔄 Ertele' }}
            </button>
          </div>
        </div>
      </div>

      <div class="border-t border-slate-100 px-4 py-3">
        <p class="text-center text-xs text-slate-500">
          Bu bir önizlemedir. Gerçek mesaj farklı görünebilir.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'
import type { MessageTemplate } from '@/api/messageTemplate'

const props = defineProps<{
  template: MessageTemplate | null
}>()

defineEmits<{
  close: []
}>()

const hasButtons = computed(() => {
  return props.template?.type === 'APPOINTMENT_REMINDER'
})

const sampleData: Record<string, string> = {
  customer_name: 'Ahmet Yılmaz',
  business_name: 'Kuaför Salonu',
  service_name: 'Saç Kesimi',
  date: '15 Nisan 2026',
  time: '14:00',
  price: '250 TL'
}

const renderText = (text: string) => {
  let result = text
  for (const [key, value] of Object.entries(sampleData)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }
  return result
}
</script>
