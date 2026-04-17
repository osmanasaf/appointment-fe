<template>
  <SetupStepShell
    :step-index="stepIndex"
    :total-steps="totalSteps"
    :title="t('setup.steps.hours.title')"
    :description="t('setup.steps.hours.description')"
    :busy="applyingPreset"
    :error-message="errorMessage"
    :next-disabled="!setup.hoursDone"
    @back="$emit('back')"
    @next="$emit('next')"
    @dismiss="$emit('dismiss')"
  >
    <div class="flex flex-col gap-5">
      <div v-if="setup.activeEmployees.length === 0" class="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-6 text-center text-sm text-amber-700">
        {{ t('setup.steps.hours.noActiveEmployees') }}
      </div>

      <template v-else>
        <section class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {{ t('setup.steps.hours.applyPresetCta') }}
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="preset in presets"
              :key="preset.id"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              :disabled="applyingPreset"
              @click="applyPresetToAll(preset)"
            >
              <Sparkles class="size-3.5" aria-hidden="true" />
              {{ preset.label }}
            </button>
          </div>
          <p class="mt-3 text-[11px] text-slate-500">{{ t('setup.steps.hours.skipNote') }}</p>
        </section>

        <section class="rounded-xl border border-slate-200 bg-white">
          <header class="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3">
            <label for="emp-select" class="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {{ t('setup.steps.hours.selectEmployee') }}
            </label>
            <select
              id="emp-select"
              v-model.number="selectedEmpId"
              class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option v-for="emp in setup.activeEmployees" :key="emp.id" :value="emp.id">
                {{ emp.name }}
              </option>
            </select>
            <span v-if="loadingSchedule" class="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <Loader2 class="size-3.5 animate-spin" aria-hidden="true" />
              {{ t('common.loading') }}
            </span>
          </header>

          <ul class="divide-y divide-slate-100">
            <li
              v-for="day in WEEK_DAYS"
              :key="day.key"
              class="grid grid-cols-[7rem_auto_1fr] items-center gap-3 px-4 py-3 sm:grid-cols-[9rem_auto_1fr_auto]"
            >
              <span class="text-sm font-medium text-slate-700">{{ day.label }}</span>
              <label class="inline-flex items-center gap-2 text-xs text-slate-600">
                <input
                  v-model="schedule[day.key].closed"
                  type="checkbox"
                  class="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                  @change="onClosedChange(day.key)"
                />
                {{ t('employees.closed') }}
              </label>
              <div
                class="flex items-center gap-2 text-xs"
                :class="{ 'opacity-40': schedule[day.key].closed }"
              >
                <input
                  v-model="schedule[day.key].startTime"
                  type="time"
                  step="900"
                  :disabled="schedule[day.key].closed"
                  class="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <span class="text-slate-400">—</span>
                <input
                  v-model="schedule[day.key].endTime"
                  type="time"
                  step="900"
                  :disabled="schedule[day.key].closed"
                  class="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <button
                type="button"
                class="justify-self-end text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-40 sm:justify-self-end"
                :disabled="savingDay === day.key || schedule[day.key].closed && wasInitiallyClosed[day.key]"
                @click="saveDay(day.key)"
              >
                <span v-if="savingDay === day.key" class="inline-flex items-center gap-1">
                  <Loader2 class="size-3 animate-spin" aria-hidden="true" />
                  {{ t('setup.steps.assignments.saving') }}
                </span>
                <span v-else>{{ t('common.save') }}</span>
              </button>
            </li>
          </ul>
        </section>
      </template>
    </div>
  </SetupStepShell>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Loader2, Sparkles } from 'lucide-vue-next'
import SetupStepShell from '@/components/setup/SetupStepShell.vue'
import { useSetupStore } from '@/stores/setup'
import { useToast } from '@/composables/useToast'
import { employeeApi, type DayOfWeek, type EmployeeScheduleRequest } from '@/api/employee'

defineProps<{ stepIndex: number; totalSteps: number; isFinal?: boolean }>()

defineEmits<{
  next: []
  back: []
  dismiss: []
}>()

const { t } = useI18n()
const setup = useSetupStore()
const toast = useToast()

interface DayEntry {
  startTime: string
  endTime: string
  closed: boolean
}

interface PresetDef {
  id: 'weekday' | 'sixDays' | 'everyDay'
  label: string
  open: DayOfWeek[]
  startTime: string
  endTime: string
}

const WEEK_DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'MONDAY', label: t('employees.days.MONDAY') },
  { key: 'TUESDAY', label: t('employees.days.TUESDAY') },
  { key: 'WEDNESDAY', label: t('employees.days.WEDNESDAY') },
  { key: 'THURSDAY', label: t('employees.days.THURSDAY') },
  { key: 'FRIDAY', label: t('employees.days.FRIDAY') },
  { key: 'SATURDAY', label: t('employees.days.SATURDAY') },
  { key: 'SUNDAY', label: t('employees.days.SUNDAY') },
]

