<template>
  <div class="min-h-screen bg-white text-slate-900">
    <header
      class="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md"
    >
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
        <RouterLink to="/" class="flex items-center gap-2 font-semibold text-slate-900">
          <span class="flex size-9 items-center justify-center rounded-lg bg-teal-600 text-white">
            <CalendarDays class="size-4" />
          </span>
          {{ t('admin.brand') }}
        </RouterLink>
        <nav class="flex items-center gap-4 text-sm font-medium">
          <a href="#niches" class="hidden text-slate-600 transition hover:text-slate-900 sm:inline">
            {{ t('landing.navNiches') }}
          </a>
          <a href="#features" class="hidden text-slate-600 transition hover:text-slate-900 sm:inline">
            {{ t('landing.navFeatures') }}
          </a>
          <a href="#pricing" class="hidden text-slate-600 transition hover:text-slate-900 sm:inline">
            {{ t('landing.navPricing') }}
          </a>
          <a href="#faq" class="hidden text-slate-600 transition hover:text-slate-900 md:inline">
            {{ t('landing.navFaq') }}
          </a>
          <a
            :href="loginUrl"
            class="text-slate-600 transition hover:text-slate-900"
          >
            {{ t('landing.ctaLogin') }}
          </a>
          <a
            :href="registerUrl"
            class="rounded-lg bg-teal-600 px-4 py-2 text-white shadow-sm transition hover:bg-teal-700"
          >
            {{ t('landing.ctaTrial') }}
          </a>
        </nav>
      </div>
    </header>

    <HeroSection />
    <TrustedBySection />
    <NicheShowcaseSection />
    <FeaturesSection />
    <SolutionSection />
    <TestimonialsSection />
    <PricingSection />
    <CtaBannerSection />
    <FaqSection />
    <FooterSection />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CalendarDays } from 'lucide-vue-next'
import HeroSection from '@/components/landing/HeroSection.vue'
import TrustedBySection from '@/components/landing/TrustedBySection.vue'
import NicheShowcaseSection from '@/components/landing/NicheShowcaseSection.vue'
import FeaturesSection from '@/components/landing/FeaturesSection.vue'
import SolutionSection from '@/components/landing/SolutionSection.vue'
import TestimonialsSection from '@/components/landing/TestimonialsSection.vue'
import PricingSection from '@/components/landing/PricingSection.vue'
import CtaBannerSection from '@/components/landing/CtaBannerSection.vue'
import FaqSection from '@/components/landing/FaqSection.vue'
import FooterSection from '@/components/landing/FooterSection.vue'
import { usePageMeta } from '@/composables/usePageMeta'
import { useAppPublicUrl } from '@/composables/useAppPublicUrl'

const { t } = useI18n()
const { loginUrl, registerUrl } = useAppPublicUrl()

usePageMeta({
  title: t('landing.documentTitle'),
  description: 'Kuaför, güzellik merkezi, psikolog ve diyetisyen için WhatsApp entegreli online randevu ve müşteri yönetimi. Ücretsiz deneyin.',
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Randevum',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'WhatsApp entegreli online randevu ve müşteri yönetimi platformu.',
    url: 'https://randevum.pro',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'TRY',
      description: 'Ücretsiz deneme mevcut',
    },
  },
})
</script>
