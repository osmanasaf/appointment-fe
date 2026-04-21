<template>
  <a
    :href="ctaHref"
    class="upgrade-card"
    :aria-label="t('admin.upgradePromo.cta')"
  >
    <div class="upgrade-card__head">
      <span class="upgrade-card__icon" aria-hidden="true">
        <Zap class="size-3.5" />
      </span>
      <span class="upgrade-card__title title">{{ t('admin.upgradePromo.title') }}</span>
    </div>
    <p class="upgrade-card__desc body-sm">
      {{ t('admin.upgradePromo.desc') }}
    </p>
    <span class="upgrade-card__cta">
      {{ t('admin.upgradePromo.cta') }}
    </span>
  </a>
</template>

<script setup lang="ts">
import { Zap } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

defineProps<{
  ctaHref: string
}>()

const { t } = useI18n()
</script>

<style scoped>
.upgrade-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: var(--r-lg);
  border: 0.5px solid var(--hairline);
  background: linear-gradient(135deg, rgba(13, 122, 143, 0.08), rgba(20, 184, 166, 0.04));
  text-decoration: none;
  color: var(--ink-1);
  transition: box-shadow 0.18s ease, transform 0.18s ease;
}

.upgrade-card:hover {
  box-shadow: var(--shadow-2);
  transform: translateY(-1px);
}

.upgrade-card:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--primary-tint);
}

.upgrade-card__head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.upgrade-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--r-sm);
  background: var(--primary);
  color: #fff;
}

.upgrade-card__title {
  font-size: 0.8125rem;
}

.upgrade-card__desc {
  margin: 0;
  font-size: 0.71875rem;
}

.upgrade-card__cta {
  margin-top: 0.125rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.4375rem 0.75rem;
  border-radius: var(--r-sm);
  background: var(--primary);
  color: #fff;
  font-size: 0.78125rem;
  font-weight: 600;
  letter-spacing: -0.005em;
  transition: background 0.15s ease;
}

.upgrade-card:hover .upgrade-card__cta {
  background: var(--primary-pressed);
}
</style>
