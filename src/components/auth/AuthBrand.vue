<template>
  <div
    class="auth-brand"
    :class="[`auth-brand--${size}`, { 'auth-brand--inverted': inverted }]"
  >
    <div class="brand-icon">
      <CalendarDays :class="size === 'lg' ? 'size-6' : 'size-4'" />
    </div>
    <div class="brand-text">
      <div class="brand-name">{{ t('auth.brand.name') }}</div>
      <div class="brand-tagline">{{ t('auth.brand.tagline') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CalendarDays } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

withDefaults(
  defineProps<{
    size?: 'lg' | 'sm'
    inverted?: boolean
  }>(),
  {
    size: 'lg',
    inverted: false,
  },
)

const { t } = useI18n()
</script>

<style scoped>
.auth-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--r-md);
  background: linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 90%, var(--gradient-end)) 100%);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--primary) 35%, transparent);
}

.brand-icon svg {
  color: var(--surface);
}

.auth-brand--lg .brand-icon {
  width: 44px;
  height: 44px;
}

.auth-brand--sm .brand-icon {
  width: 36px;
  height: 36px;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.brand-name {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ink-1);
}

.auth-brand--lg .brand-name {
  font-size: 18px;
  line-height: 1.2;
}

.auth-brand--sm .brand-name {
  font-size: 16px;
  line-height: 1.2;
}

.brand-tagline {
  font-size: 10px;
  color: var(--ink-3);
  margin-top: -2px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-weight: 600;
  line-height: 1.2;
}

.auth-brand--inverted .brand-icon {
  background: color-mix(in srgb, var(--surface) 20%, transparent);
  box-shadow: 0 8px 20px color-mix(in srgb, #000 25%, transparent);
  backdrop-filter: blur(8px);
}

.auth-brand--inverted .brand-icon svg {
  color: var(--surface);
}

.auth-brand--inverted .brand-name {
  color: var(--surface);
}

.auth-brand--inverted .brand-tagline {
  color: color-mix(in srgb, var(--surface) 80%, transparent);
}
</style>
