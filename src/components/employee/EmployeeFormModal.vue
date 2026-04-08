<template>
  <AppModal
    :visible="visible"
    :title="isCreate ? t('employees.modalCreateTitle') : employee?.name ?? t('employees.modalEditTitle')"
    :style="{ width: 'min(40rem, 95vw)' }"
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
        :employee="employee"
        :business-id="businessId"
        :is-create="isCreate"
        @saved="onProfileSaved"
      />
      <EmployeeScheduleTab
        v-else-if="activeTab === 'schedule' && employee"
        :employee-id="employee.id"
      />
      <EmployeeCapabilitiesTab
        v-else-if="activeTab === 'capabilities' && employee"
        :employee-id="employee.id"
        :business-id="businessId"
      />
      <EmployeeLeaveTab
        v-else-if="activeTab === 'leaves' && employee"
        :employee-id="employee.id"
        @show-conflicts="onShowConflicts"
      />
    </div>

    <!-- Leave conflict modal -->
    <LeaveConflictModal
      v-if="employee"
      v-model:visible="conflictModalVisible"
      :preview="conflictPreview"
      :other-employees="otherEmployees"
      @resolve="onResolveConflict"
    />
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
import LeaveConflictModal from './LeaveConflictModal.vue'
import { useEmployeeLeave } from '../../composables/useEmployeeLeave'
import type { EmployeeResponse, LeaveConflictAction, LeaveConflictPreviewResponse } from '../../api/employee'

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

type TabKey = 'profile' | 'schedule' | 'capabilities' | 'leaves'

const ALL_TABS: { key: TabKey; labelKey: string }[] = [
  { key: 'profile', labelKey: 'employees.tabProfile' },
  { key: 'schedule', labelKey: 'employees.tabSchedule' },
  { key: 'capabilities', labelKey: 'employees.tabCapabilities' },
  { key: 'leaves', labelKey: 'employees.tabLeaves' },
]

const visibleTabs = computed(() => {
  if (isCreate.value) return [ALL_TABS[0]]
  return ALL_TABS.map((tab) => ({ ...tab, label: t(tab.labelKey) }))
})

const activeTab = ref<TabKey>(props.initialTab ?? 'profile')

watch(
  () => props.visible,
  (open) => {
    if (open) activeTab.value = props.initialTab ?? 'profile'
  },
)

const conflictModalVisible = ref(false)
const conflictPreview = ref<LeaveConflictPreviewResponse | null>(null)

const otherEmployees = computed(() =>
  (props.allEmployees ?? []).filter((e) => e.id !== props.employee?.id && e.status === 'ACTIVE'),
)

const leaveComposable = computed(() =>
  props.employee ? useEmployeeLeave(props.employee.id) : null,
)

function onProfileSaved(emp: EmployeeResponse) {
  emit('saved', emp)
  if (isCreate.value) {
    emit('update:visible', false)
  }
}

function onShowConflicts(preview: LeaveConflictPreviewResponse) {
  conflictPreview.value = preview
  conflictModalVisible.value = true
}

async function onResolveConflict(action: LeaveConflictAction, newEmployeeId?: number) {
  if (!conflictPreview.value || !leaveComposable.value || !props.employee) return
  // The EmployeeLeaveTab has already composed the leave form; we resolve here
  // This emits up to parent which should call resolveAndCreate
  emit('update:visible', false)
}
</script>
