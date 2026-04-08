<template>
  <div class="space-y-4">
    <p class="text-sm text-slate-500">{{ t('employees.servicesHint') }}</p>

    <!-- Service assign form -->
    <div class="rounded-xl border border-slate-200 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-700">{{ t('employees.assignService') }}</h3>
      <div v-if="servicesLoading" class="text-sm text-slate-400">{{ t('common.loading') }}</div>
      <template v-else-if="availableServices.length === 0">
        <p class="text-sm text-slate-400">{{ t('employees.noServices') }}</p>
      </template>
      <template v-else>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="space-y-1">
            <label class="block text-sm font-medium text-slate-700" for="cap-service">{{ t('employees.service') }}</label>
            <select id="cap-service" v-model.number="assignForm.serviceId" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
              <option :value="0">{{ t('employees.selectService') }}</option>
              <option v-for="s in availableServices" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="block text-sm font-medium text-slate-700">{{ t('employees.skillLevel') }}</label>
            <select v-model="assignForm.skillLevel" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
              <option v-for="sl in skillLevels" :key="sl" :value="sl">{{ t(`employees.skillLevels.${sl}`) }}</option>
            </select>
          </div>
        </div>
        <div class="mt-3 flex justify-end">
          <AppButton
            variant="primary"
            size="sm"
            :disabled="!assignForm.serviceId"
            :loading="assigning"
            @click="assign"
          >
            {{ t('employees.assign') }}
          </AppButton>
        </div>
      </template>
    </div>

    <!-- Current capabilities -->
    <div>
      <h3 class="mb-2 text-sm font-semibold text-slate-700">{{ t('employees.currentCapabilities') }}</h3>
      <div v-if="capsLoading" class="text-sm text-slate-400">{{ t('common.loading') }}</div>
      <p v-else-if="capabilities.length === 0" class="text-sm text-slate-400">—</p>
      <ul v-else class="divide-y divide-slate-100 rounded-xl border border-slate-200">
        <li
          v-for="cap in capabilities"
          :key="cap.id"
          class="flex items-center justify-between gap-3 px-4 py-3"
        >
          <div>
            <span class="text-sm font-medium text-slate-800">{{ cap.serviceName }}</span>
            <span class="ml-2 text-xs text-slate-400">{{ t(`employees.skillLevels.${cap.skillLevel}`) }}</span>
          </div>
          <AppButton variant="danger" size="sm" :loading="removingId === cap.serviceId" @click="remove(cap.serviceId)">
            {{ t('employees.removeCapability') }}
          </AppButton>
        </li>
      </ul>
    </div>

    <p v-if="opError" class="text-sm text-red-500" role="alert">{{ opError }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '../../ui/AppButton.vue'
import { employeeApi, type EmployeeCapabilityResponse, type SkillLevel } from '../../../api/employee'
import { serviceApi } from '../../../api/service'
import type { ServiceResponse } from '../../../api/service'

const { t } = useI18n()

const props = defineProps<{ employeeId: number; businessId: number }>()

const SKILL_LEVELS: SkillLevel[] = ['JUNIOR', 'INTERMEDIATE', 'SENIOR', 'EXPERT']
const skillLevels = SKILL_LEVELS

const capabilities = ref<EmployeeCapabilityResponse[]>([])
const capsLoading = ref(false)
const services = ref<ServiceResponse[]>([])
const servicesLoading = ref(false)
const assigning = ref(false)
const removingId = ref<number | null>(null)
const opError = ref<string | null>(null)

const assignForm = reactive({ serviceId: 0, skillLevel: 'INTERMEDIATE' as SkillLevel })

const assignedServiceIds = computed(() => new Set(capabilities.value.map((c) => c.serviceId)))
const availableServices = computed(() =>
  services.value.filter((s) => !assignedServiceIds.value.has(s.id) && s.active),
)

onMounted(async () => {
  await Promise.all([loadCaps(), loadServices()])
})

async function loadCaps() {
  capsLoading.value = true
  try {
    const res = await employeeApi.getCapabilities(props.employeeId)
    capabilities.value = res.data.data ?? []
  } finally {
    capsLoading.value = false
  }
}

async function loadServices() {
  servicesLoading.value = true
  try {
    const res = await serviceApi.list(props.businessId)
    services.value = res.data.data ?? []
  } finally {
    servicesLoading.value = false
  }
}

async function assign() {
  if (!assignForm.serviceId) return
  assigning.value = true
  opError.value = null
  try {
    await employeeApi.assignCapability(props.employeeId, {
      serviceId: assignForm.serviceId,
      skillLevel: assignForm.skillLevel,
    })
    await loadCaps()
    assignForm.serviceId = 0
  } catch {
    opError.value = t('common.error')
  } finally {
    assigning.value = false
  }
}

async function remove(serviceId: number) {
  removingId.value = serviceId
  opError.value = null
  try {
    await employeeApi.removeCapability(props.employeeId, serviceId)
    capabilities.value = capabilities.value.filter((c) => c.serviceId !== serviceId)
  } catch {
    opError.value = t('common.error')
  } finally {
    removingId.value = null
  }
}
</script>

