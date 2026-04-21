import { validationPatterns } from '@/validation/schemas'

const { phoneFlexible, emailMax } = validationPatterns

const EMAIL_RFC_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const PHONE_LOCAL_MAX_LENGTH = 10

export interface ValidatorOptions {
  required?: boolean
}

export type ValidationResultKey =
  | 'required'
  | 'invalid'
  | 'tooLong'
  | null

export interface FieldValidationResult {
  valid: boolean
  errorKey: ValidationResultKey
}

const ok: FieldValidationResult = { valid: true, errorKey: null }

function fail(key: Exclude<ValidationResultKey, null>): FieldValidationResult {
  return { valid: false, errorKey: key }
}

export function normalizePhoneInput(raw: string | null | undefined): string {
  if (!raw) return ''
  const trimmed = String(raw).trim()
  if (trimmed.startsWith('+')) {
    return '+' + trimmed.slice(1).replace(/\D/g, '')
  }
  return trimmed.replace(/\D/g, '')
}

export function sanitizeLocalPhoneInput(raw: string | null | undefined): string {
  if (!raw) return ''
  return String(raw).replace(/\D/g, '').slice(0, PHONE_LOCAL_MAX_LENGTH)
}

export function applyPhoneInputMask(event: Event): string {
  const target = event.target as HTMLInputElement | null
  if (!target) return ''
  const sanitized = sanitizeLocalPhoneInput(target.value)
  if (target.value !== sanitized) {
    target.value = sanitized
  }
  return sanitized
}

export function validatePhoneField(
  raw: string | null | undefined,
  opts: ValidatorOptions = {},
): FieldValidationResult {
  const value = normalizePhoneInput(raw)
  if (!value) {
    return opts.required ? fail('required') : ok
  }
  if (!phoneFlexible.test(value)) {
    return fail('invalid')
  }
  return ok
}

export function validateEmailField(
  raw: string | null | undefined,
  opts: ValidatorOptions = {},
): FieldValidationResult {
  const value = (raw ?? '').trim()
  if (!value) {
    return opts.required ? fail('required') : ok
  }
  if (value.length > emailMax) {
    return fail('tooLong')
  }
  if (!EMAIL_RFC_LIKE.test(value)) {
    return fail('invalid')
  }
  return ok
}

export type FieldKind = 'email' | 'phone'

export function fieldErrorI18nKey(
  kind: FieldKind,
  errorKey: Exclude<ValidationResultKey, null>,
): string {
  return `validation.${kind}.${errorKey}`
}
