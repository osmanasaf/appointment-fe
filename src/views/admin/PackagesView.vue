<template>
  <div class="space-y-6 p-4 sm:p-6">
    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="space-y-1">
        <h1 class="page-title">{{ t('packagesView.title') }}</h1>
        <p class="page-subtitle">
          {{ t('packagesView.summary', {
            templates: activeTemplatesCount,
            sales: allPackages.length,
            active: activePackages.length,
          }) }}
        </p>
      </div>
      <AppButton variant="primary" @click="openTemplateModal()">
        <Plus :size="14" :stroke-width="2.4" aria-hidden="true" />
        {{ t('packagesView.action.newTemplate') }}
      </AppButton>
    </div>

    <div v-if="!businessId" class="card p-8 text-center text-sm" :style="{ color: 'var(--ink-3)' }">
      {{ t('packagesView.noBusiness') }}
    </div>

    <template v-else>
      <!-- Loading -->
      <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 3" :key="i" class="h-56 animate-pulse rounded-2xl" :style="{ background: 'var(--surface-2)' }" />
      </div>

      <!-- Error -->
      <div
        v-else-if="pageError"
        class="rounded-xl border p-6 text-center"
        :style="{ borderColor: 'var(--danger-tint)', background: 'var(--danger-tint)' }"
        role="alert"
      >
        <p class="text-sm" :style="{ color: 'var(--danger)' }">{{ pageError }}</p>
        <AppButton variant="secondary" size="sm" class="mt-3" @click="load">{{ t('common.retry') }}</AppButton>
      </div>

      <template v-else>
        <!-- ── Package Templates Grid ─────────────────────────────────── -->
        <section class="space-y-3">
          <div
            v-if="templates.length === 0"
            class="rounded-2xl border border-dashed p-10 text-center text-sm"
            :style="{ borderColor: 'var(--hairline)', background: 'var(--surface-2)', color: 'var(--ink-4)' }"
          >
            {{ t('packagesView.empty.templates') }}
          </div>

          <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <article
              v-for="(tpl, idx) in templates"
              :key="tpl.id"
              class="package-card"
              role="button"
              tabindex="0"
              :aria-label="tpl.name"
              @click="goToDetail(tpl.id)"
              @keydown.enter.prevent="goToDetail(tpl.id)"
              @keydown.space.prevent="goToDetail(tpl.id)"
            >
              <header class="package-card__hero" :style="{ background: heroColor(idx) }">
                <div class="package-card__hero-top">
                  <Package class="size-5" />
                  <button
                    type="button"
                    class="package-card__menu"
                    :aria-label="t('packagesView.action.edit')"
                    @click.stop="openTemplateModal(tpl)"
                    @keydown.enter.stop
                    @keydown.space.stop
                  >
                    <MoreHorizontal class="size-4" />
                  </button>
                </div>
                <h3 class="package-card__name">{{ tpl.name }}</h3>
                <p class="package-card__sessions">{{ t('packagesView.template.sessions', { n: tpl.totalSessions }) }}</p>
                <span v-if="!tpl.active" class="package-card__badge">{{ t('packagesView.template.passive') }}</span>
              </header>

              <div class="package-card__body">
                <div class="package-card__price">
                  <span class="package-card__price-value">{{ tpl.price != null ? formatPrice(tpl.price) : '—' }}</span>
                  <span v-if="tpl.price != null && tpl.totalSessions > 0" class="package-card__price-sub">
                    {{ t('packagesView.card.perSession', { price: formatPrice(Math.round(tpl.price / tpl.totalSessions)) }) }}
                  </span>
                </div>

                <p class="package-card__service">{{ resolveServiceName(tpl.serviceId) }}</p>

                <div class="package-card__stats">
                  <div class="package-card__stat">
                    <div class="package-card__stat-value">{{ templateSaleCount(tpl.id) }}</div>
                    <div class="package-card__stat-label">{{ t('packagesView.card.sold') }}</div>
                  </div>
                  <div class="package-card__stat">
                    <div class="package-card__stat-value">{{ templateActiveCount(tpl.id) }}</div>
                    <div class="package-card__stat-label">{{ t('packagesView.card.active') }}</div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <!-- ── Customer Packages ────────────────────────────────────────── -->
        <section v-if="allPackages.length > 0" class="space-y-4">
          <SectionHeader
            :title="t('packagesView.section.sold')"
            :subtitle="t('packagesView.section.soldDesc')"
            as="h3"
          />

          <!-- Summary stats -->
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard
              :label="t('packagesView.stat.totalSales')"
              :value="String(allPackages.length)"
              tint="neutral"
            />
            <KpiCard
              :label="t('packagesView.stat.active')"
              :value="String(activePackages.length)"
              tint="success"
            />
            <KpiCard
              :label="t('packagesView.stat.lowSessions')"
              :value="String(lowPackages.length)"
              tint="warning"
            />
            <KpiCard
              :label="t('packagesView.stat.expired')"
              :value="String(expiredPackages.length)"
              tint="neutral"
            />
          </div>

          <!-- Grouped by template -->
          <div class="space-y-3">
            <div
              v-for="group in groupedByTemplate"
              :key="group.templateId ?? 'manual'"
              class="card overflow-hidden"
            >
              <!-- Group header -->
              <div
                class="group-header"
                role="button"
                tabindex="0"
                :aria-label="group.name"
                :aria-expanded="group.templateId ? undefined : manualGroupOpen"
                @click="group.templateId ? goToDetail(group.templateId) : toggleManualGroup()"
                @keydown.enter.prevent="group.templateId ? goToDetail(group.templateId) : toggleManualGroup()"
                @keydown.space.prevent="group.templateId ? goToDetail(group.templateId) : toggleManualGroup()"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-9 shrink-0 items-center justify-center rounded-lg"
                    :style="{ background: 'var(--primary-tint)', color: 'var(--primary)' }"
                  >
                    <Package class="size-4" />
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-semibold truncate" :style="{ color: 'var(--ink-1)' }">{{ group.name }}</span>
                      <span
                        v-if="!group.templateId"
                        class="rounded-full px-2 py-0.5 text-xs"
                        :style="{ background: 'var(--surface-2)', color: 'var(--ink-3)' }"
                      >{{ t('packagesView.group.manual') }}</span>
                    </div>
                    <p class="text-xs" :style="{ color: 'var(--ink-3)' }">{{ resolveServiceName(group.serviceId) }}</p>
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-3">
                  <div class="flex items-center gap-2">
                    <span class="pkg-pill pkg-pill--active">
                      {{ t('packagesView.group.activeCount', { n: group.activeCount }) }}
                    </span>
                    <span v-if="group.lowCount > 0" class="pkg-pill pkg-pill--low">
                      {{ t('packagesView.group.lowCount', { n: group.lowCount }) }}
                    </span>
                    <span v-if="group.expiredCount > 0" class="pkg-pill pkg-pill--expired">
                      {{ t('packagesView.group.expiredCount', { n: group.expiredCount }) }}
                    </span>
                  </div>
                  <span class="text-sm font-medium" :style="{ color: 'var(--ink-2)' }">
                    {{ t('packagesView.group.customers', { n: group.packages.length }) }}
                  </span>
                  <div
                    v-if="group.templateId"
                    class="flex items-center gap-1 text-xs font-medium"
                    :style="{ color: 'var(--primary)' }"
                  >
                    {{ t('packagesView.group.detail') }} <ChevronRight class="size-3.5" />
                  </div>
                  <ChevronDown
                    v-else
                    class="size-4 transition-transform"
                    :style="{ color: 'var(--ink-4)' }"
                    :class="manualGroupOpen ? 'rotate-180' : ''"
                  />
                </div>
              </div>

              <!-- Inline owner list (only for manual / expanded) -->
              <div
                v-if="!group.templateId && manualGroupOpen"
                class="divide-y border-t"
                :style="{ borderColor: 'var(--hairline)' }"
              >
                <div
                  v-for="p in group.packages"
                  :key="p.id"
                  class="flex flex-wrap items-center gap-3 px-4 py-2.5"
                >
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium truncate" :style="{ color: 'var(--ink-2)' }">{{ resolveCustomerName(p.customerId) }}</p>
                    <p class="text-xs" :style="{ color: 'var(--ink-4)' }">{{ packageExpiryLine(p.expiresAt) }}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="h-1.5 w-16 overflow-hidden rounded-full" :style="{ background: 'var(--surface-2)' }">
                      <div
                        class="h-full rounded-full"
                        :style="{
                          width: sessionsPercent(p) + '%',
                          background: p.expired ? 'var(--ink-4)' : p.lowOnSessions ? 'var(--warning)' : 'var(--success)'
                        }"
                      />
                    </div>
                    <span class="text-xs font-semibold tabular-nums" :style="{ color: 'var(--ink-2)' }">
                      {{ p.remainingSessions }}/{{ p.totalSessions }}
                    </span>
                    <span
                      class="pkg-pill"
                      :class="p.expired ? 'pkg-pill--expired' : p.lowOnSessions ? 'pkg-pill--low' : 'pkg-pill--active'"
                    >
                      {{ p.expired ? t('packagesView.package.statusExpired') : p.lowOnSessions ? t('packagesView.package.statusLow') : t('packagesView.package.statusActive') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>
    </template>

    <!-- ── Template Create/Edit Modal ──────────────────────────────────────── -->
    <AppModal
      v-model:visible="showTemplateModal"
      :title="editingTemplate ? t('packagesView.modal.editTemplate') : t('packagesView.modal.newTemplate')"
      :dialog-style="{ width: 'min(56rem, 95vw)' }"
    >
      <div class="template-modal">
        <!-- Form column -->
        <form class="template-modal__form" autocomplete="off" @submit.prevent="saveTemplate">
          <div class="space-y-1">
            <label class="form-label" for="tpl-name">
              {{ t('packagesView.field.name') }} <span :style="{ color: 'var(--danger)' }">*</span>
            </label>
            <input
              id="tpl-name"
              v-model="templateForm.name"
              type="text"
              name="package-template-name"
              required
              minlength="2"
              maxlength="100"
              autocomplete="off"
              autocorrect="off"
              spellcheck="false"
              :placeholder="t('packagesView.field.namePlaceholder')"
              class="form-input"
            />
          </div>

          <div class="space-y-1">
            <label class="form-label" for="tpl-service">
              {{ t('packagesView.field.service') }} <span :style="{ color: 'var(--danger)' }">*</span>
            </label>
            <select
              id="tpl-service"
              v-model.number="templateForm.serviceId"
              required
              :disabled="!!editingTemplate"
              class="form-input"
            >
              <option value="">{{ t('packagesView.field.servicePlaceholder') }}</option>
              <option v-for="s in packageEligibleServices" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
            <p v-if="!editingTemplate && packageEligibleServices.length === 0" class="form-hint">
              {{ t('packagesView.field.serviceEmptyHint') }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="form-label" for="tpl-sessions">
                {{ t('packagesView.field.sessions') }} <span :style="{ color: 'var(--danger)' }">*</span>
              </label>
              <div class="stepper">
                <button
                  type="button"
                  class="stepper__btn"
                  :disabled="templateForm.totalSessions <= 1"
                  :aria-label="t('common.decrement')"
                  @click="adjustSessions(-1)"
                >
                  <Minus class="size-3.5" />
                </button>
                <input
                  id="tpl-sessions"
                  v-model.number="templateForm.totalSessions"
                  type="number"
                  min="1"
                  max="99"
                  required
                  autocomplete="off"
                  inputmode="numeric"
                  class="stepper__input"
                />
                <button
                  type="button"
                  class="stepper__btn"
                  :disabled="templateForm.totalSessions >= 99"
                  :aria-label="t('common.increment')"
                  @click="adjustSessions(1)"
                >
                  <Plus class="size-3.5" />
                </button>
              </div>
            </div>
            <div class="space-y-1">
              <label class="form-label" for="tpl-price">
                {{ t('packagesView.field.price') }}
                <span class="font-normal" :style="{ color: 'var(--ink-4)' }">{{ t('packagesView.field.priceOptional') }}</span>
              </label>
              <div class="relative">
                <span class="form-prefix">₺</span>
                <input
                  id="tpl-price"
                  v-model.number="templateForm.price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  autocomplete="off"
                  inputmode="decimal"
                  class="form-input form-input--with-prefix"
                />
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <label class="form-label">{{ t('packagesView.field.color') }}</label>
            <div class="color-swatches" role="radiogroup" :aria-label="t('packagesView.field.color')">
              <button
                v-for="(color, i) in HERO_PALETTE"
                :key="i"
                type="button"
                class="color-swatch"
                :class="{ 'color-swatch--active': templateForm.colorIndex === i }"
                :style="{ background: color }"
                role="radio"
                :aria-checked="templateForm.colorIndex === i"
                :aria-label="`Color ${i + 1}`"
                @click="templateForm.colorIndex = i"
              />
            </div>
          </div>

          <p v-if="templateFormError" class="form-error" role="alert">{{ templateFormError }}</p>
        </form>

        <!-- Preview column -->
        <aside class="template-modal__preview">
          <p class="template-modal__preview-label">{{ t('packagesView.modal.preview') }}</p>
          <div class="package-card package-card--preview">
            <header class="package-card__hero" :style="{ background: heroColor(templateForm.colorIndex) }">
              <div class="package-card__hero-top">
                <Package class="size-5" />
              </div>
              <h3 class="package-card__name">
                {{ templateForm.name.trim() || t('packagesView.modal.previewNamePlaceholder') }}
              </h3>
              <p class="package-card__sessions">
                {{ t('packagesView.template.sessions', { n: templateForm.totalSessions || 0 }) }}
              </p>
            </header>
            <div class="package-card__body">
              <div class="package-card__price">
                <span class="package-card__price-value">
                  {{ templateForm.price != null && templateForm.price > 0 ? formatPrice(templateForm.price) : '—' }}
                </span>
                <span
                  v-if="templateForm.price != null && templateForm.price > 0 && templateForm.totalSessions > 0"
                  class="package-card__price-sub"
                >
                  {{ t('packagesView.card.perSession', { price: formatPrice(Math.round(templateForm.price / templateForm.totalSessions)) }) }}
                </span>
              </div>
              <p class="package-card__service">
                {{ resolveServicePreviewName(templateForm.serviceId) }}
              </p>
            </div>
          </div>
        </aside>
      </div>

      <template #footer>
        <AppButton variant="secondary" @click="showTemplateModal = false">{{ t('common.cancel') }}</AppButton>
        <AppButton variant="primary" :loading="templateSaving" @click="saveTemplate">{{ t('common.save') }}</AppButton>
      </template>
    </AppModal>

    <!-- ── Deactivate confirm ────────────────────────────────────────────────── -->
    <AppModal v-model:visible="showDeactivateModal" :title="t('packagesView.modal.deactivate')">
      <p class="text-sm" :style="{ color: 'var(--ink-2)' }">
        {{ t('packagesView.modal.deactivateBody', { name: toDeactivate?.name ?? '' }) }}
      </p>
      <template #footer>
        <AppButton variant="secondary" @click="showDeactivateModal = false">{{ t('packagesView.modal.confirmCancel') }}</AppButton>
        <AppButton variant="danger" :loading="deactivating" @click="doDeactivate">{{ t('packagesView.modal.confirmDeactivate') }}</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { Package, ChevronDown, ChevronRight, Plus, Minus, MoreHorizontal } from 'lucide-vue-next'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import KpiCard from '@/components/ui/KpiCard.vue'
import { fetchAllPageContent } from '@/api/client'
import { customerApi, type CustomerResponse, type PackageResponse } from '@/api/customer'
import { serviceApi, type ServiceResponse } from '@/api/service'
import { packageTemplateApi, type PackageTemplateResponse } from '@/api/packageTemplate'

const { t } = useI18n()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const businessId = computed(() => auth.user?.businessId ?? null)

// ── Data ──────────────────────────────────────────────────────────────────────
const allPackages = ref<PackageResponse[]>([])
const customers = ref<CustomerResponse[]>([])
const services = ref<ServiceResponse[]>([])
const templates = ref<PackageTemplateResponse[]>([])
const loading = ref(true)
const pageError = ref('')

// ── Filter ────────────────────────────────────────────────────────────────────
const activePackages = computed(() => allPackages.value.filter((p) => !p.expired && p.remainingSessions > 0))
const lowPackages = computed(() => allPackages.value.filter((p) => p.lowOnSessions && !p.expired))
const expiredPackages = computed(() => allPackages.value.filter((p) => p.expired))
const activeTemplatesCount = computed(() => templates.value.filter((tpl) => tpl.active).length)

// ── Group by template ─────────────────────────────────────────────────────────
const manualGroupOpen = ref(false)

interface PackageGroup {
  templateId: number | null
  name: string
  serviceId: number
  packages: PackageResponse[]
  activeCount: number
  lowCount: number
  expiredCount: number
}

const groupedByTemplate = computed<PackageGroup[]>(() => {
  const map = new Map<string, PackageGroup>()
  for (const p of allPackages.value) {
    const key = p.templateId == null ? 'manual' : String(p.templateId)
    let group = map.get(key)
    if (!group) {
      group = {
        templateId: p.templateId ?? null,
        name: p.name,
        serviceId: p.serviceId,
        packages: [],
        activeCount: 0,
        lowCount: 0,
        expiredCount: 0,
      }
      map.set(key, group)
    }
    group.packages.push(p)
    if (p.expired) group.expiredCount++
    else if (p.lowOnSessions) { group.lowCount++; group.activeCount++ }
    else group.activeCount++
  }
  return [...map.values()].sort((a, b) => b.packages.length - a.packages.length)
})

function toggleManualGroup() {
  manualGroupOpen.value = !manualGroupOpen.value
}

function goToDetail(id: number) {
  router.push({ name: 'AdminPackageDetail', params: { id } })
}

// ── Template form ─────────────────────────────────────────────────────────────
const showTemplateModal = ref(false)
const editingTemplate = ref<PackageTemplateResponse | null>(null)
const templateForm = ref({
  name: '',
  serviceId: '' as number | '',
  totalSessions: 8,
  price: null as number | null,
  colorIndex: 0,
})
const templateFormError = ref('')
const templateSaving = ref(false)

const showDeactivateModal = ref(false)
const toDeactivate = ref<PackageTemplateResponse | null>(null)
const deactivating = ref(false)

const packageEligibleServices = computed(() => services.value.filter((s) => s.packageEligible && s.active))

// ── Lookups ───────────────────────────────────────────────────────────────────
const customerMap = computed(() => {
  const m = new Map<number, string>()
  for (const c of customers.value) m.set(c.id, c.name)
  return m
})
const serviceMap = computed(() => {
  const m = new Map<number, string>()
  for (const s of services.value) m.set(s.id, s.name)
  return m
})

function resolveCustomerName(id: number): string {
  return customerMap.value.get(id) ?? t('common.customerFallback', { id })
}
function resolveServiceName(id: number): string {
  return serviceMap.value.get(id) ?? t('common.serviceFallback', { id })
}

function sessionsPercent(p: PackageResponse): number {
  if (p.totalSessions === 0) return 0
  return Math.round((p.remainingSessions / p.totalSessions) * 100)
}

function templateSaleCount(templateId: number): number {
  return allPackages.value.filter(p => p.templateId === templateId).length
}

function templateActiveCount(templateId: number): number {
  return allPackages.value.filter(p => p.templateId === templateId && !p.expired && p.remainingSessions > 0).length
}

function packageExpiryLine(iso: string | null | undefined): string {
  if (iso == null || String(iso).trim() === '') {
    return t('packagesView.package.expiryUnlimited')
  }
  const d = new Date(iso)
  const tms = d.getTime()
  if (Number.isNaN(tms) || tms === 0) {
    return t('packagesView.package.expiryUnlimited')
  }
  const formatted = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short' }).format(d)
  return t('packagesView.package.expiryUntil', { date: formatted })
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(price)
}

const HERO_PALETTE = [
  'var(--niche-beauty)',
  'var(--niche-hair)',
  'var(--niche-tattoo)',
  'var(--niche-nail)',
  'var(--niche-psych)',
  'var(--niche-diet)',
] as const

function heroColor(index: number): string {
  return HERO_PALETTE[index % HERO_PALETTE.length]
}

// ── Template CRUD ─────────────────────────────────────────────────────────────
function openTemplateModal(tpl?: PackageTemplateResponse) {
  editingTemplate.value = tpl ?? null
  const fallbackColorIndex = tpl
    ? Math.max(0, templates.value.findIndex((t) => t.id === tpl.id)) % HERO_PALETTE.length
    : templates.value.length % HERO_PALETTE.length
  templateForm.value = {
    name: tpl?.name ?? '',
    serviceId: tpl?.serviceId ?? '',
    totalSessions: tpl?.totalSessions ?? 8,
    price: tpl?.price ?? null,
    colorIndex: fallbackColorIndex,
  }
  templateFormError.value = ''
  showTemplateModal.value = true
}

function adjustSessions(delta: number) {
  const next = (templateForm.value.totalSessions || 0) + delta
  templateForm.value.totalSessions = Math.min(99, Math.max(1, next))
}

function resolveServicePreviewName(id: number | ''): string {
  if (typeof id !== 'number') return t('packagesView.modal.previewServicePlaceholder')
  return resolveServiceName(id)
}

async function saveTemplate() {
  if (!businessId.value) return
  templateFormError.value = ''
  const name = templateForm.value.name.trim()
  const totalSessions = templateForm.value.totalSessions
  const serviceId = templateForm.value.serviceId
  if (!name || name.length < 2) { templateFormError.value = t('packagesView.validation.nameMin'); return }
  if (typeof serviceId !== 'number') { templateFormError.value = t('packagesView.validation.serviceRequired'); return }
  if (!totalSessions || totalSessions < 1) { templateFormError.value = t('packagesView.validation.sessionsMin'); return }
  templateSaving.value = true
  try {
    if (editingTemplate.value) {
      await packageTemplateApi.update(editingTemplate.value.id, {
        name,
        totalSessions,
        price: templateForm.value.price ?? undefined,
      })
    } else {
      await packageTemplateApi.create({
        serviceId,
        name,
        totalSessions,
        price: templateForm.value.price ?? undefined,
      })
    }
    showTemplateModal.value = false
    await loadTemplates()
  } catch (e: unknown) {
    templateFormError.value = e instanceof Error ? e.message : t('packagesView.validation.saveFailed')
  } finally {
    templateSaving.value = false
  }
}

async function doDeactivate() {
  if (!toDeactivate.value) return
  deactivating.value = true
  try {
    await packageTemplateApi.deactivate(toDeactivate.value.id)
    showDeactivateModal.value = false
    await loadTemplates()
  } catch {
    pageError.value = t('packagesView.validation.deactivateFailed')
  } finally {
    deactivating.value = false
  }
}

// ── Data loading ──────────────────────────────────────────────────────────────
async function loadTemplates() {
  if (!businessId.value) return
  try {
    const { data } = await packageTemplateApi.list()
    templates.value = data.success && data.data ? data.data : []
  } catch {
    templates.value = []
  }
}

async function load() {
  if (!businessId.value) return
  loading.value = true
  pageError.value = ''
  try {
    const [custList, svcRes, tplRes] = await Promise.all([
      fetchAllPageContent((page, size) => customerApi.list({ page, size })),
      serviceApi.list(),
      packageTemplateApi.list(),
    ])
    customers.value = custList
    services.value = svcRes.data.success && svcRes.data.data ? svcRes.data.data : []
    templates.value = tplRes.data.success && tplRes.data.data ? tplRes.data.data : []

    if (customers.value.length > 0) {
      const pkgResults = await Promise.all(
        customers.value.map((c) => customerApi.getPackages(c.id).then((r) => r.data.data ?? [])),
      )
      allPackages.value = pkgResults.flat()
    }
  } catch {
    pageError.value = t('packagesView.errorLoad')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (businessId.value) load()
  else loading.value = false

  const createFor = route.query.createFor
  const serviceName = route.query.serviceName
  if (createFor && typeof createFor === 'string') {
    const sid = Number.parseInt(createFor, 10)
    if (!Number.isNaN(sid)) {
      openTemplateModal()
      templateForm.value.serviceId = sid
      templateForm.value.name = typeof serviceName === 'string' ? t('common.packageNameSuffix', { name: serviceName }) : ''
    }
  }
})
</script>

<style scoped>
.page-title {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ink-1);
  margin: 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--ink-3);
  margin: 0;
}

/* ── Package Card ─────────────────────────────────────────────────── */
.package-card {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.package-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in oklab, var(--primary) 25%, var(--hairline));
  box-shadow: 0 8px 24px -12px color-mix(in oklab, var(--ink-1) 18%, transparent);
}

