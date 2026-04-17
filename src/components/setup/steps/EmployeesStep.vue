<template>
  <SetupStepShell
    :step-index="stepIndex"
    :total-steps="totalSteps"
    :title="t('setup.steps.employees.title')"
    :description="t('setup.steps.employees.description')"
    :busy="false"
    :error-message="errorMessage"
    :next-disabled="!setup.employeesDone"
    @back="$emit('back')"
    @next="$emit('next')"
    @dismiss="$emit('dismiss')"
  >
    <div class="flex flex-col gap-5">
      <form
        class="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1.5fr_1fr_auto]"
        @submit.prevent="addEmployee"
      >
        <div class="space-y-1">
          <label for="emp-name" class="block text-xs font-medium text-slate-600">
            {{ t('setup.steps.employees.namePlaceholder') }}
          </label>
          <input
            id="emp-name"
            v-model="form.name"
            type="text"
            maxlength="100"
            required
            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div class="space-y-1">
          <label for="emp-title" class="block text-xs font-medium text-slate-600">
            {{ t('setup.steps.employees.titlePlaceholder') }}
          </label>
          <input
            id="emp-title"
            v-model="form.title"
            type="text"
            maxlength="120"
            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div class="flex items-end">
          <AppButton native-type="submit" variant="primary" :loading="adding" :disabled="!canAdd">
            <Plus class="size-4" aria-hidden="true" />
            {{ t('setup.steps.employees.addCta') }}
          </AppButton>
        </div>
        <p v-if="formError" class="col-span-full text-xs text-red-600" role="alert">{{ formError }}</p>
      </form>

      <div class="flex flex-wrap items-center gap-2">
        <button
          v-if="canAddSelf"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          :disabled="adding"
          @click="addSelf"
        >
          <UserPlus class="size-3.5" aria-hidden="true" />
          {{ t('setup.steps.employees.addSelfCta') }}
        </button>
      </div>

      <div v-if="setup.employees.length === 0" class="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        {{ t('setup.steps.employees.empty') }}
      </div>

      <ul v-else class="space-y-2">
        <li
          v-for="emp in setup.employees"
          :key="emp.id"
          class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
              {{ initials(emp.name) }}
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-slate-900">{{ emp.name }}</p>
              <p class="truncate text-xs text-slate-500">
                {{ emp.title ?? '—' }}
                <span v-if="emp.owner" class="ml-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                  {{ t('employees.owner') }}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            class="text-xs font-semibold text-red-500 hover:text-red-700"
            :disabled="busyId === emp.id"
            @click="confirmRemove(emp.id, emp.name)"
          >
            {{ t('setup.steps.employees.remove') }}
          </button>
        </li>
      </ul>

      <p
        v-if="!setup.employeesDone && setup.employees.length === 0"
        class="text-xs text-amber-600"
        role="status"
      >
        {{ t('setup.steps.employees.needAtLeastOne') }}
      </p>
    </div>
  </SetupStepShell>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, UserPlus } from 'lucide-vue-next'
import SetupStepShell from '@/components/setup/SetupStepShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useSetupStore } from '@/stores/setup'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { employeeApi, type CreateEmployeeRequest } from '@/api/employee'

defineProps<{ stepIndex: number; totalSteps: number; isFinal?: boolean }>()

const emit = defineEmits<{
  next: []
  back: []
  dismiss: []
}>()

const { t } = useI18n()
const setup = useSetupStore()
const auth = useAuthStore()
const toast = useToast()

const adding = ref(false)
const busyId = ref<number | null>(null)
const formError = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

const form = reactive<{ name: string; title: string }>({
  name: '',
  title: '',
})

const canAdd = computed(() => form.name.trim().length >= 2)

const canAddSelf = computed(() => {
  const userName = auth.user?.name?.trim()
  if (!userName) return false
  return !setup.employees.some((e) => e.name.trim().toLowerCase() === userName.toLowerCase())
})

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || '?'
}

async function persistAdd(payload: CreateEmployeeRequest) {
  const { data } = await employeeApi.create(payload)
  if (data.success && data.data) {
    setup.setEmployees([data.data, ...setup.employees])
    setup.setCapabilities(data.data.id, [])
    toast.success(t('setup.steps.assignments.savedShort'))
    return true
  }
  formError.value = data.error?.message ?? t('common.error')
  return false
}

async function addEmployee() {
  formError.value = null
  if (!canAdd.value) {
    formError.value = t('setup.steps.employees.validation')
    return
  }
  adding.value = true
  try {
    const ok = await persistAdd({
      name: form.name.trim(),
      title: form.title.trim() || undefined,
    })
    if (ok) {
      form.name = ''
      form.title = ''
    }
  } catch (e) {
    formError.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    adding.value = false
  }
}

async function addSelf() {
  formError.value = null
  const userName = auth.user?.name?.trim()
  if (!userName) return
  adding.value = true
  try {
    await persistAdd({
      name: userName,
      email: auth.user?.email ?? undefined,
      owner: true,
    })
  } catch (e) {
    formError.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    adding.value = false
  }
}

async function confirmRemove(id: number, name: string) {
  const ok = window.confirm(t('setup.steps.employees.removeConfirm', { name }))
  if (!ok) return
  busyId.value = id
  try {
    await employeeApi.delete(id)
    setup.setEmployees(setup.employees.filter((e) => e.id !== id))
    setup.setCapabilities(id, [])
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    busyId.value = null
  }
}
</script>
