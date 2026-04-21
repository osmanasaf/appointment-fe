<template>
  <div class="employees-page space-y-6 p-4 sm:p-6">
    <SectionHeader :title="t('pageTitles.employees')" :subtitle="t('employees.lead')">
      <template #actions>
        <AppButton
          v-if="businessId && !loading && !listError"
          variant="secondary"
          @click="inviteListModalVisible = true"
        >
          {{ t('employees.viewInvites') }}
        </AppButton>
        <AppButton
          v-if="businessId && !loading && !listError"
          variant="primary"
          @click="openCreate"
        >
          {{ t('employees.add') }}
        </AppButton>
      </template>
    </SectionHeader>

    <div
      v-if="!businessId"
      class="card p-8 text-center text-sm"
      :style="{ color: 'var(--ink-3)' }"
    >
      {{ t('employees.noBusiness') }}
    </div>

    <template v-else>
      <!-- Filters -->
      <div v-if="!loading && !listError && employees.length > 0" class="flex flex-wrap items-center gap-3">
        <input
          v-model="search"
          type="search"
          class="employees-search w-full px-3 py-2 text-sm sm:w-64"
          style="border: 1px solid var(--hairline); border-radius: var(--r-md); background: var(--surface); color: var(--ink-1)"
          :placeholder="t('employees.searchPlaceholder')"
        />
        <div class="flex flex-wrap gap-2">
          <FilterChip
            v-for="opt in STATUS_FILTER_OPTIONS"
            :key="opt.value"
            :label="t(opt.labelKey)"
            :active="statusFilter === opt.value"
            @click="statusFilter = opt.value"
          />
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="i in 6"
          :key="i"
          class="h-48 animate-pulse rounded-xl"
          style="background: var(--surface-2)"
        />
      </div>

      <!-- Error -->
      <div
        v-else-if="listError"
        class="card flex flex-col items-center p-6 text-center"
        role="alert"
        :style="{ background: 'var(--danger-tint)', borderColor: 'var(--danger)', color: 'var(--danger)' }"
      >
        <p class="text-sm">{{ listError }}</p>
        <AppButton variant="secondary" size="sm" class="mt-3" @click="loadList">{{ t('common.retry') }}</AppButton>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="employees.length === 0"
        class="card flex flex-col items-center py-16 text-center"
      >
        <div
          class="mb-4 flex size-16 items-center justify-center rounded-full text-3xl"
          style="background: var(--surface-2)"
        >
          👥
        </div>
        <p class="font-semibold" :style="{ color: 'var(--ink-2)' }">{{ t('employees.emptyTitle') }}</p>
        <p class="mt-1 text-sm" :style="{ color: 'var(--ink-3)' }">{{ t('employees.emptyDesc') }}</p>
        <AppButton variant="primary" size="sm" class="mt-4" @click="openCreate">{{ t('employees.add') }}</AppButton>
      </div>

      <!-- Filter empty -->
      <div
        v-else-if="filteredEmployees.length === 0"
        class="py-10 text-center text-sm"
        :style="{ color: 'var(--ink-4)' }"
      >
        {{ t('employees.noFilterResults') }}
      </div>

      <!-- Card grid -->
      <div v-else class="grid gap-4 sm:grid-cols-2">
        <EmployeeCard
          v-for="emp in filteredEmployees"
          :key="emp.id"
          :employee="emp"
          :capabilities="capabilitiesMap.get(emp.id) ?? []"
          :status-loading="statusLoadingId === emp.id"
          @edit="openEdit"
          @send-invite="openSendInvite"
          @add-leave="openLeaveTab"
          @activate="activate"
          @deactivate="deactivate"
          @offboard="openOffboard"
          @delete="confirmDelete"
        />
      </div>
    </template>

    <!-- Employee Form Modal (create / edit) -->
    <EmployeeFormModal
      v-model:visible="formModalVisible"
      :employee="editingEmployee ?? undefined"
      :business-id="businessId ?? 0"
      :all-employees="employees"
      :initial-tab="formModalInitialTab"
      @saved="onEmployeeSaved"
    />

    <!-- Send Invite Modal -->
    <SendInviteModal
      v-model:visible="inviteModalVisible"
      :employee="inviteEmployee"
      @invited="onInviteSent"
    />

    <!-- Invite List Modal -->
    <InviteListModal
      v-model:visible="inviteListModalVisible"
      :employees="employees"
    />

    <!-- Delete confirm -->
    <AppModal
      v-model:visible="deleteModalVisible"
      :title="t('employees.deleteTitle')"
    >
      <p class="text-sm" :style="{ color: 'var(--ink-2)' }">
        {{ t('employees.deleteConfirm', { name: toDelete?.name ?? '' }) }}
      </p>
      <template #footer>
        <AppButton variant="secondary" @click="deleteModalVisible = false">{{ t('common.cancel') }}</AppButton>
        <AppButton variant="danger" :loading="deleting" @click="doDelete">{{ t('employees.delete') }}</AppButton>
      </template>
    </AppModal>

    <!-- Offboard Modal -->
    <AppModal
      v-model:visible="offboardModalVisible"
      :title="t('employees.offboardTitle', { name: offboardEmployee?.name ?? '' })"
      :dialog-style="{ width: 'min(36rem, 95vw)' }"
    >
      <div class="space-y-4">
        <div
          v-if="offboardLoading"
          class="py-6 text-center text-sm"
          :style="{ color: 'var(--ink-4)' }"
        >
          {{ t('common.loading') }}
        </div>
        <template v-else>
          <p
            v-if="affectedAppointments.length === 0"
            class="text-sm"
            :style="{ color: 'var(--ink-3)' }"
          >
            {{ t('employees.offboardNone') }}
          </p>
          <template v-else>
            <p class="text-sm" :style="{ color: 'var(--ink-2)' }">
              {{ t('employees.offboardIntro', { count: affectedAppointments.length }) }}
            </p>
            <ul
              class="divide-y divide-[color:var(--hairline)] rounded-xl border text-sm"
              :style="{ borderColor: 'var(--hairline)', color: 'var(--ink-2)' }"
            >
              <li
                v-for="a in affectedAppointments"
                :key="a.id"
                class="px-3 py-2"
              >
                {{ formatApptLine(a) }}
              </li>
            </ul>
            <div v-if="affectedAppointments.length" class="space-y-2">
              <p class="text-sm font-medium" :style="{ color: 'var(--ink-2)' }">{{ t('employees.offboardAction') }}</p>
              <AppRadioRow v-model="offboardAction" name="offboard-action" option-value="CANCEL_ALL">
                {{ t('employees.cancelAll') }}
              </AppRadioRow>
              <AppRadioRow v-model="offboardAction" name="offboard-action" option-value="REASSIGN_ALL">
                {{ t('employees.reassignAll') }}
              </AppRadioRow>
              <div v-if="offboardAction === 'REASSIGN_ALL'" class="space-y-1">
                <label class="block text-sm font-medium" :style="{ color: 'var(--ink-2)' }">{{ t('employees.selectEmployee') }}</label>
                <select v-model.number="offboardNewEmployeeId" class="app-select w-full">
                  <option :value="0">{{ t('employees.selectEmployee') }}</option>
                  <option v-for="o in offboardTargetOptions" :key="o.id" :value="o.id">{{ o.name }}</option>
                </select>
              </div>
            </div>
          </template>
          <p v-if="offboardError" class="text-sm" role="alert" :style="{ color: 'var(--danger)' }">{{ offboardError }}</p>
        </template>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="offboardModalVisible = false">{{ t('common.cancel') }}</AppButton>
        <AppButton
          v-if="affectedAppointments.length"
          variant="danger"
          :loading="offboardSubmitting"
          :disabled="offboardAction === 'REASSIGN_ALL' && !offboardNewEmployeeId"
          @click="submitOffboard"
        >
          {{ t('employees.confirmOffboard') }}
        </AppButton>
        <AppButton
          v-else
          :loading="offboardSubmitting"
          @click="deactivateOnlyOffboard"
        >
          {{ t('employees.deactivate') }}
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { fetchAllPageContent } from '@/api/client'
import { employeeApi, type AffectedAppointmentResponse, type EmployeeCapabilityResponse, type EmployeeResponse } from '@/api/employee'
import AppButton from '@/components/ui/AppButton.vue'
import FilterChip from '@/components/ui/FilterChip.vue'
import AppModal from '@/components/ui/AppModal.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import AppRadioRow from '@/components/ui/AppRadioRow.vue'
import EmployeeCard from '@/components/employee/EmployeeCard.vue'
import EmployeeFormModal from '@/components/employee/EmployeeFormModal.vue'
import SendInviteModal from '@/components/employee/SendInviteModal.vue'
import InviteListModal from '@/components/employee/InviteListModal.vue'