.package-card:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.package-card__hero {
  position: relative;
  padding: 1.125rem 1.125rem 1.25rem;
  color: #ffffff;
}

.package-card__hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.625rem;
}

.package-card__menu {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
}

.package-card__menu:hover {
  background: rgba(255, 255, 255, 0.28);
}

.package-card__menu:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}

.package-card__name {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.2;
  margin: 0;
}

.package-card__sessions {
  font-size: 0.8125rem;
  opacity: 0.92;
  margin: 0.125rem 0 0;
}

.package-card__badge {
  position: absolute;
  top: 0.875rem;
  right: 3.25rem;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.2);
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.package-card__body {
  padding: 1rem 1.125rem 1.125rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.package-card__price {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.package-card__price-value {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ink-1);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

.package-card__price-sub {
  font-size: 0.75rem;
  color: var(--ink-4);
}

.package-card__service {
  font-size: 0.75rem;
  color: var(--ink-3);
  margin: 0;
}

.package-card__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  padding-top: 0.75rem;
  margin-top: 0.25rem;
  border-top: 1px solid var(--hairline);
}

.package-card__stat-value {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 1rem;
  font-weight: 700;
  color: var(--ink-1);
  font-variant-numeric: tabular-nums;
}

.package-card__stat-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--ink-4);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── Group header ─────────────────────────────────────────────────── */
.group-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.12s ease;
}