const presets: PresetDef[] = [
  {
    id: 'weekday',
    label: t('setup.steps.hours.presetWeekday'),
    open: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    startTime: '09:00',
    endTime: '18:00',
  },
  {
    id: 'sixDays',
    label: t('setup.steps.hours.presetSixDays'),
    open: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
    startTime: '10:00',
    endTime: '19:00',
  },
  {
    id: 'everyDay',
    label: t('setup.steps.hours.presetEveryDay'),
    open: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
    startTime: '10:00',
    endTime: '20:00',
  },
]

function emptySchedule(): Record<DayOfWeek, DayEntry> {
  return WEEK_DAYS.reduce(
    (acc, d) => {
      acc[d.key] = { startTime: '09:00', endTime: '18:00', closed: true }
      return acc
    },
    {} as Record<DayOfWeek, DayEntry>,
  )
}

function emptyClosedFlags(): Record<DayOfWeek, boolean> {
  return WEEK_DAYS.reduce(
    (acc, d) => {
      acc[d.key] = true
      return acc
    },
    {} as Record<DayOfWeek, boolean>,
  )
}

const selectedEmpId = ref<number | null>(setup.activeEmployees[0]?.id ?? null)
const schedule = reactive<Record<DayOfWeek, DayEntry>>(emptySchedule())
const wasInitiallyClosed = reactive<Record<DayOfWeek, boolean>>(emptyClosedFlags())
const loadingSchedule = ref(false)
const savingDay = ref<DayOfWeek | null>(null)
const applyingPreset = ref(false)
const errorMessage = ref<string | null>(null)

function onClosedChange(key: DayOfWeek) {
  if (!schedule[key].closed && !schedule[key].startTime) {
    schedule[key].startTime = '09:00'
    schedule[key].endTime = '18:00'
  }
}

function shortTime(value: string | null): string {
  if (!value) return '09:00'
  return value.slice(0, 5)
}

async function loadScheduleFor(empId: number) {
  loadingSchedule.value = true
  errorMessage.value = null
  try {
    const { data } = await employeeApi.getSchedule(empId)
    const list = data.data ?? []
    for (const day of WEEK_DAYS) {
      const found = list.find((s) => s.dayOfWeek === day.key)
      if (found) {
        schedule[day.key] = {
          startTime: shortTime(found.startTime),
          endTime: shortTime(found.endTime),
          closed: found.closed,
        }
        wasInitiallyClosed[day.key] = found.closed
      } else {
        schedule[day.key] = { startTime: '09:00', endTime: '18:00', closed: true }
        wasInitiallyClosed[day.key] = true
      }
    }
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('setup.steps.hours.saveFailed')
  } finally {
    loadingSchedule.value = false
  }
}

async function saveDay(key: DayOfWeek) {
  if (!selectedEmpId.value) return
  savingDay.value = key
  errorMessage.value = null
  try {
    const entry = schedule[key]
    const payload: EmployeeScheduleRequest = entry.closed
      ? { dayOfWeek: key, closed: true }
      : {
          dayOfWeek: key,
          closed: false,
          startTime: entry.startTime,
          endTime: entry.endTime,
        }
    await employeeApi.setDaySchedule(selectedEmpId.value, payload)
    wasInitiallyClosed[key] = entry.closed
    toast.success(t('setup.steps.hours.savedShort'))
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('setup.steps.hours.saveFailed')
  } finally {
    savingDay.value = null
  }
}

async function applyPresetToAll(preset: PresetDef) {
  if (setup.activeEmployees.length === 0) return
  applyingPreset.value = true
  errorMessage.value = null
  try {
    const tasks: Promise<unknown>[] = []
    for (const emp of setup.activeEmployees) {
      for (const day of WEEK_DAYS) {
        const isOpen = preset.open.includes(day.key)
        const payload: EmployeeScheduleRequest = isOpen
          ? {
              dayOfWeek: day.key,
              closed: false,
              startTime: preset.startTime,
              endTime: preset.endTime,
            }
          : { dayOfWeek: day.key, closed: true }
        tasks.push(employeeApi.setDaySchedule(emp.id, payload))
      }
    }
    await Promise.all(tasks)
    if (selectedEmpId.value) await loadScheduleFor(selectedEmpId.value)
    toast.success(t('setup.steps.hours.savedShort'))
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('setup.steps.hours.saveFailed')
  } finally {
    applyingPreset.value = false
  }
}

watch(
  selectedEmpId,
  (id) => {
    if (id) void loadScheduleFor(id)
  },
  { immediate: true },
)
</script>
