<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <p class="text-sm text-slate-500">{{ t('employees.scheduleHint') }}</p>
      <button
        type="button"
        class="text-xs text-indigo-600 hover:underline focus-visible:outline-none"
        @click="applyToAll"
      >
        Hepsine uygula
      </button>
    </div>

    <!-- İskelet yüklenme -->
    <div v-if="loading" class="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
      <div v-for="i in 7" :key="i" class="flex items-center gap-3 px-4 py-3.5">
        <div class="h-4 w-20 animate-pulse rounded bg-slate-100" />
        <div class="h-8 w-40 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </div>

    <!-- Program satırları -->
    <div v-else class="overflow-hidden rounded-xl border border-slate-200">
      <div
        v-for="(row, i) in rows"
        :key="row.dayOfWeek"
        class="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3 transition-colors last:border-b-0"
        :class="row.closed ? 'bg-slate-50' : 'bg-white'"
      >
        <!-- Gün adı + toggle -->
        <div class="flex w-32 shrink-0 items-center gap-2.5">
          <span
            class="text-sm font-semibold"
            :class="row.closed ? 'text-slate-400' : 'text-slate-700'"
          >{{ DAY_LABELS[i] }}</span>
        </div>

        <!-- Açık/Kapalı toggle pill -->
        <button
          type="button"
          class="flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          :class="row.closed
            ? 'border-slate-200 bg-slate-100 text-slate-400 hover:border-slate-300 hover:bg-slate-200'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'"
          :aria-pressed="!row.closed"
          :aria-label="row.closed ? `${DAY_LABELS[i]}: çalışmıyor, açmak için tıkla` : `${DAY_LABELS[i]}: çalışıyor, kapatmak için tıkla`"
          @click="row.closed = !row.closed; markDirty()"
        >
          <span
            class="size-1.5 rounded-full"
            :class="row.closed ? 'bg-slate-400' : 'bg-emerald-500'"
            aria-hidden="true"
          />
          {{ row.closed ? 'Çalışmıyor' : 'Çalışıyor' }}
        </button>

        <!-- Saat seçiciler (sadece açık günlerde) -->
        <Transition
          enter-active-class="transition-all duration-150 ease-out"
          enter-from-class="opacity-0 -translate-x-2"
          enter-to-class="opacity-100 translate-x-0"
          leave-active-class="transition-all duration-100 ease-in"
          leave-from-class="opacity-100 translate-x-0"
          leave-to-class="opacity-0 -translate-x-2"
        >
          <div v-if="!row.closed" class="flex flex-wrap items-center gap-2">
            <!-- Başlangıç saati -->
            <div class="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
              <Clock class="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
              <select
                :value="row.startHour"
                class="appearance-none bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
                :aria-label="`${DAY_LABELS[i]} başlangıç saati`"
                @change="row.startHour = ($event.target as HTMLSelectElement).value; markDirty()"
              >
                <option v-for="h in HOURS" :key="h" :value="h">{{ h }}</option>
              </select>
              <span class="text-slate-400 font-bold">:</span>
              <select
                :value="row.startMin"
                class="appearance-none bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
                :aria-label="`${DAY_LABELS[i]} başlangıç dakikası`"
                @change="row.startMin = ($event.target as HTMLSelectElement).value; markDirty()"
              >
                <option v-for="m in MINS" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>

            <span class="text-sm font-medium text-slate-400">→</span>

            <!-- Bitiş saati -->
            <div class="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
              <Clock class="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
              <select
                :value="row.endHour"
                class="appearance-none bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
                :aria-label="`${DAY_LABELS[i]} bitiş saati`"
                @change="row.endHour = ($event.target as HTMLSelectElement).value; markDirty()"
              >
                <option v-for="h in HOURS" :key="h" :value="h">{{ h }}</option>
              </select>
              <span class="text-slate-400 font-bold">:</span>
              <select
                :value="row.endMin"
                class="appearance-none bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
                :aria-label="`${DAY_LABELS[i]} bitiş dakikası`"
                @change="row.endMin = ($event.target as HTMLSelectElement).value; markDirty()"
              >
                <option v-for="m in MINS" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>

            <!-- Süre etiketi -->
            <span class="text-xs text-slate-400 tabular-nums">
              {{ calcDuration(row) }}
            </span>
          </div>
        </Transition>

        <!-- Kapalı etiketi -->
        <span v-if="row.closed" class="text-xs italic text-slate-400">Tatil / İzin</span>
      </div>
    </div>

    <!-- Hata -->
    <p v-if="saveError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
      {{ saveError }}
    </p>

    <!-- Kaydet -->
    <div class="flex items-center justify-between">
      <p v-if="isDirty && !saving" class="text-xs text-amber-600">
        · Kaydedilmemiş değişiklikler var
      </p>
      <p v-else-if="savedOk" class="flex items-center gap-1 text-xs text-emerald-600">
        <CheckCircle2 class="size-3.5" aria-hidden="true" />
        Program kaydedildi
      </p>
      <span v-else />
      <AppButton
        variant="primary"
        :loading="saving"
        :disabled="!isDirty"
        @click="saveAll"
      >
        <Save class="size-4" aria-hidden="true" />
        Programı kaydet
      </AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { Clock, Save, CheckCircle2 } from 'lucide-vue-next'
