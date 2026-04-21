<template>
  <div class="email-verify-banner" role="alert">
    <div class="banner-icon">
      <MailWarning />
    </div>
    <div class="banner-content">
      <p class="banner-message">{{ t('auth.emailNotVerifiedMessage') }}</p>
      <button
        type="button"
        class="banner-action"
        :disabled="resending"
        @click="handleResend"
      >
        {{ resending ? t('common.sending') : t('auth.resendVerification') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { MailWarning } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  email: string
}>()

const { t } = useI18n()
const auth = useAuthStore()
const toast = useToast()
const resending = ref(false)

async function handleResend() {
  resending.value = true
  try {
    await auth.resendVerification(props.email)
    toast.success(t('auth.verificationEmailSent'))
  } catch (e) {
    toast.error(t('auth.verificationEmailFailed'))
  } finally {
    resending.value = false
  }
}
</script>

<style scoped>
.email-verify-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-warning-bg, #fffbeb);
  border: 1px solid var(--color-warning-border, #fde68a);
  border-radius: var(--radius-md, 0.5rem);
  color: var(--color-warning-text, #92400e);
}

.banner-icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-warning, #f59e0b);
}

.banner-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.banner-message {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
}

.banner-action {
  align-self: flex-start;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-warning-text, #92400e);
  background: transparent;
  border: 1px solid var(--color-warning-border, #fde68a);
  border-radius: var(--radius-sm, 0.375rem);
  cursor: pointer;
  transition: background 0.2s;
}

.banner-action:hover:not(:disabled) {
  background: var(--color-warning-hover, #fef3c7);
}

.banner-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
