<template>
  <footer class="border-t border-slate-200 bg-slate-900 px-6 py-12 lg:px-8">
    <div class="mx-auto max-w-6xl">
      <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div class="sm:col-span-2 lg:col-span-1">
          <RouterLink to="/" class="flex items-center gap-2 text-white">
            <span class="flex size-9 items-center justify-center rounded-lg bg-teal-600">
              <CalendarDays class="size-4 text-white" />
            </span>
            <span class="font-semibold">{{ t('admin.brand') }}</span>
          </RouterLink>
          <p class="mt-4 text-sm text-slate-400">
            {{ t('landing.footerTagline') }}
          </p>
        </div>

        <div>
          <p class="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {{ t('landing.footerProduct') }}
          </p>
          <nav class="flex flex-col gap-2.5 text-sm">
            <a href="#features" class="text-slate-400 transition hover:text-white">
              {{ t('landing.footerFeatures') }}
            </a>
            <a href="#niches" class="text-slate-400 transition hover:text-white">
              {{ t('landing.navNiches') }}
            </a>
            <a href="#faq" class="text-slate-400 transition hover:text-white">
              {{ t('landing.footerFaq') }}
            </a>
          </nav>
        </div>

        <div>
          <p class="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {{ t('landing.footerCompany') }}
          </p>
          <nav class="flex flex-col gap-2.5 text-sm">
            <RouterLink to="/register" class="text-slate-400 transition hover:text-white">
              {{ t('landing.footerRegister') }}
            </RouterLink>
            <RouterLink to="/login" class="text-slate-400 transition hover:text-white">
              {{ t('landing.footerLogin') }}
            </RouterLink>
          </nav>
        </div>

        <div>
          <p class="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {{ t('landing.footerLegal') }}
          </p>
          <nav class="flex flex-col gap-2.5 text-sm">
            <a href="#" class="text-slate-400 transition hover:text-white">
              {{ t('landing.footerPrivacy') }}
            </a>
            <a href="#" class="text-slate-400 transition hover:text-white">
              {{ t('landing.footerTerms') }}
            </a>
            <a href="#" class="text-slate-400 transition hover:text-white">
              {{ t('landing.footerKvkk') }}
            </a>
          </nav>
        </div>
      </div>

      <div class="mt-12 border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
        {{ t('landing.footerCopyright', { year: currentYear }) }}
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CalendarDays } from 'lucide-vue-next'

const { t } = useI18n()

const currentYear = new Date().getFullYear()
</script>
