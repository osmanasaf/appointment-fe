<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-lg font-semibold text-slate-900">
        {{ t('settings.notifications.title') }}
      </h2>
      <p class="mt-1 text-sm text-slate-500">
        {{ t('settings.notifications.subtitle') }}
      </p>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="size-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <p class="text-red-600">{{ error }}</p>
      <button
        class="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        @click="loadSettings"
      >
        Tekrar Dene
      </button>
    </div>

    <template v-else>
      <!-- Kullanım Kotası -->
      <div class="rounded-xl border border-slate-200 bg-gradient-to-r from-teal-50 to-cyan-50 p-6 shadow-sm">
        <h3 class="mb-4 font-medium text-slate-900">Aylık Kullanım</h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <!-- WhatsApp Kotası -->
          <div class="rounded-lg bg-white p-4 shadow-sm">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-sm font-medium text-slate-700">WhatsApp Mesajları</span>
              <span class="text-sm text-slate-500">
                {{ settings.whatsappLimit < 0 ? 'Sınırsız' : `${settings.whatsappUsed} / ${settings.whatsappLimit}` }}
              </span>
            </div>
            <div v-if="settings.whatsappLimit >= 0" class="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                class="h-full rounded-full transition-all"
                :class="whatsappUsagePercent > 90 ? 'bg-red-500' : whatsappUsagePercent > 70 ? 'bg-yellow-500' : 'bg-green-500'"
                :style="{ width: `${Math.min(whatsappUsagePercent, 100)}%` }"
              />
            </div>
            <p v-if="settings.whatsappLimit >= 0" class="mt-1 text-xs text-slate-500">
              {{ settings.whatsappRemaining }} mesaj kaldı
            </p>
          </div>

          <!-- SMS Kotası -->
          <div class="rounded-lg bg-white p-4 shadow-sm">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-sm font-medium text-slate-700">SMS</span>
              <span class="text-sm text-slate-500">
                <template v-if="!settings.smsAvailable">
                  <span class="text-amber-600">Plan yükseltme gerekli</span>
                </template>
                <template v-else>
                  {{ settings.smsLimit < 0 ? 'Sınırsız' : `${settings.smsUsed} / ${settings.smsLimit}` }}
                </template>
              </span>
            </div>
            <div v-if="settings.smsAvailable && settings.smsLimit >= 0" class="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                class="h-full rounded-full transition-all"
                :class="smsUsagePercent > 90 ? 'bg-red-500' : smsUsagePercent > 70 ? 'bg-yellow-500' : 'bg-blue-500'"
                :style="{ width: `${Math.min(smsUsagePercent, 100)}%` }"
              />
            </div>
            <p v-if="settings.smsAvailable && settings.smsLimit >= 0" class="mt-1 text-xs text-slate-500">
              {{ settings.smsRemaining }} SMS kaldı
            </p>
          </div>
        </div>
      </div>

      <!-- WhatsApp Ayarları -->
      <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-lg bg-green-500">
            <MessageCircle class="size-5 text-white" />
          </div>
          <div>
            <h3 class="font-medium text-slate-900">
              {{ t('settings.notifications.whatsapp.title') }}
            </h3>
            <p v-if="!settings.whatsappAvailable" class="text-xs text-amber-600">
              Bu özellik için planınızı yükseltmeniz gerekiyor
            </p>
          </div>
        </div>

        <div class="space-y-4">
          <label class="flex items-center gap-3">
            <input
              v-model="form.whatsappEnabled"
              type="checkbox"
              :disabled="!settings.whatsappAvailable"
              class="size-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span class="text-sm text-slate-700" :class="{ 'opacity-50': !settings.whatsappAvailable }">
              {{ t('settings.notifications.whatsapp.enabled') }}
            </span>
          </label>

          <div v-if="form.whatsappEnabled && settings.whatsappAvailable" class="ml-7 space-y-4 border-l-2 border-slate-100 pl-4">
            <label class="flex items-center gap-3">
              <input
                v-model="form.whatsappReminderEnabled"
                type="checkbox"
                class="size-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span class="text-sm text-slate-700">
                {{ t('settings.notifications.whatsapp.sendReminders') }}
              </span>
            </label>

            <div v-if="form.whatsappReminderEnabled" class="flex flex-wrap items-center gap-3">
              <label class="text-sm text-slate-700">
                {{ t('settings.notifications.whatsapp.reminderHours') }}
              </label>
              <select
                v-model.number="form.reminderHoursBefore"
                class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option :value="1">1 saat</option>
                <option :value="2">2 saat</option>
                <option :value="4">4 saat</option>
                <option :value="12">12 saat</option>
                <option :value="24">24 saat (1 gün)</option>
                <option :value="48">48 saat (2 gün)</option>
              </select>
            </div>

            <!-- İkinci Hatırlatma -->
            <label class="flex items-center gap-3">
              <input
                v-model="form.secondReminderEnabled"
                type="checkbox"
                class="size-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span class="text-sm text-slate-700">
                İkinci hatırlatma gönder
              </span>
            </label>

            <div v-if="form.secondReminderEnabled" class="flex flex-wrap items-center gap-3">
              <label class="text-sm text-slate-700">
                İkinci hatırlatma zamanı:
              </label>
              <select
                v-model.number="form.secondReminderHoursBefore"
                class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option :value="1">1 saat önce</option>
                <option :value="2">2 saat önce</option>
                <option :value="4">4 saat önce</option>
              </select>
            </div>

            <label class="flex items-center gap-3">
              <input
                v-model="form.whatsappConfirmationEnabled"
                type="checkbox"
                class="size-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span class="text-sm text-slate-700">
                {{ t('settings.notifications.whatsapp.sendConfirmations') }}
              </span>
            </label>

            <label class="flex items-center gap-3">
              <input
                v-model="form.whatsappCancellationEnabled"
                type="checkbox"
                class="size-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span class="text-sm text-slate-700">
                {{ t('settings.notifications.whatsapp.sendCancellations') }}
              </span>
            </label>
          </div>
        </div>
      </div>

      <!-- SMS Ayarları -->
      <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-lg bg-blue-500">
            <Smartphone class="size-5 text-white" />
          </div>
          <div>
            <h3 class="font-medium text-slate-900">
              {{ t('settings.notifications.sms.title') }}
            </h3>
            <p v-if="!settings.smsAvailable" class="text-xs text-amber-600">
              SMS bildirimleri Business ve üzeri planlarda kullanılabilir
            </p>
          </div>
        </div>

        <div class="space-y-4">
          <label class="flex items-center gap-3">
            <input
              v-model="form.smsEnabled"
              type="checkbox"
              :disabled="!settings.smsAvailable"
              class="size-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span class="text-sm text-slate-700" :class="{ 'opacity-50': !settings.smsAvailable }">
              SMS bildirimlerini etkinleştir
            </span>
          </label>

          <label class="flex items-center gap-3">
            <input
              v-model="form.smsFallbackEnabled"
              type="checkbox"
              :disabled="!settings.smsAvailable"
              class="size-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span class="text-sm text-slate-700" :class="{ 'opacity-50': !settings.smsAvailable }">
              {{ t('settings.notifications.sms.fallback') }}
            </span>
          </label>
        </div>
      </div>

      <!-- Kaydet Butonu -->
      <div class="flex items-center gap-4">
        <button
          type="button"
          class="rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-50"
          :disabled="saving || !hasChanges"
          @click="saveSettings"
        >
          <span v-if="saving" class="flex items-center gap-2">
            <div class="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Kaydediliyor...
          </span>
          <span v-else>Kaydet</span>
        </button>
        <span v-if="hasChanges" class="text-sm text-amber-600">
          Kaydedilmemiş değişiklikler var
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
    
    // Form'u güncelle
    form.whatsappEnabled = data.whatsappEnabled
    form.whatsappReminderEnabled = data.whatsappReminderEnabled
    form.whatsappConfirmationEnabled = data.whatsappConfirmationEnabled
    form.whatsappCancellationEnabled = data.whatsappCancellationEnabled
    form.smsEnabled = data.smsEnabled
    form.smsFallbackEnabled = data.smsFallbackEnabled
    form.reminderHoursBefore = data.reminderHoursBefore
    form.secondReminderEnabled = data.secondReminderEnabled
    form.secondReminderHoursBefore = data.secondReminderHoursBefore
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Ayarlar yüklenemedi'
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
    toast.success('Bildirim ayarları kaydedildi')
  } catch (e: any) {
    const message = e.response?.data?.message || 'Ayarlar kaydedilemedi'
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
