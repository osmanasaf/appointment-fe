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
      root: { class: 'app-modal-root rounded-xl border-0' },
      mask: { class: '!fixed !inset-0 !z-[1000] !flex !items-center !justify-center !p-4' },
      header: {
        class:
          'app-modal-header !relative !flex !w-full !max-w-full !min-h-[2.75rem] !items-start !justify-between !gap-3 !border-b !pb-3 !overflow-visible',
      },
      headerActions: { class: '!ml-0 !shrink-0 !items-start !pt-0.5' },
      pcCloseButton: {
        root: {
          class:
            'app-modal-close !size-9 !rounded-lg !border-0 !bg-transparent focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-offset-2',
        },
      },
      content: { class: 'app-modal-content pt-4' },
    }"
    @update:visible="onVisible"
  >
    <template #header>
      <span
        v-if="title"
        :id="titleId"
        class="app-modal-title block min-w-0 flex-1 break-words pr-2 text-lg font-semibold leading-snug"
      >
        {{ title }}
      </span>
    </template>
    <slot />
    <template v-if="$slots.footer" #footer>
      <div class="app-modal-footer flex flex-wrap justify-end gap-2 border-t pt-4">
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

<style>
.app-modal-root {
  background: var(--surface);
  color: var(--ink-2);
  box-shadow: var(--shadow-3);
}
.app-modal-header {
  border-bottom-color: var(--hairline) !important;
  color: var(--ink-1);
}
.app-modal-title {
  color: var(--ink-1);
}
.app-modal-content {
  color: var(--ink-2);
}
.app-modal-footer {
  border-top-color: var(--hairline);
}
.app-modal-close {
  color: var(--ink-3) !important;
}
.app-modal-close:hover {
  background: var(--surface-2) !important;
  color: var(--ink-1) !important;
}
.app-modal-close:focus-visible {
  outline-color: var(--primary) !important;
}
</style>