.group-header:hover {
  background: var(--surface-2);
}

.group-header:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: -2px;
}

/* ── Template Modal Layout ────────────────────────────────────────── */
.template-modal {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .template-modal {
    grid-template-columns: minmax(0, 1fr) 18rem;
    gap: 1.75rem;
  }
}

.template-modal__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.template-modal__preview {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: var(--radius-lg);
  background: color-mix(in oklab, var(--surface-2) 70%, transparent);
  border: 1px dashed var(--hairline);
}

.template-modal__preview-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--ink-4);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 0.25rem;
}

.package-card--preview {
  cursor: default;
  pointer-events: none;
}

.package-card--preview:hover {
  transform: none;
  border-color: var(--hairline);
  box-shadow: none;
}

/* ── Stepper ──────────────────────────────────────────────────────── */
.stepper {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  background: var(--surface);
  overflow: hidden;
  transition: border-color 0.12s, box-shadow 0.12s;
}

.stepper:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary) 12%, transparent);
}

.stepper__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.625rem;
  background: transparent;
  border: none;
  color: var(--ink-2);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.stepper__btn:hover:not(:disabled) {
  background: var(--surface-2);
  color: var(--ink-1);
}

.stepper__btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.stepper__btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: -2px;
}

.stepper__input {
  flex: 1;
  border: none;
  outline: none;
  text-align: center;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--ink-1);
  background: transparent;
  font-variant-numeric: tabular-nums;
  font-family: inherit;
  padding: 0.625rem 0.25rem;
  min-width: 0;
  -moz-appearance: textfield;
}

