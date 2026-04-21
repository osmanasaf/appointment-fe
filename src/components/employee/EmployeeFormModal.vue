<template>
  <AppModal
    :visible="visible"
    :title="modalTitle"
    :closable="true"
    :dialog-style="{ width: 'min(40rem, 95vw)' }"
    @update:visible="$emit('update:visible', $event)"
  >
    <!-- Tab navigation -->
    <div class="tab-nav">
      <button
        v-for="tab in visibleTabs"
        :key="tab.key"
        type="button"
        class="tab-button"
        :class="{ 'tab-button--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab content -->
    <div class="min-h-60">
      <EmployeeProfileTab
        v-if="activeTab === 'profile'"
        :key="employee?.id ?? 'new'"
        :employee="employee"
        :business-id="businessId"
        :is-create="isCreate"
        @saved="onProfileSaved"
      />
      <EmployeeScheduleTab
        v-else-if="activeTab === 'schedule' && employee"
        :key="employee.id"
        :employee-id="employee.id"
      />
      <EmployeeCapabilitiesTab
        v-else-if="activeTab === 'capabilities' && employee"
        :key="employee.id"
        :employee-id="employee.id"
        :business-id="businessId"
      />
      <EmployeeLeaveTab
        v-else-if="activeTab === 'leaves' && employee"
        :key="employee.id"
        :employee-id="employee.id"
        :other-employees="otherEmployees"
      />
    </div>
    <template #footer>
      <AppButton variant="secondary" @click="$emit('update:visible', false)">
        {{ t('common.cancel') }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '../ui/AppButton.vue'
import AppModal from '../ui/AppModal.vue'
import EmployeeProfileTab from './tabs/EmployeeProfileTab.vue'
import EmployeeScheduleTab from './tabs/EmployeeScheduleTab.vue'
import EmployeeCapabilitiesTab from './tabs/EmployeeCapabilitiesTab.vue'
import EmployeeLeaveTab from './tabs/EmployeeLeaveTab.vue'
import type { EmployeeResponse } from '../../api/employee'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  employee?: EmployeeResponse
  businessId: number
  allEmployees?: EmployeeResponse[]
  initialTab?: TabKey
}>()

const emit = defineEmits<{
  'update:visible': [boolean]
  saved: [employee: EmployeeResponse]
}>()

const isCreate = computed(() => !props.employee)

const modalTitle = computed(() =>
  isCreate.value ? t('employees.modalCreateTitle') : props.employee?.name ?? t('employees.modalEditTitle'),
)

type TabKey = 'profile' | 'schedule' | 'capabilities' | 'leaves'

const ALL_TABS: { key: TabKey; labelKey: string }[] = [
  { key: 'profile', labelKey: 'employees.tabProfile' },
  { key: 'schedule', labelKey: 'employees.tabSchedule' },
  { key: 'capabilities', labelKey: 'employees.tabCapabilities' },
  { key: 'leaves', labelKey: 'employees.tabLeaves' },
]

const visibleTabs = computed(() => {
  const tabs = ALL_TABS.map((tab) => ({ ...tab, label: t(tab.labelKey) }))
  if (isCreate.value) return [tabs[0]]
  return tabs
})

const activeTab = ref<TabKey>(props.initialTab ?? 'profile')

watch(
  () => props.visible,
  (open) => {
    if (open) activeTab.value = props.initialTab ?? 'profile'
  },
)

const otherEmployees = computed(() =>
  (props.allEmployees ?? []).filter((e) => e.id !== props.employee?.id && e.status === 'ACTIVE'),
)

function onProfileSaved(emp: EmployeeResponse) {
  emit('saved', emp)
  if (isCreate.value) {
    emit('update:visible', false)
  }
}

</script>

<style scoped>
.tab-nav {
  display: flex;
  gap: 0.125rem;
  padding: 0.25rem;
  margin-bottom: 1.25rem;
  background: var(--surface-2);
  border-radius: var(--radius-lg);
}

.tab-button {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--ink-3);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-button:hover:not(.tab-button--active) {
  color: var(--ink-2);
  background: color-mix(in oklab, var(--surface-2) 50%, var(--surface));
}

.tab-button--active {
  background: var(--surface);
  color: var(--ink-1);
  font-weight: 600;
  box-shadow: var(--shadow-1);
}
</style>
