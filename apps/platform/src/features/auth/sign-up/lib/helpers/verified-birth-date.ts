import { formatBirthDateInput } from '../utils'

/** NICE 프로필/콜백 생년월일 → 가입 UI `YYYY.MM.DD` */
export function signupBirthDateFromVerified(raw?: string | null): string {
  const digits = raw?.replace(/\D/g, '').slice(0, 8) ?? ''
  if (digits.length !== 8) return ''
  return formatBirthDateInput(digits)
}
