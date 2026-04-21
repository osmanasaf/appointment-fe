<template>
  <div class="verified-view">
    <div class="verified-card">
      <div v-if="state === 'loading'" class="loading-state">
        <span class="spinner" aria-hidden="true" />
        <p>{{ t('auth.verifyEmailWorking') }}</p>
      </div>

      <template v-else-if="state === 'success'">
        <div class="icon-container icon-container--success">
          <CheckCircle class="icon" aria-hidden="true" />
        </div>
        <h1 class="display-md">{{ t('auth.emailVerified.title') }}</h1>
        <p class="body">{{ t('auth.emailVerified.subtitle') }}</p>
        <RouterLink to="/login" class="success-btn">
          {{ t('auth.emailVerified.continue') }}
        </RouterLink>
      </template>

      <template v-else>
        <div class="icon-container icon-container--error">
          <AlertCircle class="icon" aria-hidden="true" />
        </div>
        <h1 class="display-md">{{ t('auth.verifyErrorTitle') }}</h1>
        <p class="error-message">{{ errorMessage }}</p>
        <div class="action-buttons">
          <RouterLink to="/register" class="primary-btn">
            {{ t('auth.registerLink') }}
          </RouterLink>
          <RouterLink to="/login" class="secondary-link">
            {{ t('auth.backToLogin') }}
          </RouterLink>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { CheckCircle, AlertCircle } from 'lucide-vue-next'
import axios from 'axios'
import { authApi } from '@/api/auth'
import type { ApiResponse } from '@/api/client'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

type VerifyState = 'loading' | 'success' | 'error'
const state = ref<VerifyState>('loading')
const errorMessage = ref('')

onMounted(async () => {
  if (route.path === '/auth/verified') {
    state.value = 'success'
    return
  }
  const tokenParam = route.query.token
  const token = typeof tokenParam === 'string' ? tokenParam.trim() : ''
  if (!token) {
    state.value = 'error'
    errorMessage.value = t('auth.verifyMissingToken')
    return
  }
  try {
    const { data } = await authApi.verifyEmail(token)
    if (data.success) {
      await router.replace('/auth/verified')
      return
    } else {
      state.value = 'error'
      errorMessage.value = data.error?.message ?? t('auth.verifyErrorGeneric')
    }
  } catch (e: unknown) {
    state.value = 'error'
    if (axios.isAxiosError(e)) {
      const body = e.response?.data as ApiResponse<unknown> | undefined
      errorMessage.value = body?.error?.message ?? t('auth.verifyErrorGeneric')
    } else {
      errorMessage.value = t('auth.verifyErrorGeneric')
    }
  }
})
</script>

<style scoped>
.verified-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
  background: var(--bg);
}

.verified-card {
  width: 100%;
  max-width: 28rem;
  padding: 2rem;
  border: 0.5px solid var(--hairline);
  border-radius: var(--r-xl);
  background: var(--surface);
  box-shadow: var(--shadow-1);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
}

.loading-state p {
  font-size: 0.875rem;
  color: var(--ink-3);
}

.spinner {
  display: block;
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid var(--primary-tint);
  border-top-color: var(--primary);
  border-radius: 9999px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.icon-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.icon-container .icon {
  width: 3.5rem;
  height: 3.5rem;
  padding: 1rem;
  border-radius: var(--r-lg);
}

.icon-container--success .icon {
  background: var(--success-tint);
  color: var(--success);
}

.icon-container--error .icon {
  background: var(--danger-tint);
  color: var(--danger);
}

.display-md {
  text-align: center;
  color: var(--ink-1);
  margin: 0 0 0.75rem 0;
}

.body {
  text-align: center;
  color: var(--ink-3);
  line-height: 1.6;
  margin: 0 0 2rem 0;
}

.error-message {
  margin: 0 0 2rem 0;
  text-align: center;
  font-size: 0.875rem;
  color: var(--danger);
}

.success-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: var(--r-md);
  background: var(--primary);
  color: var(--surface);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  box-shadow: var(--shadow-1);
  transition: background-color 0.15s, box-shadow 0.15s;
}

.success-btn:hover {
  background: var(--primary-pressed);
  box-shadow: var(--shadow-2);
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.primary-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: var(--r-md);
  background: var(--primary);
  color: var(--surface);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  box-shadow: var(--shadow-1);
  transition: background-color 0.15s, box-shadow 0.15s;
}

.primary-btn:hover {
  background: var(--primary-pressed);
  box-shadow: var(--shadow-2);
}

.secondary-link {
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ink-3);
  text-decoration: none;
  transition: color 0.15s;
}

.secondary-link:hover {
  color: var(--ink-1);
  text-decoration: underline;
  text-decoration-skip-ink: auto;
}
</style>
