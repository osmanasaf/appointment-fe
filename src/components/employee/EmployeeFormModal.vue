<template>
  <AppModal
    :visible="visible"
    :title="modalTitle"
    :dialog-style="{ width: 'min(40rem, 95vw)' }"
    @update:visible="$emit('update:visible', $event)"
  >
    <!-- Tab navigation -->
    <div class="mb-5 flex gap-0.5 rounded-lg bg-slate-100 p-1">
      <button
        v-for="tab in visibleTabs"
        :key="tab.key"
        type="button"
        class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition"
        :class="activeTab === tab.key
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-500 hover:text-slate-700'"
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
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
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
