<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, ChevronRight, Filter, Plus } from 'lucide-vue-next'
import AppButton from '@/components/ui/AppButton.vue'
import { getMondayOfWeek } from '@/composables/useCalendarUtils'

type CalendarView = 'day' | 'week' | 'month'

interface Props {
  view: CalendarView
  currentDate: Date
  filterActive?: boolean
  filterCount?: number
  filterPanelOpen?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  prev: []
  next: []
  today: []
  viewChange: [view: CalendarView]
  filterClick: []
  newAppointmentClick: []
}>()

const { t, locale } = useI18n()

const VIEW_TYPES: ReadonlyArray<CalendarView> = ['day', 'week', 'month']
const segmentRefs = ref<Record<CalendarView, HTMLButtonElement | null>>({
  day: null,
  week: null,
  month: null,
})

const intlLocale = computed(() => (locale.value === 'tr' ? 'tr-TR' : 'en-US'))

const formattedDate = computed(() => {
  const date = props.currentDate
  const view = props.view
  const localeStr = intlLocale.value

  if (view === 'day') {
    const dayName = new Intl.DateTimeFormat(localeStr, { weekday: 'long' }).format(date)
    const dateStr = new Intl.DateTimeFormat(localeStr, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
    const dayNameCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1)
    return `${dateStr} · ${dayNameCapitalized}`
  }

  if (view === 'week') {
    const monday = getMondayOfWeek(date)
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)
    return formatWeekRange(monday, sunday, localeStr)
  }

  return new Intl.DateTimeFormat(localeStr, { month: 'long', year: 'numeric' }).format(date)
})

const prevAriaLabel = computed(() => t(`calendar.nav.previous.${props.view}`))
const nextAriaLabel = computed(() => t(`calendar.nav.next.${props.view}`))

