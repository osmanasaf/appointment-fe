<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
  icon: Component
  label: string
  value: string | number
  change?: string
  sub?: string
  tint?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'violet'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  tint: 'primary',
  loading: false
})

const tintColors = {
  primary: { bg: 'var(--primary-tint)', fg: 'var(--primary)' },
  success: { bg: 'var(--success-tint)', fg: 'var(--success)' },
  warning: { bg: 'var(--warning-tint)', fg: 'var(--warning)' },
  danger: { bg: 'var(--danger-tint)', fg: 'var(--danger)' },
  info: { bg: 'var(--info-tint)', fg: 'var(--info)' },
  violet: { bg: 'color-mix(in oklab, var(--niche-tattoo) 12%, transparent)', fg: 'var(--niche-tattoo)' }
}

const tintBg = tintColors[props.tint].bg
const tintFg = tintColors[props.tint].fg

const changeVariant = props.change
  ? props.change[0] === '+'
    ? 'success'
    : props.change[0] === '-'
      ? 'danger'
      : null
  : null
</script>

<template>
  <div class="kpi-card">
    <div v-if="loading" class="kpi-card__skeleton">
      <div class="skeleton-line skeleton-line--icon" />
      <div class="skeleton-line skeleton-line--value" />
      <div class="skeleton-line skeleton-line--label" />
      <div class="skeleton-line skeleton-line--sub" />
    </div>

    <template v-else>
      <div class="kpi-card__header">
        <div class="kpi-card__icon" :style="{ background: tintBg }">
          <component :is="icon" :size="18" :color="tintFg" aria-hidden="true" />
        </div>

        <div
          v-if="change && changeVariant"
          class="kpi-card__change"
          :class="`kpi-card__change--${changeVariant}`"
        >
          {{ change }}
        </div>
      </div>

      <div class="kpi-card__value display-md mono">{{ value }}</div>

      <div class="kpi-card__label">{{ label }}</div>

      <div v-if="sub" class="kpi-card__sub">{{ sub }}</div>
    </template>
  </div>
</template>

<style scoped>
.kpi-card {
  padding: 18px;
  background: var(--surface);
  border: 0.5px solid var(--hairline);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-1);
}

.kpi-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
}

.kpi-card__icon {
  width: 38px;
  height: 38px;
  border-radius: var(--r-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-card__change {
  padding: 2px 8px;
  border-radius: var(--r-full);
  font-size: 11.5px;
  font-weight: 700;
  line-height: 1.3;
}

.kpi-card__change--success {
  background: var(--success-tint);
  color: var(--success);
}

.kpi-card__change--danger {
  background: var(--danger-tint);
  color: var(--danger);
}

.kpi-card__value {
  font-size: 28px;
  line-height: 1.1;
  color: var(--ink-1);
}

.kpi-card__label {
  margin-top: 2px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-3);
}

.kpi-card__sub {
  margin-top: 2px;
  font-size: 11.5px;
  color: var(--ink-4);
}

/* Skeleton loading states */
.kpi-card__skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-line {
  background: linear-gradient(
    90deg,
    var(--surface-2) 25%,
    var(--bg-subtle) 50%,
    var(--surface-2) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--r-sm);
}

.skeleton-line--icon {
  width: 38px;
  height: 38px;
  border-radius: var(--r-md);
}

.skeleton-line--value {
  width: 60%;
  height: 28px;
  margin-top: 8px;
}

.skeleton-line--label {
  width: 80%;
  height: 13px;
}

.skeleton-line--sub {
  width: 50%;
  height: 11px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
