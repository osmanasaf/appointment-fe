<template>
  <div class="error-state" role="status" aria-live="polite">
    <div class="error-state__icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </div>
    <h3 class="error-state__title">{{ title || t('errors.unknown') }}</h3>
    <p v-if="message" class="error-state__message">{{ message }}</p>
    <div v-if="$slots.default || showRetry" class="error-state__actions">
      <slot>
        <button
          v-if="showRetry"
          type="button"
          class="error-state__retry"
          :disabled="loading"
          @click="$emit('retry')"
        >
          <svg
            v-if="loading"
            class="error-state__spinner"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          {{ loading ? t('common.loading') : t('common.retry') }}
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  title?: string
  message?: string
  showRetry?: boolean
  loading?: boolean
}>()

defineEmits<{
  retry: []
}>()

const { t } = useI18n()
</script>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
  min-height: 20rem;
}

.error-state__icon {
  width: 3rem;
  height: 3rem;
  margin-bottom: 1rem;
  color: var(--color-error, #dc2626);
  opacity: 0.8;
}

.error-state__icon svg {
  width: 100%;
  height: 100%;
}

.error-state__title {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary, #111827);
}

.error-state__message {
  margin: 0 0 1.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary, #6b7280);
  max-width: 32rem;
}

.error-state__actions {
  display: flex;
  gap: 0.75rem;
}

.error-state__retry {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-primary-contrast, white);
  background: var(--color-primary, #3b82f6);
  border: none;
  border-radius: var(--radius-md, 0.5rem);
  cursor: pointer;
  transition: background 0.2s;
}

.error-state__retry:hover:not(:disabled) {
  background: var(--color-primary-dark, #2563eb);
}

.error-state__retry:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-state__spinner {
  width: 1rem;
  height: 1rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
