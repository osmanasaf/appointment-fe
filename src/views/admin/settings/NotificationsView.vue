<template>
  <div class="space-y-6">
    <SectionHeader
      :title="t('settings.notifications.title')"
      :subtitle="t('settings.notifications.subtitle')"
    />

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="size-8 animate-spin rounded-full" :style="{ border: '4px solid var(--primary)', borderTopColor: 'transparent' }" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="card p-6 text-center" role="alert" :style="{ border: '1px solid var(--danger)' }">
      <p :style="{ color: 'var(--danger)' }">{{ error }}</p>
      <AppButton
        variant="primary"
        size="md"
        class="mt-4"
        @click="loadSettings"
      >
        {{ t('settings.notifications.retryButton') }}
      </AppButton>
    </div>

    <template v-else>
      <!-- Kullanım Kotası -->
      <div class="card p-6" :style="{ background: 'var(--primary-tint)' }">
        <h3 class="mb-4 font-medium" :style="{ color: 'var(--ink-1)' }">{{ t('settings.notifications.monthlyUsage') }}</h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <!-- WhatsApp Kotası -->
          <div class="rounded-lg p-4 shadow-sm" :style="{ background: 'var(--surface)' }">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-sm font-medium" :style="{ color: 'var(--ink-2)' }">{{ t('settings.notifications.whatsapp.subtitle') }}</span>
              <span class="text-sm" :style="{ color: 'var(--ink-4)' }">
                {{ settings.whatsappLimit < 0 ? t('settings.notifications.unlimited') : `${settings.whatsappUsed} / ${settings.whatsappLimit}` }}
              </span>
            </div>
            <div v-if="settings.whatsappLimit >= 0" class="h-2 overflow-hidden rounded-full" :style="{ background: 'var(--surface-2)' }">
              <div
                class="h-full rounded-full transition-all"
                :style="{
                  width: `${Math.min(whatsappUsagePercent, 100)}%`,
                  background: whatsappUsagePercent > 90 ? 'var(--danger)' : whatsappUsagePercent > 70 ? 'var(--warning)' : 'var(--success)'
                }"
              />
            </div>
            <p v-if="settings.whatsappLimit >= 0" class="mt-1 text-xs" :style="{ color: 'var(--ink-4)' }">
              {{ t('settings.notifications.messagesRemaining', { n: settings.whatsappRemaining }) }}
            </p>
          </div>

          <!-- SMS Kotası -->
          <div class="rounded-lg p-4 shadow-sm" :style="{ background: 'var(--surface)' }">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-sm font-medium" :style="{ color: 'var(--ink-2)' }">{{ t('settings.notifications.sms.subtitle') }}</span>
              <span class="text-sm" :style="{ color: 'var(--ink-4)' }">
                <template v-if="!settings.smsAvailable">
                  <span :style="{ color: 'var(--warning)' }">{{ t('settings.notifications.planUpgradeRequired') }}</span>
                </template>
                <template v-else>
                  {{ settings.smsLimit < 0 ? t('settings.notifications.unlimited') : `${settings.smsUsed} / ${settings.smsLimit}` }}
                </template>
              </span>
            </div>
            <div v-if="settings.smsAvailable && settings.smsLimit >= 0" class="h-2 overflow-hidden rounded-full" :style="{ background: 'var(--surface-2)' }">
              <div
                class="h-full rounded-full transition-all"
                :style="{
                  width: `${Math.min(smsUsagePercent, 100)}%`,
                  background: smsUsagePercent > 90 ? 'var(--danger)' : smsUsagePercent > 70 ? 'var(--warning)' : 'var(--primary)'
                }"
              />
            </div>
            <p v-if="settings.smsAvailable && settings.smsLimit >= 0" class="mt-1 text-xs" :style="{ color: 'var(--ink-4)' }">
              {{ t('settings.notifications.smsRemaining', { n: settings.smsRemaining }) }}
            </p>
          </div>
        </div>
      </div>

      <!-- WhatsApp Ayarları -->
      <div class="card p-6">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-lg" :style="{ background: 'var(--success)' }">
            <MessageCircle class="size-5 text-white" />
          </div>
          <div>
            <h3 class="font-medium" :style="{ color: 'var(--ink-1)' }">
              {{ t('settings.notifications.whatsapp.title') }}
            </h3>
            <p v-if="!settings.whatsappAvailable" class="text-xs" :style="{ color: 'var(--warning)' }">
              {{ t('settings.notifications.whatsapp.planUpgradeNote') }}
            </p>
          </div>
        </div>

        <div class="space-y-4">
          <label class="flex items-center gap-3">
            <input
              v-model="form.whatsappEnabled"
              type="checkbox"
              :disabled="!settings.whatsappAvailable"
              class="checkbox-input"
            />
            <span class="text-sm" :style="{ color: !settings.whatsappAvailable ? 'var(--ink-4)' : 'var(--ink-2)' }">
              {{ t('settings.notifications.whatsapp.enabled') }}
            </span>
          </label>

          <div v-if="form.whatsappEnabled && settings.whatsappAvailable" class="ml-7 space-y-4 border-l-2 pl-4" :style="{ borderColor: 'color-mix(in oklab, var(--hairline) 60%, transparent)' }">
            <label class="flex items-center gap-3">
              <input
                v-model="form.whatsappReminderEnabled"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="text-sm" :style="{ color: 'var(--ink-2)' }">
                {{ t('settings.notifications.whatsapp.sendReminders') }}
              </span>
            </label>

            <div v-if="form.whatsappReminderEnabled" class="flex flex-wrap items-center gap-3">
              <label class="text-sm" :style="{ color: 'var(--ink-2)' }">
                {{ t('settings.notifications.whatsapp.reminderHours') }}
              </label>
              <select
                v-model.number="form.reminderHoursBefore"
                class="select-input"
              >
                <option :value="1">{{ t('settings.notifications.reminderOptions.h1') }}</option>
                <option :value="2">{{ t('settings.notifications.reminderOptions.h2') }}</option>
                <option :value="4">{{ t('settings.notifications.reminderOptions.h4') }}</option>
                <option :value="12">{{ t('settings.notifications.reminderOptions.h12') }}</option>
                <option :value="24">{{ t('settings.notifications.reminderOptions.h24') }}</option>
                <option :value="48">{{ t('settings.notifications.reminderOptions.h48') }}</option>
              </select>
            </div>

            <label class="flex items-center gap-3">
              <input
                v-model="form.secondReminderEnabled"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="text-sm" :style="{ color: 'var(--ink-2)' }">
                {{ t('settings.notifications.secondReminder.label') }}
              </span>
            </label>

            <div v-if="form.secondReminderEnabled" class="flex flex-wrap items-center gap-3">
              <label class="text-sm" :style="{ color: 'var(--ink-2)' }">
                {{ t('settings.notifications.secondReminder.timeLabel') }}
              </label>
              <select
                v-model.number="form.secondReminderHoursBefore"
                class="select-input"
              >
                <option :value="1">{{ t('settings.notifications.secondReminder.h1') }}</option>
                <option :value="2">{{ t('settings.notifications.secondReminder.h2') }}</option>
                <option :value="4">{{ t('settings.notifications.secondReminder.h4') }}</option>
              </select>
            </div>

            <label class="flex items-center gap-3">
              <input
                v-model="form.whatsappConfirmationEnabled"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="text-sm" :style="{ color: 'var(--ink-2)' }">
                {{ t('settings.notifications.whatsapp.sendConfirmations') }}
              </span>
            </label>

            <label class="flex items-center gap-3">
              <input
                v-model="form.whatsappCancellationEnabled"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="text-sm" :style="{ color: 'var(--ink-2)' }">
                {{ t('settings.notifications.whatsapp.sendCancellations') }}
              </span>
            </label>
          </div>
        </div>
      </div>

      <!-- SMS Ayarları -->
      <div class="card p-6">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-lg" :style="{ background: 'var(--primary)' }">
            <Smartphone class="size-5 text-white" />
          </div>
          <div>
            <h3 class="font-medium" :style="{ color: 'var(--ink-1)' }">
              {{ t('settings.notifications.sms.title') }}
            </h3>
            <p v-if="!settings.smsAvailable" class="text-xs" :style="{ color: 'var(--warning)' }">
              {{ t('settings.notifications.sms.planNote') }}
            </p>
          </div>
        </div>

        <div class="space-y-4">
          <label class="flex items-center gap-3">
            <input
              v-model="form.smsEnabled"
              type="checkbox"
              :disabled="!settings.smsAvailable"
              class="checkbox-input"
            />
            <span class="text-sm" :style="{ color: !settings.smsAvailable ? 'var(--ink-4)' : 'var(--ink-2)' }">
              {{ t('settings.notifications.sms.enabled') }}
            </span>
          </label>

          <label class="flex items-center gap-3">
            <input
              v-model="form.smsFallbackEnabled"
              type="checkbox"
              :disabled="!settings.smsAvailable"
              class="checkbox-input"
            />
            <span class="text-sm" :style="{ color: !settings.smsAvailable ? 'var(--ink-4)' : 'var(--ink-2)' }">
              {{ t('settings.notifications.sms.fallback') }}
            </span>
          </label>
        </div>
      </div>

      <!-- Kaydet Butonu -->
      <div class="flex items-center gap-4">
        <AppButton
          variant="primary"
          size="md"
          :disabled="saving || !hasChanges"
          @click="saveSettings"
        >
          <span v-if="saving" class="flex items-center gap-2">
            <div class="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            {{ t('settings.notifications.savingButton') }}
          </span>
          <span v-else>{{ t('common.save') }}</span>
        </AppButton>
        <span v-if="hasChanges" class="text-sm" :style="{ color: 'var(--warning)' }">
          {{ t('settings.notifications.unsavedChanges') }}
        </span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { MessageCircle, Smartphone } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'
