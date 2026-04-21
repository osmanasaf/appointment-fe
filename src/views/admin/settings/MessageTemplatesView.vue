<template>
  <div class="space-y-6">
    <SectionHeader
      :title="t('settings.messageTemplates.title')"
      :subtitle="t('settings.messageTemplates.subtitle')"
    />

    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="size-8 animate-spin rounded-full" :style="{ border: '4px solid var(--primary)', borderTopColor: 'transparent' }" />
    </div>

    <div v-else-if="error" class="rounded-lg p-4 text-sm" role="alert" :style="{ background: 'var(--danger-tint)', color: 'var(--danger)' }">
      {{ error }}
    </div>

    <div v-else class="space-y-6">
      <div
        v-for="template in templates"
        :key="template.id"
        class="card p-6"
      >
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="flex size-10 items-center justify-center rounded-lg"
              :style="{ background: getTemplateBgColor(template.type) }"
            >
              <component :is="getTemplateIcon(template.type)" class="size-5 text-white" />
            </div>
            <div>
              <h3 class="font-medium" :style="{ color: 'var(--ink-1)' }">
                {{ t(`settings.messageTemplates.templateTypes.${template.type}`) }}
              </h3>
              <p class="text-sm" :style="{ color: 'var(--ink-4)' }">{{ template.name }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="btn-ghost btn-sm"
              @click="previewTemplate(template)"
            >
              <Eye class="mr-1 inline-block size-4" />
              {{ t('settings.messageTemplates.actions.preview') }}
            </button>
            <button
              type="button"
              class="btn-ghost btn-sm"
              @click="resetTemplate(template)"
            >
              <RotateCcw class="mr-1 inline-block size-4" />
              {{ t('settings.messageTemplates.actions.reset') }}
            </button>
          </div>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium" :style="{ color: 'var(--ink-2)' }">
                {{ t('settings.messageTemplates.fields.header') }}
              </label>
              <input
                v-model="template.headerTemplate"
                type="text"
                class="form-input w-full"
                :placeholder="t('settings.messageTemplates.fields.header')"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium" :style="{ color: 'var(--ink-2)' }">
                {{ t('settings.messageTemplates.fields.body') }}
              </label>
              <textarea
                v-model="template.bodyTemplate"
                rows="6"
                class="form-input w-full"
                :placeholder="t('settings.messageTemplates.fields.body')"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium" :style="{ color: 'var(--ink-2)' }">
                {{ t('settings.messageTemplates.fields.footer') }}
              </label>
              <input
                v-model="template.footerTemplate"
                type="text"
                class="form-input w-full"
                :placeholder="t('settings.messageTemplates.fields.footer')"
              />
            </div>
          </div>

          <div class="space-y-4">
            <div class="rounded-lg p-4" :style="{ background: 'var(--surface-2)' }">
              <h4 class="mb-2 text-sm font-medium" :style="{ color: 'var(--ink-2)' }">
                {{ t('settings.messageTemplates.variables.title') }}
              </h4>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="variable in variables"
                  :key="variable.key"
                  type="button"
                  class="rounded-md px-2 py-1 text-xs font-mono shadow-sm transition"
                  :style="{
                    background: 'var(--surface)',
                    color: 'var(--ink-3)'
                  }"
                  @click="insertVariable(template, variable.key)"
                  @mouseover="$event.currentTarget.style.background = 'var(--primary-tint)'; $event.currentTarget.style.color = 'var(--primary)'"
                  @mouseleave="$event.currentTarget.style.background = 'var(--surface)'; $event.currentTarget.style.color = 'var(--ink-3)'"
                >
                  <span v-text="'{{' + variable.key + '}}'"></span>
                </button>
              </div>
              <p class="mt-2 text-xs" :style="{ color: 'var(--ink-4)' }">
                {{ t('settings.messageTemplates.variables.hint') }}
              </p>
            </div>

            <div v-if="hasButtons(template)" class="space-y-3">
              <h4 class="text-sm font-medium" :style="{ color: 'var(--ink-2)' }">
                {{ t('settings.messageTemplates.fields.buttons') }}
              </h4>

              <div class="flex items-center gap-3">
                <label class="flex items-center gap-2">
                  <input
                    v-model="template.showConfirmButton"
                    type="checkbox"
                    class="checkbox-input"
                  />
                  <span class="text-sm" :style="{ color: 'var(--ink-3)' }">{{ t('settings.messageTemplates.fields.confirmButton') }}</span>
                </label>
                <input
                  v-if="template.showConfirmButton"
                  v-model="template.confirmButtonText"
                  type="text"
                  class="form-input flex-1"
                  maxlength="20"
                />
              </div>

              <div class="flex items-center gap-3">
                <label class="flex items-center gap-2">
                  <input
                    v-model="template.showCancelButton"
                    type="checkbox"
                    class="checkbox-input"
                  />
                  <span class="text-sm" :style="{ color: 'var(--ink-3)' }">{{ t('settings.messageTemplates.fields.cancelButton') }}</span>
                </label>
                <input
                  v-if="template.showCancelButton"
                  v-model="template.cancelButtonText"
                  type="text"
                  class="form-input flex-1"
                  maxlength="20"
                />
              </div>

              <div class="flex items-center gap-3">
                <label class="flex items-center gap-2">
                  <input
                    v-model="template.showRescheduleButton"
                    type="checkbox"
                    class="checkbox-input"
                  />
                  <span class="text-sm" :style="{ color: 'var(--ink-3)' }">{{ t('settings.messageTemplates.fields.rescheduleButton') }}</span>
                </label>
                <input
                  v-if="template.showRescheduleButton"
                  v-model="template.rescheduleButtonText"
                  type="text"
                  class="form-input flex-1"
                  maxlength="20"
                />
              </div>
            </div>

            <AppButton
              variant="primary"
              size="md"
              class="w-full"
              :disabled="saving === template.id"
              @click="saveTemplate(template)"
            >
              <span v-if="saving === template.id" class="flex items-center justify-center gap-2">
                <div class="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {{ t('settings.messageTemplates.messages.savingButton') }}
              </span>
              <span v-else>{{ t('settings.messageTemplates.actions.save') }}</span>
            </AppButton>
          </div>
        </div>
      </div>
    </div>

    <PreviewModal
      v-if="previewVisible"
      :template="previewingTemplate"
      @close="previewVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Bell, CheckCircle, XCircle, Clock, Eye, RotateCcw } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'
