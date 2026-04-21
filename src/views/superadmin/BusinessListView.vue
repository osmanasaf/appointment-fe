<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">İşletmeler</h1>
        <p class="mt-1 text-sm text-gray-400">Tüm kayıtlı işletmeleri yönetin</p>
      </div>
    </div>

    <!-- Search & Filters -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="İşletme adı ile ara..."
          class="w-full rounded-lg border border-gray-700 bg-gray-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          @input="debouncedSearch"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="size-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto rounded-xl border border-gray-800">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-gray-800 bg-gray-800/60 text-xs uppercase text-gray-400">
          <tr>
            <th class="px-4 py-3 font-medium">İşletme</th>
            <th class="px-4 py-3 font-medium">Kategori</th>
            <th class="px-4 py-3 font-medium">Sahip</th>
            <th class="px-4 py-3 font-medium">Plan</th>
            <th class="px-4 py-3 font-medium">Durum</th>
            <th class="px-4 py-3 font-medium">Bitiş</th>
            <th class="px-4 py-3 font-medium text-center">Çalışan</th>
            <th class="px-4 py-3 font-medium text-center">Randevu</th>
            <th class="px-4 py-3 font-medium">Kayıt</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-800">
          <tr
            v-for="biz in businesses"
            :key="biz.businessId"
            class="cursor-pointer transition hover:bg-gray-800/50"
            @click="goToDetail(biz.businessId)"
          >
            <td class="px-4 py-3">
              <div>
                <p class="font-medium text-white">{{ biz.businessName }}</p>
                <p class="text-xs text-gray-500">{{ biz.slug }}</p>
              </div>
            </td>
            <td class="px-4 py-3 text-gray-300">{{ biz.category }}</td>
            <td class="px-4 py-3">
              <div>
                <p class="text-gray-300">{{ biz.ownerName }}</p>
                <p class="text-xs text-gray-500">{{ biz.ownerEmail }}</p>
              </div>
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="planBadgeClass(biz.planCode)"
              >
                {{ biz.planCode }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="statusBadgeClass(biz.subscriptionStatus)"
              >
                {{ statusLabel(biz.subscriptionStatus) }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-400">
              {{ biz.subscriptionEnd ? formatDate(biz.subscriptionEnd) : '—' }}
            </td>
            <td class="px-4 py-3 text-center text-gray-300">{{ biz.employeeCount }}</td>
            <td class="px-4 py-3 text-center text-gray-300">{{ biz.currentMonthAppointments }}</td>
            <td class="px-4 py-3 text-gray-400 whitespace-nowrap">{{ formatDate(biz.registeredAt) }}</td>
          </tr>
          <tr v-if="businesses.length === 0">
            <td colspan="9" class="px-4 py-12 text-center text-gray-500">
              Sonuç bulunamadı
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-between">
      <p class="text-sm text-gray-500">
        Toplam {{ totalElements }} işletme
      </p>
      <div class="flex gap-1">
        <button
          v-for="p in paginationPages"
          :key="p"
          class="rounded-lg px-3 py-1.5 text-xs font-medium transition"
          :class="p === currentPage
            ? 'bg-indigo-600 text-white'
            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          "
          @click="goToPage(p)"
        >
          {{ p + 1 }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from 'lucide-vue-next'
import { superadminApi, type SuperAdminBusinessListItem } from '@/api/superadmin'

const router = useRouter()
const loading = ref(true)
const businesses = ref<SuperAdminBusinessListItem[]>([])
const searchQuery = ref('')
const currentPage = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)

let searchTimeout: ReturnType<typeof setTimeout> | null = null

onMounted(() => fetchBusinesses())

async function fetchBusinesses() {
  loading.value = true
  try {
    const res = await superadminApi.listBusinesses(currentPage.value, 20, searchQuery.value)
    if (res.data.success && res.data.data) {
      businesses.value = res.data.data.content
      totalPages.value = res.data.data.totalPages
      totalElements.value = res.data.data.totalElements
    }
  } finally {
    loading.value = false
  }
}

function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 0
    fetchBusinesses()
  }, 400)
}

function goToPage(page: number) {
  currentPage.value = page
  fetchBusinesses()
}

function goToDetail(businessId: number) {
  router.push({ name: 'SuperAdminBusinessDetail', params: { id: businessId } })
}

const paginationPages = computed(() => {
  const pages: number[] = []
  const maxVisible = 7
  const start = Math.max(0, currentPage.value - Math.floor(maxVisible / 2))
  const end = Math.min(totalPages.value, start + maxVisible)
  for (let i = start; i < end; i++) pages.push(i)
  return pages
})

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function planBadgeClass(plan: string): string {
  const map: Record<string, string> = {
    SOLO: 'bg-sky-900/50 text-sky-300',
    PRO: 'bg-indigo-900/50 text-indigo-300',
    ENTERPRISE: 'bg-amber-900/50 text-amber-300',
  }
  return map[plan] ?? 'bg-gray-700 text-gray-300'
}

function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    TRIAL: 'bg-sky-900/40 text-sky-300',
    ACTIVE: 'bg-emerald-900/40 text-emerald-300',
    EXPIRED: 'bg-gray-700 text-gray-400',
    SUSPENDED: 'bg-red-900/40 text-red-300',
  }
  return map[status] ?? 'bg-gray-700 text-gray-300'
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    TRIAL: 'Trial',
    ACTIVE: 'Aktif',
    EXPIRED: 'Süresi Dolmuş',
    SUSPENDED: 'Askıda',
  }
  return map[status] ?? status
}
</script>
