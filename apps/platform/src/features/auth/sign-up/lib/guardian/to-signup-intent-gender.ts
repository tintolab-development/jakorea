import type { GenderType } from '../../model/sign-up.types'

/** Signup Intent API enum (OpenAPI 예: FEMALE / MALE) */
export function toSignupIntentGender(gender: GenderType | null): string | undefined {
  if (gender === 'female') return 'FEMALE'
  if (gender === 'male') return 'MALE'
  return undefined
}