import { notificationSettingsApi, type NotificationSettings } from '@/api/notificationSettings'
import { extractApiError } from '@/utils/apiError'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'

const { t } = useI18n()
const toast = useToast()

const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)

const settings = ref<NotificationSettings>({
  whatsappEnabled: false,
  whatsappReminderEnabled: false,
  whatsappConfirmationEnabled: false,
  whatsappCancellationEnabled: false,
  smsEnabled: false,
  smsFallbackEnabled: false,
  reminderHoursBefore: 24,
  secondReminderEnabled: false,
  secondReminderHoursBefore: 2,
  whatsappAvailable: false,
  smsAvailable: false,
  whatsappLimit: 0,
  smsLimit: 0,
  whatsappUsed: 0,
  smsUsed: 0,
  whatsappRemaining: 0,
  smsRemaining: 0
})

const form = reactive({
  whatsappEnabled: false,
  whatsappReminderEnabled: false,
  whatsappConfirmationEnabled: false,
  whatsappCancellationEnabled: false,
  smsEnabled: false,
  smsFallbackEnabled: false,
  reminderHoursBefore: 24,
  secondReminderEnabled: false,
  secondReminderHoursBefore: 2 as number | null
})

const whatsappUsagePercent = computed(() => {
  if (settings.value.whatsappLimit <= 0) return 0
  return (settings.value.whatsappUsed / settings.value.whatsappLimit) * 100
})

