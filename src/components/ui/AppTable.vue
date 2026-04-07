<template>
  <div class="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <div v-if="loading" class="divide-y divide-slate-100 p-4" aria-busy="true">
      <div v-for="rowIdx in skeletonRows" :key="rowIdx" class="flex gap-3 py-2">
        <AppSkeleton v-for="col in columns" :key="`${rowIdx}-${col.key}`" :height="'1rem'" class="flex-1" />
      </div>
    </div>
    <div v-else-if="!rows.length" class="p-6">
      <AppEmptyState :title="resolvedEmptyTitle" :description="resolvedEmptyDescription">
        <template v-if="$slots.emptyIcon" #icon>
          <slot name="emptyIcon" />
        </template>
        <template v-if="$slots.emptyAction" #action>
          <slot name="emptyAction" />
        </template>
      </AppEmptyState>
    </div>
    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[20rem] border-collapse text-left text-sm">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50/90">
            <th
              v-for="col in columns"
              :key="col.key"
              scope="col"
              class="px-4 py-3 font-semibold text-slate-700"
              :class="col.headerClass"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="(row, rowIndex) in rows" :key="rowKey(row, rowIndex)" class="hover:bg-slate-50/80">
            <td
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 text-slate-800"
              :class="col.cellClass"
            >
              <slot
                :name="`cell-${col.key}`"
                :row="row"
                :column="col"
                :value="row[col.key]"
              >
                {{ formatCell(row[col.key]) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppSkeleton from './AppSkeleton.vue'
import AppEmptyState from './AppEmptyState.vue'

export interface AppTableColumn {
  key: string
  label: string
  headerClass?: string
  cellClass?: string
}

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    columns: AppTableColumn[]
    rows: Record<string, unknown>[]
    loading?: boolean
    emptyTitle?: string
    emptyDescription?: string
    skeletonRows?: number
    rowKey?: (row: Record<string, unknown>, index: number) => string | number
  }>(),
  {
    loading: false,
    emptyTitle: undefined,
    emptyDescription: undefined,
    skeletonRows: 5,
  },
)

const resolvedEmptyTitle = computed(() => props.emptyTitle ?? t('table.empty'))
const resolvedEmptyDescription = computed(() => props.emptyDescription ?? t('table.emptyHint'))

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function rowKey(row: Record<string, unknown>, index: number) {
  if (props.rowKey) return props.rowKey(row, index)
  const id = row.id
  if (typeof id === 'number' || typeof id === 'string') return id
  return index
}
</script>
