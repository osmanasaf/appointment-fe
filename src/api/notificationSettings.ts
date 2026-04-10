import { api, type ApiResponse } from './client'

export interface NotificationSettings {
  whatsappEnabled: boolean
  whatsappReminderEnabled: boolean
  whatsappConfirmationEnabled: boolean
  whatsappCancellationEnabled: boolean
  smsEnabled: boolean
  smsFallbackEnabled: boolean
  reminderHoursBefore: number
  secondReminderEnabled: boolean
  secondReminderHoursBefore: number | null
  // Plan özellikleri
  whatsappAvailable: boolean
  smsAvailable: boolean
  whatsappLimit: number
  smsLimit: number
  // Kullanım
  whatsappUsed: number
  smsUsed: number
  whatsappRemaining: number
  smsRemaining: number
}

export interface UpdateNotificationSettingsRequest {
  whatsappEnabled: boolean
  whatsappReminderEnabled: boolean
  whatsappConfirmationEnabled: boolean
  whatsappCancellationEnabled: boolean
  smsEnabled: boolean
  smsFallbackEnabled: boolean
  reminderHoursBefore: number
  secondReminderEnabled: boolean
  secondReminderHoursBefore: number | null
}

export interface QuotaResponse {
  whatsappUsed: number
  whatsappLimit: number
  whatsappRemaining: number
  smsUsed: number
  smsLimit: number
  smsRemaining: number
}

export const notificationSettingsApi = {
  getSettings: () =>
    api.get<ApiResponse<NotificationSettings>>('/notification-settings'),

  updateSettings: (data: UpdateNotificationSettingsRequest) =>
    api.put<ApiResponse<NotificationSettings>>('/notification-settings', data),

  getQuota: () =>
    api.get<ApiResponse<QuotaResponse>>('/notification-settings/quota')
}