function formatWeekRange(monday: Date, sunday: Date, localeStr: string): string {
  const sameMonth = monday.getMonth() === sunday.getMonth()
  const sameYear = monday.getFullYear() === sunday.getFullYear()

  if (sameMonth && sameYear) {
    const monthName = new Intl.DateTimeFormat(localeStr, { month: 'long' }).format(monday)
    return `${monday.getDate()} – ${sunday.getDate()} ${monthName} ${monday.getFullYear()}`
  }

  if (sameYear) {
    const startStr = new Intl.DateTimeFormat(localeStr, { day: 'numeric', month: 'short' }).format(
      monday,
    )
    const endStr = new Intl.DateTimeFormat(localeStr, { day: 'numeric', month: 'short' }).format(
      sunday,
    )
    return `${startStr} – ${endStr} ${monday.getFullYear()}`
  }

  const startFull = new Intl.DateTimeFormat(localeStr, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(monday)
  const endFull = new Intl.DateTimeFormat(localeStr, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(sunday)
  return `${startFull} – ${endFull}`
}

function setSegmentRef(view: CalendarView, el: Element | null) {
  segmentRefs.value[view] = el as HTMLButtonElement | null
}

function focusView(view: CalendarView) {
  void nextTick(() => {
    segmentRefs.value[view]?.focus()
  })
}

function selectView(view: CalendarView) {
  if (view !== props.view) emit('viewChange', view)
}

function handleSegmentKeydown(event: KeyboardEvent) {
  const idx = VIEW_TYPES.indexOf(props.view)
  if (idx < 0) return

  let target: CalendarView | null = null
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      target = VIEW_TYPES[(idx + 1) % VIEW_TYPES.length]
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      target = VIEW_TYPES[(idx - 1 + VIEW_TYPES.length) % VIEW_TYPES.length]
      break
    case 'Home':
      target = VIEW_TYPES[0]
      break
    case 'End':
      target = VIEW_TYPES[VIEW_TYPES.length - 1]
      break
  }

  if (target) {
    event.preventDefault()
    selectView(target)
    focusView(target)
  }
}
</script>

<template>
  <div class="calendar-toolbar">
    <div class="toolbar-nav">
      <button
        type="button"
        class="nav-button"
        :aria-label="prevAriaLabel"
        @click="emit('prev')"
      >
        <ChevronLeft :size="18" :stroke-width="2.5" aria-hidden="true" />
      </button>
      <AppButton variant="secondary" size="sm" @click="emit('today')">
        {{ t('calendar.today') }}
      </AppButton>
      <button
        type="button"
        class="nav-button"
        :aria-label="nextAriaLabel"
        @click="emit('next')"
      >
        <ChevronRight :size="18" :stroke-width="2.5" aria-hidden="true" />
      </button>
    </div>

    <div class="toolbar-date display-sm" aria-live="polite">
      {{ formattedDate }}
    </div>

    <div class="toolbar-spacer" />

    <div
      class="view-segment"
      role="radiogroup"
      :aria-label="t('calendar.viewSelector')"
      @keydown="handleSegmentKeydown"
    >
      <button
        v-for="viewType in VIEW_TYPES"
        :key="viewType"
        :ref="(el) => setSegmentRef(viewType, el as Element | null)"
        type="button"
        class="segment-button"
        :class="{ active: view === viewType }"
        role="radio"
        :aria-checked="view === viewType"
        :tabindex="view === viewType ? 0 : -1"
        @click="selectView(viewType)"
      >
        {{ t(`calendar.view.${viewType}`) }}
      </button>
    </div>

    <div class="toolbar-actions">
      <AppButton
        :variant="filterActive ? 'primary' : 'secondary'"
        size="sm"
        :aria-pressed="filterPanelOpen ? 'true' : 'false'"
        :aria-expanded="filterPanelOpen ?? false"
        @click="emit('filterClick')"
      >
        <Filter :size="14" :stroke-width="2" aria-hidden="true" />
        {{ t('calendar.filter') }}
        <span
          v-if="filterCount && filterCount > 0"
          class="filter-badge"
          aria-hidden="true"
        >{{ filterCount }}</span>
      </AppButton>
      <AppButton variant="primary" size="sm" @click="emit('newAppointmentClick')">
        <Plus :size="14" :stroke-width="2.4" aria-hidden="true" />
        {{ t('calendar.newAppointment') }}
      </AppButton>
    </div>
  </div>
</template>

<style scoped>
.calendar-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  min-height: 40px;
  padding: 0 8px;
  border: 1px solid var(--hairline-strong);
  background: var(--surface);
  border-radius: 8px;
  color: var(--ink-2);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.nav-button:hover {
  background: var(--surface-2);
  color: var(--ink-1);
}

.nav-button:active {
  transform: scale(0.97);
}

.nav-button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.toolbar-date {
  margin-left: 8px;
  color: var(--ink-1);
}

.toolbar-spacer {
  flex: 1;
}

.view-segment {
  display: flex;
  gap: 4px;
  background: var(--surface-2);
  padding: 3px;
  border-radius: 10px;
  border: 1px solid var(--hairline);
}

.segment-button {
  min-height: 32px;
  padding: 6px 14px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 600;
  background: transparent;
  color: var(--ink-3);
  transition: background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.segment-button.active {
  background: var(--surface);
  color: var(--ink-1);
  box-shadow: var(--shadow-1);
}

.segment-button:hover:not(.active) {
  color: var(--ink-2);
}

.segment-button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.filter-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  margin-left: 4px;
  border-radius: var(--r-full);
  font-size: 10px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  background: color-mix(in srgb, currentColor 20%, transparent);
  color: inherit;
}

@media (max-width: 768px) {
  .calendar-toolbar {
    gap: 10px;
  }

  .toolbar-date {
    flex-basis: 100%;
    order: 1;
    margin-left: 0;
    font-size: 18px;
  }

  .toolbar-nav {
    order: 0;
  }

  .toolbar-spacer {
    display: none;
  }

  .view-segment {
    order: 2;
  }

  .toolbar-actions {
    order: 3;
    flex-wrap: wrap;
  }

  .nav-button {
    min-width: 44px;
    min-height: 44px;
  }
}
</style>
