<template>
  <form class="space-y-4" @submit.prevent="submit">
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="space-y-1 sm:col-span-2">
        <label class="block text-sm font-medium text-slate-700" for="pf-name">{{ t('employees.name') }} *</label>
        <input
          id="pf-name"
          v-model="form.name"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          type="text"
          required
          minlength="2"
          maxlength="100"
        />
      </div>

      <div class="space-y-1">
        <label class="block text-sm font-medium text-slate-700" for="pf-title">{{ t('employees.titleLabel') }}</label>
        <input id="pf-title" v-model="form.title" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" type="text" maxlength="120" />
      </div>

      <div class="space-y-1">
        <label class="block text-sm font-medium text-slate-700" for="pf-exp">{{ t('employees.experienceYears') }}</label>
        <input id="pf-exp" v-model.number="form.experienceYears" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" type="number" min="0" max="80" />
      </div>

      <div class="space-y-1">
        <label class="block text-sm font-medium text-slate-700" for="pf-phone">{{ t('employees.phone') }}</label>
        <input id="pf-phone" v-model="form.phoneNumber" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" type="tel" />
      </div>

      <div class="space-y-1">
        <label class="block text-sm font-medium text-slate-700" for="pf-email">{{ t('employees.email') }}</label>
        <input id="pf-email" v-model="form.email" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" type="email" />
      </div>

      <div class="space-y-1 sm:col-span-2">
        <label class="block text-sm font-medium text-slate-700" for="pf-bio">{{ t('employees.bio') }}</label>
        <textarea id="pf-bio" v-model="form.bio" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" rows="3" maxlength="500" />
      </div>

      <div class="space-y-1 sm:col-span-2">
        <label class="block text-sm font-medium text-slate-700" for="pf-img">{{ t('employees.profileImageUrl') }}</label>
        <input id="pf-img" v-model="form.profileImageUrl" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" type="url" />
      </div>
    </div>

    <div class="flex flex-col gap-3 pt-1">
      <AppCheckbox v-model="form.acceptsOnlineBooking" :label="t('employees.acceptsOnlineBooking')" />
      <AppCheckbox v-if="isCreate" v-model="form.owner" :label="t('employees.ownerCheck')" />
    </div>

    <p v-if="error" class="text-sm text-red-500" role="alert">{{ error }}</p>

    <div class="flex justify-end gap-2 pt-2">
      <AppButton variant="primary" native-type="submit" :loading="saving">
        {{ t('common.save') }}
      </AppButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '../../ui/AppButton.vue'
import AppCheckbox from '../../ui/AppCheckbox.vue'
import { employeeApi, type EmployeeResponse } from '../../../api/employee'

const { t } = useI18n()

const props = defineProps<{
  employee?: EmployeeResponse
  businessId: number
  isCreate?: boolean
}>()

const emit = defineEmits<{
  saved: [employee: EmployeeResponse]
}>()

const saving = ref(false)
const error = ref<string | null>(null)

const form = reactive({
  name: props.employee?.name ?? '',
  title: props.employee?.title ?? '',
  phoneNumber: props.employee?.phoneNumber ?? '',
  email: props.employee?.email ?? '',
  bio: props.employee?.bio ?? '',
  profileImageUrl: props.employee?.profileImageUrl ?? '',
  experienceYears: props.employee?.experienceYears ?? undefined as number | undefined,
  acceptsOnlineBooking: props.employee?.acceptsOnlineBooking ?? true,
  owner: props.employee?.owner ?? false,
})

watch(() => props.employee, (e) => {
  if (!e) return
  Object.assign(form, {
    name: e.name,
    title: e.title ?? '',
    phoneNumber: e.phoneNumber ?? '',
    email: e.email ?? '',
    bio: e.bio ?? '',
    profileImageUrl: e.profileImageUrl ?? '',
    experienceYears: e.experienceYears ?? undefined,
    acceptsOnlineBooking: e.acceptsOnlineBooking,
    owner: e.owner,
  })
})

async function submit() {
  error.value = null
  saving.value = true
  try {
    let result: EmployeeResponse
    if (props.isCreate) {
      const res = await employeeApi.create({
        name: form.name,
        title: form.title || undefined,
        phoneNumber: form.phoneNumber || undefined,
        email: form.email || undefined,
        bio: form.bio || undefined,
        owner: form.owner,
      })
      result = res.data.data!
    } else {
      const res = await employeeApi.update(props.employee!.id, {
        name: form.name,
        title: form.title || undefined,
        phoneNumber: form.phoneNumber || undefined,
        email: form.email || undefined,
        bio: form.bio || undefined,
        profileImageUrl: form.profileImageUrl || undefined,
        experienceYears: form.experienceYears,
        acceptsOnlineBooking: form.acceptsOnlineBooking,
      })
      result = res.data.data!
    }
    emit('saved', result)
  } catch {
    error.value = t('common.error')
  } finally {
    saving.value = false
  }
}
</script>

