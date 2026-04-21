<template>
  <AppModal v-model="isOpen" :title="t('upgrade.modalTitle')" size="lg">
    <div class="upgrade-content">
      <div class="upgrade-icon">
        <TrendingUp />
      </div>
      <p class="upgrade-message">{{ message }}</p>
      <p class="upgrade-hint">{{ t('upgrade.modalHint') }}</p>
      
      <div class="upgrade-actions">
        <AppButton variant="secondary" @click="isOpen = false">
          {{ t('common.cancel') }}
        </AppButton>
        <AppButton @click="navigateToPlans">
          {{ t('upgrade.viewPlans') }}
        </AppButton>
      </div>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { TrendingUp } from 'lucide-vue-next'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{
  message: string
}>()

const model = defineModel<boolean>({ required: true })

const { t } = useI18n()
const router = useRouter()

const isOpen = computed({
  get: () => model.value,
  set: (val) => (model.value = val),
})

function navigateToPlans() {
  isOpen.value = false
  router.push('/admin/plan-settings')
}
</script>

<style scoped>
.upgrade-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem;
  text-align: center;
}

.upgrade-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: var(--color-primary-bg, #eff6ff);
  color: var(--color-primary, #3b82f6);
}

.upgrade-icon svg {
  width: 2rem;
  height: 2rem;
}

.upgrade-message {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-primary, #111827);
}

.upgrade-hint {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary, #6b7280);
}

.upgrade-actions {
  display: flex;
  gap: 0.75rem;
  width: 100%;
  justify-content: center;
  margin-top: 0.5rem;
}
</style>
