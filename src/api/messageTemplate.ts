import { api, type ApiResponse } from './client'

export interface MessageTemplate {
  id: number
  businessId: number
  type: 'APPOINTMENT_REMINDER' | 'APPOINTMENT_CONFIRMATION' | 'APPOINTMENT_CANCELLED' | 'RESCHEDULE_REQUEST_RECEIVED'
  name: string
  headerTemplate: string | null
  bodyTemplate: string
  footerTemplate: string | null
  showConfirmButton: boolean
  showCancelButton: boolean
  showRescheduleButton: boolean
  confirmButtonText: string
  cancelButtonText: string
  rescheduleButtonText: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface MessageTemplateUpdateRequest {
  name?: string
  headerTemplate?: string | null
  bodyTemplate?: string
  footerTemplate?: string | null
  showConfirmButton?: boolean
  showCancelButton?: boolean
  showRescheduleButton?: boolean
  confirmButtonText?: string
  cancelButtonText?: string
  rescheduleButtonText?: string
}

export const messageTemplateApi = {
  getAll: () => api.get<ApiResponse<MessageTemplate[]>>('/message-templates'),

  getByType: (type: string) => api.get<ApiResponse<MessageTemplate>>(`/message-templates/type/${type}`),

  update: (id: number, data: MessageTemplateUpdateRequest) =>
    api.put<ApiResponse<MessageTemplate>>(`/message-templates/${id}`, data),

  reset: (id: number) => api.post<ApiResponse<MessageTemplate>>(`/message-templates/${id}/reset`)
}
