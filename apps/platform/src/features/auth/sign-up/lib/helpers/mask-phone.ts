import { toApiSignupPhone } from './to-api-phone'

/** 확인 화면용 — `010-****-1234` 형식 */
export function maskSignupPhoneForDisplay(phone: string | undefined): string {
  const normalized = toApiSignupPhone(phone) ?? phone?.trim() ?? ''
  const digits = normalized.replace(/\D/g, '')
  if (digits.length < 10) return normalized || '-'

  const local = digits.startsWith('82') ? `0${digits.slice(2)}` : digits
  if (local.length === 11 && local.startsWith('010')) {
    return `${local.slice(0, 3)}-****-${local.slice(7)}`
  }
  if (local.length >= 10) {
    return `${local.slice(0, 3)}-****-${local.slice(-4)}`
  }
  return normalized || '-'
}