const smsUsagePercent = computed(() => {
  if (settings.value.smsLimit <= 0) return 0
  return (settings.value.smsUsed / settings.value.smsLimit) * 100
})

const hasChanges = computed(() => {
  return (
    form.whatsappEnabled !== settings.value.whatsappEnabled ||
    form.whatsappReminderEnabled !== settings.value.whatsappReminderEnabled ||
    form.whatsappConfirmationEnabled !== settings.value.whatsappConfirmationEnabled ||
    form.whatsappCancellationEnabled !== settings.value.whatsappCancellationEnabled ||
    form.smsEnabled !== settings.value.smsEnabled ||
    form.smsFallbackEnabled !== settings.value.smsFallbackEnabled ||
    form.reminderHoursBefore !== settings.value.reminderHoursBefore ||
    form.secondReminderEnabled !== settings.value.secondReminderEnabled ||
    form.secondReminderHoursBefore !== settings.value.secondReminderHoursBefore
  )
})

const loadSettings = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await notificationSettingsApi.getSettings()
    const data = response.data.data
    settings.value = data
    
    form.whatsappEnabled = data.whatsappEnabled
    form.whatsappReminderEnabled = data.whatsappReminderEnabled
    form.whatsappConfirmationEnabled = data.whatsappConfirmationEnabled
    form.whatsappCancellationEnabled = data.whatsappCancellationEnabled
    form.smsEnabled = data.smsEnabled
    form.smsFallbackEnabled = data.smsFallbackEnabled
    form.reminderHoursBefore = data.reminderHoursBefore
    form.secondReminderEnabled = data.secondReminderEnabled
    form.secondReminderHoursBefore = data.secondReminderHoursBefore
  } catch (e: unknown) {
    error.value = extractApiError(e, t('settings.notifications.toast.loadError'))
    console.error('Failed to load notification settings:', e)
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  saving.value = true
  try {
    const response = await notificationSettingsApi.updateSettings({
      whatsappEnabled: form.whatsappEnabled,
      whatsappReminderEnabled: form.whatsappReminderEnabled,
      whatsappConfirmationEnabled: form.whatsappConfirmationEnabled,
      whatsappCancellationEnabled: form.whatsappCancellationEnabled,
      smsEnabled: form.smsEnabled,
      smsFallbackEnabled: form.smsFallbackEnabled,
      reminderHoursBefore: form.reminderHoursBefore,
      secondReminderEnabled: form.secondReminderEnabled,
      secondReminderHoursBefore: form.secondReminderHoursBefore
    })
    
    settings.value = response.data.data
    toast.success(t('settings.notifications.toast.success'))
  } catch (e: unknown) {
    const message = extractApiError(e, t('settings.notifications.toast.error'))
    toast.error(message)
    console.error('Failed to save notification settings:', e)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.checkbox-input {
  width: 1rem;
  height: 1rem;
  border-radius: var(--r-sm);
  border: 1px solid var(--hairline);
  cursor: pointer;
  accent-color: var(--primary);
}

.checkbox-input:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.checkbox-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary) 12%, transparent);
}

.select-input {
  padding: 0.375rem 0.75rem;
  font-size: 14px;
  border-radius: var(--r-md);
  border: 1px solid var(--hairline);
  background: var(--surface);
  color: var(--ink-1);
  min-width: 10rem;
  cursor: pointer;
}

.select-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary) 12%, transparent);
}
</style>