const { t } = useI18n()
const auth = useAuthStore()
const businessId = computed(() => auth.user?.businessId ?? null)

// ── Filter ──────────────────────────────────────────────────────────────────
const STATUS_FILTER_OPTIONS = [
  { value: 'all', labelKey: 'common.all' },
  { value: 'ACTIVE', labelKey: 'employees.active' },
  { value: 'INACTIVE', labelKey: 'employees.inactive' },
  { value: 'ON_LEAVE', labelKey: 'employees.onLeave' },
]

const search = ref('')
const statusFilter = ref('all')

const filteredEmployees = computed(() => {
  let list = employees.value
  if (statusFilter.value !== 'all') list = list.filter((e) => e.status === statusFilter.value)
  const q = search.value.toLowerCase().trim()
  if (q) list = list.filter((e) => e.name.toLowerCase().includes(q) || e.title?.toLowerCase().includes(q))
  return list
})

// ── Data ────────────────────────────────────────────────────────────────────
const employees = ref<EmployeeResponse[]>([])
const capabilitiesMap = ref<Map<number, EmployeeCapabilityResponse[]>>(new Map())
const loading = ref(true)
const listError = ref('')
const statusLoadingId = ref<number | null>(null)

onMounted(loadList)

async function loadList() {
  if (!businessId.value) return
  loading.value = true
  listError.value = ''
  try {
    employees.value = await fetchAllPageContent((page, size) =>
      employeeApi.list({ page, size }),
    )
    await loadAllCapabilities()
  } catch {
    listError.value = t('employees.loadError')
  } finally {
    loading.value = false
  }
}

