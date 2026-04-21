import { z } from 'zod'

const PHONE_TR_LOCAL = /^5\d{9}$/
const PHONE_E164 = /^\+[1-9]\d{6,14}$/
const PHONE_FLEXIBLE = /^(\+[1-9]\d{6,14}|5\d{9})$/

const PASSWORD_MIN = 8
const PASSWORD_MAX = 128
const NAME_MIN = 2
const NAME_MAX = 100
const EMAIL_MAX = 254
const NOTES_MAX = 500
const ADDRESS_MAX = 300
const BIO_MAX = 500
const TITLE_MAX = 100

const NATIONAL_ID_REGEX = /^\d{11}$/

const phoneSchema = z
  .string()
  .min(1, 'Telefon numarası zorunludur')
  .regex(PHONE_FLEXIBLE, 'Geçerli bir telefon numarası girin (örn: 5321234567 veya +905321234567)')

const optionalPhone = z
  .string()
  .optional()
  .or(z.literal(''))
  .transform((v) => (v == null || v === '' ? undefined : v))
  .refine((v) => v === undefined || PHONE_FLEXIBLE.test(v), {
    message: 'Geçerli bir telefon numarası girin (örn: 5321234567 veya +905321234567)',
  })

const emailSchema = z
  .string()
  .min(1, 'E-posta zorunludur')
  .max(EMAIL_MAX, `E-posta en fazla ${EMAIL_MAX} karakter olabilir`)
  .email('Geçerli bir e-posta adresi girin')

const optionalEmail = z
  .string()
  .max(EMAIL_MAX, `E-posta en fazla ${EMAIL_MAX} karakter olabilir`)
  .email('Geçerli bir e-posta adresi girin')
  .optional()
  .or(z.literal(''))
  .transform((v) => (v === '' ? undefined : v))

const strongPasswordSchema = z
  .string()
  .min(PASSWORD_MIN, `Şifre en az ${PASSWORD_MIN} karakter olmalıdır`)
  .max(PASSWORD_MAX, `Şifre en fazla ${PASSWORD_MAX} karakter olabilir`)
  .regex(/[A-Z]/, 'En az bir büyük harf içermelidir')
  .regex(/[0-9]/, 'En az bir rakam içermelidir')

const requiredString = (field: string, min = 1, max?: number) => {
  let schema = z.string().min(min, `${field} zorunludur`)
  if (max) schema = schema.max(max, `${field} en fazla ${max} karakter olabilir`)
  return schema
}

const nameSchema = requiredString('Ad Soyad', NAME_MIN, NAME_MAX)

const optionalNationalId = z
  .string()
  .optional()
  .or(z.literal(''))
  .transform((v) => (v == null || v === '' ? undefined : v))
  .refine((v) => v === undefined || NATIONAL_ID_REGEX.test(v), {
    message: 'TC kimlik numarası 11 rakamdan oluşmalıdır',
  })

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Şifre zorunludur').max(PASSWORD_MAX),
})

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    phoneNumber: optionalPhone,
    businessName: requiredString('İşletme adı', NAME_MIN, NAME_MAX),
    businessCategory: requiredString('İşletme kategorisi'),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Şifre tekrarı zorunludur'),
    termsAccepted: z.boolean().refine((v) => v === true, {
      message: 'Devam etmek için sözleşmeyi onaylayın',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  })

export const registerEmployeeSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    phoneNumber: optionalPhone,
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Şifre tekrarı zorunludur'),
    inviteToken: requiredString('Davet kodu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  })

export const forgotPasswordEmailSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z
  .object({
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Şifre tekrarı zorunludur'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  })

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mevcut şifrenizi giriniz'),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Şifre tekrarı zorunludur'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Yeni şifre mevcut şifre ile aynı olamaz',
    path: ['newPassword'],
  })

export const otpSchema = z.object({
  email: emailSchema,
  otp: z
    .string()
    .min(6, 'Doğrulama kodu 6 haneli olmalıdır')
    .max(6, 'Doğrulama kodu 6 haneli olmalıdır')
    .regex(/^\d{6}$/, 'Doğrulama kodu sadece rakamlardan oluşmalıdır'),
})

export const createCustomerSchema = z.object({
  name: nameSchema,
  phoneNumber: phoneSchema,
  phoneCountryCode: z.string().optional().default('+90'),
  email: optionalEmail,
  notes: z.string().max(NOTES_MAX, `Not en fazla ${NOTES_MAX} karakter olabilir`).optional(),
  address: z.string().max(ADDRESS_MAX, `Adres en fazla ${ADDRESS_MAX} karakter olabilir`).optional(),
  nationalId: optionalNationalId,
})

export const updateCustomerSchema = z.object({
  name: nameSchema,
  email: optionalEmail,
  notes: z.string().max(NOTES_MAX, `Not en fazla ${NOTES_MAX} karakter olabilir`).optional(),
  address: z.string().max(ADDRESS_MAX, `Adres en fazla ${ADDRESS_MAX} karakter olabilir`).optional(),
  nationalId: optionalNationalId,
})

export const blacklistCustomerSchema = z.object({
  reason: requiredString('Kara liste sebebi', 1, 500),
})

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
    .max(1_000_000, 'Fiyat çok yüksek')
    .optional()
    .default(0),
  requiresConfirmation: z.boolean().optional().default(false),
  sameDayBookingAllowed: z.boolean().optional().default(true),
  packageEligible: z.boolean().optional().default(false),
})

