<template>
  <div
    v-if="message"
    class="error-banner"
    role="alert"
    aria-live="polite"
  >
    <div class="error-banner__icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </div>
    <div class="error-banner__content">
      <p class="error-banner__message">{{ message }}</p>
      <slot name="action" />
    </div>
    <button
      v-if="dismissible"
      type="button"
      class="error-banner__dismiss"
      :aria-label="t('common.close')"
      @click="$emit('dismiss')"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  message: string
  dismissible?: boolean
}>()

defineEmits<{
  dismiss: []
}>()

const { t } = useI18n()
</script>

<style scoped>
.error-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: var(--color-error-bg, #fef2f2);
  border: 1px solid var(--color-error-border, #fecaca);
  border-radius: var(--radius-md, 0.5rem);
  color: var(--color-error-text, #991b1b);
}

.error-banner__icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-error, #dc2626);
}

.error-banner__icon svg {
  width: 100%;
  height: 100%;
}

.error-banner__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.error-banner__message {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
}

.error-banner__dismiss {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
  background: transparent;
  border: none;
  color: var(--color-error-text, #991b1b);
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.error-banner__dismiss:hover {
  opacity: 1;
}

.error-banner__dismiss svg {
  width: 100%;
  height: 100%;
}
</style>
