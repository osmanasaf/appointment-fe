<template>
  <div class="auth-page">
    <main class="auth-card">
      <div class="auth-header">
        <span class="auth-logo" aria-hidden="true">◇</span>
        <h1 class="auth-title">Giriş</h1>
        <p class="auth-subtitle">Randevu panelinize giriş yapın</p>
      </div>
      <form @submit.prevent="onSubmit" class="auth-form" novalidate>
        <div class="field">
          <label for="login-email">E-posta</label>
          <input
            id="login-email"
            v-model="email"
            type="email"
            name="email"
            autocomplete="email"
            required
            :aria-invalid="!!errors.email"
            :aria-describedby="errors.email ? 'login-email-error' : undefined"
          />
          <span v-if="errors.email" id="login-email-error" class="error" role="alert">{{ errors.email }}</span>
        </div>
        <div class="field">
          <label for="login-password">Şifre</label>
          <input
            id="login-password"
            v-model="password"
            type="password"
            name="password"
            autocomplete="current-password"
            required
            :aria-invalid="!!errors.password"
            :aria-describedby="errors.password ? 'login-password-error' : undefined"
          />
          <span v-if="errors.password" id="login-password-error" class="error" role="alert">{{ errors.password }}</span>
        </div>
        <p v-if="submitError" class="submit-error" role="alert">{{ submitError }}</p>
        <button type="submit" class="auth-btn" :disabled="loading">
          {{ loading ? 'Giriş yapılıyor…' : 'Giriş yap' }}
        </button>
      </form>
      <p class="auth-footer">
        Hesabınız yok mu?
        <router-link to="/register">Kayıt olun</router-link>
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errors = reactive<Record<string, string>>({})
const submitError = ref('')

function validate(): boolean {
  submitError.value = ''
  errors.email = ''
  errors.password = ''
  if (!email.value.trim()) {
    errors.email = 'E-posta giriniz'
    return false
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    errors.email = 'Geçerli bir e-posta giriniz'
    return false
  }
  if (!password.value) {
    errors.password = 'Şifre giriniz'
    return false
  }
  return true
}

async function onSubmit() {
  if (!validate()) return
  loading.value = true
  submitError.value = ''
  try {
    await auth.login({ email: email.value.trim(), password: password.value })
    const redirect = (route.query.redirect as string) || '/admin'
    await router.push(redirect)
  } catch (e: unknown) {
    submitError.value = e instanceof Error ? e.message : 'Giriş yapılamadı. Tekrar deneyin.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: var(--color-background);
}

.auth-card {
  width: 100%;
  max-width: 24rem;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border);
  padding: 2rem;
}

.auth-header {
  text-align: center;
  margin-bottom: 1.75rem;
}

.auth-logo {
  width: 3rem;
  height: 3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-lg);
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.auth-title {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.auth-subtitle {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--color-text-muted);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.auth-form .field {
  margin-bottom: 0;
}

.auth-form label {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.auth-form input {
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-family: inherit;
  width: 100%;
}

.auth-form input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.auth-form input[aria-invalid='true'] {
  border-color: var(--color-danger);
}

.auth-form .error {
  font-size: 0.875rem;
  color: var(--color-danger);
}

.submit-error {
  font-size: 0.875rem;
  color: var(--color-danger);
  margin: 0;
}

.auth-btn {
  padding: 0.75rem 1.25rem;
  font-size: 1rem;
  font-weight: 600;
  font-family: inherit;
  color: white;
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.15s;
}

.auth-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.auth-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.auth-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.auth-footer {
  margin: 1.5rem 0 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  text-align: center;
}

.auth-footer a {
  color: var(--color-primary);
  font-weight: 500;
  text-decoration: none;
}

.auth-footer a:hover {
  text-decoration: underline;
}
</style>
