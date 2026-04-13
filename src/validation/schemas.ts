import { z } from 'zod'

// ── Ortak alanlar ────────────────────────────────────────────────────────────

/** Türkiye cep numarası: 5 ile başlayan 10 hane (başında 0 olmadan). */
const phoneSchema = z
  .string()
  .min(1, 'Telefon numarası zorunludur')
  .regex(/^5\d{9}$/, 'Geçerli bir telefon numarası girin (örn: 5321234567)')

const emailSchema = z
  .string()
  .email('Geçerli bir e-posta adresi girin')

const optionalEmail = z
  .string()
  .email('Geçerli bir e-posta adresi girin')
  .optional()
  .or(z.literal(''))
  .transform((v) => (v === '' ? undefined : v))

const requiredString = (field: string, min = 1, max?: number) => {
  let schema = z.string().min(min, `${field} zorunludur`)
  if (max) schema = schema.max(max, `${field} en fazla ${max} karakter olabilir`)
  return schema
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Şifre zorunludur'),
})

export const registerSchema = z
  .object({
    name: requiredString('Ad Soyad', 2, 100),
    email: emailSchema,
    password: z
      .string()
      .min(8, 'Şifre en az 8 karakter olmalıdır')
      .regex(/[A-Z]/, 'En az bir büyük harf içermelidir')
      .regex(/[0-9]/, 'En az bir rakam içermelidir'),
    confirmPassword: z.string().min(1, 'Şifre tekrarı zorunludur'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  })

// ── Customer ─────────────────────────────────────────────────────────────────

export const createCustomerSchema = z.object({
  name: requiredString('Ad Soyad', 2, 100),
  phoneNumber: phoneSchema,
  phoneCountryCode: z.string().optional().default('+90'),
  email: optionalEmail,
  notes: z.string().max(500, 'Not en fazla 500 karakter olabilir').optional(),
  address: z.string().max(300, 'Adres en fazla 300 karakter olabilir').optional(),
  nationalId: z.string().optional(),
})

export const updateCustomerSchema = z.object({
  name: requiredString('Ad Soyad', 2, 100),
  email: optionalEmail,
  notes: z.string().max(500, 'Not en fazla 500 karakter olabilir').optional(),
  address: z.string().max(300, 'Adres en fazla 300 karakter olabilir').optional(),
  nationalId: z.string().optional(),
})

export const blacklistCustomerSchema = z.object({
  reason: requiredString('Kara liste sebebi', 1, 500),
})

// ── Service ──────────────────────────────────────────────────────────────────

export const createServiceSchema = z.object({
  name: requiredString('Hizmet adı', 1, 100),
  description: z
    .string()
    .max(500, 'Açıklama en fazla 500 karakter olabilir')
    .optional(),
  durationMinutes: z
    .number({ invalid_type_error: 'Süre sayı olmalıdır' })
    .min(5, 'Süre en az 5 dakika olmalıdır')
    .max(480, 'Süre en fazla 8 saat olabilir'),
  bufferBeforeMinutes: z.number().min(0).max(60).optional().default(0),
  bufferAfterMinutes: z.number().min(0).max(60).optional().default(0),
  price: z
    .number({ invalid_type_error: 'Fiyat sayı olmalıdır' })
    .min(0, 'Fiyat 0 veya daha büyük olmalıdır')
    .optional()
    .default(0),
  requiresConfirmation: z.boolean().optional().default(false),
  sameDayBookingAllowed: z.boolean().optional().default(true),
  packageEligible: z.boolean().optional().default(false),
})

export const updateServiceSchema = createServiceSchema

// ── Employee ─────────────────────────────────────────────────────────────────

export const createEmployeeSchema = z.object({
  name: requiredString('Çalışan adı', 2, 100),
  phoneNumber: phoneSchema.optional().or(z.literal('')).transform((v) => v === '' ? undefined : v),
  phoneCountryCode: z.string().optional().default('+90'),
  email: optionalEmail,
  title: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  owner: z.boolean().optional().default(false),
})

export const updateEmployeeSchema = z.object({
  name: requiredString('Çalışan adı', 2, 100),
  phoneNumber: phoneSchema.optional().or(z.literal('')).transform((v) => v === '' ? undefined : v),
  title: z.string().max(100).optional(),
  email: optionalEmail,
  bio: z.string().max(500).optional(),
  experienceYears: z.number().min(0).max(50).optional(),
  acceptsOnlineBooking: z.boolean().optional().default(true),
})

// ── Appointment (admin/staff create) ─────────────────────────────────────────

export const createStaffAppointmentSchema = z.object({
  employeeId: z
    .number({ invalid_type_error: 'Çalışan seçiniz' })
    .positive('Çalışan seçiniz'),
  serviceId: z
    .number({ invalid_type_error: 'Hizmet seçiniz' })
    .positive('Hizmet seçiniz'),
  scheduledAt: z.string().min(1, 'Tarih ve saat seçiniz'),
  customerName: requiredString('Müşteri adı', 2, 100),
  phoneNumber: phoneSchema,
  phoneCountryCode: z.string().optional().default('+90'),
  notes: z.string().max(500).optional(),
  source: z.enum(['PHONE', 'WALK_IN']).default('PHONE'),
})

export const cancelAppointmentSchema = z.object({
  reason: z.string().max(500, 'Sebep en fazla 500 karakter olabilir').optional(),
})

// ── Public Booking (müşteri bilgisi adımı) ───────────────────────────────────

export const publicBookingCustomerSchema = z.object({
  customerName: requiredString('Ad Soyad', 2, 100),
  customerPhone: phoneSchema,
  customerEmail: optionalEmail,
  customerNotes: z
    .string()
    .max(500, 'Not en fazla 500 karakter olabilir')
    .optional(),
})

// ── Business Onboarding ──────────────────────────────────────────────────────

export const businessOnboardingSchema = z.object({
  name: requiredString('İşletme adı', 2, 100),
  phoneNumber: phoneSchema,
  address: z.string().max(300).optional(),
  description: z.string().max(500).optional(),
})

// ── Types (inference) ─────────────────────────────────────────────────────────

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type CreateCustomerFormData = z.infer<typeof createCustomerSchema>
export type UpdateCustomerFormData = z.infer<typeof updateCustomerSchema>
export type BlacklistCustomerFormData = z.infer<typeof blacklistCustomerSchema>
export type CreateServiceFormData = z.infer<typeof createServiceSchema>
export type UpdateServiceFormData = z.infer<typeof updateServiceSchema>
export type CreateEmployeeFormData = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeFormData = z.infer<typeof updateEmployeeSchema>
export type CreateStaffAppointmentFormData = z.infer<typeof createStaffAppointmentSchema>
export type CancelAppointmentFormData = z.infer<typeof cancelAppointmentSchema>
export type PublicBookingCustomerFormData = z.infer<typeof publicBookingCustomerSchema>
export type BusinessOnboardingFormData = z.infer<typeof businessOnboardingSchema>
