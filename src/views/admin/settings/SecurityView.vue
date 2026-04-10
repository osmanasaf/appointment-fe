<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-lg font-semibold text-slate-900">
        {{ t('settings.security.title') }}
      </h2>
      <p class="mt-1 text-sm text-slate-500">
        {{ t('settings.security.subtitle') }}
      </p>
    </header>

    <div class="space-y-6">
      <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-lg bg-slate-700">
            <KeyRound class="size-5 text-white" />
          </div>
          <div>
            <h3 class="font-medium text-slate-900">
              {{ t('settings.security.changePassword') }}
            </h3>
            <p class="text-sm text-slate-500">Hesap şifrenizi değiştirin</p>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">
              Mevcut Şifre
            </label>
            <input
              v-model="passwordForm.currentPassword"
              type="password"
              class="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">
              Yeni Şifre
            </label>
            <input
              v-model="passwordForm.newPassword"
              type="password"
              class="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">
              Yeni Şifre (Tekrar)
            </label>
            <input
              v-model="passwordForm.confirmPassword"
              type="password"
              class="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <button
            type="button"
            class="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
            :disabled="!canChangePassword"
            @click="changePassword"
          >
            Şifreyi Değiştir
          </button>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-lg bg-amber-500">
            <ShieldCheck class="size-5 text-white" />
          </div>
          <div>
            <h3 class="font-medium text-slate-900">
              {{ t('settings.security.twoFactor') }}
            </h3>
            <p class="text-sm text-slate-500">Hesabınızı daha güvenli hale getirin</p>
          </div>
        </div>

        <div class="rounded-lg bg-amber-50 p-4">
          <p class="text-sm text-amber-800">
            İki faktörlü doğrulama yakında kullanıma sunulacak.
          </p>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-lg bg-blue-500">
            <Monitor class="size-5 text-white" />
          </div>
          <div>
            <h3 class="font-medium text-slate-900">
              {{ t('settings.security.sessions') }}
            </h3>
            <p class="text-sm text-slate-500">Aktif oturumlarınızı yönetin</p>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <div class="flex items-center gap-3">
              <Monitor class="size-5 text-slate-400" />
              <div>
                <p class="text-sm font-medium text-slate-900">Bu cihaz</p>
                <p class="text-xs text-slate-500">Windows - Chrome</p>
              </div>
            </div>
            <span class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Aktif
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { KeyRound, ShieldCheck, Monitor } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const toast = useToast()

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const canChangePassword = computed(() => {
  return (
    passwordForm.value.currentPassword &&
    passwordForm.value.newPassword &&
    passwordForm.value.newPassword === passwordForm.value.confirmPassword &&
    passwordForm.value.newPassword.length >= 8
  )
})

const changePassword = async () => {
  try {
    // TODO: API call
    toast.success('Şifre değiştirildi')
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  } catch (e) {
    toast.error('Şifre değiştirilemedi')
  }
}
</script>
