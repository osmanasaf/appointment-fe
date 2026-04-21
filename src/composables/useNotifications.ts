import { ref, computed } from 'vue'
import type { NotificationItem } from '@/types/notification'

// Mock veri sağlayıcısı. Production'da backend API ile değiştirilecek.
// TODO: Backend entegrasyonu için /api/v1/notifications endpoint kullan

const items = ref<NotificationItem[]>([])

function seedMockData(): void {
  const now = Date.now()
  items.value = [
    {
      id: '1',
      kind: 'appointment_created',
      severity: 'info',
      title: 'notifications.kinds.appointment_created.title',
      body: 'notifications.kinds.appointment_created.body',
      bodyParams: { customer: 'Ayşe Yılmaz', time: '15:30' },
      createdAt: new Date(now - 1000 * 60 * 2).toISOString(),
      read: false,
      actionLabel: 'notifications.actions.viewAppointment',
      actionRoute: 'Appointments',
    },
    {
      id: '2',
      kind: 'payment_received',
      severity: 'success',
      title: 'notifications.kinds.payment_received.title',
      body: 'notifications.kinds.payment_received.body',
      bodyParams: { customer: 'Mehmet Kaya', amount: '500₺' },
      createdAt: new Date(now - 1000 * 60 * 45).toISOString(),
      read: false,
      actionLabel: 'notifications.actions.viewCustomer',
      actionRoute: 'Customers',
    },
    {
      id: '3',
      kind: 'appointment_cancelled',
      severity: 'warning',
      title: 'notifications.kinds.appointment_cancelled.title',
      body: 'notifications.kinds.appointment_cancelled.body',
      bodyParams: { customer: 'Zeynep Demir' },
      createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
      read: false,
      actionLabel: 'notifications.actions.viewAppointment',
      actionRoute: 'Appointments',
    },
    {
      id: '4',
      kind: 'reminder_sent',
      severity: 'info',
      title: 'notifications.kinds.reminder_sent.title',
      body: 'notifications.kinds.reminder_sent.body',
      bodyParams: { count: '12' },
      createdAt: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
      read: true,
    },
    {
      id: '5',
      kind: 'appointment_created',
      severity: 'info',
      title: 'notifications.kinds.appointment_created.title',
      body: 'notifications.kinds.appointment_created.body',
      bodyParams: { customer: 'Ali Yılmaz', time: '10:00' },
      createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
      read: true,
      actionLabel: 'notifications.actions.viewAppointment',
      actionRoute: 'Appointments',
    },
    {
      id: '6',
      kind: 'system',
      severity: 'danger',
      title: 'notifications.kinds.system.title',
      body: 'notifications.kinds.system.body',
      bodyParams: { message: 'Sistem bakımı: Bugün 22:00 - 23:00 arası servisimiz kısa süreli kesintiye uğrayacaktır.' },
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
      read: true,
    },
    {
      id: '7',
      kind: 'appointment_created',
      severity: 'info',
      title: 'notifications.kinds.appointment_created.title',
      body: 'notifications.kinds.appointment_created.body',
      bodyParams: { customer: 'Fatma Şahin', time: '14:30' },
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 2 - 1000 * 60 * 30).toISOString(),
      read: true,
      actionLabel: 'notifications.actions.viewAppointment',
      actionRoute: 'Appointments',
    },
    {
      id: '8',
      kind: 'payment_received',
      severity: 'success',
      title: 'notifications.kinds.payment_received.title',
      body: 'notifications.kinds.payment_received.body',
      bodyParams: { customer: 'Can Arslan', amount: '800₺' },
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
      read: true,
      actionLabel: 'notifications.actions.viewCustomer',
      actionRoute: 'Customers',
    },
  ]
}

seedMockData()

export function useNotifications() {
  const unreadCount = computed(() => items.value.filter((n) => !n.read).length)

  function markAsRead(id: string): void {
    const item = items.value.find((n) => n.id === id)
    if (item) {
      item.read = true
    }
  }

  function markAllAsRead(): void {
    items.value.forEach((n) => {
      n.read = true
    })
  }

  function dismiss(id: string): void {
    const index = items.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      items.value.splice(index, 1)
    }
  }

  function refresh(): void {
    // Mock için yeniden seed
    seedMockData()
  }

  return {
    items,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismiss,
    refresh,
  }
}
