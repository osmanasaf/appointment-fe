<template>
  <SetupStepShell
    :step-index="stepIndex"
    :total-steps="totalSteps"
    :title="t('setup.steps.share.title')"
    :description="t('setup.steps.share.description')"
    :busy="false"
    :error-message="errorMessage"
    :next-label="t('setup.shell.finish')"
    :next-disabled="!setup.isComplete"
    :is-final="true"
    @back="$emit('back')"
    @next="$emit('next')"
    @dismiss="$emit('dismiss')"
  >
    <div class="flex flex-col gap-5">
      <div v-if="!setup.isComplete" class="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        {{ t('setup.steps.share.notReady') }}
      </div>

      <section v-if="bookingUrl" class="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
        <p class="text-xs font-semibold uppercase tracking-wide text-indigo-700">
          {{ t('setup.steps.share.linkLabel') }}
        </p>
        <div class="mt-2 flex flex-wrap items-center gap-3">
          <code class="flex-1 min-w-0 truncate rounded-lg bg-white px-3 py-2 text-sm font-medium text-indigo-700">
            {{ bookingUrl }}
          </code>
          <AppButton variant="primary" type="button" @click="copyLink">
            <Copy v-if="!copied" class="size-4" aria-hidden="true" />
            <Check v-else class="size-4" aria-hidden="true" />
            {{ copied ? t('setup.steps.share.copied') : t('setup.steps.share.copyCta') }}
          </AppButton>
        </div>
      </section>

      <section class="grid gap-3 sm:grid-cols-3">
        <a
          v-if="bookingUrl"
          :href="bookingUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="group flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 shadow-sm hover:border-indigo-300 hover:bg-indigo-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <ExternalLink class="size-5 text-indigo-600" aria-hidden="true" />
          <span>{{ t('setup.steps.share.previewCta') }}</span>
        </a>
        <router-link
          :to="{ name: 'AdminAppointments' }"
          class="group flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 shadow-sm hover:border-indigo-300 hover:bg-indigo-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <CalendarRange class="size-5 text-indigo-600" aria-hidden="true" />
          <span>{{ t('setup.steps.share.openCalendar') }}</span>
        </router-link>
        <router-link
          :to="{ name: 'AdminAppointments', query: { create: '1' } }"
          class="group flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 shadow-sm hover:border-indigo-300 hover:bg-indigo-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <PlusCircle class="size-5 text-indigo-600" aria-hidden="true" />
          <span>{{ t('setup.steps.share.createTestAppointment') }}</span>
        </router-link>
      </section>

      <div v-if="setup.isComplete" class="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 p-5 text-white shadow-md">
        <p class="text-base font-semibold">{{ t('setup.steps.share.ready') }}</p>
        <p class="mt-1 text-sm opacity-90">
          {{ t('setup.shell.finishedToast') }}
        </p>
      </div>
    </div>
  </SetupStepShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CalendarRange, Check, Copy, ExternalLink, PlusCircle } from 'lucide-vue-next'
import SetupStepShell from '@/components/setup/SetupStepShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useSetupStore } from '@/stores/setup'
import { useToast } from '@/composables/useToast'

defineProps<{ stepIndex: number; totalSteps: number; isFinal?: boolean }>()

defineEmits<{
  next: []
  back: []
  dismiss: []
}>()

const { t } = useI18n()
const setup = useSetupStore()
const toast = useToast()

const copied = ref(false)
const errorMessage = ref<string | null>(null)

const bookingUrl = computed(() => {
  const slug = setup.business?.slug?.trim()
  if (!slug) return null
  const origin = window.location.origin.replace(/\/$/, '')
  return `${origin}/b/${slug}`
})

async function copyLink() {
  if (!bookingUrl.value) return
  try {
    await navigator.clipboard.writeText(bookingUrl.value)
    copied.value = true
    toast.success(t('setup.steps.share.copied'))
    window.setTimeout(() => {
      copied.value = false
    }, 2200)
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  }
}
</script>