.stepper__input::-webkit-outer-spin-button,
.stepper__input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* ── Form prefix (for ₺) ─────────────────────────────────────────── */
.form-prefix {
  position: absolute;
  inset-block: 0;
  left: 0.75rem;
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: var(--ink-3);
  pointer-events: none;
  font-weight: 500;
}

.form-input--with-prefix {
  padding-left: 1.75rem;
}

/* ── Color swatches ──────────────────────────────────────────────── */
.color-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.color-swatch {
  width: 1.875rem;
  height: 1.875rem;
  border-radius: 9999px;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  position: relative;
  transition: transform 0.12s, box-shadow 0.12s;
  box-shadow: 0 0 0 1px var(--hairline);
}

.color-swatch:hover {
  transform: scale(1.08);
}

.color-swatch--active {
  border-color: var(--surface);
  box-shadow: 0 0 0 2px var(--ink-1);
}

.color-swatch:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* ── Form helpers ────────────────────────────────────────────────── */
.form-hint {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--ink-4);
}

.form-error {
  font-size: 0.875rem;
  color: var(--danger);
  margin: 0;
}

/* ── Form input (modal) ───────────────────────────────────────────── */
.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ink-2);
  margin-bottom: 0.25rem;
}

.form-input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--ink-1);
  font-size: 0.9375rem;
  font-family: inherit;
  transition: border-color 0.12s, box-shadow 0.12s;
}

.form-input::placeholder {
  color: var(--ink-4);
}

.form-input:hover:not(:disabled) {
  border-color: var(--ink-3);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary) 12%, transparent);
}

.form-input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  background: var(--surface-2);
}

select.form-input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2.5rem;
}

/* ── Pills ────────────────────────────────────────────────────────── */
.pkg-pill {
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}

.pkg-pill--active {
  background: var(--success-tint);
  color: var(--success);
}

.pkg-pill--low {
  background: var(--warning-tint);
  color: var(--warning);
}

.pkg-pill--expired {
  background: var(--surface-2);
  color: var(--ink-3);
}
</style>
