<template>
  <div class="staff-appointments">
    <div class="page-header">
      <h1>{{ t('staff.myAppointments') }}</h1>
      <p class="subtitle">{{ t('staff.myAppointmentsDesc') }}</p>
    </div>

    <div v-if="loading" class="loading-state">
      <p>{{ t('common.loading') }}...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="loadAppointments" class="btn-retry">{{ t('common.retry') }}</button>
    </div>

    <div v-else class="appointments-content">
      <div class="filters">
        <div class="date-range">
          <label>{{ t('appointments.startDate') }}</label>
          <input type="date" v-model="startDate" @change="loadAppointments" />
        </div>
        <div class="date-range">
          <label>{{ t('appointments.endDate') }}</label>
          <input type="date" v-model="endDate" @change="loadAppointments" />
        </div>
      </div>

      <div v-if="appointments.length === 0" class="empty-state">
        <p>{{ t('appointments.noAppointments') }}</p>
      </div>

      <div v-else class="appointments-list">
        <div
          v-for="apt in appointments"
          :key="apt.id"
          class="appointment-card"
          :class="'status-' + apt.status.toLowerCase()"
        >
          <div class="apt-header">
            <div class="apt-time">
              <span class="date">{{ formatDate(apt.scheduledAt) }}</span>
              <span class="time">{{ formatTime(apt.scheduledAt) }}</span>
            </div>
            <span class="status-badge" :class="'badge-' + apt.status.toLowerCase()">
              {{ t(`appointmentStatus.${apt.status}`) }}
            </span>
          </div>
          
          <div class="apt-body">
            <div class="info-row">
              <strong>{{ t('appointments.customer') }}:</strong>
              <span>{{ apt.customerName }}</span>
            </div>
            <div class="info-row">
              <strong>{{ t('appointments.service') }}:</strong>
              <span>{{ apt.serviceName }}</span>
            </div>
            <div v-if="apt.notes" class="info-row">
              <strong>{{ t('appointments.notes') }}:</strong>
              <span>{{ apt.notes }}</span>
            </div>
          </div>

          <div class="apt-actions">
            <button
              v-if="apt.status === 'PENDING'"
              @click="confirmAppointment(apt.id)"
              class="btn btn-confirm"
            >
              {{ t('appointments.confirm') }}
            </button>
            <button
              v-if="apt.status === 'CONFIRMED'"
              @click="completeAppointment(apt.id)"
              class="btn btn-complete"
            >
              {{ t('appointments.complete') }}
            </button>
            <button
              v-if="apt.status === 'PENDING' || apt.status === 'CONFIRMED'"
              @click="cancelAppointment(apt.id)"
              class="btn btn-cancel"
            >
              {{ t('appointments.cancel') }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="pagination.totalPages > 1" class="pagination">
        <button
          @click="loadPage(pagination.currentPage - 1)"
          :disabled="pagination.currentPage === 0"
          class="btn-page"
        >
          {{ t('common.previous') }}
        </button>
        <span class="page-info">
          {{ pagination.currentPage + 1 }} / {{ pagination.totalPages }}
        </span>
        <button
          @click="loadPage(pagination.currentPage + 1)"
          :disabled="pagination.currentPage >= pagination.totalPages - 1"
          class="btn-page"
        >
          {{ t('common.next') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { appointmentApi, type AppointmentResponse } from '@/api/appointment'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const { showSuccess, showError } = useToast()

const loading = ref(false)
const error = ref<string | null>(null)
const appointments = ref<AppointmentResponse[]>([])
const startDate = ref<string>('')
const endDate = ref<string>('')
const pagination = ref({
  currentPage: 0,
  totalPages: 1,
  pageSize: 20,
})

onMounted(() => {
  loadAppointments()
})

async function loadAppointments() {
  loading.value = true
  error.value = null
  try {
    const params: any = {
      page: pagination.value.currentPage,
      size: pagination.value.pageSize,
    }
    if (startDate.value) params.startDate = startDate.value
    if (endDate.value) params.endDate = endDate.value

    const { data } = await appointmentApi.list(params)
    if (data.success && data.data) {
      appointments.value = data.data.content
      pagination.value = {
        currentPage: data.data.currentPage,
        totalPages: data.data.totalPages,
        pageSize: data.data.pageSize,
      }
    }
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || t('common.errorOccurred')
  } finally {
    loading.value = false
  }
}

async function loadPage(page: number) {
  pagination.value.currentPage = page
  await loadAppointments()
}

async function confirmAppointment(id: number) {
  try {
    const { data } = await appointmentApi.confirm(id)
    if (data.success) {
      showSuccess(t('appointments.confirmSuccess'))
      await loadAppointments()
    }
  } catch (err: any) {
    showError(err.response?.data?.error?.message || t('common.errorOccurred'))
  }
}

async function completeAppointment(id: number) {
  try {
    const { data } = await appointmentApi.complete(id)
    if (data.success) {
      showSuccess(t('appointments.completeSuccess'))
      await loadAppointments()
    }
  } catch (err: any) {
    showError(err.response?.data?.error?.message || t('common.errorOccurred'))
  }
}

async function cancelAppointment(id: number) {
  if (!confirm(t('appointments.cancelConfirm'))) return
  try {
    const { data } = await appointmentApi.cancel(id)
    if (data.success) {
      showSuccess(t('appointments.cancelSuccess'))
      await loadAppointments()
    }
  } catch (err: any) {
    showError(err.response?.data?.error?.message || t('common.errorOccurred'))
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
</script>

<style scoped>
.staff-appointments {
  max-width: 1024px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  color: #6b7280;
  font-size: 0.875rem;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.btn-retry {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.date-range {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date-range label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.date-range input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.appointments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.appointment-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.apt-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.apt-time {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.apt-time .date {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.apt-time .time {
  font-size: 0.875rem;
  color: #6b7280;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-pending {
  background: #fef3c7;
  color: #92400e;
}

.badge-confirmed {
  background: #dbeafe;
  color: #1e40af;
}

.badge-completed {
  background: #d1fae5;
  color: #065f46;
}

.badge-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.apt-body {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.info-row strong {
  color: #374151;
  min-width: 80px;
}

.info-row span {
  color: #6b7280;
}

.apt-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirm {
  background: #10b981;
  color: white;
}

.btn-confirm:hover {
  background: #059669;
}

.btn-complete {
  background: #3b82f6;
  color: white;
}

.btn-complete:hover {
  background: #2563eb;
}

.btn-cancel {
  background: #ef4444;
  color: white;
}

.btn-cancel:hover {
  background: #dc2626;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-page {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: #6b7280;
}
</style>