async function loadAllCapabilities() {
  const results = await Promise.allSettled(
    employees.value.map((e) => employeeApi.getCapabilities(e.id)),
  )
  const map = new Map<number, EmployeeCapabilityResponse[]>()
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') map.set(employees.value[i].id, r.value.data.data ?? [])
  })
  capabilitiesMap.value = map
}

// ── Create / Edit ────────────────────────────────────────────────────────────
const formModalVisible = ref(false)
const editingEmployee = ref<EmployeeResponse | null>(null)
const formModalInitialTab = ref<'profile' | 'leaves'>('profile')

function openCreate() {
  editingEmployee.value = null
  formModalInitialTab.value = 'profile'
  formModalVisible.value = true
}

function openEdit(emp: EmployeeResponse) {
  editingEmployee.value = emp
  formModalInitialTab.value = 'profile'
  formModalVisible.value = true
}

function openLeaveTab(emp: EmployeeResponse) {
  editingEmployee.value = emp
  formModalInitialTab.value = 'leaves'
  formModalVisible.value = true
}

function onEmployeeSaved(emp: EmployeeResponse) {
  const idx = employees.value.findIndex((e) => e.id === emp.id)
  if (idx !== -1) employees.value[idx] = emp
  else employees.value.unshift(emp)
}

// ── Send Invite ───────────────────────────────────────────────────────────────
const inviteModalVisible = ref(false)
const inviteEmployee = ref<EmployeeResponse | null>(null)
const inviteListModalVisible = ref(false)

