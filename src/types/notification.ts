export type NotificationKind =
  | 'appointment_created'
  | 'appointment_cancelled'
  | 'reminder_sent'
  | 'payment_received'
  | 'system'

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'danger'

export interface NotificationItem {
  id: string
  kind: NotificationKind
  severity: NotificationSeverity
  title: string
  body?: string
  bodyParams?: Record<string, string | number>
  createdAt: string
  read: boolean
  actionLabel?: string
  actionRoute?: string
}