import { messageTemplateApi, type MessageTemplate } from '@/api/messageTemplate'
import PreviewModal from '@/components/settings/MessageTemplatePreviewModal.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'

const { t } = useI18n()
const toast = useToast()

const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref<number | null>(null)
const templates = ref<MessageTemplate[]>([])
const previewVisible = ref(false)
const previewingTemplate = ref<MessageTemplate | null>(null)

const variables = computed(() => [
  { key: 'customer_name', label: t('settings.messageTemplates.variables.customer_name') },
  { key: 'business_name', label: t('settings.messageTemplates.variables.business_name') },
  { key: 'service_name', label: t('settings.messageTemplates.variables.service_name') },
  { key: 'date', label: t('settings.messageTemplates.variables.date') },
  { key: 'time', label: t('settings.messageTemplates.variables.time') },
  { key: 'price', label: t('settings.messageTemplates.variables.price') }
])

const getTemplateIcon = (type: string) => {
  switch (type) {
    case 'APPOINTMENT_REMINDER': return Bell
    case 'APPOINTMENT_CONFIRMATION': return CheckCircle
    case 'APPOINTMENT_CANCELLED': return XCircle
    case 'RESCHEDULE_REQUEST_RECEIVED': return Clock
    default: return Bell
  }
}

const getTemplateBgColor = (type: string) => {
  switch (type) {
    case 'APPOINTMENT_REMINDER': return 'var(--primary)'
    case 'APPOINTMENT_CONFIRMATION': return 'var(--success)'
    case 'APPOINTMENT_CANCELLED': return 'var(--danger)'
    case 'RESCHEDULE_REQUEST_RECEIVED': return 'var(--warning)'
    default: return 'var(--ink-3)'
  }
}

const hasButtons = (template: MessageTemplate) => {
  return template.type === 'APPOINTMENT_REMINDER'
}

const insertVariable = (template: MessageTemplate, key: string) => {
  template.bodyTemplate += `{{${key}}}`
}

const loadTemplates = async () => {
  try {
    loading.value = true
    error.value = null
    const response = await messageTemplateApi.getAll()
    templates.value = response.data.data || []
  } catch (e) {
    error.value = t('settings.messageTemplates.messages.loadError')
    console.error(e)
  } finally {
    loading.value = false
  }
}

const saveTemplate = async (template: MessageTemplate) => {
  try {
    saving.value = template.id
    await messageTemplateApi.update(template.id, {
      name: template.name,
      headerTemplate: template.headerTemplate,
      bodyTemplate: template.bodyTemplate,
      footerTemplate: template.footerTemplate,
      showConfirmButton: template.showConfirmButton,
      showCancelButton: template.showCancelButton,
      showRescheduleButton: template.showRescheduleButton,
      confirmButtonText: template.confirmButtonText,
      cancelButtonText: template.cancelButtonText,
      rescheduleButtonText: template.rescheduleButtonText
    })
    toast.success(t('settings.messageTemplates.messages.saveSuccess'))
  } catch (e) {
    toast.error(t('settings.messageTemplates.messages.saveError'))
    console.error(e)
  } finally {
    saving.value = null
  }
}

const resetTemplate = async (template: MessageTemplate) => {
  if (!confirm(t('settings.messageTemplates.messages.resetConfirm'))) return
  
  try {
    saving.value = template.id
    const response = await messageTemplateApi.reset(template.id)
    const index = templates.value.findIndex(t => t.id === template.id)
    if (index !== -1 && response.data.data) {
      templates.value[index] = response.data.data
    }
    toast.success(t('settings.messageTemplates.messages.resetSuccess'))
  } catch (e) {
    toast.error(t('settings.messageTemplates.messages.resetError'))
    console.error(e)
  } finally {
    saving.value = null
  }
}

const previewTemplate = (template: MessageTemplate) => {
  previewingTemplate.value = template
  previewVisible.value = true
}

onMounted(loadTemplates)
</script>

<style scoped>
.form-input {
  padding: 0.5rem 0.75rem;
  font-size: 14px;
  border-radius: var(--r-md);
  border: 1px solid var(--hairline);
  background: var(--surface);
  color: var(--ink-1);
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary) 12%, transparent);
}

.checkbox-input {
  width: 1rem;
  height: 1rem;
  border-radius: var(--r-sm);
  border: 1px solid var(--hairline);
  cursor: pointer;
  accent-color: var(--primary);
}

.checkbox-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary) 12%, transparent);
}

.btn-ghost {
  padding: 0.375rem 0.75rem;
  font-size: 14px;
  font-weight: 500;
  border-radius: var(--r-md);
  color: var(--ink-3);
  transition: all 0.2s;
}

.btn-ghost:hover {
  background: var(--surface-2);
  color: var(--ink-2);
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 13px;
}
</style>
