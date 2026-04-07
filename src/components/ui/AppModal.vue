<template>
  <Dialog
    :visible="visible"
    :header="title"
    modal
    :dismissable-mask="dismissableMask ?? true"
    :closable="closable ?? true"
    class="app-modal"
    :style="{ width: 'min(28rem, 95vw)' }"
    :pt="{
      root: { class: 'rounded-xl border-0 shadow-xl' },
      header: { class: 'border-b border-slate-100 pb-3' },
      title: { class: 'text-lg font-semibold text-slate-900' },
      content: { class: 'pt-4 text-slate-700' },
    }"
    @update:visible="onVisible"
  >
    <slot />
    <template v-if="$slots.footer" #footer>
      <div class="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
        <slot name="footer" />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog'

defineProps<{
  visible: boolean
  title?: string
  closable?: boolean
  dismissableMask?: boolean
}>()

const emit = defineEmits<{ 'update:visible': [boolean] }>()

function onVisible(v: boolean) {
  emit('update:visible', v)
}
</script>
