<template>
  <div class="auth-page">
    <main class="auth-card">
      <div class="auth-header">
        <span class="auth-logo" aria-hidden="true">◇</span>
        <h1 class="auth-title">Kayıt</h1>
        <p class="auth-subtitle">Yeni işletme hesabı oluşturun</p>
      </div>
      <form @submit.prevent="onSubmit" class="auth-form" novalidate>
        <div class="field">
          <label for="reg-email">E-posta</label>
          <input
            id="reg-email"
            v-model="email"
            type="email"
            name="email"
            autocomplete="email"
            required
            :aria-invalid="!!errors.email"
            :aria-describedby="errors.email ? 'reg-email-error' : undefined"
          />
          <span v-if="errors.email" id="reg-email-error" class="error" role="alert">{{ errors.email }}</span>
        </div>
        <div class="field">
          <label for="reg-password">Şifre</label>
          <input
            id="reg-password"
            v-model="password"
            type="password"
            name="password"
            autocomplete="new-password"
            required
            :aria-invalid="!!errors.password"
            :aria-describedby="errors.password ? 'reg-password-error' : undefined"
          />
          <span v-if="errors.password" id="reg-password-error" class="error" role="alert">{{ errors.password }}</span>
        </div>
        <div class="field">
          <label for="reg-name">Ad Soyad</label>
          <input
            id="reg-name"
            v-model="name"
            type="text"
            name="name"
            autocomplete="name"
            required
            :aria-invalid="!!errors.name"
          />
          <span v-if="errors.name" class="error" role="alert">{{ errors.name }}</span>
        </div>
        <div class="field">
          <label for="reg-phone">Telefon (isteğe bağlı)</label>
          <input
            id="reg-phone"
            v-model="phoneNumber"
            type="tel"
            name="phone"
            autocomplete="tel"
            :aria-invalid="!!errors.phoneNumber"
          />
          <span v-if="errors.phoneNumber" class="error" role="alert">{{ errors.phoneNumber }}</span>
        </div>
        <div class="field">
          <label for="reg-business">İşletme adı</label>
          <input
            id="reg-business"
            v-model="businessName"
            type="text"
            name="businessName"
            autocomplete="organization"
            required
            :aria-invalid="!!errors.businessName"
          />
          <span v-if="errors.businessName" class="error" role="alert">{{ errors.businessName }}</span>
        </div>
        <p v-if="submitError" class="submit-error" role="alert">{{ submitError }}</p>
        <button type="submit" class="auth-btn" :disabled="loading">
          {{ loading ? 'Kayıt yapılıyor…' : 'Kayıt ol' }}
        </button>
      </form>
      <p class="auth-footer">
        Zaten hesabınız var mı?
        <router-link to="/login">Giriş yapın</router-link>
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const name = ref('')
const phoneNumber = ref('')
const businessName = ref('')
const loading = ref(false)
const errors = reactive<Record<string, string>>({})
const submitError = ref('')

function validate(): boolean {
  submitError.value = ''
  errors.email = ''
  errors.password = ''
  errors.name = ''
  errors.phoneNumber = ''
  errors.businessName = ''
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
  if (password.value.length < 6) {
    errors.password = 'Şifre en az 6 karakter olmalıdır'
    return false
  }
  if (!name.value.trim()) {
    errors.name = 'Ad soyad giriniz'
    return false
  }
  if (!businessName.value.trim()) {
    errors.businessName = 'İşletme adı giriniz'
    return false
  }
  return true
}

async function onSubmit() {
  if (!validate()) return
  loading.value = true
  submitError.value = ''
  try {
    await auth.register({
      email: email.value.trim(),
      password: password.value,
      name: name.value.trim(),
      phoneNumber: phoneNumber.value.trim() || undefined,
      businessName: businessName.value.trim(),
    })
    await router.push('/admin')
  } catch (e: unknown) {
    submitError.value = e instanceof Error ? e.message : 'Kayıt yapılamadı. Tekrar deneyin.'
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
