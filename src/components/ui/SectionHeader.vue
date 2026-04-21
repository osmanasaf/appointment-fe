<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
  as?: 'h2' | 'h3' | 'h4'
}

const props = withDefaults(defineProps<Props>(), {
  as: 'h2'
})
</script>

<template>
  <div class="section-header">
    <div class="section-header__content">
      <component :is="as" class="section-header__title display-sm">
        {{ title }}
      </component>

      <p v-if="subtitle" class="section-header__subtitle">{{ subtitle }}</p>
    </div>

    <div v-if="$slots.actions" class="section-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
}

.section-header__content {
  flex: 1;
  min-width: 0;
}

.section-header__title {
  margin: 0;
  color: var(--ink-1);
}

.section-header__subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-3);
}

.section-header__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* Mobile responsive: stack on small screens */
@media (max-width: 640px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-header__actions {
    width: 100%;
  }
}
</style>