function openSendInvite(emp: EmployeeResponse) {
  inviteEmployee.value = emp
  inviteModalVisible.value = true
}

function onInviteSent() {
  // Başarılı davet gönderimi
  inviteModalVisible.value = false
}

// ── Activate / Deactivate ────────────────────────────────────────────────────
async function activate(id: number) {
  statusLoadingId.value = id
  try {
    const res = await employeeApi.activate(id)
    const updated = res.data.data
    if (updated) {
      const idx = employees.value.findIndex((e) => e.id === id)
      if (idx !== -1) employees.value[idx] = updated
    }
  } finally {
    statusLoadingId.value = null
  }
}

async function deactivate(id: number) {
  statusLoadingId.value = id
  try {
    const res = await employeeApi.deactivate(id)
    const updated = res.data.data
    if (updated) {
      const idx = employees.value.findIndex((e) => e.id === id)
      if (idx !== -1) employees.value[idx] = updated
    }
  } finally {
    statusLoadingId.value = null
  }
}

// ── Delete ───────────────────────────────────────────────────────────────────
const deleteModalVisible = ref(false)
const toDelete = ref<EmployeeResponse | null>(null)
const deleting = ref(false)

function confirmDelete(emp: EmployeeResponse) {
  toDelete.value = emp
  deleteModalVisible.value = true
}

async function doDelete() {
  if (!toDelete.value) return
  deleting.value = true
  try {
    await employeeApi.delete(toDelete.value.id)
    employees.value = employees.value.filter((e) => e.id !== toDelete.value!.id)
    deleteModalVisible.value = false
  } finally {
    deleting.value = false
  }
}

// ── Offboard ─────────────────────────────────────────────────────────────────
const offboardModalVisible = ref(false)
const offboardEmployee = ref<EmployeeResponse | null>(null)
const offboardLoading = ref(false)
const affectedAppointments = ref<AffectedAppointmentResponse[]>([])
const offboardAction = ref<'CANCEL_ALL' | 'REASSIGN_ALL'>('CANCEL_ALL')
const offboardNewEmployeeId = ref(0)
const offboardSubmitting = ref(false)
const offboardError = ref('')

const offboardTargetOptions = computed(() =>
  employees.value.filter((e) => e.id !== offboardEmployee.value?.id && e.status === 'ACTIVE'),
)

async function openOffboard(emp: EmployeeResponse) {
  offboardEmployee.value = emp
  offboardAction.value = 'CANCEL_ALL'
  offboardNewEmployeeId.value = 0
  offboardError.value = ''
  offboardModalVisible.value = true
  offboardLoading.value = true
  try {
    const res = await employeeApi.offboardPreview(emp.id)
    affectedAppointments.value = res.data.data ?? []
  } finally {
    offboardLoading.value = false
  }
}

async function submitOffboard() {
  if (!offboardEmployee.value) return
  offboardSubmitting.value = true
  offboardError.value = ''
  try {
    await employeeApi.offboard(offboardEmployee.value.id, {
      action: offboardAction.value,
      newEmployeeId: offboardAction.value === 'REASSIGN_ALL' ? offboardNewEmployeeId.value : undefined,
    })
    await loadList()
    offboardModalVisible.value = false
  } catch {
    offboardError.value = t('common.error')
  } finally {
    offboardSubmitting.value = false
  }
}

async function deactivateOnlyOffboard() {
  if (!offboardEmployee.value) return
  offboardSubmitting.value = true
  try {
    await employeeApi.deactivate(offboardEmployee.value.id)
    await loadList()
    offboardModalVisible.value = false
  } finally {
    offboardSubmitting.value = false
  }
}

function formatApptLine(a: AffectedAppointmentResponse) {
  const d = new Date(a.scheduledAt)
  return d.toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })
}
</script>

<style scoped>
.employees-search::placeholder {
  color: var(--ink-4);
}

.employees-search:focus {
  outline: none;
}

.employees-search:focus-visible {
  box-shadow: 0 0 0 2px var(--primary-tint);
  border-color: var(--primary);
}
</style>

