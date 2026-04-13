<template>
  <section
    class="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800 px-6 pb-20 pt-16 sm:pb-28 sm:pt-24 lg:px-8"
  >
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute -left-32 -top-32 size-[40rem] rounded-full bg-white/5 blur-3xl" />
      <div class="absolute -bottom-40 -right-40 size-[36rem] rounded-full bg-cyan-400/10 blur-3xl" />
      <div class="absolute right-1/4 top-1/3 size-64 rounded-full bg-teal-300/10 blur-2xl" />
    </div>

    <div class="relative mx-auto max-w-7xl">
      <div class="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div class="text-center lg:text-left">
          <p
            class="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-teal-100 backdrop-blur-sm"
          >
            <span class="size-1.5 rounded-full bg-teal-300" />
            {{ t('landing.heroEyebrow') }}
          </p>

          <h1
            class="landing-heading text-4xl text-white sm:text-5xl lg:text-6xl"
            style="white-space: pre-line"
          >
            {{ t('landing.heroTitle') }}
          </h1>

          <p class="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-teal-100 lg:mx-0">
            {{ t('landing.heroSubtitle') }}
          </p>

          <div class="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <a
              :href="registerUrl"
              class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-teal-700 shadow-lg transition hover:bg-teal-50 sm:w-auto"
            >
              {{ t('landing.ctaTrial') }}
              <ArrowRight class="size-4" />
            </a>
            <a
              href="#how-it-works"
              class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 sm:w-auto"
            >
              <Play class="size-4" />
              {{ t('landing.ctaDemo') }}
            </a>
          </div>
        </div>

        <div class="relative hidden lg:block">
          <div class="relative mx-auto w-full max-w-lg">
            <div
              class="absolute -inset-4 rounded-3xl bg-gradient-to-r from-teal-400/20 to-cyan-400/20 blur-2xl"
            />
            <div class="relative rounded-2xl bg-white/10 p-6 backdrop-blur-md">
              <div class="space-y-4">
                <div
                  v-for="(item, i) in illustrationItems"
                  :key="i"
                  class="flex items-center gap-4 rounded-xl bg-white/90 p-4 shadow-sm"
                  :class="{ 'animate-float': i === 0, 'animate-float-delayed': i === 1, 'animate-float-slow': i === 2 }"
                >
                  <div
                    class="flex size-12 shrink-0 items-center justify-center rounded-xl"
                    :class="item.bgClass"
                  >
                    <component :is="item.icon" class="size-6" :class="item.iconClass" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold text-slate-900">{{ item.title }}</p>
                    <p class="text-xs text-slate-500">{{ item.subtitle }}</p>
                  </div>
                  <div
                    class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
                    :class="item.badgeClass"
                  >
                    {{ item.badge }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ArrowRight, Play, Scissors, Sparkles, Calendar } from 'lucide-vue-next'
import { useAppPublicUrl } from '@/composables/useAppPublicUrl'

const { t } = useI18n()
const { registerUrl } = useAppPublicUrl()

const illustrationItems = [
  {
    icon: Scissors,
    bgClass: 'bg-teal-100',
    iconClass: 'text-teal-600',
    title: 'Saç Kesimi',
    subtitle: 'Bugün 14:30',
    badge: 'Onaylı',
    badgeClass: 'bg-emerald-100 text-emerald-700',
  },
  {
    icon: Sparkles,
    bgClass: 'bg-pink-100',
    iconClass: 'text-pink-600',
    title: 'Cilt Bakımı',
    subtitle: 'Yarın 10:00',
    badge: 'Bekliyor',
    badgeClass: 'bg-amber-100 text-amber-700',
  },
  {
    icon: Calendar,
    bgClass: 'bg-blue-100',
    iconClass: 'text-blue-600',
    title: 'Danışmanlık',
    subtitle: 'Cuma 16:00',
    badge: 'Yeni',
    badgeClass: 'bg-teal-100 text-teal-700',
  },
]
</script>

<style scoped>
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes float-delayed {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes float-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.animate-float {
  animation: float 4s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float-delayed 4.5s ease-in-out infinite;
  animation-delay: 0.5s;
}

.animate-float-slow {
  animation: float-slow 5s ease-in-out infinite;
  animation-delay: 1s;
}
</style>
