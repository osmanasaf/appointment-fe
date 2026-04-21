<template>
  <div class="space-y-6">
    <SectionHeader
      :title="t('settings.security.title')"
      :subtitle="t('settings.security.subtitle')"
    />

    <div class="space-y-6">
      <div class="card p-6">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-lg" :style="{ background: 'var(--primary-tint)' }">
            <KeyRound class="size-5" :style="{ color: 'var(--primary)' }" aria-hidden="true" />
          </div>
          <div>
            <h3 class="font-medium" :style="{ color: 'var(--ink-1)' }">
              {{ t('settings.security.changePassword') }}
            </h3>
            <p class="text-sm" :style="{ color: 'var(--ink-4)' }">{{ t('settings.security.changePasswordSubtitle') }}</p>
          </div>
        </div>

        <form class="space-y-4" novalidate @submit.prevent="changePassword">
          <div>
            <label for="current-password" class="mb-1 block text-sm font-medium" :style="{ color: 'var(--ink-2)' }">
              {{ t('settings.security.fields.currentPassword') }}
            </label>
            <input
              id="current-password"
              v-model="passwordForm.currentPassword"
              type="password"
              autocomplete="current-password"
              class="form-input w-full max-w-md"
              :aria-invalid="hasFieldError('currentPassword')"
              :aria-describedby="hasFieldError('currentPassword') ? 'current-password-error' : undefined"
            />
            <p
              v-if="hasFieldError('currentPassword')"
              id="current-password-error"
              class="mt-1 text-xs"
              role="alert"
              :style="{ color: 'var(--danger)' }"
            >
              {{ fieldErrors.currentPassword }}
            </p>
          </div>

          <div>
            <label for="new-password" class="mb-1 block text-sm font-medium" :style="{ color: 'var(--ink-2)' }">
              {{ t('settings.security.fields.newPassword') }}
            </label>
            <input
              id="new-password"
              v-model="passwordForm.newPassword"
              type="password"
              autocomplete="new-password"
              class="form-input w-full max-w-md"
              :aria-invalid="hasFieldError('newPassword')"
              :aria-describedby="hasFieldError('newPassword') ? 'new-password-error' : 'new-password-hint'"
            />
            <p
              v-if="hasFieldError('newPassword')"
              id="new-password-error"
              class="mt-1 text-xs"
              role="alert"
              :style="{ color: 'var(--danger)' }"
            >
              {{ fieldErrors.newPassword }}
            </p>
            <p v-else id="new-password-hint" class="mt-1 text-xs" :style="{ color: 'var(--ink-4)' }">
              {{ t('settings.security.newPasswordHint') }}
            </p>
          </div>

          <div>
            <label for="confirm-password" class="mb-1 block text-sm font-medium" :style="{ color: 'var(--ink-2)' }">
              {{ t('settings.security.fields.confirmPassword') }}
            </label>
            <input
              id="confirm-password"
              v-model="passwordForm.confirmPassword"
              type="password"
              autocomplete="new-password"
              class="form-input w-full max-w-md"
              :aria-invalid="hasFieldError('confirmPassword')"
              :aria-describedby="hasFieldError('confirmPassword') ? 'confirm-password-error' : undefined"
            />
            <p
              v-if="hasFieldError('confirmPassword')"
              id="confirm-password-error"
              class="mt-1 text-xs"
              role="alert"
              :style="{ color: 'var(--danger)' }"
            >
              {{ fieldErrors.confirmPassword }}
            </p>
          </div>

          <AppButton
            variant="primary"
            size="md"
            native-type="submit"
            :disabled="!canChangePassword"
            :loading="isSubmitting"
          >
            {{ t('settings.security.button.change') }}
          </AppButton>
        </form>
      </div>

      <div class="card p-6">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-lg" :style="{ background: 'var(--warning-tint)' }">
            <ShieldCheck class="size-5" :style="{ color: 'var(--warning)' }" aria-hidden="true" />
          </div>
          <div>
            <h3 class="font-medium" :style="{ color: 'var(--ink-1)' }">
              {{ t('settings.security.twoFactor') }}
            </h3>
            <p class="text-sm" :style="{ color: 'var(--ink-4)' }">{{ t('settings.security.twoFactorSubtitle') }}</p>
          </div>
        </div>

        <div class="rounded-lg p-4" :style="{ background: 'var(--warning-tint)', color: 'var(--warning)' }">
          <p class="text-sm">
            {{ t('settings.security.twoFactorComingSoon') }}
          </p>
        </div>
      </div>

      <div class="card p-6">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-lg" :style="{ background: 'var(--primary-tint)' }">
            <Monitor class="size-5" :style="{ color: 'var(--primary)' }" aria-hidden="true" />
          </div>
          <div>
            <h3 class="font-medium" :style="{ color: 'var(--ink-1)' }">
              {{ t('settings.security.sessions') }}
            </h3>
            <p class="text-sm" :style="{ color: 'var(--ink-4)' }">{{ t('settings.security.sessionsSubtitle') }}</p>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between rounded-lg p-3" :style="{ background: 'var(--surface-2)' }">
            <div class="flex items-center gap-3">
              <Monitor class="size-5" :style="{ color: 'var(--ink-4)' }" />
              <div>
                <p class="text-sm font-medium" :style="{ color: 'var(--ink-1)' }">{{ t('settings.security.thisDevice') }}</p>
                <p class="text-xs" :style="{ color: 'var(--ink-4)' }">{{ t('settings.security.thisDevicePlatform') }}</p>
              </div>
            </div>
            <span class="rounded-full px-2 py-0.5 text-xs font-medium" :style="{ background: 'var(--success-tint)', color: 'var(--success)' }">
              {{ t('settings.security.activeStatus') }}
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
import SectionHeader from '@/components/ui/SectionHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { changePasswordSchema, validationPatterns } from '@/validation/schemas'

const { t } = useI18n()
const toast = useToast()

const MIN_PASSWORD_LENGTH = validationPatterns.passwordMin

type PasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword'

const passwordForm = ref<Record<PasswordField, string>>({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const fieldErrors = ref<Partial<Record<PasswordField, string>>>({})
const isSubmitting = ref(false)

const canChangePassword = computed(() => {
  return (
    !!passwordForm.value.currentPassword &&
    !!passwordForm.value.newPassword &&
    passwordForm.value.newPassword === passwordForm.value.confirmPassword &&
    passwordForm.value.newPassword.length >= MIN_PASSWORD_LENGTH &&
    !isSubmitting.value
  )
})

function hasFieldError(field: PasswordField): boolean {
  return Boolean(fieldErrors.value[field])
}

function validate(): boolean {
  const result = changePasswordSchema.safeParse(passwordForm.value)
  if (result.success) {
    fieldErrors.value = {}
    return true
  }
  const errors: Partial<Record<PasswordField, string>> = {}
  for (const issue of result.error.issues) {
    const key = issue.path[0]
    if (key === 'currentPassword' || key === 'newPassword' || key === 'confirmPassword') {
      if (!errors[key]) {
        errors[key] = issue.message
      }
    }
  }
  fieldErrors.value = errors
  return false
}

async function changePassword(): Promise<void> {
  if (isSubmitting.value || !validate()) return
  isSubmitting.value = true
  try {
    toast.success(t('settings.security.toast.success'))
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    fieldErrors.value = {}
  } catch (error) {
    const message = error instanceof Error ? error.message : t('settings.security.toast.error')
    toast.error(message)
  } finally {
    isSubmitting.value = false
  }
}
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
</style>
