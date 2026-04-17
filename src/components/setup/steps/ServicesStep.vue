<template>
  <SetupStepShell
    :step-index="stepIndex"
    :total-steps="totalSteps"
    :title="t('setup.steps.services.title')"
    :description="t('setup.steps.services.description')"
    :busy="saving"
    :error-message="errorMessage"
    :next-disabled="!setup.servicesDone"
    @back="$emit('back')"
    @next="$emit('next')"
    @dismiss="$emit('dismiss')"
  >
    <div class="flex flex-col gap-5">
      <form
        class="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1.6fr_120px_140px_auto]"
        @submit.prevent="addService"
      >
        <div class="space-y-1">
          <label for="svc-name" class="block text-xs font-medium text-slate-600">
            {{ t('setup.steps.services.namePlaceholder') }}
          </label>
          <input
            id="svc-name"
            v-model="form.name"
            type="text"
            maxlength="100"
            required
            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div class="space-y-1">
          <label for="svc-duration" class="block text-xs font-medium text-slate-600">
            {{ t('setup.steps.services.durationLabel') }}
          </label>
          <div class="relative">
            <input
              id="svc-duration"
              v-model.number="form.durationMinutes"
              type="number"
              min="5"
              max="480"
              step="5"
              required
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">
              {{ t('setup.steps.services.minutesUnit') }}
            </span>
          </div>
        </div>
        <div class="space-y-1">
          <label for="svc-price" class="block text-xs font-medium text-slate-600">
            {{ t('setup.steps.services.priceLabel') }}
          </label>
          <div class="relative">
            <input
              id="svc-price"
              v-model.number="form.price"
              type="number"
              min="0"
              step="0.01"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">₺</span>
          </div>
        </div>
        <div class="flex items-end">
          <AppButton native-type="submit" variant="primary" :loading="adding" :disabled="!canAdd">
            <Plus class="size-4" aria-hidden="true" />
            {{ t('setup.steps.services.addCta') }}
          </AppButton>
        </div>
        <p v-if="formError" class="col-span-full text-xs text-red-600" role="alert">{{ formError }}</p>
      </form>

      <div v-if="setup.services.length === 0" class="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        {{ t('setup.steps.services.empty') }}
      </div>

      <ul v-else class="space-y-2">
        <li
          v-for="svc in setup.services"
          :key="svc.id"
          class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          :class="{ 'opacity-60': !svc.active }"
        >
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-slate-900">{{ svc.name }}</p>
            <p class="text-xs text-slate-500">
              {{ svc.durationMinutes }} {{ t('setup.steps.services.minutesUnit') }} ·
              {{ formatPrice(svc.price) }}
              <span v-if="!svc.active" class="ml-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {{ t('employees.inactive') }}
              </span>
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <button
              type="button"
              class="text-xs font-semibold text-slate-500 hover:text-slate-700"
              :disabled="busyId === svc.id"
              @click="toggleActive(svc.id, svc.active)"
            >
              {{ svc.active ? t('setup.steps.services.deactivate') : t('setup.steps.services.activate') }}
            </button>
            <button
              type="button"
              class="text-xs font-semibold text-red-500 hover:text-red-700"
              :disabled="busyId === svc.id"
              @click="confirmRemove(svc.id, svc.name)"
            >
              {{ t('setup.steps.services.remove') }}
            </button>
          </div>
        </li>
      </ul>

      <p
        v-if="!setup.servicesDone && setup.services.length > 0"
        class="text-xs text-amber-600"
        role="status"
      >
        {{ t('setup.steps.services.needAtLeastOne') }}
      </p>
    </div>
  </SetupStepShell>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus } from 'lucide-vue-next'
import SetupStepShell from '@/components/setup/SetupStepShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useSetupStore } from '@/stores/setup'
import { useToast } from '@/composables/useToast'
import { serviceApi, type CreateServiceRequest } from '@/api/service'

defineProps<{ stepIndex: number; totalSteps: number; isFinal?: boolean }>()

const emit = defineEmits<{
  next: []
  back: []
  dismiss: []
}>()

const { t } = useI18n()
const setup = useSetupStore()
const toast = useToast()

const adding = ref(false)
const saving = ref(false)
const busyId = ref<number | null>(null)
const formError = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

const form = reactive<CreateServiceRequest>({
  name: '',
  durationMinutes: 30,
  price: 0,
})

const canAdd = computed(
  () =>
    form.name.trim().length >= 2 &&
    Number.isFinite(form.durationMinutes) &&
    form.durationMinutes >= 5,
)

function formatPrice(price: number | string): string {
  const n = typeof price === 'string' ? Number(price) : price
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n)
}

async function addService() {
  formError.value = null
  if (!canAdd.value) {
    formError.value = t('setup.steps.services.validation')
    return
  }
  adding.value = true
  try {
    const payload: CreateServiceRequest = {
      name: form.name.trim(),
      durationMinutes: form.durationMinutes,
      price: form.price && form.price > 0 ? form.price : undefined,
    }
    const { data } = await serviceApi.create(payload)
    if (data.success && data.data) {
      setup.setServices([data.data, ...setup.services])
      form.name = ''
      form.price = 0
    } else {
      formError.value = data.error?.message ?? t('common.error')
    }
  } catch (e) {
    formError.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    adding.value = false
  }
}

async function toggleActive(id: number, active: boolean) {
  busyId.value = id
  try {
    const res = active ? await serviceApi.deactivate(id) : await serviceApi.activate(id)
    const updated = res.data.data
    if (updated) {
      setup.setServices(
        setup.services.map((s) => (s.id === id ? updated : s)),
      )
    }
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    busyId.value = null
  }
}

async function confirmRemove(id: number, name: string) {
  const ok = window.confirm(t('setup.steps.services.removeConfirm', { name }))
  if (!ok) return
  busyId.value = id
  try {
    await serviceApi.delete(id)
    setup.setServices(setup.services.filter((s) => s.id !== id))
    toast.success(t('setup.steps.assignments.savedShort'))
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    busyId.value = null
  }
}
</script>
