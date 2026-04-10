<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-lg font-semibold text-slate-900">
        {{ t('settings.messageTemplates.title') }}
      </h2>
      <p class="mt-1 text-sm text-slate-500">
        {{ t('settings.messageTemplates.subtitle') }}
      </p>
    </header>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="size-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
    </div>

    <div v-else-if="error" class="rounded-lg bg-red-50 p-4 text-sm text-red-700">
      {{ error }}
    </div>

    <div v-else class="space-y-6">
      <div
        v-for="template in templates"
        :key="template.id"
        class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="flex size-10 items-center justify-center rounded-lg"
              :class="getTemplateIconBg(template.type)"
            >
              <component :is="getTemplateIcon(template.type)" class="size-5 text-white" />
            </div>
            <div>
              <h3 class="font-medium text-slate-900">
                {{ t(`settings.messageTemplates.templateTypes.${template.type}`) }}
              </h3>
              <p class="text-sm text-slate-500">{{ template.name }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              @click="previewTemplate(template)"
            >
              <Eye class="mr-1 inline-block size-4" />
              {{ t('settings.messageTemplates.actions.preview') }}
            </button>
            <button
              type="button"
              class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
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
              <label class="mb-1 block text-sm font-medium text-slate-700">
                {{ t('settings.messageTemplates.fields.header') }}
              </label>
              <input
                v-model="template.headerTemplate"
                type="text"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                :placeholder="t('settings.messageTemplates.fields.header')"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">
                {{ t('settings.messageTemplates.fields.body') }}
              </label>
              <textarea
                v-model="template.bodyTemplate"
                rows="6"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                :placeholder="t('settings.messageTemplates.fields.body')"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">
                {{ t('settings.messageTemplates.fields.footer') }}
              </label>
              <input
                v-model="template.footerTemplate"
                type="text"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                :placeholder="t('settings.messageTemplates.fields.footer')"
              />
            </div>
          </div>

          <div class="space-y-4">
            <div class="rounded-lg bg-slate-50 p-4">
              <h4 class="mb-2 text-sm font-medium text-slate-700">
                {{ t('settings.messageTemplates.variables.title') }}
              </h4>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="variable in variables"
                  :key="variable.key"
                  type="button"
                  class="rounded-md bg-white px-2 py-1 text-xs font-mono text-slate-600 shadow-sm transition hover:bg-teal-50 hover:text-teal-700"
                  @click="insertVariable(template, variable.key)"
                >
                  <span v-text="'{{' + variable.key + '}}'"></span>
                </button>
              </div>
              <p class="mt-2 text-xs text-slate-500">
                Değişkene tıklayarak mesaj içeriğine ekleyebilirsiniz.
              </p>
            </div>

            <div v-if="hasButtons(template)" class="space-y-3">
              <h4 class="text-sm font-medium text-slate-700">
                {{ t('settings.messageTemplates.fields.buttons') }}
              </h4>

              <div class="flex items-center gap-3">
                <label class="flex items-center gap-2">
                  <input
                    v-model="template.showConfirmButton"
                    type="checkbox"
                    class="size-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span class="text-sm text-slate-600">{{ t('settings.messageTemplates.fields.confirmButton') }}</span>
                </label>
                <input
                  v-if="template.showConfirmButton"
                  v-model="template.confirmButtonText"
                  type="text"
                  class="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-teal-500 focus:outline-none"
                  maxlength="20"
                />
              </div>

              <div class="flex items-center gap-3">
                <label class="flex items-center gap-2">
                  <input
                    v-model="template.showCancelButton"
                    type="checkbox"
                    class="size-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span class="text-sm text-slate-600">{{ t('settings.messageTemplates.fields.cancelButton') }}</span>
                </label>
                <input
                  v-if="template.showCancelButton"
                  v-model="template.cancelButtonText"
                  type="text"
                  class="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-teal-500 focus:outline-none"
                  maxlength="20"
                />
              </div>

              <div class="flex items-center gap-3">
                <label class="flex items-center gap-2">
                  <input
                    v-model="template.showRescheduleButton"
                    type="checkbox"
                    class="size-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span class="text-sm text-slate-600">{{ t('settings.messageTemplates.fields.rescheduleButton') }}</span>
                </label>
                <input
                  v-if="template.showRescheduleButton"
                  v-model="template.rescheduleButtonText"
                  type="text"
                  class="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-teal-500 focus:outline-none"
                  maxlength="20"
                />
              </div>
            </div>

            <button
              type="button"
              class="w-full rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-50"
              :disabled="saving === template.id"
              @click="saveTemplate(template)"
            >
              <span v-if="saving === template.id" class="flex items-center justify-center gap-2">
                <div class="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Kaydediliyor...
              </span>
              <span v-else>{{ t('settings.messageTemplates.actions.save') }}</span>
            </button>
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

const { t } = useI18n()
const toast = useToast()

const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref<number | null>(null)
const templates = ref<MessageTemplate[]>([])
const previewVisible = ref(false)
const previewingTemplate = ref<MessageTemplate | null>(null)

const variables = [
  { key: 'customer_name', label: 'Müşteri adı' },
  { key: 'business_name', label: 'İşletme adı' },
  { key: 'service_name', label: 'Hizmet adı' },
  { key: 'date', label: 'Tarih' },
  { key: 'time', label: 'Saat' },
  { key: 'price', label: 'Fiyat' }
]

const getTemplateIcon = (type: string) => {
  switch (type) {
    case 'APPOINTMENT_REMINDER': return Bell
    case 'APPOINTMENT_CONFIRMATION': return CheckCircle
    case 'APPOINTMENT_CANCELLED': return XCircle
    case 'RESCHEDULE_REQUEST_RECEIVED': return Clock
    default: return Bell
  }
}

const getTemplateIconBg = (type: string) => {
  switch (type) {
    case 'APPOINTMENT_REMINDER': return 'bg-blue-500'
    case 'APPOINTMENT_CONFIRMATION': return 'bg-green-500'
    case 'APPOINTMENT_CANCELLED': return 'bg-red-500'
    case 'RESCHEDULE_REQUEST_RECEIVED': return 'bg-amber-500'
    default: return 'bg-slate-500'
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
    error.value = 'Şablonlar yüklenemedi'
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
    toast.error('Şablon sıfırlanamadı')
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
