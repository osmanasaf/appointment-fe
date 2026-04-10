<template>
  <div class="employee-register-view">
    <div class="register-container">
      <div class="register-card">
        <h1 class="title">{{ t('auth.registerEmployeeTitle') }}</h1>
        <p class="subtitle">{{ t('auth.registerEmployeeSubtitle') }}</p>

        <form @submit.prevent="handleSubmit" class="register-form">
          <div class="form-group">
            <label for="name">{{ t('auth.name') }}</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              :placeholder="t('auth.name')"
              required
            />
            <span v-if="errors.name" class="error">{{ errors.name }}</span>
          </div>

          <div class="form-group">
            <label for="email">{{ t('auth.email') }}</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              :placeholder="t('auth.email')"
              required
            />
            <span v-if="errors.email" class="error">{{ errors.email }}</span>
          </div>

          <div class="form-group">
            <label for="password">{{ t('auth.password') }}</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              :placeholder="t('auth.password')"
              required
            />
            <span v-if="errors.password" class="error">{{ errors.password }}</span>
          </div>

          <div class="form-group">
            <label for="phone">{{ t('auth.phoneOptional') }}</label>
            <input
              id="phone"
              v-model="form.phoneNumber"
              type="tel"
              :placeholder="t('auth.phoneOptional')"
            />
          </div>

          <p v-if="submitError" class="submit-error">{{ submitError }}</p>

          <button type="submit" :disabled="loading" class="btn-submit">
            {{ loading ? t('auth.signingUp') : t('auth.signUp') }}
          </button>
        </form>

        <div class="login-link">
          {{ t('auth.hasAccount') }}
          <RouterLink to="/login">{{ t('auth.loginLink') }}</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { authApi } from '@/api/auth'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const loading = ref(false)
const submitError = ref<string | null>(null)
const inviteToken = ref<string>('')

const form = ref({
  name: '',
  email: '',
  password: '',
  phoneNumber: '',
})

const errors = ref<Record<string, string>>({})

onMounted(() => {
  inviteToken.value = (route.query.token as string) || ''
  if (!inviteToken.value) {
    submitError.value = t('auth.inviteTokenMissing')
  }
})

function validateForm(): boolean {
  errors.value = {}
  
  if (!form.value.name || form.value.name.length < 2) {
    errors.value.name = t('auth.nameRequired')
  }
  
  if (!form.value.email || !/\S+@\S+\.\S+/.test(form.value.email)) {
    errors.value.email = t('auth.emailInvalid')
  }
  
  if (!form.value.password || form.value.password.length < 6) {
    errors.value.password = t('auth.passwordMin')
  }
  
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validateForm()) return
  if (!inviteToken.value) {
    submitError.value = t('auth.inviteTokenMissing')
    return
  }
  
  loading.value = true
  submitError.value = null
  
  try {
    const { data } = await authApi.registerEmployee({
      ...form.value,
      inviteToken: inviteToken.value,
    })
    
    if (data.success) {
      router.push({ name: 'Login', query: { registered: '1' } })
    }
  } catch (err: any) {
    submitError.value = err.response?.data?.error?.message || t('auth.registerFailed')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.employee-register-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 1rem;
}

.register-container {
  width: 100%;
  max-width: 480px;
}

.register-card {
  background: white;
  border-radius: 1rem;
  padding: 2.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
  text-align: center;
}

.subtitle {
  color: #6b7280;
  text-align: center;
  margin: 0 0 2rem 0;
  font-size: 0.875rem;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-group input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.error {
  font-size: 0.75rem;
  color: #ef4444;
}

.submit-error {
  color: #ef4444;
  font-size: 0.875rem;
  text-align: center;
  margin: 0;
}

.btn-submit {
  width: 100%;
  padding: 0.875rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>
