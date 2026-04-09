<template>
  <Dialog
    :visible="visible"
    modal
    append-to="body"
    :dismissable-mask="dismissableMask ?? true"
    :closable="showCloseButton"
    class="app-modal"
    :style="dialogStyle ?? { width: 'min(28rem, 95vw)' }"
    :pt="{
      root: { class: 'rounded-xl border-0 shadow-xl' },
      mask: { class: '!fixed !inset-0 !z-[1000] !flex !items-center !justify-center !p-4' },
      header: {
        class:
          '!relative !flex !w-full !max-w-full !min-h-[2.75rem] !items-start !justify-between !gap-3 !border-b !border-slate-100 !pb-3 !overflow-visible',
      },
      headerActions: { class: '!ml-0 !shrink-0 !items-start !pt-0.5' },
      pcCloseButton: {
        root: {
          class:
            '!size-9 !rounded-lg !border-0 !bg-transparent !text-slate-600 hover:!bg-slate-100 hover:!text-slate-900 focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-indigo-500',
        },
      },
      content: { class: 'pt-4 text-slate-700' },
    }"
    @update:visible="onVisible"
  >
    <template #header>
      <span
        v-if="title"
        :id="titleId"
        class="block min-w-0 flex-1 break-words pr-2 text-lg font-semibold leading-snug text-slate-900"
      >
        {{ title }}
      </span>
    </template>
    <slot />
    <template v-if="$slots.footer" #footer>
      <div class="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
        <slot name="footer" />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import Dialog from 'primevue/dialog'

const props = defineProps<{
  visible: boolean
  title?: string
  closable?: boolean
  dismissableMask?: boolean
  dialogStyle?: Record<string, string> | string
}>()

const emit = defineEmits<{ 'update:visible': [boolean] }>()

const titleId = useId()
const showCloseButton = computed(() => props.closable !== false)

function onVisible(v: boolean) {
  emit('update:visible', v)
}
</script>
