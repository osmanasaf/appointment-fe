<script setup lang="ts">
interface Props {
  eyebrow?: string
  title?: string
  subtitle?: string
  tone?: 'teal' | 'violet' | 'sunset'
}

const props = withDefaults(defineProps<Props>(), {
  tone: 'teal'
})

// Brand renkleri (--primary #0D7A8F → --teal-700 #0E7490 → --teal-500 #14B8A6); --primary-pressed/700/500 değerleriyle eşleşir
const gradients = {
  teal: 'linear-gradient(135deg, #0D7A8F 0%, #155E75 60%, #14B8A6 120%)',
  violet: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 60%, #8B5CF6 120%)',
  sunset: 'linear-gradient(135deg, #DC2626 0%, #9A3412 60%, #F59E0B 120%)'
}
</script>

<template>
  <div class="hero-banner" :style="{ background: gradients[tone] }">
    <!-- Decorative background circles -->
    <div class="hero-banner__circle hero-banner__circle--top" aria-hidden="true" />
    <div class="hero-banner__circle hero-banner__circle--bottom" aria-hidden="true" />

    <div class="hero-banner__content">
      <div v-if="eyebrow" class="hero-banner__eyebrow">{{ eyebrow }}</div>

      <h2 v-if="title" class="hero-banner__title display-md">{{ title }}</h2>

      <p v-if="subtitle" class="hero-banner__subtitle">{{ subtitle }}</p>

      <div v-if="$slots.default" class="hero-banner__slot">
        <slot />
      </div>
    </div>

    <div v-if="$slots.actions" class="hero-banner__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.hero-banner {
  position: relative;
  overflow: hidden;
  min-height: 180px;
  padding: 22px;
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-pop);
  color: white;
}

.hero-banner__circle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.hero-banner__circle--top {
  top: -50px;
  right: -30px;
  width: 180px;
  height: 180px;
  background: rgba(255, 255, 255, 0.08);
}

.hero-banner__circle--bottom {
  bottom: -60px;
  right: 140px;
  width: 120px;
  height: 120px;
  background: rgba(255, 255, 255, 0.06);
}

.hero-banner__content {
  position: relative;
  z-index: 1;
}

.hero-banner__eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  opacity: 0.9;
  line-height: 1.3;
}

.hero-banner__title {
  margin-top: 10px;
  margin-bottom: 0;
  color: white;
  letter-spacing: -0.015em;
}

.hero-banner__subtitle {
  margin-top: 4px;
  margin-bottom: 0;
  font-size: 14.5px;
  line-height: 1.5;
  opacity: 0.85;
}

.hero-banner__slot {
  margin-top: 12px;
}

.hero-banner__actions {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

/* Mobile responsive adjustments */
@media (max-width: 640px) {
  .hero-banner {
    min-height: 160px;
    padding: 18px;
  }

  .hero-banner__title {
    font-size: 22px;
  }

  .hero-banner__subtitle {
    font-size: 13.5px;
  }

  .hero-banner__circle--top {
    width: 140px;
    height: 140px;
  }

  .hero-banner__circle--bottom {
    width: 100px;
    height: 100px;
    right: 100px;
  }
}
</style>