import AppButton from '../../ui/AppButton.vue'
import { employeeApi, type DayOfWeek, type EmployeeScheduleResponse } from '../../../api/employee'

const { t } = useI18n()
const props = defineProps<{ employeeId: number }>()

// ─── Sabitler ────────────────────────────────────────────────────────────────

const DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
const DAY_LABELS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

const HOURS = Array.from({ length: 18 }, (_, i) => String(i + 6).padStart(2, '0'))  // 06–23
const MINS = ['00', '15', '30', '45']

// ─── State ───────────────────────────────────────────────────────────────────

interface ScheduleRow {
  dayOfWeek: DayOfWeek
  startHour: string
  startMin: string
  endHour: string
  endMin: string
  closed: boolean
}

const loading = ref(false)
const saving = ref(false)
const saveError = ref('')
const isDirty = ref(false)
const savedOk = ref(false)

const rows = reactive<ScheduleRow[]>(
  DAYS.map((d) => ({
    dayOfWeek: d,
    startHour: '09', startMin: '00',
    endHour: '18', endMin: '00',
    closed: false,
  })),
)

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

function toHHMM(time: string): { h: string; m: string } {
  const parts = time.slice(0, 5).split(':')
  return { h: parts[0].padStart(2, '0'), m: parts[1].padStart(2, '0') }
}

function calcDuration(row: ScheduleRow): string {
  const startTotal = Number(row.startHour) * 60 + Number(row.startMin)
  const endTotal = Number(row.endHour) * 60 + Number(row.endMin)
  const diff = endTotal - startTotal
  if (diff <= 0) return ''
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return h > 0 && m > 0 ? `${h} sa ${m} dk` : h > 0 ? `${h} sa` : `${m} dk`
}

function markDirty() {
  isDirty.value = true
  savedOk.value = false
}

/** İlk açık günün saatlerini tüm açık günlere uygula */
function applyToAll() {
  const source = rows.find(r => !r.closed)
  if (!source) return
  for (const row of rows) {
    if (row.closed) continue
    row.startHour = source.startHour
    row.startMin = source.startMin
    row.endHour = source.endHour
    row.endMin = source.endMin
  }
  markDirty()
}

// ─── API ─────────────────────────────────────────────────────────────────────

onMounted(loadSchedule)

async function loadSchedule() {
  loading.value = true
  try {
    const res = await employeeApi.getSchedule(props.employeeId)
    const existing: EmployeeScheduleResponse[] = res.data.data ?? []
    const map = new Map(existing.map((s) => [s.dayOfWeek, s]))
    rows.forEach((row) => {
      const s = map.get(row.dayOfWeek)
      if (s) {
        const start = toHHMM(s.startTime)
        const end = toHHMM(s.endTime)
        // Seçenekte yoksa en yakın MINS değerine yuvarla
        row.startHour = HOURS.includes(start.h) ? start.h : '09'
        row.startMin = MINS.includes(start.m) ? start.m : '00'
        row.endHour = HOURS.includes(end.h) ? end.h : '18'
        row.endMin = MINS.includes(end.m) ? end.m : '00'
        row.closed = s.closed
      }
    })
  } catch {
    // Henüz program oluşturulmamış — varsayılanlar geçerli
  } finally {
    loading.value = false
  }
}

async function saveAll() {
  saving.value = true
  saveError.value = ''
  savedOk.value = false
  try {
    await Promise.all(
      rows.map((row) =>
        employeeApi.setDaySchedule(props.employeeId, {
          dayOfWeek: row.dayOfWeek,
          closed: row.closed,
          startTime: row.closed ? undefined : `${row.startHour}:${row.startMin}:00`,
          endTime: row.closed ? undefined : `${row.endHour}:${row.endMin}:00`,
        }),
      ),
    )
    isDirty.value = false
    savedOk.value = true
    setTimeout(() => { savedOk.value = false }, 3000)
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: { message?: string } } } }
    saveError.value = err.response?.data?.error?.message ?? t('common.error')
  } finally {
    saving.value = false
  }
}
</script>