export const updateServiceSchema = createServiceSchema

export const createEmployeeSchema = z.object({
  name: requiredString('Çalışan adı', NAME_MIN, NAME_MAX),
  phoneNumber: optionalPhone,
  phoneCountryCode: z.string().optional().default('+90'),
  email: optionalEmail,
  title: z.string().max(TITLE_MAX, `Ünvan en fazla ${TITLE_MAX} karakter olabilir`).optional(),
  bio: z.string().max(BIO_MAX, `Biyografi en fazla ${BIO_MAX} karakter olabilir`).optional(),
  owner: z.boolean().optional().default(false),
})

export const updateEmployeeSchema = z.object({
  name: requiredString('Çalışan adı', NAME_MIN, NAME_MAX),
  phoneNumber: optionalPhone,
  title: z.string().max(TITLE_MAX, `Ünvan en fazla ${TITLE_MAX} karakter olabilir`).optional(),
  email: optionalEmail,
  bio: z.string().max(BIO_MAX, `Biyografi en fazla ${BIO_MAX} karakter olabilir`).optional(),
  experienceYears: z.number().min(0).max(80).optional(),
  acceptsOnlineBooking: z.boolean().optional().default(true),
})

export const createStaffAppointmentSchema = z.object({
  employeeId: z
    .number({ invalid_type_error: 'Çalışan seçiniz' })
    .positive('Çalışan seçiniz'),
  serviceId: z
    .number({ invalid_type_error: 'Hizmet seçiniz' })
    .positive('Hizmet seçiniz'),
  scheduledAt: z.string().min(1, 'Tarih ve saat seçiniz'),
  customerName: nameSchema,
  phoneNumber: phoneSchema,
  phoneCountryCode: z.string().optional().default('+90'),
  notes: z.string().max(NOTES_MAX, `Not en fazla ${NOTES_MAX} karakter olabilir`).optional(),
  source: z.enum(['PHONE', 'WALK_IN']).default('PHONE'),
})

export const cancelAppointmentSchema = z.object({
  reason: z.string().max(NOTES_MAX, `Sebep en fazla ${NOTES_MAX} karakter olabilir`).optional(),
})

export const publicBookingCustomerSchema = z.object({
  customerName: nameSchema,
  customerPhone: phoneSchema,
  customerEmail: optionalEmail,
  customerNotes: z
    .string()
    .max(NOTES_MAX, `Not en fazla ${NOTES_MAX} karakter olabilir`)
    .optional(),
})

export const businessOnboardingSchema = z.object({
  name: requiredString('İşletme adı', NAME_MIN, NAME_MAX),
  phoneNumber: phoneSchema,
  address: z.string().max(ADDRESS_MAX, `Adres en fazla ${ADDRESS_MAX} karakter olabilir`).optional(),
  description: z.string().max(NOTES_MAX, `Açıklama en fazla ${NOTES_MAX} karakter olabilir`).optional(),
})

export const updateBusinessProfileSchema = z.object({
  name: requiredString('İşletme adı', NAME_MIN, NAME_MAX),
  email: optionalEmail,
  address: z.string().max(500, 'Adres en fazla 500 karakter olabilir').optional(),
  description: z.string().max(1000, 'Açıklama en fazla 1000 karakter olabilir').optional(),
})

export const businessProfileValidationSchema = z.object({
  name: requiredString('İşletme adı', NAME_MIN, NAME_MAX),
  phoneNumber: phoneSchema,
  email: optionalEmail,
})

export const validationPatterns = {
  phoneTrLocal: PHONE_TR_LOCAL,
  phoneE164: PHONE_E164,
  phoneFlexible: PHONE_FLEXIBLE,
  nationalId: NATIONAL_ID_REGEX,
  passwordMin: PASSWORD_MIN,
  emailMax: EMAIL_MAX,
} as const

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type RegisterEmployeeFormData = z.infer<typeof registerEmployeeSchema>
export type ForgotPasswordEmailFormData = z.infer<typeof forgotPasswordEmailSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
export type OtpFormData = z.infer<typeof otpSchema>
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
export type UpdateBusinessProfileFormData = z.infer<typeof updateBusinessProfileSchema>
