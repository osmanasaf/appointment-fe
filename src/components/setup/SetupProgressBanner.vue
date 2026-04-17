<template>
  <section
    v-if="visible"
    class="setup-banner"
    role="region"
    :aria-label="t('setup.banner.aria')"
  >
    <div class="setup-banner__icon" aria-hidden="true">
      <Sparkles class="size-5" />
    </div>
    <div class="setup-banner__body">
      <p class="setup-banner__title">{{ t('setup.banner.title') }}</p>
      <p class="setup-banner__desc">
        {{
          t('setup.banner.desc', {
            current: setup.completedCount,
            total: setup.totalCount,
          })
        }}
      </p>
      <div
        class="setup-banner__bar"
        :aria-valuenow="setup.progressPercent"
        aria-valuemin="0"
        aria-valuemax="100"
        role="progressbar"
      >
        <div class="setup-banner__bar-fill" :style="{ width: `${setup.progressPercent}%` }" />
      </div>
    </div>
    <div class="setup-banner__actions">
      <router-link
        :to="{ name: 'AdminSetup' }"
        class="setup-banner__cta"
      >
        {{ t('setup.banner.continue') }}
      </router-link>
      <button
        type="button"
        class="setup-banner__dismiss"
        :aria-label="t('setup.banner.dismiss')"
        @click="dismiss"
      >
        <X class="size-4" aria-hidden="true" />
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Sparkles, X } from 'lucide-vue-next'
import { useSetupStore } from '@/stores/setup'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const setup = useSetupStore()
const auth = useAuthStore()

const visible = computed(
  () =>
    auth.isBusinessOwner &&
    setup.loaded &&
    !setup.isComplete,
)

function dismiss() {
  setup.markDismissed()
}

onMounted(() => {
  void setup.ensureLoaded()
})
</script>

<style scoped>
.setup-banner {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, rgb(99 102 241), rgb(79 70 229));
  color: white;
  border-radius: 1rem;
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.18);
}

.setup-banner__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.625rem;
  background-color: rgba(255, 255, 255, 0.16);
  flex-shrink: 0;
}

.setup-banner__body {
  flex: 1;
  min-width: 0;
}

.setup-banner__title {
  margin: 0;
  font-weight: 700;
  font-size: 0.9375rem;
  line-height: 1.2;
}

.setup-banner__desc {
  margin: 0.25rem 0 0.625rem;
  font-size: 0.8125rem;
  opacity: 0.9;
}

.setup-banner__bar {
  width: 100%;
  height: 0.4375rem;
  background-color: rgba(255, 255, 255, 0.22);
  border-radius: 9999px;
  overflow: hidden;
}

.setup-banner__bar-fill {
  height: 100%;
  background-color: white;
  border-radius: 9999px;
  transition: width 0.4s ease;
}

.setup-banner__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.setup-banner__cta {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.875rem;
  background-color: white;
  color: rgb(79 70 229);
  font-weight: 600;
  font-size: 0.8125rem;
  border-radius: 0.625rem;
  text-decoration: none;
  transition: background-color 0.15s, transform 0.15s;
}

.setup-banner__cta:hover {
  background-color: rgb(241 245 249);
}

.setup-banner__cta:focus-visible {
  outline: 2px solid white;
  outline-offset: 2px;
}

.setup-banner__dismiss {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background-color: transparent;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.setup-banner__dismiss:hover {
  background-color: rgba(255, 255, 255, 0.16);
}

.setup-banner__dismiss:focus-visible {
  outline: 2px solid white;
  outline-offset: 2px;
}

@media (max-width: 639px) {
  .setup-banner {
    flex-wrap: wrap;
    padding: 0.875rem 1rem;
  }
  .setup-banner__actions {
    width: 100%;
    justify-content: space-between;
    margin-top: 0.5rem;
  }
}
</style>
