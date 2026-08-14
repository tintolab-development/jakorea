import type { GenderType } from '@/features/auth/sign-up'
import type { AdminProvisionedProfileRequest } from '../api/types'

/** UI `YYYY.MM.DD` → API `YYYY-MM-DD` */
export function toAdminProvisionedApiBirthDate(birthDate: string): string {
  const digits = birthDate.replace(/\D/g, '')
  if (digits.length < 8) return ''
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
}

/** UI male/female → API `M`/`F` */
export function toAdminProvisionedApiGender(gender: GenderType): string {
  if (gender === 'female') return 'F'
  if (gender === 'male') return 'M'
  return ''
}

export function mapAdminProvisionedProfileRequest(input: {
  birthDate: string
  gender: GenderType
}): AdminProvisionedProfileRequest | null {
  const birthDate = toAdminProvisionedApiBirthDate(input.birthDate)
  const gender = toAdminProvisionedApiGender(input.gender)
  if (!birthDate || !gender) return null
  return { birthDate, gender }
}
