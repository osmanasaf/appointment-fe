<!--
  AppListState — loading / error / empty / content state'lerini yöneten wrapper.

  Kullanım:
    <AppListState
      :loading="store.loading"
      :error="store.error"
      :empty="!store.items.length"
      empty-title="Henüz randevunuz yok"
      empty-description="İlk randevuyu oluşturarak başlayın."
      :on-retry="store.fetch"
    >
      <!-- actual list content -->
    </AppListState>
-->
<template>
  <!-- Loading skeleton'ları -->
  <div v-if="loading" class="flex flex-col gap-3" role="status" aria-label="Yükleniyor">
    <slot name="skeleton">
      <template v-for="n in skeletonCount" :key="n">
        <AppSkeleton variant="block" :height="skeletonHeight" />
      </template>
    </slot>
  </div>

  <!-- Hata durumu -->
  <AppErrorState
    v-else-if="error"
    :title="errorTitle"
    :message="error"
    :on-retry="onRetry"
  />

  <!-- Boş durum -->
  <AppEmptyState
    v-else-if="empty"
    :icon="emptyIcon"
    :title="emptyTitle ?? 'Kayıt bulunamadı'"
    :description="emptyDescription"
  >
    <template v-if="$slots['empty-action']" #action>
      <slot name="empty-action" />
    </template>
  </AppEmptyState>

  <!-- İçerik -->
  <slot v-else />
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import AppSkeleton from './AppSkeleton.vue'
import AppEmptyState from './AppEmptyState.vue'
import AppErrorState from './AppErrorState.vue'

withDefaults(
  defineProps<{
    loading?: boolean
    error?: string | null
    empty?: boolean
    /** Boş durum başlık metni */
    emptyTitle?: string
    /** Boş durum açıklama metni */
    emptyDescription?: string
    /** Boş durum ikonu */
    emptyIcon?: Component
    /** Hata durumu başlık metni */
    errorTitle?: string
    /** Tekrar dene callback'i */
    onRetry?: () => void
    /** Kaç adet skeleton gösterilsin? */
    skeletonCount?: number
    /** Skeleton yüksekliği */
    skeletonHeight?: string
  }>(),
  {
    loading: false,
    error: null,
    empty: false,
    errorTitle: 'Yüklenirken hata oluştu',
    skeletonCount: 4,
    skeletonHeight: '4rem',
  },
)
</script>
