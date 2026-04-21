import type { AppointmentResponse } from '@/api/appointment'
import type { CustomerResponse } from '@/api/customer'
import type { EmployeeResponse } from '@/api/employee'
import type { ServiceResponse } from '@/api/service'

export interface CalendarLookupMaps {
  customers: Map<number, CustomerResponse>
  employees: Map<number, EmployeeResponse>
  services: Map<number, ServiceResponse>
}

export interface ResolvedAppointmentMeta {
  customerName: string
  serviceName: string
  employeeName: string
  customerPhone: string | null
}

export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return formatLocalDate(a) === formatLocalDate(b)
}

export function localDateKeyOfIso(iso: string): string {
  return formatLocalDate(new Date(iso))
}

const INITIALS_MAX_CHARS = 2

export function getInitials(name: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, INITIALS_MAX_CHARS)
    .toUpperCase()
}

export function buildLookupMaps(
  customers: CustomerResponse[],
  employees: EmployeeResponse[],
  services: ServiceResponse[],
): CalendarLookupMaps {
  return {
    customers: new Map(customers.map((c) => [c.id, c])),
    employees: new Map(employees.map((e) => [e.id, e])),
    services: new Map(services.map((s) => [s.id, s])),
  }
}

const MS_PER_MINUTE = 60_000
const FALLBACK_DURATION_MINUTES = 60

export function getAppointmentDurationMinutes(appointment: AppointmentResponse): number {
  if (appointment.durationMinutes && appointment.durationMinutes > 0) {
    return appointment.durationMinutes
  }
  if (appointment.endAt && appointment.scheduledAt) {
    const start = new Date(appointment.scheduledAt).getTime()
    const end = new Date(appointment.endAt).getTime()
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
      return Math.round((end - start) / MS_PER_MINUTE)
    }
  }
  return FALLBACK_DURATION_MINUTES
}

export interface FallbackLabelResolvers {
  customer: (id: number) => string
  employee: (id: number) => string
  service: (id: number) => string
}

export function resolveAppointmentMeta(
  appointment: AppointmentResponse,
  lookups: CalendarLookupMaps,
  fallbacks: FallbackLabelResolvers,
): ResolvedAppointmentMeta {
  const customer = lookups.customers.get(appointment.customerId)
  const employee = lookups.employees.get(appointment.employeeId)
  const service = lookups.services.get(appointment.serviceId)

  return {
    customerName: customer?.name ?? fallbacks.customer(appointment.customerId),
    serviceName: service?.name ?? fallbacks.service(appointment.serviceId),
    employeeName: employee?.name ?? fallbacks.employee(appointment.employeeId),
    customerPhone: customer?.phoneNumber ?? null,
  }
}
