<template>
  <SetupStepShell
    :step-index="stepIndex"
    :total-steps="totalSteps"
    :title="t('setup.steps.assignments.title')"
    :description="t('setup.steps.assignments.description')"
    :busy="false"
    :error-message="errorMessage"
    :next-disabled="!setup.assignmentsDone"
    @back="$emit('back')"
    @next="$emit('next')"
    @dismiss="$emit('dismiss')"
  >
    <div class="flex flex-col gap-4">
      <div v-if="setup.services.length === 0" class="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-6 text-center text-sm text-amber-700">
        {{ t('setup.steps.assignments.noServices') }}
      </div>
      <div v-else-if="setup.employees.length === 0" class="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-6 text-center text-sm text-amber-700">
        {{ t('setup.steps.assignments.noEmployees') }}
      </div>

      <template v-else>
        <p class="text-xs text-slate-500">{{ t('setup.steps.assignments.matrixHint') }}</p>

        <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table class="min-w-full text-sm">
            <thead class="bg-slate-50">
              <tr>
                <th
                  scope="col"
                  class="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {{ t('setup.steps.employees.label') }}
                </th>
                <th
                  v-for="svc in activeServices"
                  :key="svc.id"
                  scope="col"
                  class="px-3 py-3 text-center text-xs font-semibold text-slate-600"
                >
                  <div class="flex flex-col items-center">
                    <span class="truncate max-w-[8rem]">{{ svc.name }}</span>
                    <span class="text-[10px] font-normal text-slate-400">
                      {{ svc.durationMinutes }} {{ t('setup.steps.services.minutesUnit') }}
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="emp in setup.employees" :key="emp.id">
                <th
                  scope="row"
                  class="sticky left-0 z-10 bg-white px-4 py-3 text-left text-sm font-medium text-slate-900"
                >
                  <div class="flex items-center gap-2">
                    <span class="inline-flex size-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                      {{ initials(emp.name) }}
                    </span>
                    <span class="truncate max-w-[10rem]">{{ emp.name }}</span>
                  </div>
                </th>
                <td
                  v-for="svc in activeServices"
                  :key="svc.id"
                  class="px-3 py-3 text-center"
                >
                  <button
                    type="button"
                    class="inline-flex size-9 items-center justify-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                    :class="cellClass(emp.id, svc.id)"
                    :disabled="isBusy(emp.id, svc.id)"
                    :aria-pressed="isAssigned(emp.id, svc.id)"
                    :aria-label="cellLabel(emp.name, svc.name, isAssigned(emp.id, svc.id))"
                    @click="toggle(emp.id, svc.id)"
                  >
                    <Loader2 v-if="isBusy(emp.id, svc.id)" class="size-4 animate-spin" aria-hidden="true" />
                    <Check v-else-if="isAssigned(emp.id, svc.id)" class="size-4" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span class="font-medium text-slate-700">
            {{ t('setup.steps.assignments.totalLabel', { count: setup.totalAssignments }) }}
          </span>
          <span
            v-if="employeesWithoutAssignment > 0"
            class="rounded-full bg-amber-50 px-2 py-1 text-amber-700"
          >
            {{ t('setup.steps.assignments.warningEmployeeWithoutService', { count: employeesWithoutAssignment }) }}
          </span>
          <span v-if="!setup.assignmentsDone" class="text-amber-600">
            {{ t('setup.steps.assignments.needAtLeastOne') }}
          </span>
        </div>
      </template>
    </div>
  </SetupStepShell>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, Loader2 } from 'lucide-vue-next'
import SetupStepShell from '@/components/setup/SetupStepShell.vue'
import { useSetupStore } from '@/stores/setup'
import { useToast } from '@/composables/useToast'
import { employeeApi, type EmployeeCapabilityResponse } from '@/api/employee'

defineProps<{ stepIndex: number; totalSteps: number; isFinal?: boolean }>()

defineEmits<{
  next: []
  back: []
  dismiss: []
}>()

const { t } = useI18n()
const setup = useSetupStore()
const toast = useToast()

const errorMessage = ref<string | null>(null)
const busyKeys = reactive<Record<string, boolean>>({})

const activeServices = computed(() => setup.activeServices)

const employeesWithoutAssignment = computed(() => {
  let count = 0
  for (const emp of setup.employees) {
    const caps = setup.capabilitiesByEmployee.get(emp.id) ?? []
    const has = caps.some((c) => c.active)
    if (!has) count += 1
  }
  return count
})

function cellKey(empId: number, svcId: number) {
  return `${empId}:${svcId}`
}

function isBusy(empId: number, svcId: number) {
  return Boolean(busyKeys[cellKey(empId, svcId)])
}

function isAssigned(empId: number, svcId: number): boolean {
  const caps = setup.capabilitiesByEmployee.get(empId) ?? []
  return caps.some((c) => c.serviceId === svcId && c.active)
}

function cellClass(empId: number, svcId: number): string {
  if (isAssigned(empId, svcId)) {
    return 'border-indigo-500 bg-indigo-500 text-white shadow-sm hover:bg-indigo-600'
  }
  return 'border-slate-200 bg-white text-slate-400 hover:border-indigo-300 hover:bg-indigo-50'
}

function cellLabel(empName: string, svcName: string, assigned: boolean): string {
  return assigned
    ? `${empName} → ${svcName}: ✓`
    : `${empName} → ${svcName}`
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || '?'
}

async function toggle(empId: number, svcId: number) {
  const key = cellKey(empId, svcId)
  if (busyKeys[key]) return
  busyKeys[key] = true
  errorMessage.value = null
  const wasAssigned = isAssigned(empId, svcId)
  const previous = setup.capabilitiesByEmployee.get(empId) ?? []
  try {
    if (wasAssigned) {
      await employeeApi.removeCapability(empId, svcId)
      const next = previous.filter((c) => !(c.serviceId === svcId))
      setup.setCapabilities(empId, next)
    } else {
      const { data } = await employeeApi.assignCapability(empId, { serviceId: svcId })
      if (data.success && data.data) {
        const updated: EmployeeCapabilityResponse = data.data
        const filtered = previous.filter((c) => c.serviceId !== svcId)
        setup.setCapabilities(empId, [...filtered, updated])
      } else {
        errorMessage.value = data.error?.message ?? t('setup.steps.assignments.saveFailed')
      }
    }
    toast.success(t('setup.steps.assignments.savedShort'))
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('setup.steps.assignments.saveFailed')
  } finally {
    delete busyKeys[key]
  }
}
</script>
