<template>
  <div class="auth-split">
    <!-- Hero Panel (left, hidden on mobile) -->
    <aside class="hero-panel" aria-hidden="true">
      <!-- Decorative blurs -->
      <div class="hero-blur hero-blur--1" aria-hidden="true" />
      <div class="hero-blur hero-blur--2" aria-hidden="true" />

      <!-- Brand -->
      <div class="hero-brand">
        <AuthBrand size="lg" />
      </div>

      <!-- Hero content -->
      <div class="hero-content">
        <h2 class="hero-title">
          <slot name="hero-title">
            {{ t('auth.hero.title') }}
          </slot>
        </h2>
        <p class="hero-subtitle">
          <slot name="hero-subtitle">
            {{ t('auth.hero.subtitle') }}
          </slot>
        </p>

        <ul class="hero-features">
          <li v-for="(feature, i) in features" :key="i" class="hero-feature">
            <span class="feature-icon">
              <Check class="size-3" />
            </span>
            {{ feature }}
          </li>
        </ul>
      </div>

      <!-- Hero footer card -->
      <div class="hero-footer">
        <div class="footer-icon">
          <CalendarDays class="size-7" />
        </div>
        <div class="footer-text">
          <p class="footer-title">
            <slot name="hero-footer-title">
              {{ t('auth.hero.footerTitle') }}
            </slot>
          </p>
          <p class="footer-subtitle">
            <slot name="hero-footer-subtitle">
              {{ t('auth.hero.footerSubtitle') }}
            </slot>
          </p>
        </div>
      </div>
    </aside>

    <!-- Form Panel (right) -->
    <main class="form-panel">
      <!-- Mobile brand badge -->
      <div class="mobile-brand">
        <AuthBrand size="sm" />
      </div>

      <div class="form-container">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CalendarDays, Check } from 'lucide-vue-next'
import AuthBrand from './AuthBrand.vue'

const { t, tm } = useI18n()

const features = computed(() => {
  const raw = tm('auth.hero.features')
  if (Array.isArray(raw)) return raw as string[]
  return [
    'Online appointment & calendar management',
    'Customer & staff tracking',
    'Service & package management',
    'Real-time notifications & reminders',
  ]
})
</script>

<style scoped>
.auth-split {
  display: flex;
  min-height: 100vh;
}

/* Hero Panel */
.hero-panel {
  display: none;
  position: relative;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  padding: 3rem;
  background: linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 75%, var(--gradient-end)) 100%);
  color: var(--surface);
}

@media (min-width: 1024px) {
  .hero-panel {
    display: flex;
    width: 46%;
  }
}

.hero-blur {
  position: absolute;
  width: 28rem;
  height: 28rem;
  border-radius: 9999px;
  filter: blur(80px);
  pointer-events: none;
}

.hero-blur--1 {
  top: -6rem;
  left: -6rem;
  background: color-mix(in srgb, var(--surface) 5%, transparent);
}

.hero-blur--2 {
  bottom: -6rem;
  right: -6rem;
  background: color-mix(in srgb, var(--gradient-end) 10%, transparent);
}

.hero-brand {
  position: relative;
  z-index: 10;
}

.hero-content {
  position: relative;
  z-index: 10;
}

.hero-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 2.5rem;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: 1rem;
}

.hero-subtitle {
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 2.5rem;
  color: color-mix(in srgb, var(--surface) 85%, var(--primary));
}

.hero-features {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.hero-feature {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: color-mix(in srgb, var(--surface) 85%, var(--primary));
}

.feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--surface) 15%, transparent);
}

.hero-footer {
  position: relative;
  z-index: 10;
  display: flex;
  gap: 1rem;
  border-top: 0.5px solid color-mix(in srgb, var(--surface) 10%, transparent);
  padding-top: 2rem;
}

.footer-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  flex-shrink: 0;
  border-radius: var(--r-lg);
  background: color-mix(in srgb, var(--surface) 15%, transparent);
  backdrop-filter: blur(8px);
}

.footer-text {
  flex: 1;
}

.footer-title {
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.3;
  margin: 0 0 0.5rem 0;
}

.footer-subtitle {
  font-size: 0.875rem;
  color: color-mix(in srgb, var(--surface) 75%, var(--primary));
  margin: 0;
}

/* Form Panel */
.form-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
  background: var(--bg);
}

@media (min-width: 640px) {
  .form-panel {
    padding: 4rem 2.5rem;
  }
}

.mobile-brand {
  display: flex;
  margin-bottom: 2.5rem;
}

@media (min-width: 1024px) {
  .mobile-brand {
    display: none;
  }
}

.form-container {
  width: 100%;
  max-width: 22rem;
}

/* Focus-visible global */
.auth-split :deep(a:focus-visible),
.auth-split :deep(button:focus-visible),
.auth-split :deep(input:focus-visible),
.auth-split :deep(select:focus-visible) {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
</style>
